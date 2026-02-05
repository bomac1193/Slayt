/**
 * Performance Tracking & Conviction Loop API
 * Endpoints for the revolutionary feedback loop
 */

const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const {
  fetchPerformanceMetrics,
  batchFetchPerformance
} = require('../services/performanceTrackerService');
const {
  validateConviction,
  batchValidateConvictions,
  getAccuracyStats
} = require('../services/convictionValidatorService');
const {
  applyFeedbackToGenome,
  batchProcessFeedback,
  getLearningProgress,
  resetLearning
} = require('../services/genomeFeedbackService');

/**
 * POST /api/performance/fetch/:contentId
 * Fetch performance metrics for a specific post
 */
router.post('/fetch/:contentId', auth, async (req, res) => {
  try {
    const { contentId } = req.params;
    const metrics = await fetchPerformanceMetrics(contentId);
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching performance:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/performance/batch-fetch
 * Batch fetch performance for multiple posts
 */
router.post('/batch-fetch', auth, async (req, res) => {
  try {
    const { contentIds } = req.body;

    if (!Array.isArray(contentIds)) {
      return res.status(400).json({ error: 'contentIds must be an array' });
    }

    const results = await batchFetchPerformance(contentIds);
    res.json({ results });
  } catch (error) {
    console.error('Error batch fetching performance:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/performance/validate/:contentId
 * Validate conviction prediction vs actual performance
 */
router.post('/validate/:contentId', auth, async (req, res) => {
  try {
    const { contentId } = req.params;
    const validation = await validateConviction(contentId);
    res.json(validation);
  } catch (error) {
    console.error('Error validating conviction:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/performance/batch-validate
 * Batch validate convictions
 */
router.post('/batch-validate', auth, async (req, res) => {
  try {
    const { contentIds } = req.body;

    if (!Array.isArray(contentIds)) {
      return res.status(400).json({ error: 'contentIds must be an array' });
    }

    const results = await batchValidateConvictions(contentIds);
    res.json({ results });
  } catch (error) {
    console.error('Error batch validating:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/performance/accuracy-stats
 * Get prediction accuracy statistics
 */
router.get('/accuracy-stats', auth, async (req, res) => {
  try {
    const { profileId } = req.query;
    const stats = await getAccuracyStats(req.user.id, profileId);
    res.json(stats);
  } catch (error) {
    console.error('Error getting accuracy stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/performance/apply-feedback
 * Apply validation feedback to genome (manual trigger)
 */
router.post('/apply-feedback', auth, async (req, res) => {
  try {
    const { validation, profileId } = req.body;

    if (!validation || !profileId) {
      return res.status(400).json({ error: 'validation and profileId required' });
    }

    const result = await applyFeedbackToGenome(validation, profileId);
    res.json(result);
  } catch (error) {
    console.error('Error applying feedback:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/performance/process-loop/:contentId
 * Complete conviction loop for a post (fetch → validate → feedback)
 * This is the main endpoint that closes the loop
 */
router.post('/process-loop/:contentId', auth, async (req, res) => {
  try {
    const { contentId } = req.params;
    const { profileId } = req.body;

    if (!profileId) {
      return res.status(400).json({ error: 'profileId required' });
    }

    // Step 1: Fetch performance metrics
    console.log(`[Conviction Loop] Step 1: Fetching metrics for ${contentId}`);
    const metrics = await fetchPerformanceMetrics(contentId);

    if (metrics.status === 'not_posted') {
      return res.json({
        status: 'not_posted',
        message: 'Content not posted yet'
      });
    }

    // Step 2: Validate conviction prediction
    console.log(`[Conviction Loop] Step 2: Validating conviction`);
    const validation = await validateConviction(contentId);

    // Step 3: Apply feedback to genome
    console.log(`[Conviction Loop] Step 3: Applying feedback to genome`);
    const feedbackResult = await applyFeedbackToGenome(validation, profileId);

    res.json({
      status: 'completed',
      metrics,
      validation,
      feedbackResult,
      message: 'Conviction loop processed successfully'
    });
  } catch (error) {
    console.error('Error processing conviction loop:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/performance/batch-process-loop
 * Process conviction loop for multiple posts
 */
router.post('/batch-process-loop', auth, async (req, res) => {
  try {
    const { contentIds, profileId } = req.body;

    if (!Array.isArray(contentIds) || !profileId) {
      return res.status(400).json({ error: 'contentIds (array) and profileId required' });
    }

    const results = {
      processed: 0,
      skipped: 0,
      failed: 0,
      details: []
    };

    for (const contentId of contentIds) {
      try {
        // Fetch metrics
        const metrics = await fetchPerformanceMetrics(contentId);

        if (metrics.status === 'not_posted') {
          results.skipped++;
          results.details.push({ contentId, status: 'skipped', reason: 'not_posted' });
          continue;
        }

        // Validate
        const validation = await validateConviction(contentId);

        // Apply feedback
        const feedbackResult = await applyFeedbackToGenome(validation, profileId);

        results.processed++;
        results.details.push({
          contentId,
          status: 'success',
          accuracy: validation.validation.accuracy,
          feedbackApplied: feedbackResult.updated
        });
      } catch (error) {
        results.failed++;
        results.details.push({
          contentId,
          status: 'error',
          error: error.message
        });
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Error batch processing conviction loop:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/performance/learning-progress
 * Get learning progress for a profile
 */
router.get('/learning-progress', auth, async (req, res) => {
  try {
    const { profileId } = req.query;

    if (!profileId) {
      return res.status(400).json({ error: 'profileId required' });
    }

    const progress = await getLearningProgress(profileId);
    res.json(progress);
  } catch (error) {
    console.error('Error getting learning progress:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/performance/reset-learning
 * Reset learning data for a profile (admin/testing)
 */
router.post('/reset-learning', auth, async (req, res) => {
  try {
    const { profileId } = req.body;

    if (!profileId) {
      return res.status(400).json({ error: 'profileId required' });
    }

    const result = await resetLearning(profileId);
    res.json(result);
  } catch (error) {
    console.error('Error resetting learning:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
