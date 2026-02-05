/**
 * Genome Feedback Service
 * Updates taste genome based on actual performance feedback
 * Part of the Conviction Loop: closes the loop by learning from results
 */

const Profile = require('../models/Profile');
const Content = require('../models/Content');

/**
 * Apply feedback to taste genome
 * @param {Object} validation - Validation result from convictionValidatorService
 * @param {String} profileId - Profile ID
 * @returns {Object} Updated genome
 */
async function applyFeedbackToGenome(validation, profileId) {
  try {
    if (!validation.feedback?.shouldUpdateGenome) {
      return {
        updated: false,
        message: 'No genome update needed'
      };
    }

    // Find profile and genome
    let profile = await Profile.findById(profileId);

    if (!profile) {
      return {
        updated: false,
        message: 'Profile not found - cannot apply feedback'
      };
    }

    // Initialize genome if it doesn't exist
    if (!profile.tasteGenome) {
      profile.tasteGenome = {};
    }

    const genome = profile.tasteGenome;

    const feedback = validation.feedback;
    const signals = feedback.signals;

    // Track learning events
    if (!genome.learning) {
      genome.learning = {
        totalFeedbackEvents: 0,
        lastUpdated: new Date(),
        accuracyHistory: [],
        archetypeAdjustments: {}
      };
    }

    genome.learning.totalFeedbackEvents++;
    genome.learning.lastUpdated = new Date();

    // Apply each feedback signal
    for (const signal of signals) {
      if (signal.type === 'underestimated' || signal.type === 'overestimated') {
        await applyArchetypeConfidenceAdjustment(genome, signal);
      }

      if (signal.type === 'performance_component') {
        await applyComponentWeightAdjustment(genome, signal);
      }
    }

    // Store accuracy in history
    genome.learning.accuracyHistory.push({
      accuracy: validation.validation.accuracy,
      convictionScore: validation.predicted.convictionScore,
      actualScore: validation.actual.engagementScore,
      contentId: validation.contentId,
      timestamp: new Date()
    });

    // Keep only last 100 accuracy records
    if (genome.learning.accuracyHistory.length > 100) {
      genome.learning.accuracyHistory = genome.learning.accuracyHistory.slice(-100);
    }

    // Recalculate overall accuracy
    genome.learning.overallAccuracy = calculateOverallAccuracy(genome.learning.accuracyHistory);

    // Mark genome as updated
    genome.lastModified = new Date();
    genome.version = (genome.version || 0) + 1;

    // Save profile with updated genome
    profile.tasteGenome = genome;
    profile.markModified('tasteGenome'); // Important for Mixed type
    await profile.save();

    return {
      updated: true,
      profileId: profile._id,
      feedbackApplied: signals.length,
      newAccuracy: genome.learning.overallAccuracy,
      version: genome.version
    };
  } catch (error) {
    console.error('Error applying feedback to genome:', error);
    throw error;
  }
}

/**
 * Apply archetype confidence adjustment
 */
async function applyArchetypeConfidenceAdjustment(genome, signal) {
  const archetype = signal.archetype;
  if (!archetype) return;

  // Initialize archetype adjustments if needed
  if (!genome.learning.archetypeAdjustments[archetype]) {
    genome.learning.archetypeAdjustments[archetype] = {
      totalAdjustments: 0,
      confidence: 1.0, // Neutral start
      performanceDelta: 0
    };
  }

  const adjustment = genome.learning.archetypeAdjustments[archetype];

  // Calculate adjustment factor (small increments - learning rate ~0.05)
  const learningRate = 0.05;
  const adjustmentFactor = signal.magnitude > 0 ? learningRate : -learningRate;

  if (signal.type === 'underestimated') {
    // Content performed better - increase confidence in this archetype
    adjustment.confidence = Math.min(1.5, adjustment.confidence + adjustmentFactor);
    adjustment.performanceDelta += signal.magnitude;
  } else if (signal.type === 'overestimated') {
    // Content performed worse - decrease confidence
    adjustment.confidence = Math.max(0.5, adjustment.confidence - adjustmentFactor);
    adjustment.performanceDelta -= signal.magnitude;
  }

  adjustment.totalAdjustments++;
  adjustment.lastAdjusted = new Date();

  // Update archetype in main list if it exists
  if (genome.archetypes && Array.isArray(genome.archetypes)) {
    const archetypeIndex = genome.archetypes.findIndex(a => a.designation === archetype);
    if (archetypeIndex !== -1) {
      genome.archetypes[archetypeIndex].confidence = adjustment.confidence;
    }
  }
}

/**
 * Apply component weight adjustment (performance, taste, brand)
 */
