/**
 * Boveda Proxy Routes
 * Proxies character data from the canonical Boveda API.
 * Same pattern as crucibla.js.
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

const BOVEDA_URL = process.env.BOVEDA_URL || 'http://localhost:3001';
const BOVEDA_API_KEY = process.env.BOVEDA_API_KEY;

router.use(authenticate);

/**
 * GET /api/boveda/characters
 * Proxy to Boveda GET /characters, mapping response to Slayt-compatible shape.
 */
router.get('/characters', async (req, res) => {
  if (!BOVEDA_API_KEY) {
    return res.status(503).json({ error: 'Boveda integration not configured (missing BOVEDA_API_KEY)' });
  }

  try {
    const response = await fetch(`${BOVEDA_URL}/characters`, {
      headers: {
        'X-API-Key': BOVEDA_API_KEY,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[Boveda proxy] API error:', response.status, text);
      return res.status(response.status).json({ error: 'Failed to fetch characters from Boveda' });
    }

    const data = await response.json();
    const characters = (data.characters || data || []).map(c => ({
      ...c,
      // Slayt-compatible defaults for fields Boveda characters don't have
      color: c.color || '#8b5cf6',
      voice: c.voice || 'conversational',
      captionStyle: c.captionStyle || 'conversational',
    }));

    res.json({ success: true, characters });
  } catch (error) {
    console.error('[Boveda proxy] error:', error.message);
    res.status(502).json({ error: 'Could not reach Boveda. Is it running?' });
  }
});

module.exports = router;
