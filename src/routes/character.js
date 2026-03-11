/**
 * Character Generate Route
 * Single endpoint: generate content in a character's voice.
 * Character data is passed inline (from Boveda API) — no DB lookup.
 */

const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const intelligenceService = require('../services/intelligenceService');

/**
 * Build a generation prompt context from inline character data.
 * Same logic as the old Character.buildPromptContext() method.
 */
function buildPromptContext(character) {
  const parts = [];
  if (character.name) parts.push(`You are ${character.name}.`);
  if (character.bio) parts.push(character.bio);
  if (character.personaTags?.length) parts.push(`Personality: ${character.personaTags.join(', ')}.`);
  if (character.toneAllowed?.length) parts.push(`Use these tones: ${character.toneAllowed.join(', ')}.`);
  if (character.toneForbidden?.length) parts.push(`NEVER use these tones: ${character.toneForbidden.join(', ')}.`);
  if (character.voice) parts.push(`Voice style: ${character.voice}.`);
  if (character.captionStyle) parts.push(`Caption style: ${character.captionStyle}.`);
  if (character.systemPrompt) parts.push(character.systemPrompt);
  return parts.join(' ');
}

/**
 * POST /api/characters/generate
 * Generate content in a character's voice.
 *
 * Body: { character: { name, bio, personaTags, toneAllowed, toneForbidden, voice, captionStyle, ... }, topic, platform, count }
 */
router.post('/generate', auth, async (req, res) => {
  try {
    const { character, topic, platform, count } = req.body;

    if (!character || !character.name) {
      return res.status(400).json({ error: 'character object with name is required' });
    }

    const characterTasteProfile = {
      performancePatterns: {
        hooks: character.hookPreferences || [],
        sentiment: character.toneAllowed || [],
        structure: [],
        keywords: [],
      },
      aestheticPatterns: {
        dominantTones: character.toneAllowed || [],
        avoidTones: character.toneForbidden || [],
        voice: character.voice || 'conversational',
        complexity: 'moderate',
      },
      voiceSignature: {
        sentencePatterns: [],
        rhetoricalDevices: [],
        vocabularyLevel: 'moderate',
      },
      characterContext: buildPromptContext(character),
    };

    const result = await intelligenceService.generateVariants(
      topic || `content for ${character.name}`,
      characterTasteProfile,
      {
        platform: platform || 'instagram',
        count: count || 5,
      }
    );

    res.json({
      success: true,
      character: {
        name: character.name,
        voice: character.voice || 'conversational',
      },
      ...result,
    });
  } catch (error) {
    console.error('[Characters] Generate error:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

module.exports = router;
