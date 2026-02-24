/**
 * Conviction API Routes
 * BLUE OCEAN: Conviction-gated scheduling and content intelligence
 */

const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const Content = require('../models/Content');
const convictionService = require('../services/convictionService');

/**
 * POST /api/conviction/calculate
 * Calculate conviction score for content
 */
router.post('/calculate', auth, async (req, res) => {
  try {
    const { contentId, profileId } = req.body;

    if (!contentId) {
      return res.status(400).json({ error: 'Content ID required' });
    }

    // Get content
    const content = await Content.findOne({ _id: contentId, userId: req.userId });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Calculate conviction
    const result = await convictionService.calculateConviction(content, null);

    // Update content with conviction scores
    Object.assign(content.aiScores, result.aiScores);
    content.conviction = result.conviction;
    await content.save();

    res.json({
      success: true,
      contentId: content._id,
      ...result
    });
  } catch (error) {
    console.error('[Conviction] Calculate error:', error);
    res.status(500).json({ error: 'Failed to calculate conviction' });
  }
});

/**
 * POST /api/conviction/check-gating
 * Check if content passes conviction gating
 */
router.post('/check-gating', auth, async (req, res) => {
  try {
    const { contentId, threshold, strictMode } = req.body;

    if (!contentId) {
      return res.status(400).json({ error: 'Content ID required' });
    }

    const content = await Content.findOne({ _id: contentId, userId: req.userId });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Use content's method to check gating
    const gatingResult = content.checkConvictionGating(threshold, strictMode);

    res.json({
      success: true,
      contentId: content._id,
      ...gatingResult
    });
  } catch (error) {
    console.error('[Conviction] Check gating error:', error);
    res.status(500).json({ error: 'Failed to check gating' });
  }
});

/**
 * POST /api/conviction/override
 * Override conviction gating for a piece of content
 */
router.post('/override', auth, async (req, res) => {
  try {
    const { contentId, reason } = req.body;

    if (!contentId) {
      return res.status(400).json({ error: 'Content ID required' });
    }

    const content = await Content.findOne({ _id: contentId, userId: req.userId });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Override gating
    const overrideResult = content.overrideConvictionGating(reason);
    await content.save();

    res.json({
      success: true,
      message: 'Conviction gating overridden',
      contentId: content._id,
      conviction: overrideResult
    });
  } catch (error) {
    console.error('[Conviction] Override error:', error);
    res.status(500).json({ error: 'Failed to override gating' });
  }
});

/**
 * GET /api/conviction/report/:contentId
 * Get full conviction report for content
 */
router.get('/report/:contentId', auth, async (req, res) => {
  try {
    const { contentId } = req.params;
    const { profileId } = req.query;

    const content = await Content.findOne({ _id: contentId, userId: req.userId });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Generate full report
    const report = await convictionService.generateConvictionReport(content, null);

    res.json({
      success: true,
      contentId: content._id,
      report,
      validationResult: content.convictionValidation || null,
      contentStatus: content.status,
      wasUserOverride: content.conviction?.userOverride || false
    });
  } catch (error) {
    console.error('[Conviction] Report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * POST /api/conviction/batch-calculate
 * Calculate conviction for multiple content items
 */
router.post('/batch-calculate', auth, async (req, res) => {
  try {
    const { contentIds, profileId } = req.body;

    if (!contentIds || !Array.isArray(contentIds)) {
      return res.status(400).json({ error: 'Content IDs array required' });
    }

    // Get all content
    const contents = await Content.find({
      _id: { $in: contentIds },
      userId: req.userId
    });

    // Calculate conviction for each
    const results = await Promise.all(
      contents.map(async (content) => {
        const result = await convictionService.calculateConviction(content, null);

        // Update content
        Object.assign(content.aiScores, result.aiScores);
        content.conviction = result.conviction;
        await content.save();

        return {
          contentId: content._id,
          conviction: result.conviction,
          gating: convictionService.checkGating(result.conviction.score)
        };
      })
    );

    res.json({
      success: true,
      calculated: results.length,
      results
    });
  } catch (error) {
    console.error('[Conviction] Batch calculate error:', error);
    res.status(500).json({ error: 'Failed to batch calculate conviction' });
  }
});

/**
 * GET /api/conviction/stats
 * Get conviction statistics for user's content
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const { profileId } = req.query;

    const query = { userId: req.userId };
    if (profileId) {
      query.profileId = profileId;
    }

    // Get all content with conviction scores
    const contents = await Content.find(query).select('conviction aiScores status');

    // Calculate stats
    const stats = {
      total: contents.length,
      byTier: {
        exceptional: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      byStatus: {
        approved: 0,
        warning: 0,
        blocked: 0,
        override: 0
      },
      averageScore: 0,
      highestScore: 0,
      lowestScore: 100
    };

    let totalScore = 0;

    contents.forEach(content => {
      const score = content.conviction?.score || content.aiScores?.convictionScore || 0;
      const tier = content.conviction?.tier || 'medium';
      const status = content.conviction?.gatingStatus || 'approved';

      stats.byTier[tier]++;
      stats.byStatus[status]++;

      totalScore += score;

      if (score > stats.highestScore) stats.highestScore = score;
      if (score < stats.lowestScore) stats.lowestScore = score;
    });

    stats.averageScore = contents.length > 0 ? Math.round(totalScore / contents.length) : 0;

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('[Conviction] Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

/**
 * GET /api/conviction/thresholds
 * Get conviction thresholds configuration
 */
router.get('/thresholds', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      thresholds: convictionService.CONVICTION_THRESHOLDS,
      description: {
        exceptional: 'Auto-prioritize, suggest cross-posting',
        high: 'Approved for scheduling',
        medium: 'Warning, suggest improvements',
        low: 'Block (strict mode) or warn'
      }
    });
  } catch (error) {
    console.error('[Conviction] Thresholds error:', error);
    res.status(500).json({ error: 'Failed to get thresholds' });
  }
});

module.exports = router;
