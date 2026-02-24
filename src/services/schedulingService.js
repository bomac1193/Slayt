const Collection = require('../models/Collection');
const Content = require('../models/Content');
const User = require('../models/User');
const socialMediaService = require('./socialMediaService');
const convictionService = require('./convictionService');
const approvalGateService = require('./approvalGateService');

/**
 * Scheduling Service
 * Handles automated posting of scheduled collections
 */

class SchedulingService {
  constructor() {
    this.isRunning = false;
    this.interval = null;
    this.checkIntervalMs = 60 * 1000; // Check every minute
  }

  /**
   * Start the scheduling service
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Scheduling service already running');
      return;
    }

    console.log('🚀 Starting scheduling service...');
    this.isRunning = true;

    // Run immediately
    this.processScheduledCollections();

    // Then run on interval
    this.interval = setInterval(() => {
      this.processScheduledCollections();
    }, this.checkIntervalMs);

    console.log('✅ Scheduling service started');
  }

  /**
   * Stop the scheduling service
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('🛑 Scheduling service stopped');
  }

  /**
   * Process all scheduled collections that are ready to post
   */
  async processScheduledCollections() {
    try {
      const now = new Date();

      // Find collections ready to post
      const collections = await Collection.find({
        'scheduling.enabled': true,
        'scheduling.autoPost': true,
        status: { $in: ['scheduled', 'posting'] },
        'stats.nextPostAt': { $lte: now },
        'settings.isActive': true
      }).populate('userId items.contentId');

      if (collections.length === 0) {
        return;
      }

      console.log(`📅 Found ${collections.length} collection(s) ready to post`);

      for (const collection of collections) {
        await this.processCollection(collection);
      }
    } catch (error) {
      console.error('❌ Error processing scheduled collections:', error);
    }
  }

  /**
   * Process a single collection
   */
  async processCollection(collection) {
    try {
      console.log(`📤 Processing collection: ${collection.name} (${collection._id})`);

      // Get user
      const user = await User.findById(collection.userId);
      if (!user) {
        console.error(`❌ User not found for collection ${collection._id}`);
        return;
      }

      // Validate social media credentials
      const validation = await socialMediaService.validateCredentials(user, collection.platform);
      if (!validation.valid) {
        console.error(`❌ Invalid credentials for ${collection.platform}: ${validation.error}`);

        // Update collection with error
        collection.errors.push({
          timestamp: new Date(),
          errorMessage: validation.error,
          errorCode: 'AUTH_ERROR'
        });

        if (validation.needsRefresh) {
          collection.status = 'paused';
          await collection.save();
        }

        return;
      }

      // Get next item to post
      const nextItem = collection.getNextItemToPost();
      if (!nextItem) {
        console.log(`✅ Collection ${collection.name} completed - no more items to post`);
        collection.status = 'completed';
        await collection.save();
        return;
      }

      // Update status to posting
      if (collection.status !== 'posting') {
        collection.status = 'posting';
        await collection.save();
      }

      // Get content
      const content = await Content.findById(nextItem.contentId);
      if (!content) {
        console.error(`❌ Content not found: ${nextItem.contentId}`);
        collection.errors.push({
          timestamp: new Date(),
          itemIndex: nextItem.order,
          errorMessage: 'Content not found',
          errorCode: 'CONTENT_NOT_FOUND'
        });
        await collection.save();
        return;
      }

      // BLUE OCEAN: Check conviction gating before posting
      const convictionCheck = await this.checkConvictionGating(content, user, collection);

      if (!convictionCheck.canPost) {
        console.log(`⚠️  Content blocked by conviction gating: ${content.title} (score: ${convictionCheck.score})`);

        collection.errors.push({
          timestamp: new Date(),
          itemIndex: nextItem.order,
          errorMessage: `Conviction gating: ${convictionCheck.reason}`,
          errorCode: 'CONVICTION_BLOCKED',
          metadata: {
            convictionScore: convictionCheck.score,
            suggestions: convictionCheck.suggestions
          }
        });

        // Pause collection for manual review
        collection.status = 'paused';
        collection.scheduling.enabled = false;
        await collection.save();

        console.log(`⏸️  Collection paused for conviction review`);
        return;
      }

      if (convictionCheck.requiresReview) {
        console.log(`⚠️  Content requires review: ${content.title} (score: ${convictionCheck.score})`);
        // Continue posting but log the warning
      }

      // Post content
      const postResult = await this.postContent(user, content, collection.platform);

      if (postResult.success) {
        console.log(`✅ Successfully posted: ${content.title}`);

        // Mark item as posted
        await collection.markAsPosted(nextItem.contentId, {
          postId: postResult.postId,
          postUrl: postResult.postUrl
        });

        // Update content status
        content.status = 'published';
        content.publishedAt = new Date();
        if (postResult.postUrl) {
          content.platformPostUrl = postResult.postUrl;
        }
        await content.save();
      } else {
        console.error(`❌ Failed to post: ${content.title}`, postResult.error);

        // Log error
        collection.errors.push({
          timestamp: new Date(),
          itemIndex: nextItem.order,
          errorMessage: postResult.error,
          errorCode: 'POST_FAILED'
        });
        await collection.save();
      }

      // Calculate next post time
      const nextPostTime = collection.calculateNextPostTime();

      if (nextPostTime) {
        collection.stats.nextPostAt = nextPostTime;
        collection.status = 'scheduled';
        console.log(`⏰ Next post scheduled for: ${nextPostTime}`);
      } else {
        collection.status = 'completed';
        console.log(`✅ Collection ${collection.name} completed`);
      }

      await collection.save();
    } catch (error) {
      console.error(`❌ Error processing collection ${collection._id}:`, error);

      collection.errors.push({
        timestamp: new Date(),
        errorMessage: error.message,
        errorCode: 'PROCESSING_ERROR'
      });
      collection.status = 'failed';
      await collection.save();
    }
  }

