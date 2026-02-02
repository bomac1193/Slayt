const Content = require('../models/Content');
const aiService = require('../services/aiService');
const upscaleService = require('../services/upscaleService');

// Analyze content with AI
exports.analyzeContent = async (req, res) => {
  try {
    const { contentId, creatorProfile = null } = req.body;

    const content = await Content.findOne({ _id: contentId, userId: req.userId });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Perform AI analysis
    const analysis = await aiService.analyzeContent(content, { creatorProfile });

    // Update content with AI scores
    content.aiScores = {
      viralityScore: analysis.viralityScore,
      engagementScore: analysis.engagementScore,
      aestheticScore: analysis.aestheticScore,
      trendScore: analysis.trendScore,
      analyzedAt: new Date()
    };
    content.calculateOverallScore();

    // Update AI suggestions
    content.aiSuggestions = analysis.suggestions;

    await content.save();

    res.json({
      message: 'Content analyzed successfully',
      aiScores: content.aiScores,
      aiSuggestions: content.aiSuggestions,
      creatorInsights: analysis.creatorInsights
    });
  } catch (error) {
    console.error('Analyze content error:', error);
    res.status(500).json({ error: 'Failed to analyze content' });
  }
};

// Compare multiple versions
exports.compareVersions = async (req, res) => {
  try {
    const { contentId } = req.body;

    const content = await Content.findOne({ _id: contentId, userId: req.userId });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    if (!content.versions || content.versions.length === 0) {
      return res.status(400).json({ error: 'No versions to compare' });
    }

    // Analyze each version
    const versionAnalysis = await Promise.all(
      content.versions.map(async (version) => {
        const analysis = await aiService.analyzeVersion(version);
        return {
          versionName: version.versionName,
          scores: analysis,
          recommendation: analysis.overallScore
        };
      })
    );

    // Find best version
    const bestVersion = versionAnalysis.reduce((best, current) =>
      current.recommendation > best.recommendation ? current : best
    );

    res.json({
      message: 'Versions compared successfully',
      versionAnalysis,
      bestVersion: bestVersion.versionName,
      recommendation: `The "${bestVersion.versionName}" version is predicted to perform best with a score of ${bestVersion.recommendation}/100`
    });
  } catch (error) {
    console.error('Compare versions error:', error);
    res.status(500).json({ error: 'Failed to compare versions' });
  }
};

// Suggest content type
exports.suggestContentType = async (req, res) => {
  try {
    const { contentId } = req.body;

    const content = await Content.findOne({ _id: contentId, userId: req.userId });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Analyze and suggest best content type
    const suggestion = await aiService.suggestContentType(content);

    // Update content
    content.aiSuggestions = {
      ...content.aiSuggestions,
      recommendedType: suggestion.type,
      reason: suggestion.reason,
      confidenceScore: suggestion.confidence
    };
    await content.save();

    res.json({
      message: 'Content type suggestion generated',
      suggestion: {
        recommendedType: suggestion.type,
        reason: suggestion.reason,
        confidence: suggestion.confidence,
        alternatives: suggestion.alternatives
      }
    });
  } catch (error) {
    console.error('Suggest content type error:', error);
    res.status(500).json({ error: 'Failed to suggest content type' });
  }
};

// Generate hashtags
exports.generateHashtags = async (req, res) => {
  try {
    const { contentId, count = 20 } = req.body;

    const content = await Content.findOne({ _id: contentId, userId: req.userId });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Generate hashtags using AI
    const hashtags = await aiService.generateHashtags(content, count);

    // Update content
    content.aiSuggestions = {
      ...content.aiSuggestions,
      hashtagSuggestions: hashtags
    };
    await content.save();

    res.json({
      message: 'Hashtags generated successfully',
      hashtags
    });
  } catch (error) {
    console.error('Generate hashtags error:', error);
    res.status(500).json({ error: 'Failed to generate hashtags' });
  }
};

// Generate caption
const tasteContextService = require('../services/tasteContextService');

