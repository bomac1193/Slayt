/**
 * Conviction Validator Service
 * Compares predicted conviction scores vs actual performance
 * Part of the Conviction Loop: validates predictions and calculates accuracy
 */

const Content = require('../models/Content');
const { fetchPerformanceMetrics } = require('./performanceTrackerService');

/**
 * Validate conviction prediction against actual performance
 * @param {String} contentId - Content ID
 * @returns {Object} Validation results
 */
async function validateConviction(contentId) {
  try {
    const content = await Content.findById(contentId);

    if (!content) {
      throw new Error('Content not found');
    }

    // Check if content has conviction score
    if (!content.conviction || !content.conviction.score) {
      return {
        status: 'no_conviction',
        message: 'No conviction score to validate'
      };
    }

    // Fetch actual performance metrics
    const performance = await fetchPerformanceMetrics(contentId);

    if (performance.status === 'not_posted') {
      return {
        status: 'not_posted',
        message: 'Content not posted yet - cannot validate'
      };
    }

    // Compare predicted vs actual
    const validation = {
      contentId: content._id,
      predicted: {
        convictionScore: content.conviction.score,
        tier: content.conviction.tier,
        breakdown: content.conviction.breakdown,
        archetypeMatch: content.conviction.archetypeMatch
      },
      actual: {
        engagementScore: performance.engagementScore,
        metrics: performance.metrics,
        postedAt: performance.postedAt
      },
      wasUserOverride: content.conviction?.userOverride || false,
      validation: {},
      calculatedAt: new Date()
    };

    // Calculate prediction accuracy
    validation.validation.accuracy = calculateAccuracy(
      content.conviction.score,
      performance.engagementScore
    );

    // Determine if prediction was good
    validation.validation.predictionQuality = determinePredictionQuality(
      validation.validation.accuracy
    );

    // Calculate component accuracy (performance, taste, brand)
    validation.validation.componentAnalysis = analyzeComponents(
      content.conviction.breakdown,
      performance
    );

    // Generate feedback for genome update
    validation.feedback = generateFeedback(validation, content);

    // Store validation in content
    content.convictionValidation = validation;
    await content.save();

    return validation;
  } catch (error) {
    console.error('Error validating conviction:', error);
    throw error;
  }
}

/**
 * Calculate prediction accuracy
 * Returns percentage accuracy (0-100)
 */
function calculateAccuracy(predicted, actual) {
  if (actual === 0) {
    return predicted === 0 ? 100 : 0;
  }

  // Calculate percentage error
  const error = Math.abs(predicted - actual);
  const maxScore = Math.max(predicted, actual);
  const accuracy = 100 - (error / maxScore * 100);

  return Math.max(0, Math.round(accuracy));
}

/**
 * Determine prediction quality category
 */
function determinePredictionQuality(accuracy) {
  if (accuracy >= 90) return 'excellent';
  if (accuracy >= 75) return 'good';
  if (accuracy >= 60) return 'fair';
  if (accuracy >= 40) return 'poor';
  return 'very_poor';
}

/**
 * Analyze component accuracy (performance, taste, brand)
 */
function analyzeComponents(breakdown, performance) {
  const analysis = {};

  // Performance component validation
  // High engagement = performance prediction was good
  if (performance.engagementScore >= 70) {
    analysis.performance = {
      predicted: breakdown?.performance || 0,
      actual: performance.engagementScore,
      delta: performance.engagementScore - (breakdown?.performance || 0),
      assessment: performance.engagementScore > (breakdown?.performance || 0) ? 'underestimated' : 'accurate'
    };
  } else {
    analysis.performance = {
      predicted: breakdown?.performance || 0,
      actual: performance.engagementScore,
      delta: performance.engagementScore - (breakdown?.performance || 0),
      assessment: performance.engagementScore < (breakdown?.performance || 0) ? 'overestimated' : 'accurate'
    };
  }

  // Taste component (harder to validate - use engagement as proxy)
  // If engagement is high, taste alignment was likely good
  analysis.taste = {
    predicted: breakdown?.taste || 0,
    proxy: performance.engagementScore,
    confidence: calculateTasteConfidence(breakdown?.taste || 0, performance.engagementScore)
  };

  // Brand component (validate through consistency)
  analysis.brand = {
    predicted: breakdown?.brand || 0,
    note: 'Brand validation requires multi-post consistency tracking'
  };

  return analysis;
}

/**
 * Calculate taste prediction confidence
 */
function calculateTasteConfidence(predictedTaste, actualEngagement) {
  // If both are high or both are low, confidence is high
  const bothHigh = predictedTaste >= 70 && actualEngagement >= 70;
  const bothLow = predictedTaste < 50 && actualEngagement < 50;
  const mismatch = Math.abs(predictedTaste - actualEngagement) > 30;

  if (bothHigh || bothLow) return 'high';
  if (mismatch) return 'low';
  return 'medium';
}

