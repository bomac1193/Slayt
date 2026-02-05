/**
 * API Key Management Routes
 * Admin routes for creating and managing partner API keys
 */

const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const ApiKey = require('../models/ApiKey');

/**
 * POST /api/admin/api-keys/create
 * Create new API key for a partner
 */
router.post('/create', auth, async (req, res) => {
  try {
    // TODO: Add admin-only check
    // if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin only' });

    const {
      partnerName,
      partnerEmail,
      partnerType,
      tier,
      rateLimit,
      allowedEndpoints,
      description,
      website
    } = req.body;

    if (!partnerName || !partnerEmail) {
      return res.status(400).json({
        error: 'partnerName and partnerEmail required'
      });
    }

    // Generate API key and secret
    const { apiKey, apiSecret } = ApiKey.generateKey();

    // Generate partner ID
    const partnerId = `partner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get rate limit from tier
    const tierLimits = ApiKey.TIER_LIMITS[tier || 'free'];

    // Create API key
    const newKey = new ApiKey({
      partnerId,
      partnerName,
      partnerEmail,
      partnerType: partnerType || 'developer',
      apiKey,
      apiSecret,
      tier: tier || 'free',
      rateLimit: rateLimit || tierLimits.requestsPerHour,
      allowedEndpoints: allowedEndpoints || ['all'],
      description,
      website,
      usage: {
        totalRequests: 0,
        requestsThisHour: 0,
        requestsThisMonth: 0,
        hourResetAt: new Date(),
        monthResetAt: new Date()
      }
    });

    await newKey.save();

    res.json({
      success: true,
      message: 'API key created successfully',
      apiKey: {
        partnerId: newKey.partnerId,
        partnerName: newKey.partnerName,
        apiKey: newKey.apiKey,
        apiSecret: newKey.apiSecret, // ONLY shown once!
        tier: newKey.tier,
        rateLimit: newKey.rateLimit,
        allowedEndpoints: newKey.allowedEndpoints,
        createdAt: newKey.createdAt
      },
      warning: 'Store the apiSecret securely - it will not be shown again'
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/api-keys
 * List all API keys
 */
router.get('/', auth, async (req, res) => {
  try {
    // TODO: Add admin-only check

    const keys = await ApiKey.find()
      .select('-apiSecret') // Never expose secrets
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: keys.length,
      keys
    });
  } catch (error) {
    console.error('Error listing API keys:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/api-keys/:partnerId
 * Get specific API key details
 */
router.get('/:partnerId', auth, async (req, res) => {
  try {
    const { partnerId } = req.params;

    const key = await ApiKey.findOne({ partnerId })
      .select('-apiSecret');

    if (!key) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json({
      success: true,
      key
    });
  } catch (error) {
    console.error('Error getting API key:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/admin/api-keys/:partnerId
 * Update API key settings
 */
router.put('/:partnerId', auth, async (req, res) => {
  try {
    const { partnerId } = req.params;
    const {
      isActive,
      tier,
      rateLimit,
      allowedEndpoints,
      description,
      website
    } = req.body;

    const key = await ApiKey.findOne({ partnerId });

    if (!key) {
      return res.status(404).json({ error: 'API key not found' });
    }

    // Update fields
    if (isActive !== undefined) key.isActive = isActive;
    if (tier) {
      key.tier = tier;
      // Auto-update rate limit based on tier if not explicitly set
      if (!rateLimit) {
        key.rateLimit = ApiKey.TIER_LIMITS[tier].requestsPerHour;
      }
    }
    if (rateLimit) key.rateLimit = rateLimit;
    if (allowedEndpoints) key.allowedEndpoints = allowedEndpoints;
    if (description !== undefined) key.description = description;
    if (website !== undefined) key.website = website;

    await key.save();

    res.json({
      success: true,
      message: 'API key updated',
      key: key.toObject({ transform: (doc, ret) => { delete ret.apiSecret; return ret; } })
    });
  } catch (error) {
    console.error('Error updating API key:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/api-keys/:partnerId
 * Revoke (delete) API key
 */
router.delete('/:partnerId', auth, async (req, res) => {
  try {
    const { partnerId } = req.params;

    const key = await ApiKey.findOne({ partnerId });

    if (!key) {
      return res.status(404).json({ error: 'API key not found' });
    }

    await ApiKey.deleteOne({ partnerId });

    res.json({
      success: true,
      message: 'API key revoked'
    });
  } catch (error) {
    console.error('Error revoking API key:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/api-keys/:partnerId/regenerate
 * Regenerate API key (issue new key, invalidate old)
 */
router.post('/:partnerId/regenerate', auth, async (req, res) => {
  try {
    const { partnerId } = req.params;

    const key = await ApiKey.findOne({ partnerId });

    if (!key) {
      return res.status(404).json({ error: 'API key not found' });
    }

    // Generate new key
    const { apiKey, apiSecret } = ApiKey.generateKey();

    key.apiKey = apiKey;
    key.apiSecret = apiSecret;
    await key.save();

    res.json({
      success: true,
      message: 'API key regenerated',
      apiKey: {
        apiKey: key.apiKey,
        apiSecret: key.apiSecret, // ONLY shown once!
        regeneratedAt: new Date()
      },
      warning: 'Old key is now invalid. Store the new apiSecret securely.'
    });
  } catch (error) {
    console.error('Error regenerating API key:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/api-keys/stats/summary
 * Get overall API usage statistics
 */
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const keys = await ApiKey.find();

    const stats = {
      totalPartners: keys.length,
      activePartners: keys.filter(k => k.isActive).length,
      totalRequests: keys.reduce((sum, k) => sum + (k.usage.totalRequests || 0), 0),
      requestsThisMonth: keys.reduce((sum, k) => sum + (k.usage.requestsThisMonth || 0), 0),
      byTier: {},
      byType: {},
      topPartners: keys
        .sort((a, b) => (b.usage.totalRequests || 0) - (a.usage.totalRequests || 0))
        .slice(0, 10)
        .map(k => ({
          partnerId: k.partnerId,
          partnerName: k.partnerName,
          tier: k.tier,
          totalRequests: k.usage.totalRequests,
          requestsThisMonth: k.usage.requestsThisMonth
        }))
    };

    // Group by tier
    keys.forEach(k => {
      stats.byTier[k.tier] = (stats.byTier[k.tier] || 0) + 1;
    });

    // Group by type
    keys.forEach(k => {
      stats.byType[k.partnerType] = (stats.byType[k.partnerType] || 0) + 1;
    });

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting API stats:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