exports.generateCaption = async (req, res) => {
  try {
    const { contentId, tone = 'casual', length = 'medium', creatorProfile = null, profileId = null } = req.body;

    const content = await Content.findOne({ _id: contentId, userId: req.userId });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Build shared taste context (1193 schema seed) for guardrails
    const tasteContext = await tasteContextService.buildTasteContext({
      userId: req.userId,
      profileId,
    });

    // Generate caption using AI
    const captions = await aiService.generateCaption(content, {
      tone,
      length,
      creatorProfile,
      tasteContext,
    });

    res.json({
      message: 'Captions generated successfully',
      captions
    });
  } catch (error) {
    console.error('Generate caption error:', error);
    res.status(500).json({ error: 'Failed to generate caption' });
  }
};

// Upscale image
exports.upscaleImage = async (req, res) => {
  try {
    const { contentId, provider = 'replicate' } = req.body;

    if (!['replicate', 'cloudinary'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider. Use "replicate" or "cloudinary".' });
    }

    const content = await Content.findOne({ _id: contentId, userId: req.userId });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    if (!content.mediaUrl) {
      return res.status(400).json({ error: 'Content has no media to upscale' });
    }

    // Preserve original before upscaling
    if (!content.originalMediaUrl) {
      content.originalMediaUrl = content.mediaUrl;
    }

    let upscaledUrl;
    if (provider === 'replicate') {
      upscaledUrl = await upscaleService.upscaleWithReplicate(content.mediaUrl);
    } else {
      upscaledUrl = await upscaleService.upscaleWithCloudinary(content.mediaUrl);
    }

    content.mediaUrl = upscaledUrl;
    await content.save();

    res.json({
      message: 'Image upscaled successfully',
      mediaUrl: content.mediaUrl,
      originalMediaUrl: content.originalMediaUrl,
    });
  } catch (error) {
    console.error('Upscale image error:', error);
    res.status(500).json({ error: 'Failed to upscale image' });
  }
};

// Calculate virality score
exports.calculateViralityScore = async (req, res) => {
  try {
    const { contentId } = req.body;

    const content = await Content.findOne({ _id: contentId, userId: req.userId });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const viralityScore = await aiService.calculateViralityScore(content);

    content.aiScores.viralityScore = viralityScore;
    content.calculateOverallScore();
    await content.save();

    res.json({
      message: 'Virality score calculated',
      viralityScore
    });
  } catch (error) {
    console.error('Calculate virality score error:', error);
    res.status(500).json({ error: 'Failed to calculate virality score' });
  }
};

// Calculate engagement score
exports.calculateEngagementScore = async (req, res) => {
  try {
    const { contentId } = req.body;

    const content = await Content.findOne({ _id: contentId, userId: req.userId });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const engagementScore = await aiService.calculateEngagementScore(content);

    content.aiScores.engagementScore = engagementScore;
    content.calculateOverallScore();
    await content.save();

    res.json({
      message: 'Engagement score calculated',
      engagementScore
    });
  } catch (error) {
    console.error('Calculate engagement score error:', error);
    res.status(500).json({ error: 'Failed to calculate engagement score' });
  }
};

// Calculate aesthetic score
exports.calculateAestheticScore = async (req, res) => {
  try {
    const { contentId } = req.body;

    const content = await Content.findOne({ _id: contentId, userId: req.userId });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const aestheticScore = await aiService.calculateAestheticScore(content);

    content.aiScores.aestheticScore = aestheticScore;
    content.calculateOverallScore();
    await content.save();

    res.json({
      message: 'Aesthetic score calculated',
      aestheticScore
    });
  } catch (error) {
    console.error('Calculate aesthetic score error:', error);
    res.status(500).json({ error: 'Failed to calculate aesthetic score' });
  }
};

// Get optimal timing data
exports.getOptimalTiming = async (req, res) => {
  try {
    const { platform = 'instagram' } = req.body;

    const timingData = await aiService.getOptimalTiming(platform);

    res.json({
      message: 'Optimal timing data retrieved',
      ...timingData
    });
  } catch (error) {
    console.error('Get optimal timing error:', error);
    res.status(500).json({ error: 'Failed to get optimal timing data' });
  }
};
