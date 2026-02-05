/**
 * Taste API Routes - External Partner API
 * BLUE OCEAN: Monetizable API for partners to access Slayt's taste intelligence
 *
 * Powered by Subtaste (internal) - ready for standalone integration
 */

const express = require('express');
const router = express.Router();
const { authenticateApiKey, checkEndpointAccess } = require('../middleware/apiKeyAuth');
const subtasteAdapter = require('../services/tasteApiService');

// All routes require API key authentication
router.use(authenticateApiKey);

/**
 * POST /api/taste/score
 * Score content against a taste profile
 *
 * Body:
 * {
 *   "content": {
 *     "imageUrl": "https://...",
 *     "caption": "...",
 *     "hashtags": ["..."]
 *   },
 *   "tasteProfileId": "profile123"
 * }
 */
router.post('/score', checkEndpointAccess('taste-score'), async (req, res) => {
  try {
    const { content, tasteProfileId } = req.body;

    if (!content || !tasteProfileId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['content', 'tasteProfileId']
      });
    }

    const result = await subtasteAdapter.scoreContent(content, tasteProfileId);

    res.json({
      success: true,
      data: result,
      meta: {
        partner: req.apiKey.partnerName,
        requestId: req.id,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Taste score error:', error);
    res.status(500).json({
      error: 'Scoring failed',
      message: error.message
    });
  }
});

/**
 * POST /api/taste/archetype
 * Match content to archetype
 *
 * Body:
 * {
 *   "content": {
 *     "imageUrl": "https://...",
 *     "caption": "..."
 *   }
 * }
 */
router.post('/archetype', checkEndpointAccess('archetype-match'), async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        error: 'Missing content field'
      });
    }

    const result = await subtasteAdapter.matchArchetype(content);

    res.json({
      success: true,
      data: result,
      meta: {
        partner: req.apiKey.partnerName,
        requestId: req.id,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Archetype match error:', error);
    res.status(500).json({
      error: 'Archetype matching failed',
      message: error.message
    });
  }
});

/**
 * POST /api/taste/analyze
 * Analyze content (features, aesthetics, patterns)
 *
 * Body:
 * {
 *   "content": {
 *     "imageUrl": "https://..."
 *   }
 * }
 */
router.post('/analyze', checkEndpointAccess('content-analysis'), async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        error: 'Missing content field'
      });
    }

    const result = await subtasteAdapter.analyzeContent(content);

    res.json({
      success: true,
      data: result,
      meta: {
        partner: req.apiKey.partnerName,
        requestId: req.id,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Content analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message
    });
  }
});

/**
 * GET /api/taste/recommendations/:tasteProfileId
 * Get content recommendations based on taste profile
 */
router.get('/recommendations/:tasteProfileId', checkEndpointAccess('recommendations'), async (req, res) => {
  try {
    const { tasteProfileId } = req.params;
    const filters = req.query;

    const result = await subtasteAdapter.getRecommendations(tasteProfileId, filters);

    res.json({
      success: true,
      data: result,
      meta: {
        partner: req.apiKey.partnerName,
        requestId: req.id,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({
      error: 'Recommendations failed',
      message: error.message
    });
  }
});

/**
 * GET /api/taste/genome/:tasteProfileId
 * Get taste genome summary
 */
router.get('/genome/:tasteProfileId', async (req, res) => {
  try {
    const { tasteProfileId } = req.params;

    const result = await subtasteAdapter.getGenomeSummary(tasteProfileId);

    res.json({
      success: true,
      data: result,
      meta: {
        partner: req.apiKey.partnerName,
        requestId: req.id,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Genome summary error:', error);
    res.status(500).json({
      error: 'Genome retrieval failed',
      message: error.message
    });
  }
});

/**
 * POST /api/taste/batch-score
 * Batch score multiple content items
 *
 * Body:
 * {
 *   "items": [
 *     { "content": {...}, "tasteProfileId": "..." },
 *     ...
 *   ]
 * }
 */
router.post('/batch-score', checkEndpointAccess('taste-score'), async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({
        error: 'items must be an array'
      });
    }

    if (items.length > 100) {
      return res.status(400).json({
        error: 'Batch size limit: 100 items'
      });
    }

    const results = [];

    for (const item of items) {
      try {
        const result = await subtasteAdapter.scoreContent(item.content, item.tasteProfileId);
        results.push({
          success: true,
          data: result
        });
      } catch (error) {
        results.push({
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: {
        results,
        total: items.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      },
      meta: {
        partner: req.apiKey.partnerName,
        requestId: req.id,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Batch score error:', error);
    res.status(500).json({
      error: 'Batch scoring failed',
      message: error.message
    });
  }
});

/**
 * GET /api/taste/health
 * Health check (no auth required)
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Taste API',
    provider: 'subtaste-internal',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/taste/usage
 * Get current API usage stats for the authenticated key
 */
router.get('/usage', async (req, res) => {
  try {
    const ApiKey = require('../models/ApiKey');
    const key = await ApiKey.findOne({ partnerId: req.apiKey.partnerId });

    if (!key) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json({
      success: true,
      data: {
        partner: req.apiKey.partnerName,
        tier: req.apiKey.tier,
        usage: {
          totalRequests: key.usage.totalRequests,
          requestsThisHour: key.usage.requestsThisHour,
          requestsThisMonth: key.usage.requestsThisMonth,
          lastRequest: key.usage.lastRequest
        },
        limits: {
          requestsPerHour: key.rateLimit,
          remaining: req.apiKey.rateLimit.remaining,
          resetAt: req.apiKey.rateLimit.resetAt
        }
      }
    });
  } catch (error) {
    console.error('Usage stats error:', error);
    res.status(500).json({ error: 'Failed to get usage stats' });
  }
});

module.exports = router;
