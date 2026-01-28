const schedulingService = require('../services/schedulingService');
const socialMediaService = require('../services/socialMediaService');
const Collection = require('../models/Collection');
const Content = require('../models/Content');
const User = require('../models/User');

/**
 * Manually post a single content item
 */
exports.postContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { platform, caption } = req.body;

    const content = await Content.findOne({
      _id: contentId,
      userId: req.user._id
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const user = await User.findById(req.user._id);

    // Validate credentials
    const validation = await socialMediaService.validateCredentials(user, platform);
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.error,
        needsRefresh: validation.needsRefresh
      });
    }

    // Post content
    const options = { caption: caption || content.caption };
    let result;

    if (platform === 'instagram') {
      result = await socialMediaService.postToInstagram(user, content, options);
    } else if (platform === 'tiktok') {
      result = await socialMediaService.postToTikTok(user, content, options);
    } else if (platform === 'both') {
      result = await socialMediaService.postToBoth(user, content, options);
    } else {
      return res.status(400).json({ error: 'Invalid platform' });
    }

    // Update content status
    if (result.success) {
      content.status = 'published';
      content.publishedAt = new Date();
      if (result.postUrl) {
        content.platformPostUrl = result.postUrl;
      }
      await content.save();
    }

    res.json({
      message: result.success ? 'Content posted successfully' : 'Posting failed',
      result
    });
  } catch (error) {
    console.error('Post content error:', error);
    res.status(500).json({
      error: 'Failed to post content',
      details: error.message
    });
  }
};

/**
 * Manually trigger posting for a collection
 */
exports.postCollection = async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await Collection.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const result = await schedulingService.triggerCollectionPost(id);

    res.json(result);
  } catch (error) {
    console.error('Post collection error:', error);
    res.status(500).json({
      error: 'Failed to post collection',
      details: error.message
    });
  }
};

/**
 * Post a specific item from a collection
 */
exports.postCollectionItem = async (req, res) => {
  try {
    const { id, itemId } = req.params;

    const collection = await Collection.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const result = await schedulingService.postCollectionItem(id, itemId);

    res.json({
      message: result.success ? 'Item posted successfully' : 'Posting failed',
      result
    });
  } catch (error) {
    console.error('Post collection item error:', error);
    res.status(500).json({
      error: 'Failed to post item',
      details: error.message
    });
  }
};

/**
 * Pause a scheduled collection
 */
exports.pauseCollection = async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await Collection.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const result = await schedulingService.pauseCollection(id);

    res.json(result);
  } catch (error) {
    console.error('Pause collection error:', error);
    res.status(500).json({
      error: 'Failed to pause collection',
      details: error.message
    });
  }
};

/**
 * Resume a paused collection
 */
exports.resumeCollection = async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await Collection.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const result = await schedulingService.resumeCollection(id);

    res.json(result);
  } catch (error) {
    console.error('Resume collection error:', error);
    res.status(500).json({
      error: 'Failed to resume collection',
      details: error.message
    });
  }
};

/**
 * Get scheduling service status
 */
exports.getSchedulingStatus = async (req, res) => {
  try {
    const status = schedulingService.getStatus();

    // Get counts
    const scheduledCount = await Collection.countDocuments({
      userId: req.user._id,
      status: 'scheduled',
      'scheduling.enabled': true
    });

    const activeCount = await Collection.countDocuments({
      userId: req.user._id,
      status: { $in: ['scheduled', 'posting'] },
      'settings.isActive': true
    });

    res.json({
      service: status,
      userCollections: {
        scheduled: scheduledCount,
        active: activeCount
      }
    });
  } catch (error) {
    console.error('Get scheduling status error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
};

/**
 * Refresh Instagram access token
 */
exports.refreshInstagramToken = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.socialAccounts.instagram.connected) {
      return res.status(400).json({ error: 'Instagram not connected' });
    }

    await socialMediaService.refreshInstagramToken(user);

    res.json({ message: 'Instagram token refreshed successfully' });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      error: 'Failed to refresh token',
      details: error.message
    });
  }
};

/**
 * Schedule content for future posting
 */
