/**
 * Genome API Routes
 * Taste genome management, archetype quiz, and gamification
 */

const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const User = require('../models/User');
const Profile = require('../models/Profile');
const tasteGenome = require('../services/tasteGenome');

async function getTarget(profileId, userId) {
  if (profileId) {
    const profile = await Profile.findOne({ _id: profileId, userId });
    if (profile) return profile;
  }
  return await User.findById(userId);
}

/**
 * GET /api/genome
 * Get user's taste genome
 */
router.get('/', auth, async (req, res) => {
  try {
    const { profileId } = req.query;
    let genome = null;

    const target = await getTarget(profileId, req.userId);
    genome = target?.tasteGenome;

    if (!genome) {
      return res.json({
        success: true,
        hasGenome: false,
        message: 'No taste genome yet. Take the quiz or start creating content.'
      });
    }

    res.json({
      success: true,
      hasGenome: true,
      summary: tasteGenome.getGenomeSummary(genome),
      genome
    });
  } catch (error) {
    console.error('[Genome] Get error:', error);
    res.status(500).json({ error: 'Failed to get genome' });
  }
});

/**
 * POST /api/genome/signal
 * Record a behavioral signal to evolve the genome
 */
router.post('/signal', auth, async (req, res) => {
  try {
    const { type, value, metadata, profileId } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Signal type required' });
    }

    let target = await getTarget(profileId, req.userId);
    if (!target) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    let genome = target.tasteGenome || tasteGenome.createGenome(req.userId);

    // Record signal and evolve genome
    const evolvedGenome = tasteGenome.recordSignal(genome, {
      type,
      value,
      metadata: metadata || {},
      timestamp: new Date()
    });

    // Save evolved genome
    target.tasteGenome = evolvedGenome;
    await target.save();

    res.json({
      success: true,
      xpGained: tasteGenome.XP_REWARDS[type] || 5,
      tier: tasteGenome.getCurrentTier(evolvedGenome),
      archetype: evolvedGenome.archetype.primary ? {
        glyph: evolvedGenome.archetype.primary.glyph,
        confidence: evolvedGenome.archetype.confidence
      } : null,
      confidence: evolvedGenome.confidence
    });
  } catch (error) {
    console.error('[Genome] Signal error:', error);
    res.status(500).json({ error: 'Failed to record signal' });
  }
});

/**
 * POST /api/genome/quiz
 * Process archetype quiz responses
 */
router.post('/quiz', auth, async (req, res) => {
  try {
    const { responses, profileId } = req.body;

    if (!responses || !Array.isArray(responses)) {
      return res.status(400).json({ error: 'Quiz responses required' });
    }

    let target = await getTarget(profileId, req.userId);
    if (!target) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    let genome = target.tasteGenome || tasteGenome.createGenome(req.userId);

    // Process each quiz response as a signal
    responses.forEach(response => {
      const archetypeWeights = response.weights || {};

      genome = tasteGenome.recordSignal(genome, {
        type: 'choice',
        value: response.questionId,
        metadata: {
          questionId: response.questionId,
          answer: response.answer,
          archetypeWeights
        }
      });

      // Directly apply archetype weights from quiz
      Object.entries(archetypeWeights).forEach(([designation, weight]) => {
        const signal = {
          type: 'choice',
          value: response.answer,
          weight: 1.0,
          archetypeWeights: { [designation]: weight },
          timestamp: new Date()
        };
        genome.signals.push(signal);
      });
    });

    // Re-classify after quiz
    // Force update archetype distribution
    const distribution = {};
    Object.keys(tasteGenome.ARCHETYPES).forEach(d => { distribution[d] = 0; });

    genome.signals.forEach(signal => {
      Object.entries(signal.archetypeWeights || {}).forEach(([d, w]) => {
        if (distribution[d] !== undefined) {
          distribution[d] += w * Math.abs(signal.weight || 1);
        }
      });
    });

    // Softmax normalization
    const temperature = 5;
    const designations = Object.keys(tasteGenome.ARCHETYPES);
    let sumExp = 0;
    const expValues = {};

    designations.forEach(d => {
      expValues[d] = Math.exp((distribution[d] || 0) / temperature);
      sumExp += expValues[d];
    });

    designations.forEach(d => {
      distribution[d] = sumExp > 0 ? expValues[d] / sumExp : 1 / designations.length;
    });

    const sorted = Object.entries(distribution).sort((a, b) => b[1] - a[1]);

    genome.archetype.distribution = distribution;
    genome.archetype.primary = {
      designation: sorted[0][0],
      confidence: sorted[0][1],
      ...tasteGenome.ARCHETYPES[sorted[0][0]]
    };

    if (sorted[1][1] > 0.12) {
      genome.archetype.secondary = {
        designation: sorted[1][0],
        confidence: sorted[1][1],
        ...tasteGenome.ARCHETYPES[sorted[1][0]]
      };
    }

    genome.archetype.classifiedAt = new Date();

    // Award quiz achievement
    tasteGenome.updateGamification(genome, 'score_content');

    // Save
    target.tasteGenome = genome;
    await target.save();

    res.json({
      success: true,
      archetype: {
        primary: genome.archetype.primary,
        secondary: genome.archetype.secondary,
        confidence: genome.archetype.confidence,
        distribution
      },
      tier: tasteGenome.getCurrentTier(genome),
      summary: tasteGenome.getGenomeSummary(genome)
    });
  } catch (error) {
    console.error('[Genome] Quiz error:', error);
    res.status(500).json({ error: 'Failed to process quiz' });
  }
});

/**
 * GET /api/genome/quiz/questions
 * Get the archetype quiz questions
 */
