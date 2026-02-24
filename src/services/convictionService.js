/**
 * Conviction Service
 * Calculate conviction scores by combining performance prediction
 * and brand consistency for intelligent content gating.
 */

const intelligenceService = require('./intelligenceService');

/**
 * Conviction Score Thresholds
 */
const CONVICTION_THRESHOLDS = {
  EXCEPTIONAL: 85,  // Auto-prioritize, suggest cross-posting
  HIGH: 70,         // Approved for scheduling
  MEDIUM: 50,       // Warning, suggest improvements
  LOW: 0            // Block (strict mode) or warn
};

/**
 * Calculate Conviction Score for Content
 * @param {Object} content - Content document
 * @param {Object} userGenome - User's taste genome (ignored, kept for API compat)
 * @param {Object} options - Calculation options
 * @returns {Object} Conviction scoring result
 */
async function calculateConviction(content, userGenome, options = {}) {
  const {
    strictBrandConsistency = false,
    customWeights = null
  } = options;

  const weights = customWeights || {
    performance: 0.6,
    brand: 0.4
  };

  // 1. Performance Potential Score (existing AI scores)
  const performanceScore = calculatePerformancePotential(content);

  // 2. Brand Consistency Score (on-brand analysis)
  const brandScore = await calculateBrandConsistency(content, userGenome, strictBrandConsistency);

  // TEMPORAL DECAY: Penalize over-reliance on trends (only affects trend scores >80)
  const trendScore = content.aiScores?.trendScore || 0;
  let temporalFactor = 1.0;

  if (trendScore > 90) {
    temporalFactor = Math.max(0.80, 1.0 - ((trendScore - 90) / 50));
  } else if (trendScore > 80) {
    temporalFactor = Math.max(0.90, 1.0 - ((trendScore - 80) / 100));
  }

  // Calculate base weighted conviction score
  const baseConvictionScore = (
    (performanceScore * weights.performance) +
    (brandScore * weights.brand)
  );

  // Apply temporal factor (penalizes trend-chasing)
  const convictionScore = Math.round(baseConvictionScore * temporalFactor);

  // Determine tier
  const tier = getConvictionTier(convictionScore);

  return {
    conviction: {
      score: convictionScore,
      tier,
      breakdown: {
        performance: Math.round(performanceScore),
        brand: Math.round(brandScore)
      },
      weights,
      calculatedAt: new Date()
    },
    // Update aiScores for backward compatibility
    aiScores: {
      convictionScore,
      brandConsistency: Math.round(brandScore)
    }
  };
}

/**
 * Calculate Performance Potential
 * Average of virality, engagement, aesthetic, and trend scores
 */
function calculatePerformancePotential(content) {
  const scores = content.aiScores || {};

  const viralityScore = scores.viralityScore || 0;
  const engagementScore = scores.engagementScore || 0;
  const aestheticScore = scores.aestheticScore || 0;
  const trendScore = scores.trendScore || 0;

  return (viralityScore + engagementScore + aestheticScore + trendScore) / 4;
}

/**
 * Check if content has any actual data (not empty attack)
 * Returns false only if COMPLETELY empty (no caption, no analysis data, no scores)
 */
function hasAnyData(content) {
  if (content.caption && content.caption.length > 0) return true;

  if (content.analysis?.aestheticDNA?.tone && content.analysis.aestheticDNA.tone.length > 0) return true;
  if (content.analysis?.performanceDNA?.hooks && content.analysis.performanceDNA.hooks.length > 0) return true;
  if (content.analysis?.aestheticDNA?.style && content.analysis.aestheticDNA.style.length > 0) return true;
  if (content.analysis?.aestheticDNA?.voice && content.analysis.aestheticDNA.voice.length > 0) return true;
  if (content.analysis?.performanceDNA?.structure && content.analysis.performanceDNA.structure.length > 0) return true;

  const hasScores = content.aiScores && (
    content.aiScores.viralityScore > 0 ||
    content.aiScores.engagementScore > 0 ||
    content.aiScores.aestheticScore > 0 ||
    content.aiScores.trendScore > 0
  );

  if (hasScores) return true;

  const aestheticDNA = content.analysis?.aestheticDNA;
  const performanceDNA = content.analysis?.performanceDNA;

  const hasAestheticStructure = aestheticDNA && Object.keys(aestheticDNA).length > 0;
  const hasPerformanceStructure = performanceDNA && Object.keys(performanceDNA).length > 0;

  return hasAestheticStructure || hasPerformanceStructure;
}

/**
 * Check if content appears to be from a genuine new creator
 */
function hasGenuineContent(content) {
  const hasCaption = content.caption && content.caption.length > 20;
  const hasAestheticDNA = content.analysis?.aestheticDNA?.tone &&
                          content.analysis.aestheticDNA.tone.length > 0;
  const hasViralityScore = content.aiScores?.viralityScore > 0;
  const hasMediaUrl = content.mediaUrl && content.mediaUrl.length > 0;

  const signalCount = [
    hasCaption,
    hasAestheticDNA,
    hasViralityScore,
    hasMediaUrl
  ].filter(Boolean).length;

  return signalCount >= 2;
}

/**
 * Calculate Brand Consistency Score
 * Measures how well content aligns with brand guidelines
 */