/**
 * Generate feedback for genome update
 * @param {Object} validation - Validation result
 * @param {Object} content - Content document (for override detection)
 */
function generateFeedback(validation, content) {
  const feedback = {
    shouldUpdateGenome: false,
    weight: 0,
    signals: []
  };

  const accuracy = validation.validation.accuracy;
  const predicted = validation.predicted.convictionScore;
  const actual = validation.actual.engagementScore;
  const delta = actual - predicted;

  // Only update genome if there's significant learning opportunity
  if (Math.abs(delta) >= 15) {
    feedback.shouldUpdateGenome = true;
    feedback.weight = Math.min(1.0, Math.abs(delta) / 50); // Weight based on error magnitude

    // Generate specific signals
    if (delta > 0) {
      // Underestimated - this archetype/pattern performs better than expected
      feedback.signals.push({
        type: 'underestimated',
        message: 'Content performed better than predicted',
        action: 'increase_archetype_confidence',
        archetype: validation.predicted.archetypeMatch?.designation,
        magnitude: delta
      });
    } else {
      // Overestimated - this pattern performs worse than expected
      feedback.signals.push({
        type: 'overestimated',
        message: 'Content performed worse than predicted',
        action: 'decrease_archetype_confidence',
        archetype: validation.predicted.archetypeMatch?.designation,
        magnitude: Math.abs(delta)
      });
    }

    // Component-specific feedback
    const perfAnalysis = validation.validation.componentAnalysis?.performance;
    if (perfAnalysis) {
      feedback.signals.push({
        type: 'performance_component',
        assessment: perfAnalysis.assessment,
        delta: perfAnalysis.delta,
        action: perfAnalysis.assessment === 'overestimated' ? 'reduce_performance_weight' : 'increase_performance_weight'
      });
    }

    // Override-aware: if user overrode a low score and actual outperformed by 15+
    if (content?.conviction?.userOverride && delta >= 15) {
      feedback.signals.push({
        type: 'successful_override',
        message: 'User override led to strong performance',
        action: 'boost_override_confidence',
        archetype: validation.predicted.archetypeMatch?.designation,
        magnitude: delta
      });
      feedback.weight = Math.min(1.0, feedback.weight * 2); // Double weight for successful overrides
    }
  }

  return feedback;
}

/**
 * Batch validate multiple posts
 */
async function batchValidateConvictions(contentIds) {
  const results = [];

  for (const contentId of contentIds) {
    try {
      const validation = await validateConviction(contentId);
      results.push(validation);
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
 * Get overall prediction accuracy statistics
 * @param {String} userId - User ID (optional)
 * @param {String} profileId - Profile ID (optional)
 * @returns {Object} Accuracy stats
 */
async function getAccuracyStats(userId, profileId) {
  try {
    const query = {};
    if (userId) query.user = userId;
    if (profileId) query.profile = profileId;
    query['convictionValidation.validation.accuracy'] = { $exists: true };

    const validatedContent = await Content.find(query).select('convictionValidation');

    if (validatedContent.length === 0) {
      return {
        totalValidations: 0,
        avgAccuracy: 0,
        accuracyTrend: [],
        byQuality: {}
      };
    }

    // Calculate average accuracy
    const accuracies = validatedContent.map(c => c.convictionValidation.validation.accuracy);
    const avgAccuracy = Math.round(
      accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length
    );

    // Group by quality
    const byQuality = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
      very_poor: 0
    };

    validatedContent.forEach(c => {
      const quality = c.convictionValidation.validation.predictionQuality;
      byQuality[quality] = (byQuality[quality] || 0) + 1;
    });

    // Calculate trend (last 10 validations)
    const recent = validatedContent
      .sort((a, b) => new Date(b.convictionValidation.calculatedAt) - new Date(a.convictionValidation.calculatedAt))
      .slice(0, 10);

    const accuracyTrend = recent.map(c => ({
      accuracy: c.convictionValidation.validation.accuracy,
      date: c.convictionValidation.calculatedAt
    }));

    return {
      totalValidations: validatedContent.length,
      avgAccuracy,
      accuracyTrend,
      byQuality,
      improvementRate: calculateImprovementRate(accuracyTrend)
    };
  } catch (error) {
    console.error('Error getting accuracy stats:', error);
    throw error;
  }
}

/**
 * Calculate improvement rate from trend
 */
function calculateImprovementRate(trend) {
  if (trend.length < 3) return 0;

  const firstHalf = trend.slice(0, Math.floor(trend.length / 2));
  const secondHalf = trend.slice(Math.floor(trend.length / 2));

  const firstAvg = firstHalf.reduce((sum, t) => sum + t.accuracy, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, t) => sum + t.accuracy, 0) / secondHalf.length;

  return Math.round(secondAvg - firstAvg);
}

module.exports = {
  validateConviction,
  batchValidateConvictions,
  getAccuracyStats,
  calculateAccuracy
};
