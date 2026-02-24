const ApprovalQueue = require('../models/ApprovalQueue');
const convictionService = require('./convictionService');

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  return String(value).toLowerCase() === 'true';
};

const parseNumber = (value, defaultValue) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
};

function getConfig() {
  return {
    enforced: parseBoolean(process.env.APPROVAL_GATE_ENFORCED, true),
    strictMode: parseBoolean(process.env.APPROVAL_GATE_STRICT_MODE, true),
    threshold: parseNumber(process.env.APPROVAL_GATE_THRESHOLD, 70),
    requireQueueApproval: parseBoolean(process.env.APPROVAL_GATE_REQUIRE_QUEUE_APPROVAL, false),
    allowUserOverride: parseBoolean(process.env.APPROVAL_GATE_ALLOW_USER_OVERRIDE, true),
  };
}

async function ensureConviction(content, user) {
  if (content?.conviction?.score !== null && content?.conviction?.score !== undefined) {
    return content.conviction.score;
  }

  const convictionResult = await convictionService.calculateConviction(content, null);
  content.aiScores = { ...content.aiScores, ...convictionResult.aiScores };
  content.conviction = convictionResult.conviction;
  await content.save();

  return convictionResult.conviction.score;
}

async function checkQueueApproval(contentId) {
  const latestItem = await ApprovalQueue.findOne({ contentId }).sort({ updatedAt: -1, submittedAt: -1 });

  if (!latestItem) {
    return {
      ok: false,
      reason: 'No approval record found for this content.',
      queueStatus: 'missing',
    };
  }

  if (latestItem.status !== 'approved' && latestItem.status !== 'published') {
    return {
      ok: false,
      reason: `Approval workflow incomplete (${latestItem.status}).`,
      queueStatus: latestItem.status,
    };
  }

  return {
    ok: true,
    reason: 'Approval workflow complete.',
    queueStatus: latestItem.status,
  };
}

async function evaluateContentGate({ content, user, action = 'publish' }) {
  const config = getConfig();

  if (!config.enforced) {
    return {
      allowed: true,
      bypassed: true,
      reason: 'Approval gate enforcement disabled.',
      action,
      config,
    };
  }

  const convictionScore = await ensureConviction(content, user);
  const hasUserOverride = Boolean(content?.conviction?.userOverride);
  const userOverride = hasUserOverride && config.allowUserOverride;

  const gating = convictionService.checkGating(convictionScore, {
    threshold: config.threshold,
    strictMode: config.strictMode,
    userOverride,
  });

  if (!gating.canSchedule) {
    return {
      allowed: false,
      code: 'APPROVAL_GATE_BLOCKED',
      action,
      reason: gating.reason,
      conviction: {
        score: convictionScore,
        status: gating.status,
        requiresReview: gating.requiresReview,
        suggestions: gating.suggestions,
      },
      config,
    };
  }

  if (config.requireQueueApproval) {
    const queueCheck = await checkQueueApproval(content._id);
    if (!queueCheck.ok) {
      return {
        allowed: false,
        code: 'APPROVAL_GATE_BLOCKED',
        action,
        reason: queueCheck.reason,
        conviction: {
          score: convictionScore,
          status: gating.status,
          requiresReview: gating.requiresReview,
          suggestions: gating.suggestions,
        },
        queueStatus: queueCheck.queueStatus,
        config,
      };
    }
  }

  return {
    allowed: true,
    action,
    reason: gating.reason,
    conviction: {
      score: convictionScore,
      status: gating.status,
      requiresReview: gating.requiresReview,
      suggestions: gating.suggestions,
    },
    config,
  };
}

module.exports = {
  evaluateContentGate,
};
