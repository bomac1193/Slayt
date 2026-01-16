const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: 'Untitled Content'
  },
  caption: {
    type: String,
    maxlength: 2200
  },
  mediaUrl: {
    type: String,
    required: true
  },
  originalMediaUrl: {
    type: String,
    default: function defaultOriginalUrl() {
      return this.mediaUrl;
    }
  },
  thumbnailUrl: String,
  mediaType: {
    type: String,
    enum: ['image', 'video', 'carousel'],
    required: true
  },
  platform: {
    type: String,
    enum: ['instagram', 'tiktok'],
    required: true
  },
  // AI Scoring
  aiScores: {
    viralityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    engagementScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    aestheticScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    trendScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    analyzedAt: Date
  },
  // AI Suggestions
  aiSuggestions: {
    recommendedType: {
      type: String,
      enum: ['post', 'carousel', 'reel', 'story', 'video'],
    },
    reason: String,
    improvements: [String],
    bestTimeToPost: String,
    targetAudience: String,
    hashtagSuggestions: [String],
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100
    },
    platformRecommendation: String,
    platformConfidence: {
      type: Number,
      min: 0,
      max: 100
    },
    platformReason: String,
    captionIdeas: [String],
    hookIdeas: [String],
    actionItems: [String],
    similarCreators: [{
      name: String,
      handle: String,
      overlap: String,
      performanceNote: String
    }],
    creatorInsights: mongoose.Schema.Types.Mixed
  },
  // Multiple versions for A/B testing
  versions: [{
    versionName: String,
    mediaUrl: String,
    thumbnailUrl: String,
    caption: String,
    aiScores: {
      viralityScore: Number,
      engagementScore: Number,
      aestheticScore: Number,
      trendScore: Number,
      overallScore: Number
    },
    isSelected: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Metadata
  metadata: {
    width: Number,
    height: Number,
    aspectRatio: String,
    fileSize: Number,
    duration: Number, // for videos
    format: String,
    dominantColors: [String]
  },
  // Scheduling and Publishing
  scheduledFor: Date,
  publishedAt: Date,
  platformPostUrl: String, // Direct link to post on Instagram/TikTok
  platformPostId: String,  // Platform-specific post ID
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'failed'],
    default: 'draft'
  },
  hashtags: [String],
  mentions: [String],
  location: String,
  audioTrack: String, // For reels - song or audio name
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
contentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate overall score from individual scores
contentSchema.methods.calculateOverallScore = function() {
  const scores = this.aiScores;
  const total = scores.viralityScore + scores.engagementScore +
                scores.aestheticScore + scores.trendScore;
  this.aiScores.overallScore = Math.round(total / 4);
  return this.aiScores.overallScore;
};

module.exports = mongoose.model('Content', contentSchema);
