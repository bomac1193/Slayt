/**
 * Performance Tracker Service
 * Fetches actual performance metrics from social platforms
 * Part of the Conviction Loop: confidence → ROAS → feedback
 */

const Content = require('../models/Content');
const User = require('../models/User');
const axios = require('axios');

/**
 * Fetch performance metrics for a posted content item
 * @param {String} contentId - Content ID
 * @returns {Object} Performance metrics
 */
async function fetchPerformanceMetrics(contentId) {
  try {
    const content = await Content.findById(contentId).populate('user');

    if (!content) {
      throw new Error('Content not found');
    }

    // Check if content has been posted
    if (!content.publishedAt || !content.platformPostIds) {
      return {
        status: 'not_posted',
        message: 'Content has not been posted yet'
      };
    }

    const metrics = {
      contentId: content._id,
      platform: content.platform,
      postedAt: content.publishedAt,
      metrics: {},
      fetchedAt: new Date()
    };

    // Fetch metrics based on platform
    if (content.platform === 'instagram' && content.platformPostIds?.instagram) {
      metrics.metrics.instagram = await fetchInstagramMetrics(
        content.platformPostIds.instagram,
        content.user
      );
    }

    if (content.platform === 'tiktok' && content.platformPostIds?.tiktok) {
      metrics.metrics.tiktok = await fetchTikTokMetrics(
        content.platformPostIds.tiktok,
        content.user
      );
    }

    // Calculate composite engagement score
    metrics.engagementScore = calculateEngagementScore(metrics.metrics);

    // Store metrics in content document
    content.performanceMetrics = metrics;
    content.lastMetricsFetch = new Date();
    await content.save();

    return metrics;
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    throw error;
  }
}

/**
 * Fetch Instagram metrics using Instagram Graph API
 */
async function fetchInstagramMetrics(postId, user) {
  try {
    const instagramAuth = user.connectedAccounts?.instagram;

    if (!instagramAuth || !instagramAuth.accessToken) {
      throw new Error('Instagram not connected');
    }

    // Instagram Graph API endpoint
    const url = `https://graph.instagram.com/${postId}`;
    const params = {
      fields: 'like_count,comments_count,timestamp,media_type,media_url,permalink',
      access_token: instagramAuth.accessToken
    };

    const response = await axios.get(url, { params });
    const data = response.data;

    // Calculate reach and impressions if available (requires Instagram Business Account)
    let insights = null;
    try {
      const insightsUrl = `https://graph.instagram.com/${postId}/insights`;
      const insightsParams = {
        metric: 'impressions,reach,engagement,saved',
        access_token: instagramAuth.accessToken
      };
      const insightsResponse = await axios.get(insightsUrl, { params: insightsParams });
      insights = insightsResponse.data.data;
    } catch (err) {
      console.log('Could not fetch Instagram insights (may not be business account)');
    }

    return {
      likes: data.like_count || 0,
      comments: data.comments_count || 0,
      impressions: insights?.find(i => i.name === 'impressions')?.values[0]?.value || null,
      reach: insights?.find(i => i.name === 'reach')?.values[0]?.value || null,
      engagement: insights?.find(i => i.name === 'engagement')?.values[0]?.value || null,
      saved: insights?.find(i => i.name === 'saved')?.values[0]?.value || null,
      timestamp: data.timestamp,
      url: data.permalink
    };
  } catch (error) {
    console.error('Error fetching Instagram metrics:', error.message);
    return {
      error: error.message,
      likes: 0,
      comments: 0
    };
  }
}

/**
 * Fetch TikTok metrics using TikTok API
 */