exports.schedulePost = async (req, res) => {
  try {
    // Support both frontend naming (platforms, scheduledAt) and original naming (platform, scheduledTime)
    const { contentId, scheduledTime, scheduledAt, platform, platforms, autoPost } = req.body;
    const resolvedScheduledTime = scheduledTime || scheduledAt;
    const resolvedPlatform = platform || (Array.isArray(platforms) ? platforms[0] : platforms) || 'instagram';

    if (!contentId || !resolvedScheduledTime) {
      return res.status(400).json({ error: 'Content ID and scheduled time are required' });
    }

    const content = await Content.findOne({
      _id: contentId,
      userId: req.user._id
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Update content with scheduling info
    content.scheduledTime = new Date(resolvedScheduledTime);
    content.scheduledPlatform = resolvedPlatform;
    content.autoPost = autoPost || false;
    content.status = 'scheduled';

    await content.save();

    res.json({
      message: 'Content scheduled successfully',
      scheduledPost: {
        id: content._id,
        scheduledTime: content.scheduledTime,
        platform: content.scheduledPlatform,
        autoPost: content.autoPost,
        status: content.status
      }
    });
  } catch (error) {
    console.error('Schedule post error:', error);
    res.status(500).json({
      error: 'Failed to schedule post',
      details: error.message
    });
  }
};

/**
 * Get all scheduled posts for user
 */
exports.getScheduledPosts = async (req, res) => {
  try {
    const scheduledPosts = await Content.find({
      userId: req.user._id,
      status: 'scheduled',
      scheduledTime: { $exists: true }
    }).sort({ scheduledTime: 1 });

    const mappedPosts = scheduledPosts.map(post => ({
      id: post._id,
      caption: post.caption,
      mediaUrl: post.mediaUrl,
      image: post.mediaUrl,
      scheduledTime: post.scheduledTime,
      scheduledAt: post.scheduledTime, // Alias for frontend compatibility
      platform: post.scheduledPlatform,
      autoPost: post.autoPost,
      status: post.status
    }));

    res.json({
      scheduledPosts: mappedPosts,
      posts: mappedPosts, // Alias for frontend compatibility
      scheduled: mappedPosts // Another alias for frontend compatibility
    });
  } catch (error) {
    console.error('Get scheduled posts error:', error);
    res.status(500).json({ error: 'Failed to get scheduled posts' });
  }
};

/**
 * Update a scheduled post
 */
exports.updateScheduledPost = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { scheduledTime, platform, autoPost } = req.body;

    const content = await Content.findOne({
      _id: scheduleId,
      userId: req.user._id,
      status: 'scheduled'
    });

    if (!content) {
      return res.status(404).json({ error: 'Scheduled post not found' });
    }

    if (scheduledTime) {
      content.scheduledTime = new Date(scheduledTime);
    }
    if (platform) {
      content.scheduledPlatform = platform;
    }
    if (typeof autoPost === 'boolean') {
      content.autoPost = autoPost;
    }

    await content.save();

    res.json({
      message: 'Scheduled post updated successfully',
      scheduledPost: {
        id: content._id,
        scheduledTime: content.scheduledTime,
        platform: content.scheduledPlatform,
        autoPost: content.autoPost
      }
    });
  } catch (error) {
    console.error('Update scheduled post error:', error);
    res.status(500).json({
      error: 'Failed to update scheduled post',
      details: error.message
    });
  }
};

/**
 * Cancel a scheduled post
 */
exports.cancelScheduledPost = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const content = await Content.findOne({
      _id: scheduleId,
      userId: req.user._id,
      status: 'scheduled'
    });

    if (!content) {
      return res.status(404).json({ error: 'Scheduled post not found' });
    }

    content.status = 'draft';
    content.scheduledTime = undefined;
    content.scheduledPlatform = undefined;
    content.autoPost = false;

    await content.save();

    res.json({
      message: 'Scheduled post cancelled successfully',
      contentId: content._id
    });
  } catch (error) {
    console.error('Cancel scheduled post error:', error);
    res.status(500).json({
      error: 'Failed to cancel scheduled post',
      details: error.message
    });
  }
};

module.exports = exports;