  /**
   * Post content to the specified platform(s)
   */
  async postContent(user, content, platform) {
    try {
      const options = {
        caption: content.caption,
        title: content.title
      };

      let result;

      if (platform === 'instagram') {
        result = await socialMediaService.postToInstagram(user, content, options);
      } else if (platform === 'tiktok') {
        result = await socialMediaService.postToTikTok(user, content, options);
      } else if (platform === 'both') {
        result = await socialMediaService.postToBoth(user, content, options);

        // For 'both' platform, check if at least one succeeded
        if (!result.instagram?.success && !result.tiktok?.success) {
          return {
            success: false,
            error: result.errors.map(e => e.error).join('; ')
          };
        }

        return {
          success: true,
          postId: result.instagram?.postId || result.tiktok?.postId,
          postUrl: result.instagram?.postUrl || result.tiktok?.postUrl,
          platforms: {
            instagram: result.instagram,
            tiktok: result.tiktok
          }
        };
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Manually trigger posting for a specific collection
   */
  async triggerCollectionPost(collectionId) {
    try {
      const collection = await Collection.findById(collectionId)
        .populate('userId items.contentId');

      if (!collection) {
        throw new Error('Collection not found');
      }

      await this.processCollection(collection);

      return {
        success: true,
        message: 'Collection processed successfully'
      };
    } catch (error) {
      console.error('Manual trigger error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Manually post a specific item from a collection
   */
  async postCollectionItem(collectionId, itemId) {
    try {
      const collection = await Collection.findById(collectionId)
        .populate('userId items.contentId');

      if (!collection) {
        throw new Error('Collection not found');
      }

      const item = collection.items.id(itemId);
      if (!item) {
        throw new Error('Item not found in collection');
      }

      if (item.posted) {
        throw new Error('Item already posted');
      }

      const user = await User.findById(collection.userId);
      const content = await Content.findById(item.contentId);

      const gate = await approvalGateService.evaluateContentGate({
        content,
        user,
        action: 'collection_item_post',
      });
      if (!gate.allowed) {
        return {
          success: false,
          error: gate.reason || 'Approval gate blocked posting',
          code: gate.code,
          gate,
        };
      }

      const postResult = await this.postContent(user, content, collection.platform);

      if (postResult.success) {
        await collection.markAsPosted(item.contentId, {
          postId: postResult.postId,
          postUrl: postResult.postUrl
        });

        content.status = 'published';
        content.publishedAt = new Date();
        if (postResult.postUrl) {
          content.platformPostUrl = postResult.postUrl;
        }
        await content.save();
      }

      return postResult;
    } catch (error) {
      console.error('Post item error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Pause a scheduled collection
   */
  async pauseCollection(collectionId) {
    try {
      const collection = await Collection.findById(collectionId);
      if (!collection) {
        throw new Error('Collection not found');
      }

      collection.status = 'paused';
      collection.scheduling.enabled = false;
      await collection.save();

      return { success: true, message: 'Collection paused' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Resume a paused collection
   */
  async resumeCollection(collectionId) {
    try {
      const collection = await Collection.findById(collectionId);
      if (!collection) {
        throw new Error('Collection not found');
      }

      collection.status = 'scheduled';
      collection.scheduling.enabled = true;

      // Recalculate next post time
      const nextPostTime = collection.calculateNextPostTime();
      if (nextPostTime) {
        collection.stats.nextPostAt = nextPostTime;
      }

      await collection.save();

      return { success: true, message: 'Collection resumed' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get scheduling service status
   */
  getStatus() {
    return {
      running: this.isRunning,
      checkInterval: this.checkIntervalMs / 1000 + ' seconds'
    };
  }

  /**
   * BLUE OCEAN: Check conviction gating before posting
   * @param {Object} content - Content document
   * @param {Object} user - User document
   * @param {Object} collection - Collection document (optional)
   * @returns {Object} Gating result
   */
  async checkConvictionGating(content, user, collection = null) {
    try {
      // If content doesn't have conviction score, calculate it
      if (!content.conviction || !content.conviction.score) {
        console.log(`📊 Calculating conviction for: ${content.title}`);

        const convictionResult = await convictionService.calculateConviction(content, null);

        // Update content with conviction
        Object.assign(content.aiScores, convictionResult.aiScores);
        content.conviction = convictionResult.conviction;
        await content.save();
      }

      // Check if user has overridden gating for this content
      if (content.conviction.userOverride) {
        return {
          canPost: true,
          requiresReview: false,
          score: content.conviction.score,
          reason: `User override: ${content.conviction.overrideReason}`
        };
      }

      // Get collection-specific conviction threshold (default: 70)
      const threshold = collection?.settings?.convictionThreshold || 70;
      const strictMode = collection?.settings?.strictConvictionMode || false;

      // Check gating
      const gatingResult = convictionService.checkGating(content.conviction.score, {
        threshold,
        strictMode,
        userOverride: false
      });

      return {
        canPost: gatingResult.canSchedule,
        requiresReview: gatingResult.requiresReview,
        score: gatingResult.score,
        reason: gatingResult.reason,
        suggestions: gatingResult.suggestions
      };
    } catch (error) {
      console.error('❌ Conviction gating check error:', error);
      // On error, allow posting but log warning
      return {
        canPost: true,
        requiresReview: false,
        score: 0,
        reason: 'Conviction check failed, allowing post',
        error: error.message
      };
    }
  }
}

// Create singleton instance
const schedulingService = new SchedulingService();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, stopping scheduling service...');
  schedulingService.stop();
});

process.on('SIGINT', () => {
  console.log('SIGINT received, stopping scheduling service...');
  schedulingService.stop();
});

module.exports = schedulingService;
