/**
 * API Key Model - Partner Access Management
 * For Taste API external access
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const apiKeySchema = new mongoose.Schema({
  // Partner Info
  partnerId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  partnerName: {
    type: String,
    required: true
  },
  partnerEmail: {
    type: String,
    required: true
  },
  partnerType: {
    type: String,
    enum: ['agency', 'saas', 'creator-tool', 'enterprise', 'developer'],
    default: 'developer'
  },

  // API Key
  apiKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  apiSecret: {
    type: String,
    required: true
  },

  // Access Control
  isActive: {
    type: Boolean,
    default: true
  },
  tier: {
    type: String,
    enum: ['free', 'starter', 'professional', 'enterprise'],
    default: 'free'
  },

  // Rate Limits (requests per hour)
  rateLimit: {
    type: Number,
    default: 100 // Free tier: 100 req/hour
  },

  // Allowed Endpoints
  allowedEndpoints: [{
    type: String,
    enum: ['taste-score', 'archetype-match', 'content-analysis', 'recommendations', 'all'],
    default: 'all'
  }],

  // Usage Tracking
  usage: {
    totalRequests: { type: Number, default: 0 },
    lastRequest: Date,
    requestsThisHour: { type: Number, default: 0 },
    requestsThisMonth: { type: Number, default: 0 },
    hourResetAt: Date,
    monthResetAt: Date
  },

  // Billing (if applicable)
  billing: {
    plan: String,
    pricePerRequest: { type: Number, default: 0 }, // In cents
    monthlyFee: { type: Number, default: 0 }, // In cents
    currentBalance: { type: Number, default: 0 },
    lastBilledAt: Date
  },

  // Webhooks (for async responses)
  webhookUrl: String,
  webhookSecret: String,

  // Metadata
  description: String,
  website: String,
  logoUrl: String,

  // Security
  allowedOrigins: [String], // CORS origins
  allowedIPs: [String], // IP whitelist

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: Date // Optional expiration
});

// Indexes
apiKeySchema.index({ apiKey: 1, isActive: 1 });
apiKeySchema.index({ partnerId: 1 });
apiKeySchema.index({ 'usage.requestsThisMonth': -1 });

// Pre-save middleware
apiKeySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Generate API key and secret
apiKeySchema.statics.generateKey = function() {
  const apiKey = 'sk_' + crypto.randomBytes(24).toString('hex');
  const apiSecret = crypto.randomBytes(32).toString('hex');
  return { apiKey, apiSecret };
};

// Verify API key
apiKeySchema.statics.verifyKey = async function(apiKey) {
  const key = await this.findOne({ apiKey, isActive: true });

  if (!key) {
    return { valid: false, reason: 'Invalid or inactive API key' };
  }

  if (key.expiresAt && key.expiresAt < new Date()) {
    return { valid: false, reason: 'API key expired' };
  }

  return { valid: true, key };
};

// Check rate limit
apiKeySchema.methods.checkRateLimit = function() {
  const now = new Date();
  const hourAgo = new Date(now - 60 * 60 * 1000);

  // Reset hourly counter if needed
  if (!this.usage.hourResetAt || this.usage.hourResetAt < hourAgo) {
    this.usage.requestsThisHour = 0;
    this.usage.hourResetAt = now;
  }

  // Check if over limit
  if (this.usage.requestsThisHour >= this.rateLimit) {
    return {
      allowed: false,
      limit: this.rateLimit,
      remaining: 0,
      resetAt: this.usage.hourResetAt
    };
  }

  return {
    allowed: true,
    limit: this.rateLimit,
    remaining: this.rateLimit - this.usage.requestsThisHour,
    resetAt: this.usage.hourResetAt
  };
};

// Increment usage
apiKeySchema.methods.incrementUsage = async function() {
  const now = new Date();
  const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

  // Reset monthly counter if needed
  if (!this.usage.monthResetAt || this.usage.monthResetAt < monthAgo) {
    this.usage.requestsThisMonth = 0;
    this.usage.monthResetAt = now;
  }

  this.usage.totalRequests++;
  this.usage.requestsThisHour++;
  this.usage.requestsThisMonth++;
  this.usage.lastRequest = now;

  await this.save();
};

// Tier limits
apiKeySchema.statics.TIER_LIMITS = {
  free: { requestsPerHour: 100, requestsPerMonth: 10000, price: 0 },
  starter: { requestsPerHour: 1000, requestsPerMonth: 100000, price: 49 },
  professional: { requestsPerHour: 5000, requestsPerMonth: 500000, price: 199 },
  enterprise: { requestsPerHour: 20000, requestsPerMonth: 2000000, price: 999 }
};

module.exports = mongoose.model('ApiKey', apiKeySchema);
