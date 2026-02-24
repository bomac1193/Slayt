/**
 * Rollout Intelligence Service
 *
 * Conviction-based rollout readiness and pacing analysis.
 *
 * Core Features:
 * 1. Conviction-Based Phase Gating (can't advance with low-quality content)
 * 2. Standard Pacing Recommendations
 * 3. Burnout Prevention (workload analysis)
 */

const Content = require('../models/Content');
const Rollout = require('../models/Rollout');
const YoutubeCollection = require('../models/YoutubeCollection');
const YoutubeVideo = require('../models/YoutubeVideo');
const Collection = require('../models/Collection');
const convictionService = require('./convictionService');

/**
 * Default pacing config (replaces archetype-specific ROLLOUT_DNA)
 */
const DEFAULT_PACING = {
  label: 'Standard',
  pacing: { optimalCadenceDays: 5, minCadenceDays: 3, maxCadenceDays: 7 },
  phases: { optimal: 5, min: 3, max: 7 },
};

/**
 * Get Rollout DNA — always returns default pacing
 */
function getRolloutDNA() {
  return DEFAULT_PACING;
}

/**
 * CONVICTION-BASED PHASE GATING
 *
 * Analyzes if a section is ready to advance based on content conviction scores.
 * Blocks advancement if content quality is too low.
 */
async function analyzeSectionReadiness(rollout, sectionId, user) {
  try {
    const section = rollout.sections.find(s => s.id === sectionId);
    if (!section) {
      throw new Error('Section not found');
    }

    // Get all content from collections in this section
    const allContent = [];

    for (const collectionId of section.collectionIds) {
      // Try YouTube collection
      const youtubeCollection = await YoutubeCollection.findById(collectionId);
      if (youtubeCollection) {
        const videos = await YoutubeVideo.find({ collectionId: youtubeCollection._id });
        continue;
      }

      // Try IG/TikTok collection
      const collection = await Collection.findById(collectionId).populate('items.contentId');
      if (collection) {
        collection.items.forEach(item => {
          if (item.contentId) {
            allContent.push(item.contentId);
          }
        });
      }
    }

    if (allContent.length === 0) {
      return {
        ready: false,
        canAdvance: false,
        reason: 'NO_CONTENT',
        message: 'No content found in this section',
        stats: {
          totalPieces: 0,
          avgConviction: 0,
          belowThreshold: 0,
          aboveThreshold: 0
        },
        blockers: [],
        suggestions: ['Add content to this section before advancing']
      };
    }

    // Calculate conviction stats
    const threshold = 70;
    const convictionScores = allContent.map(c => c.conviction?.score || 0);
    const avgConviction = convictionScores.reduce((a, b) => a + b, 0) / convictionScores.length;

    const belowThreshold = allContent.filter(c => (c.conviction?.score || 0) < threshold);
    const aboveThreshold = allContent.filter(c => (c.conviction?.score || 0) >= threshold);

    const ready = belowThreshold.length === 0 && avgConviction >= threshold;

    const blockers = belowThreshold.map(content => ({
      contentId: content._id,
      title: content.title,
      convictionScore: content.conviction?.score || 0,
      gap: threshold - (content.conviction?.score || 0),
      issues: content.conviction?.gatingReason || 'Low conviction score'
    }));

    const suggestions = [];
    if (belowThreshold.length > 0) {
      suggestions.push(`Rework ${belowThreshold.length} piece(s) below conviction threshold (${threshold})`);

      const worst = belowThreshold
        .sort((a, b) => (a.conviction?.score || 0) - (b.conviction?.score || 0))
        .slice(0, 3);

      worst.forEach(content => {
        suggestions.push(
          `"${content.title}" (conviction: ${content.conviction?.score || 0}) - ${content.conviction?.gatingReason || 'needs improvement'}`
        );
      });
    }

    if (avgConviction < threshold) {
      suggestions.push(`Increase average conviction from ${avgConviction.toFixed(1)} to ${threshold}+`);
    }

    let estimatedDays = 0;
    if (!ready) {
      estimatedDays = Math.ceil(belowThreshold.length * 1);
    }

    return {
      ready,
      canAdvance: ready,
      reason: ready ? 'READY' : 'CONVICTION_TOO_LOW',
      message: ready
        ? `Section ready to advance (avg conviction: ${avgConviction.toFixed(1)})`
        : `${belowThreshold.length} piece(s) below threshold - fix before advancing`,
      stats: {
        totalPieces: allContent.length,
        avgConviction: Math.round(avgConviction * 10) / 10,
        belowThreshold: belowThreshold.length,
        aboveThreshold: aboveThreshold.length,
        threshold
      },
      blockers,
      suggestions,
      estimatedTimeToReady: estimatedDays > 0 ? `${estimatedDays} day${estimatedDays > 1 ? 's' : ''}` : null,
      overrideAllowed: true,
      overrideWarning: ready ? null : `Advancing now may reduce stan conversion by ~${Math.min(40, belowThreshold.length * 10)}%`
    };

  } catch (error) {
    console.error('Error analyzing section readiness:', error);
    throw error;
  }
}