async function applyComponentWeightAdjustment(genome, signal) {
  // Initialize weights if not present
  if (!genome.weights) {
    genome.weights = {
      performance: 0.3,
      taste: 0.5,
      brand: 0.2
    };
  }

  const learningRate = 0.02; // Smaller learning rate for weights

  if (signal.action === 'reduce_performance_weight') {
    // Performance was overestimated - reduce its weight
    genome.weights.performance = Math.max(0.1, genome.weights.performance - learningRate);
    // Redistribute to taste
    genome.weights.taste = Math.min(0.7, genome.weights.taste + learningRate);
  } else if (signal.action === 'increase_performance_weight') {
    // Performance was underestimated - increase its weight
    genome.weights.performance = Math.min(0.5, genome.weights.performance + learningRate);
    // Take from taste
    genome.weights.taste = Math.max(0.3, genome.weights.taste - learningRate);
  }

  // Ensure weights sum to 1.0 (normalize)
  const sum = genome.weights.performance + genome.weights.taste + genome.weights.brand;
  genome.weights.performance /= sum;
  genome.weights.taste /= sum;
  genome.weights.brand /= sum;
}

/**
 * Calculate overall accuracy from history
 */
function calculateOverallAccuracy(history) {
  if (history.length === 0) return 0;

  // Weighted average - recent predictions count more
  let weightedSum = 0;
  let weightSum = 0;

  history.forEach((record, index) => {
    const weight = index + 1; // Linear weighting (recent = higher weight)
    weightedSum += record.accuracy * weight;
    weightSum += weight;
  });

  return Math.round(weightedSum / weightSum);
}

/**
 * Batch process feedback for multiple validations
 */
async function batchProcessFeedback(validations, profileId) {
  const results = [];

  for (const validation of validations) {
    try {
      if (validation.feedback?.shouldUpdateGenome) {
        const result = await applyFeedbackToGenome(validation, profileId);
        results.push({
          contentId: validation.contentId,
          ...result
        });
      } else {
        results.push({
          contentId: validation.contentId,
          updated: false,
          message: 'No update needed'
        });
      }
    } catch (error) {
      results.push({
        contentId: validation.contentId,
        updated: false,
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Get learning progress for a profile
 */
async function getLearningProgress(profileId) {
  try {
    const profile = await Profile.findById(profileId);

    if (!profile || !profile.tasteGenome || !profile.tasteGenome.learning) {
      return {
        hasLearning: false,
        message: 'No learning data yet'
      };
    }

    const genome = profile.tasteGenome;
    const learning = genome.learning;

    // Calculate improvement rate
    const recentHistory = learning.accuracyHistory.slice(-20);
    const improvementRate = calculateImprovementRate(recentHistory);

    // Archetype insights
    const archetypeInsights = Object.entries(learning.archetypeAdjustments || {})
      .map(([archetype, data]) => ({
        archetype,
        confidence: data.confidence,
        adjustments: data.totalAdjustments,
        performanceDelta: data.performanceDelta,
        trend: data.confidence > 1.0 ? 'improving' : data.confidence < 1.0 ? 'declining' : 'stable'
      }))
      .sort((a, b) => b.confidence - a.confidence);

    return {
      hasLearning: true,
      totalFeedbackEvents: learning.totalFeedbackEvents,
      overallAccuracy: learning.overallAccuracy,
      improvementRate,
      archetypeInsights,
      currentWeights: genome.weights,
      lastUpdated: learning.lastUpdated,
      genomeVersion: genome.version,
      accuracyTrend: recentHistory.map(h => ({
        accuracy: h.accuracy,
        date: h.timestamp
      }))
    };
  } catch (error) {
    console.error('Error getting learning progress:', error);
    throw error;
  }
}

/**
 * Calculate improvement rate from accuracy history
 */
function calculateImprovementRate(history) {
  if (history.length < 6) return null;

  const midpoint = Math.floor(history.length / 2);
  const firstHalf = history.slice(0, midpoint);
  const secondHalf = history.slice(midpoint);

  const firstAvg = firstHalf.reduce((sum, h) => sum + h.accuracy, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, h) => sum + h.accuracy, 0) / secondHalf.length;

  return {
    delta: Math.round(secondAvg - firstAvg),
    direction: secondAvg > firstAvg ? 'improving' : secondAvg < firstAvg ? 'declining' : 'stable'
  };
}

/**
 * Reset learning data (for testing or major genome changes)
 */
async function resetLearning(profileId) {
  try {
    const profile = await Profile.findById(profileId);

    if (!profile) {
      throw new Error('Profile not found');
    }

    if (!profile.tasteGenome) {
      profile.tasteGenome = {};
    }

    const genome = profile.tasteGenome;

    genome.learning = {
      totalFeedbackEvents: 0,
      lastUpdated: new Date(),
      accuracyHistory: [],
      archetypeAdjustments: {},
      overallAccuracy: 0
    };

    // Reset weights to defaults
    genome.weights = {
      performance: 0.3,
      taste: 0.5,
      brand: 0.2
    };

    profile.tasteGenome = genome;
    profile.markModified('tasteGenome');
    await profile.save();

    return {
      reset: true,
      message: 'Learning data reset successfully'
    };
  } catch (error) {
    console.error('Error resetting learning:', error);
    throw error;
  }
}

module.exports = {
  applyFeedbackToGenome,
  batchProcessFeedback,
  getLearningProgress,
  resetLearning
};
