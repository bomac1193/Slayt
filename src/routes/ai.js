const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');

// AI Analysis
router.post('/analyze', authenticate, aiController.analyzeContent);
router.post('/compare-versions', authenticate, aiController.compareVersions);
router.post('/suggest-type', authenticate, aiController.suggestContentType);
router.post('/generate-hashtags', authenticate, aiController.generateHashtags);
router.post('/generate-caption', authenticate, aiController.generateCaption);

// Image Processing
router.post('/upscale', authenticate, aiController.upscaleImage);

// Scoring
router.post('/score/virality', authenticate, aiController.calculateViralityScore);
router.post('/score/engagement', authenticate, aiController.calculateEngagementScore);
router.post('/score/aesthetic', authenticate, aiController.calculateAestheticScore);

// Timing
router.post('/optimal-timing', authenticate, aiController.getOptimalTiming);

module.exports = router;