router.get('/quiz/questions', auth, (req, res) => {
  // Initial 3-question binary quiz (from Subtaste progressive profiling)
  const questions = [
    {
      id: 'q1',
      prompt: 'When you discover something incredible, do you...',
      category: 'social',
      options: [
        { label: 'Keep it close', value: 'keep', description: 'Let it be your secret' },
        { label: 'Spread the word', value: 'share', description: 'Tell everyone about it' }
      ],
      weights: {
        keep: { 'NULL': 0.7, 'P-7': 0.5, 'L-3': 0.3, 'D-8': 0.4 },
        share: { 'H-6': 0.8, 'F-9': 0.4, 'N-5': 0.3 }
      }
    },
    {
      id: 'q2',
      prompt: 'Your creative instinct is to be...',
      category: 'temporal',
      options: [
        { label: 'Ahead of the curve', value: 'ahead', description: 'First to find what\'s next' },
        { label: 'Deep within tradition', value: 'tradition', description: 'Master what already exists' }
      ],
      weights: {
        ahead: { 'V-2': 0.7, 'S-0': 0.5, 'R-10': 0.4 },
        tradition: { 'P-7': 0.6, 'T-1': 0.5, 'L-3': 0.4 }
      }
    },
    {
      id: 'q3',
      prompt: 'When creating content, you prefer to...',
      category: 'creative',
      options: [
        { label: 'Plan every detail', value: 'structure', description: 'Structure and strategy first' },
        { label: 'Discover as you go', value: 'discover', description: 'Follow intuition and flow' }
      ],
      weights: {
        structure: { 'T-1': 0.7, 'C-4': 0.5, 'F-9': 0.4 },
        discover: { 'D-8': 0.6, 'NULL': 0.5, 'V-2': 0.3, 'N-5': 0.3 }
      }
    }
  ];

  res.json({ success: true, questions });
});

/**
 * GET /api/genome/gamification
 * Get gamification state
 */
router.get('/gamification', auth, async (req, res) => {
  try {
    const { profileId } = req.query;
    let genome = null;

    if (profileId) {
      const profile = await Profile.findOne({ _id: profileId, userId: req.userId });
      genome = profile?.tasteGenome;
    }

    if (!genome) {
      const user = await User.findById(req.userId);
      genome = user?.tasteGenome;
    }

    if (!genome) {
      return res.json({
        success: true,
        tier: tasteGenome.TASTE_TIERS[0],
        xp: 0,
        streak: 0,
        achievements: [],
        allAchievements: tasteGenome.ACHIEVEMENTS
      });
    }

    res.json({
      success: true,
      tier: tasteGenome.getCurrentTier(genome),
      xp: genome.gamification.xp,
      streak: genome.gamification.streak,
      longestStreak: genome.gamification.longestStreak,
      achievements: genome.gamification.achievements,
      allAchievements: tasteGenome.ACHIEVEMENTS,
      stats: {
        totalScores: genome.gamification.totalScores,
        totalPublished: genome.gamification.totalPublished,
        totalHooksGenerated: genome.gamification.totalHooksGenerated,
        uniqueStyles: genome.gamification.uniqueStyles.length,
        uniqueHooks: genome.gamification.uniqueHooks.length
      }
    });
  } catch (error) {
    console.error('[Genome] Gamification error:', error);
    res.status(500).json({ error: 'Failed to get gamification data' });
  }
});

/**
 * GET /api/genome/archetypes
 * Get all archetype definitions
 */
router.get('/archetypes', (req, res) => {
  res.json({
    success: true,
    archetypes: tasteGenome.ARCHETYPES
  });
});

/**
 * GET /api/genome/raw
 * Full genome object for diagnostics/admin
 */
router.get('/raw', auth, async (req, res) => {
  try {
    const { profileId } = req.query;
    const target = await getTarget(profileId, req.userId);
    if (!target || !target.tasteGenome) {
      return res.status(404).json({ error: 'Genome not found' });
    }
    res.json({
      success: true,
      genome: target.tasteGenome,
      distribution: target.tasteGenome.archetype?.distribution || {},
      signals: target.tasteGenome.signals?.length || 0
    });
  } catch (error) {
    console.error('[Genome] Raw error:', error);
    res.status(500).json({ error: 'Failed to load genome' });
  }
});

/**
 * GET /api/genome/signals
 * Recent signals for diagnostics/admin
 */
router.get('/signals', auth, async (req, res) => {
  try {
    const { profileId, limit = 20 } = req.query;
    const target = await getTarget(profileId, req.userId);
    if (!target || !target.tasteGenome) {
      return res.status(404).json({ error: 'Genome not found' });
    }
    const signals = target.tasteGenome.signals || [];
    const slice = signals.slice(-Number(limit)).reverse();
    res.json({ success: true, signals: slice });
  } catch (error) {
    console.error('[Genome] Signals error:', error);
    res.status(500).json({ error: 'Failed to load signals' });
  }
});

/**
 * POST /api/genome/recompute
 * Recompute archetype distribution from stored signals
 */
router.post('/recompute', auth, async (req, res) => {
  try {
    const { profileId } = req.body;
    const target = await getTarget(profileId, req.userId);
    if (!target) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    let genome = target.tasteGenome || tasteGenome.createGenome(req.userId);
    tasteGenome.updateArchetypeFromSignals(genome);
    genome.confidence = tasteGenome.calculateConfidence(genome);
    genome.lastUpdated = new Date();
    target.tasteGenome = genome;
    await target.save();
    res.json({
      success: true,
      archetype: genome.archetype,
      distribution: genome.archetype.distribution,
      confidence: genome.confidence
    });
  } catch (error) {
    console.error('[Genome] Recompute error:', error);
    res.status(500).json({ error: 'Failed to recompute genome' });
  }
});

module.exports = router;
