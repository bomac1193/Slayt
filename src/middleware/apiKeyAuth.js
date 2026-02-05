/**
 * API Key Authentication Middleware
 * For Taste API external partner access
 */

const ApiKey = require('../models/ApiKey');

/**
 * Authenticate API key from request header
 */
async function authenticateApiKey(req, res, next) {
  try {
    // Get API key from header
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

    if (!apiKey) {
      return res.status(401).json({
        error: 'Missing API key',
        message: 'Include X-API-Key header or Authorization: Bearer <key>'
      });
    }

    // Verify API key
    const verification = await ApiKey.verifyKey(apiKey);

    if (!verification.valid) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: verification.reason
      });
    }

    const keyDoc = verification.key;

    // Check rate limit
    const rateLimit = keyDoc.checkRateLimit();

    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        limit: rateLimit.limit,
        remaining: 0,
        resetAt: rateLimit.resetAt,
        message: `Rate limit: ${rateLimit.limit} requests per hour`
      });
    }

    // Increment usage
    await keyDoc.incrementUsage();

    // Attach to request
    req.apiKey = {
      id: keyDoc._id,
      partnerId: keyDoc.partnerId,
      partnerName: keyDoc.partnerName,
      tier: keyDoc.tier,
      rateLimit: {
        limit: rateLimit.limit,
        remaining: rateLimit.remaining - 1, // -1 for current request
        resetAt: rateLimit.resetAt
      }
    };

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': rateLimit.limit,
      'X-RateLimit-Remaining': rateLimit.remaining - 1,
      'X-RateLimit-Reset': rateLimit.resetAt.toISOString()
    });

    next();
  } catch (error) {
    console.error('API key auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Check if endpoint is allowed for this API key
 */
function checkEndpointAccess(endpoint) {
  return (req, res, next) => {
    // If key allows 'all', grant access
    if (req.apiKey.allowedEndpoints?.includes('all')) {
      return next();
    }

    // Check if specific endpoint is allowed
    if (!req.apiKey.allowedEndpoints?.includes(endpoint)) {
      return res.status(403).json({
        error: 'Access denied',
        message: `Your API key does not have access to ${endpoint} endpoint`,
        allowedEndpoints: req.apiKey.allowedEndpoints
      });
    }

    next();
  };
}

module.exports = {
  authenticateApiKey,
  checkEndpointAccess
};