async function fetchTikTokMetrics(videoId, user) {
  try {
    const tiktokAuth = user.connectedAccounts?.tiktok;

    if (!tiktokAuth || !tiktokAuth.accessToken) {
      throw new Error('TikTok not connected');
    }

    // TikTok API endpoint (v2)
    const url = 'https://open.tiktokapis.com/v2/video/query/';
    const params = {
      fields: 'id,create_time,cover_image_url,share_url,video_description,duration,height,width,title,like_count,comment_count,share_count,view_count'
    };

    const response = await axios.post(url, {
      filters: {
        video_ids: [videoId]
      }
    }, {
      headers: {
        'Authorization': `Bearer ${tiktokAuth.accessToken}`,
        'Content-Type': 'application/json'
      },
      params
    });

    const video = response.data.data?.videos?.[0];

    if (!video) {
      throw new Error('Video not found');
    }

    return {
      likes: video.like_count || 0,
      comments: video.comment_count || 0,
      shares: video.share_count || 0,
      views: video.view_count || 0,
      timestamp: video.create_time,
      url: video.share_url
    };
  } catch (error) {
    console.error('Error fetching TikTok metrics:', error.message);
    return {
      error: error.message,
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0
    };
  }
}

/**
 * Calculate composite engagement score from metrics
 * Normalized 0-100 scale
 */
function calculateEngagementScore(metrics) {
  let score = 0;
  let count = 0;

  // Instagram scoring
  if (metrics.instagram && !metrics.instagram.error) {
    const ig = metrics.instagram;
    let igScore = 0;

    // Weighted engagement
    if (ig.reach) {
      const engagementRate = ((ig.likes + ig.comments * 3 + (ig.saved || 0) * 5) / ig.reach) * 100;
      igScore = Math.min(100, engagementRate * 10); // Scale to 0-100
    } else {
      // Fallback: use absolute numbers (less accurate)
      igScore = Math.min(100, (ig.likes * 0.5 + ig.comments * 2) / 10);
    }

    score += igScore;
    count++;
  }

  // TikTok scoring
  if (metrics.tiktok && !metrics.tiktok.error) {
    const tt = metrics.tiktok;
    let ttScore = 0;

    if (tt.views > 0) {
      const engagementRate = ((tt.likes + tt.comments * 3 + tt.shares * 5) / tt.views) * 100;
      ttScore = Math.min(100, engagementRate * 10); // Scale to 0-100
    } else {
      ttScore = Math.min(100, (tt.likes * 0.5 + tt.comments * 2 + tt.shares * 3) / 20);
    }

    score += ttScore;
    count++;
  }

  return count > 0 ? Math.round(score / count) : 0;
}

/**
 * Batch fetch performance metrics for multiple posts
 * @param {Array} contentIds - Array of content IDs
 * @returns {Array} Array of performance metrics
 */
async function batchFetchPerformance(contentIds) {
  const results = [];

  for (const contentId of contentIds) {
    try {
      const metrics = await fetchPerformanceMetrics(contentId);
      results.push(metrics);
    } catch (error) {
      results.push({
        contentId,
        status: 'error',
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Auto-fetch performance for old posts (cron job)
 * Fetches metrics for posts 24h-7d old
 */
async function autoFetchRecentPerformance() {
  const now = new Date();
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  try {
    // Find posted content that hasn't had metrics fetched recently
    const content = await Content.find({
      publishedAt: { $gte: sevenDaysAgo, $lte: oneDayAgo },
      $or: [
        { lastMetricsFetch: { $exists: false } },
        { lastMetricsFetch: { $lt: new Date(now - 12 * 60 * 60 * 1000) } } // 12h ago
      ]
    }).limit(50); // Batch limit

    console.log(`[Performance Tracker] Auto-fetching metrics for ${content.length} posts`);

    const results = await batchFetchPerformance(content.map(c => c._id));

    return {
      processed: content.length,
      successful: results.filter(r => r.status !== 'error').length,
      failed: results.filter(r => r.status === 'error').length
    };
  } catch (error) {
    console.error('[Performance Tracker] Auto-fetch failed:', error);
    throw error;
  }
}

module.exports = {
  fetchPerformanceMetrics,
  batchFetchPerformance,
  autoFetchRecentPerformance,
  calculateEngagementScore
};