/**
 * Pacing recommendations (simplified, no archetype)
 */
function getPacingRecommendations(archetype, rollout) {
  const dna = DEFAULT_PACING;

  const currentPhaseCount = rollout.sections.length;
  const currentCadence = calculateAverageCadence(rollout);

  const phaseDelta = currentPhaseCount - dna.phases.optimal;
  const cadenceDelta = currentCadence - dna.pacing.optimalCadenceDays;

  const recommendations = [];
  const warnings = [];

  if (phaseDelta > 2) {
    warnings.push({
      type: 'TOO_MANY_PHASES',
      severity: 'MEDIUM',
      message: `${currentPhaseCount} phases is ${phaseDelta} more than recommended`,
      suggestion: `Consider consolidating to ${dna.phases.optimal} phases`
    });
  } else if (phaseDelta < -2) {
    warnings.push({
      type: 'TOO_FEW_PHASES',
      severity: 'LOW',
      message: `${currentPhaseCount} phases is ${Math.abs(phaseDelta)} fewer than recommended`,
      suggestion: `Consider expanding to ${dna.phases.optimal} phases`
    });
  }

  if (cadenceDelta > 2) {
    warnings.push({
      type: 'TOO_SLOW',
      severity: 'HIGH',
      message: `${currentCadence}-day cadence may be too slow`,
      suggestion: `Compress to ${dna.pacing.optimalCadenceDays}-day cadence`
    });
  } else if (cadenceDelta < -2) {
    warnings.push({
      type: 'TOO_FAST',
      severity: 'MEDIUM',
      message: `${currentCadence}-day cadence may cause burnout`,
      suggestion: `Slow to ${dna.pacing.optimalCadenceDays}-day cadence for sustainability`
    });
  }

  return {
    label: dna.label,
    optimal: {
      cadenceDays: dna.pacing.optimalCadenceDays,
      phaseCount: dna.phases.optimal,
    },
    current: {
      cadenceDays: currentCadence,
      phaseCount: currentPhaseCount
    },
    deviations: {
      phases: phaseDelta,
      cadence: cadenceDelta
    },
    recommendations,
    warnings
  };
}

/**
 * Calculate average cadence between phases
 */
function calculateAverageCadence(rollout) {
  const sections = rollout.sections.filter(s => s.startDate).sort((a, b) =>
    new Date(a.startDate) - new Date(b.startDate)
  );

  if (sections.length < 2) {
    return 7;
  }

  let totalDays = 0;
  for (let i = 1; i < sections.length; i++) {
    const prev = new Date(sections[i - 1].startDate);
    const curr = new Date(sections[i].startDate);
    const days = (curr - prev) / (1000 * 60 * 60 * 24);
    totalDays += days;
  }

  return Math.round(totalDays / (sections.length - 1));
}

/**
 * COMPREHENSIVE ROLLOUT INTELLIGENCE
 *
 * Combines readiness + pacing into single analysis
 */
async function analyzeRollout(rolloutId, userId) {
  try {
    const rollout = await Rollout.findOne({ _id: rolloutId, userId });
    if (!rollout) {
      throw new Error('Rollout not found');
    }

    const User = require('../models/User');
    const user = await User.findById(userId);

    // Run analyses
    const [
      pacing,
      sectionAnalyses
    ] = await Promise.all([
      Promise.resolve(getPacingRecommendations(null, rollout)),
      Promise.all(rollout.sections.map(section =>
        analyzeSectionReadiness(rollout, section.id, user)
      ))
    ]);

    // Calculate overall readiness
    const allSectionsReady = sectionAnalyses.every(s => s.ready);
    const totalPieces = sectionAnalyses.reduce((sum, s) => sum + s.stats.totalPieces, 0);
    const avgConviction = sectionAnalyses.reduce((sum, s) =>
      sum + (s.stats.avgConviction * s.stats.totalPieces), 0
    ) / Math.max(1, totalPieces);

    return {
      rolloutId: rollout._id,
      rolloutName: rollout.name,

      overallReadiness: {
        ready: allSectionsReady,
        totalSections: rollout.sections.length,
        readySections: sectionAnalyses.filter(s => s.ready).length,
        totalPieces,
        avgConviction: Math.round(avgConviction * 10) / 10
      },

      pacing,

      sections: rollout.sections.map((section, idx) => ({
        sectionId: section.id,
        sectionName: section.name,
        order: section.order,
        ...sectionAnalyses[idx]
      })),

      timestamp: new Date()
    };

  } catch (error) {
    console.error('Error analyzing rollout:', error);
    throw error;
  }
}

module.exports = {
  getRolloutDNA,
  analyzeSectionReadiness,
  getPacingRecommendations,
  analyzeRollout,
};