async function calculateBrandConsistency(content, userGenome, strictMode = false) {
  let brandScore = 50; // Default: neutral

  if (!hasAnyData(content)) {
    brandScore = 20; // Very low score for empty content
  } else {
    if (userGenome && userGenome.signals) {
      const signals = userGenome.signals || [];
      const positiveSignals = signals.filter(s => s.type === 'save' || s.type === 'like');
      const totalSignals = signals.length;

      if (totalSignals >= 50) {
        brandScore = 85;
      } else if (totalSignals >= 20) {
        brandScore = 75;
      } else if (totalSignals >= 10) {
        brandScore = 65;
      } else if (totalSignals > 0) {
        brandScore = 55;
      } else if (totalSignals === 0 && hasGenuineContent(content)) {
        brandScore = 60;
      }

      if (strictMode && totalSignals > 0) {
        const positiveRatio = positiveSignals.length / totalSignals;
        if (positiveRatio < 0.5) {
          brandScore *= 0.9;
        }
      }
    } else if (hasGenuineContent(content)) {
      const performanceScore = (
        (content.aiScores?.viralityScore || 0) +
        (content.aiScores?.engagementScore || 0) +
        (content.aiScores?.aestheticScore || 0)
      ) / 3;

      if (performanceScore >= 60) {
        brandScore = 70;
      } else {
        brandScore = 60;
      }
    }
  }

  if (content.conviction?.userOverride) {
    const wasVindicated = content.convictionValidation?.feedback?.signals?.some(
      s => s.type === 'successful_override'
    );
    if (!wasVindicated) {
      brandScore = Math.max(30, brandScore - 5);
    }
  }

  return Math.round(brandScore);
}

/**
 * Get Conviction Tier from Score
 */
function getConvictionTier(score) {
  if (score >= CONVICTION_THRESHOLDS.EXCEPTIONAL) return 'exceptional';
  if (score >= CONVICTION_THRESHOLDS.HIGH) return 'high';
  if (score >= CONVICTION_THRESHOLDS.MEDIUM) return 'medium';
  return 'low';
}

/**
 * Check Conviction Gating
 * Determine if content can be scheduled based on conviction score
 */
function checkGating(convictionScore, options = {}) {
  const {
    threshold = CONVICTION_THRESHOLDS.HIGH,
    strictMode = false,
    userOverride = false
  } = options;

  let status = 'approved';
  let reason = '';
  let suggestions = [];

  if (userOverride) {
    return {
      status: 'override',
      reason: 'User override active',
      canSchedule: true,
      requiresReview: false,
      suggestions: []
    };
  }

  if (convictionScore < CONVICTION_THRESHOLDS.MEDIUM) {
    status = strictMode ? 'blocked' : 'warning';
    reason = `Low conviction score (${convictionScore}/100). Content may underperform significantly.`;
    suggestions = [
      'Revise caption to better align with your brand voice',
      'Adjust visual style to match your top-performing content',
      'Consider A/B testing different versions',
      'Review AI suggestions for improvements'
    ];
  } else if (convictionScore < threshold) {
    status = 'warning';
    reason = `Below conviction threshold (${convictionScore}/${threshold}). Review suggested improvements before scheduling.`;
    suggestions = [
      'Minor adjustments could improve predicted performance',
      'Consider testing with a smaller audience first'
    ];
  } else if (convictionScore >= CONVICTION_THRESHOLDS.EXCEPTIONAL) {
    status = 'approved';
    reason = `High-conviction content (${convictionScore}/100). Predicted to perform exceptionally well.`;
    suggestions = [
      'Consider cross-posting to other platforms',
      'Amplify with paid promotion',
      'Save for optimal posting time'
    ];
  } else {
    status = 'approved';
    reason = `Good conviction score (${convictionScore}/100)`;
    suggestions = [];
  }

  return {
    status,
    reason,
    score: convictionScore,
    canSchedule: status !== 'blocked',
    requiresReview: status === 'warning',
    suggestions
  };
}

/**
 * Generate Conviction Report for Content
 */
async function generateConvictionReport(content, userGenome) {
  const result = await calculateConviction(content, userGenome);
  const gating = checkGating(result.conviction.score, {
    userOverride: content.conviction?.userOverride
  });

  return {
    ...result,
    gating,
    recommendations: generateRecommendations(result, gating)
  };
}

/**
 * Generate Actionable Recommendations
 */
function generateRecommendations(convictionResult, gatingResult) {
  const recommendations = [];

  const { breakdown } = convictionResult.conviction;

  // Performance recommendations
  if (breakdown.performance < 60) {
    recommendations.push({
      type: 'performance',
      priority: 'high',
      message: 'Low predicted performance',
      actions: [
        'Use AI to analyze top-performing content in your niche',
        'Test different content formats (carousel vs. reel)',
        'Optimize posting time based on audience activity'
      ]
    });
  }

  // Brand consistency recommendations
  if (breakdown.brand < 70) {
    recommendations.push({
      type: 'brand',
      priority: 'medium',
      message: 'May not match your brand voice',
      actions: [
        'Review brand guidelines and adjust caption',
        'Ensure visual style matches your feed aesthetic',
        'Check if tone aligns with your audience expectations'
      ]
    });
  }

  // Add gating suggestions
  if (gatingResult.suggestions && gatingResult.suggestions.length > 0) {
    recommendations.push({
      type: 'gating',
      priority: gatingResult.status === 'blocked' ? 'critical' : 'medium',
      message: gatingResult.reason,
      actions: gatingResult.suggestions
    });
  }

  return recommendations;
}

module.exports = {
  calculateConviction,
  checkGating,
  generateConvictionReport,
  CONVICTION_THRESHOLDS
};
