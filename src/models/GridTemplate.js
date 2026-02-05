/**
 * Grid Template Model - Designer Vault
 * BLUE OCEAN: Save high-conviction grids as reusable templates
 */

const mongoose = require('mongoose');

const gridTemplateSchema = new mongoose.Schema({
  // Owner
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    index: true
  },

  // Template Metadata
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['grid', 'carousel', 'story', 'feed', 'theme'],
    default: 'grid'
  },
  tags: [String],

  // Platform
  platform: {
    type: String,
    enum: ['instagram', 'tiktok', 'all'],
    default: 'all'
  },

  // Grid Configuration
  layout: {
    rows: { type: Number, default: 3 },
    columns: { type: Number, default: 3 }
  },

  // Template Structure (position-based)
  // Each slot defines what type of content should go there
  slots: [{
    position: Number, // 0-8 for 3x3
    row: Number,
    col: Number,
    contentId: mongoose.Schema.Types.ObjectId, // Original content (for preview)
    contentType: {
      type: String,
      enum: ['post', 'carousel', 'reel', 'video', 'placeholder']
    },
    archetypePreference: String, // Preferred archetype for this slot
    colorPalette: [String], // Preferred colors
    metadata: {
      caption: String,
      hashtags: [String],
      originalUrl: String,
      thumbnailUrl: String
    }
  }],

  // Template Performance Metrics
  metrics: {
    // When this template was created
    avgConvictionScore: Number,
    aestheticScore: Number,

    // Archetype distribution
    archetypeDistribution: {
      type: Map,
      of: Number // { "Artisan": 3, "Maverick": 2, ... }
    },

    // Color harmony
    colorHarmony: Number, // 0-100

    // Visual flow score
    visualFlow: Number, // 0-100

    // Performance (if template has been used)
    timesUsed: { type: Number, default: 0 },
    avgPerformance: Number, // Avg engagement when used

    // Rating
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    }
  },

  // Source Grid (reference)
  sourceGridId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grid'
  },

  // Visibility
  isPublic: {
    type: Boolean,
    default: false // Private by default
  },
  isFeatured: {
    type: Boolean,
    default: false
  },

  // Marketplace (future)
  marketplace: {
    forSale: { type: Boolean, default: false },
    price: Number,
    currency: { type: String, default: 'USD' },
    purchases: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 }
  },

  // Usage tracking
  lastUsed: Date,

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
gridTemplateSchema.index({ userId: 1, createdAt: -1 });
gridTemplateSchema.index({ platform: 1, isPublic: 1 });
gridTemplateSchema.index({ 'metrics.avgConvictionScore': -1 });
gridTemplateSchema.index({ tags: 1 });

// Update timestamp on save
gridTemplateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate template score (composite)
gridTemplateSchema.methods.calculateScore = function() {
  const conviction = this.metrics.avgConvictionScore || 0;
  const aesthetic = this.metrics.aestheticScore || 0;
  const performance = this.metrics.avgPerformance || 0;
  const usage = Math.min(this.metrics.timesUsed * 5, 100); // Cap at 100

  // Weighted score
  return Math.round(
    conviction * 0.4 +
    aesthetic * 0.3 +
    performance * 0.2 +
    usage * 0.1
  );
};

// Instance method: Apply template to content array
gridTemplateSchema.methods.applyToContent = function(contentArray) {
  // Match content to template slots based on archetype preference
  const arrangement = [];
  const usedContent = new Set();

  // First pass: exact archetype matches
  this.slots.forEach(slot => {
    if (slot.archetypePreference) {
      const match = contentArray.find(content =>
        !usedContent.has(content._id.toString()) &&
        content.conviction?.archetypeMatch?.designation === slot.archetypePreference
      );

      if (match) {
        arrangement[slot.position] = match._id;
        usedContent.add(match._id.toString());
      }
    }
  });

  // Second pass: fill remaining slots with highest conviction
  this.slots.forEach(slot => {
    if (!arrangement[slot.position]) {
      const match = contentArray.find(content =>
        !usedContent.has(content._id.toString())
      );

      if (match) {
        arrangement[slot.position] = match._id;
        usedContent.add(match._id.toString());
      }
    }
  });

  return arrangement;
};

// Static method: Get top templates
gridTemplateSchema.statics.getTopTemplates = async function(filters = {}) {
  const query = { isPublic: true };

  if (filters.platform) query.platform = filters.platform;
  if (filters.tags) query.tags = { $in: filters.tags };

  const templates = await this.find(query)
    .sort({ 'metrics.avgConvictionScore': -1 })
    .limit(filters.limit || 20)
    .populate('userId', 'name email avatar');

  return templates;
};

// Static method: Get user's best templates
gridTemplateSchema.statics.getUserBestTemplates = async function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ 'metrics.avgConvictionScore': -1 })
    .limit(limit);
};

module.exports = mongoose.model('GridTemplate', gridTemplateSchema);
