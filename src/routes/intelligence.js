/**
 * Intelligence API Routes
 * AI-powered content scoring, generation, and taste profile management
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Content = require('../models/Content');
const intelligenceService = require('../services/intelligenceService');

/**
 * POST /api/intelligence/analyze
 * Analyze content and extract DNA patterns
 */
router.post('/analyze', auth, async (req, res) => {
  try {
    const { caption, title, hashtags, mediaType } = req.body;

    if (!caption && !title) {
      return res.status(400).json({ error: 'Caption or title required' });
    }

    const analysis = await intelligenceService.analyzeContent({
      caption,
      title,
      hashtags,
      mediaType
    });

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('[Intelligence] Analyze error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

/**
 * POST /api/intelligence/score
 * Score content against user's taste profile
 */
router.post('/score', auth, async (req, res) => {
  try {
    const { content, profileId } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content required' });
    }

    // Get taste profile from user or specific profile
    let tasteProfile = null;

    if (profileId) {
      const profile = await Profile.findOne({ _id: profileId, userId: req.userId });
      tasteProfile = profile?.tasteProfile;
    }

    if (!tasteProfile) {
      const user = await User.findById(req.userId);
      tasteProfile = user?.tasteProfile;
    }

    const score = await intelligenceService.scoreAgainstProfile(content, tasteProfile);

    res.json({
      success: true,
      ...score
    });
  } catch (error) {
    console.error('[Intelligence] Score error:', error);
    res.status(500).json({ error: 'Scoring failed' });
  }
});

/**
 * POST /api/intelligence/generate
 * Generate content variants in creator's voice
 */
router.post('/generate', auth, async (req, res) => {
  try {
    const { topic, platform, count, language, profileId } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic required' });
    }

    // Get taste profile
    let tasteProfile = null;

    if (profileId) {
      const profile = await Profile.findOne({ _id: profileId, userId: req.userId });
      tasteProfile = profile?.tasteProfile;
    }

    if (!tasteProfile) {
      const user = await User.findById(req.userId);
      tasteProfile = user?.tasteProfile;
    }

    const result = await intelligenceService.generateVariants(topic, tasteProfile, {
      platform: platform || 'instagram',
      count: count || 5,
      language: language || 'en'
    });

    res.json({
      success: true,
      topic,
      platform,
      ...result
    });
  } catch (error) {
    console.error('[Intelligence] Generate error:', error);
    res.status(500).json({ error: 'Generation failed' });
  }
});

/**
 * GET /api/intelligence/profile
 * Get user's taste profile
 */
router.get('/profile', auth, async (req, res) => {
  try {
    const { profileId } = req.query;

    let tasteProfile = null;
    let source = 'user';

    if (profileId) {
      const profile = await Profile.findOne({ _id: profileId, userId: req.userId });
      if (profile?.tasteProfile) {
        tasteProfile = profile.tasteProfile;
        source = 'profile';
      }
    }

    if (!tasteProfile) {
      const user = await User.findById(req.userId);
      tasteProfile = user?.tasteProfile;
    }

    if (!tasteProfile) {
      return res.json({
        success: true,
        hasProfile: false,
        message: 'No taste profile yet. Save and analyze content to build your profile.'
      });
    }

    res.json({
      success: true,
      hasProfile: true,
      source,
      tasteProfile
    });
  } catch (error) {
    console.error('[Intelligence] Get profile error:', error);
    res.status(500).json({ error: 'Failed to get taste profile' });
  }
});

/**
 * POST /api/intelligence/profile/update
 * Update taste profile with new content performance data
 */
router.post('/profile/update', auth, async (req, res) => {
  try {
    const { contentId, actualMetrics, profileId } = req.body;

    // Get the content
    const content = await Content.findOne({ _id: contentId, userId: req.userId });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Get current taste profile
    let currentProfile = null;
    let targetModel = null;
    let targetId = null;

    if (profileId) {
      const profile = await Profile.findOne({ _id: profileId, userId: req.userId });
      if (profile) {
        currentProfile = profile.tasteProfile || {};
        targetModel = Profile;
        targetId = profileId;
      }
    }

    if (!targetModel) {
      const user = await User.findById(req.userId);
      currentProfile = user.tasteProfile || {};
      targetModel = User;
      targetId = req.userId;
    }

    // Analyze content if not already analyzed
    if (!content.analysis) {
      content.analysis = await intelligenceService.analyzeContent({
        caption: content.caption,
        title: content.title,
        hashtags: content.hashtags,
        mediaType: content.mediaType
      });
      await content.save();
    }

    // Update taste profile
    const updatedProfile = intelligenceService.updateTasteProfile(
      currentProfile,
      content,
      actualMetrics
    );

    // Save updated profile
    await targetModel.findByIdAndUpdate(targetId, {
      tasteProfile: updatedProfile
    });

    res.json({
      success: true,
      message: 'Taste profile updated',
      tasteProfile: updatedProfile
    });
  } catch (error) {
    console.error('[Intelligence] Update profile error:', error);
    res.status(500).json({ error: 'Failed to update taste profile' });
  }
});

/**
 * POST /api/intelligence/performance
 * Analyze why content performed well or poorly
 */
router.post('/performance', auth, async (req, res) => {
  try {
    const { contentId, actualMetrics } = req.body;

    const content = await Content.findOne({ _id: contentId, userId: req.userId });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const predictedScore = content.aiScores?.overall || 50;

    const analysis = await intelligenceService.analyzePerformance(
      {
        caption: content.caption,
        title: content.title,
        hashtags: content.hashtags,
        mediaType: content.mediaType
      },
      actualMetrics,
      predictedScore
    );

    // Store analysis on content
    content.performanceAnalysis = analysis;
    await content.save();

    res.json({
      success: true,
      ...analysis
    });
  } catch (error) {
    console.error('[Intelligence] Performance analysis error:', error);
    res.status(500).json({ error: 'Performance analysis failed' });
  }
});

/**
 * GET /api/intelligence/trending
 * Get trending topics/formats in a niche
 */
router.get('/trending', auth, async (req, res) => {
  try {
    const { niche, platform } = req.query;

    const trending = await intelligenceService.getTrendingInNiche(
      niche || 'general',
      platform || 'instagram'
    );

    res.json({
      success: true,
      ...trending
    });
  } catch (error) {
    console.error('[Intelligence] Trending error:', error);
    res.status(500).json({ error: 'Failed to get trending topics' });
  }
});

/**
 * POST /api/intelligence/batch-score
 * Score multiple content items at once
 */
router.post('/batch-score', auth, async (req, res) => {
  try {
    const { contentIds, profileId } = req.body;

    if (!contentIds || !Array.isArray(contentIds)) {
      return res.status(400).json({ error: 'contentIds array required' });
    }

    // Get taste profile
    let tasteProfile = null;

    if (profileId) {
      const profile = await Profile.findOne({ _id: profileId, userId: req.userId });
      tasteProfile = profile?.tasteProfile;
    }

    if (!tasteProfile) {
      const user = await User.findById(req.userId);
      tasteProfile = user?.tasteProfile;
    }

    // Get all content items
    const contents = await Content.find({
      _id: { $in: contentIds },
      userId: req.userId
    });

    // Score each item
    const scores = await Promise.all(
      contents.map(async (content) => {
        const score = await intelligenceService.scoreAgainstProfile(
          {
            caption: content.caption,
            title: content.title,
            hashtags: content.hashtags,
            mediaType: content.mediaType
          },
          tasteProfile
        );

        // Update content with scores
        content.aiScores = {
          overall: score.overallScore,
          performance: score.performanceScore,
          taste: score.tasteScore,
          scoredAt: new Date()
        };
        await content.save();

        return {
          contentId: content._id,
          ...score
        };
      })
    );

    res.json({
      success: true,
      scored: scores.length,
      scores
    });
  } catch (error) {
    console.error('[Intelligence] Batch score error:', error);
    res.status(500).json({ error: 'Batch scoring failed' });
  }
});

module.exports = router;
