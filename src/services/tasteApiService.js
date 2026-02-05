/**
 * Taste API Service - External Partner API
 * Powered by Subtaste (current) - designed for standalone integration (future)
 */

const Profile = require('../models/Profile');
const convictionService = require('./convictionService');

/**
 * INTEGRATION POINT: Subtaste Adapter
 *
 * Current: Uses internal Subtaste/genome
 * Future: Swap for standalone Subtaste API client
 *
 * To integrate standalone Subtaste:
 * 1. Replace SubtasteAdapter with SubtasteClient
 * 2. Point to external Subtaste API endpoint
 * 3. Keep the same interface (scoreContent, matchArchetype, etc.)
 */

class SubtasteAdapter {
  /**
   * Score content against a taste profile
   * @param {Object} content - Content to score (image URL, caption, metadata)
   * @param {String} tasteProfileId - Taste profile identifier
   * @returns {Object} Taste score and breakdown
   */
  async scoreContent(content, tasteProfileId) {
    try {
      // Current: Use internal conviction service
      // Future: Call standalone Subtaste API

      // Get taste genome from profile
      const profile = await Profile.findById(tasteProfileId);
      if (!profile || !profile.tasteGenome) {
        throw new Error('Taste profile not found');
      }

      // Calculate conviction score (uses Subtaste internally)
      const conviction = await convictionService.calculateConvictionScore(
        content,
        profile.tasteGenome
      );

      return {
        score: conviction.score, // 0-100
        tier: conviction.tier, // low, medium, high, exceptional
        breakdown: {
          performance: conviction.breakdown.performance,
          taste: conviction.breakdown.taste,
          brand: conviction.breakdown.brand
        },
        archetypeMatch: conviction.archetypeMatch,
        confidence: conviction.confidence || 0.85,
        provider: 'subtaste-internal' // Future: 'subtaste-standalone'
      };
    } catch (error) {
      console.error('Error scoring content:', error);
      throw error;
    }
  }

  /**
   * Match content to archetype
   * @param {Object} content - Content to analyze
   * @returns {Object} Archetype match
   */
  async matchArchetype(content) {
    try {
      // Current: Use internal archetype matching
      // Future: Call standalone Subtaste archetype API

      const result = await convictionService.matchToArchetype(content);

      return {
        archetype: {
          designation: result.designation,
          glyph: result.glyph,
          confidence: result.confidence,
          description: result.description
        },
        attributes: result.attributes || [],
        provider: 'subtaste-internal'
      };
    } catch (error) {
      console.error('Error matching archetype:', error);
      throw error;
    }
  }

  /**
   * Analyze content (extract features, aesthetics, patterns)
   * @param {Object} content - Content to analyze
   * @returns {Object} Content analysis
   */
  async analyzeContent(content) {
    try {
      // Current: Use internal analysis
      // Future: Call standalone Subtaste analysis API

      const analysis = await convictionService.analyzeContentFeatures(content);

      return {
        features: analysis.features || {},
        aesthetics: analysis.aesthetics || {},
        mood: analysis.mood || {},
        composition: analysis.composition || {},
        colorPalette: analysis.colorPalette || [],
        provider: 'subtaste-internal'
      };
    } catch (error) {
      console.error('Error analyzing content:', error);
      throw error;
    }
  }

  /**
   * Get content recommendations based on taste profile
   * @param {String} tasteProfileId - Taste profile identifier
   * @param {Object} filters - Recommendation filters
   * @returns {Array} Recommended content patterns
   */
  async getRecommendations(tasteProfileId, filters = {}) {
    try {
      const profile = await Profile.findById(tasteProfileId);
      if (!profile || !profile.tasteGenome) {
        throw new Error('Taste profile not found');
      }

      const genome = profile.tasteGenome;

      // Get top archetypes from genome
      const topArchetypes = (genome.archetypes || [])
        .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
        .slice(0, 3);

      // Generate recommendations
      const recommendations = topArchetypes.map(archetype => ({
        archetype: archetype.designation,
        glyph: archetype.glyph,
        confidence: archetype.confidence,
        suggestedThemes: archetype.themes || [],
        suggestedColors: archetype.colorPalette || [],
        suggestedMoods: archetype.moods || []
      }));

      return {
        recommendations,
        tasteProfile: {
          dominantArchetype: topArchetypes[0]?.designation,
          diversity: genome.diversity || 0,
          consistency: genome.consistency || 0
        },
        provider: 'subtaste-internal'
      };
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  }

  /**
   * Get taste genome summary (for API exposure)
   * @param {String} tasteProfileId - Taste profile identifier
   * @returns {Object} Genome summary
   */
  async getGenomeSummary(tasteProfileId) {
    try {
      const profile = await Profile.findById(tasteProfileId);
      if (!profile || !profile.tasteGenome) {
        throw new Error('Taste profile not found');
      }

      const genome = profile.tasteGenome;

      return {
        archetypes: (genome.archetypes || []).map(a => ({
          designation: a.designation,
          glyph: a.glyph,
          confidence: a.confidence
        })),
        weights: genome.weights || { performance: 0.3, taste: 0.5, brand: 0.2 },
        maturity: genome.maturity || 0,
        accuracy: genome.learning?.overallAccuracy || 0,
        signalCount: genome.signalCount || 0,
        provider: 'subtaste-internal'
      };
    } catch (error) {
      console.error('Error getting genome summary:', error);
      throw error;
    }
  }
}

// Singleton instance
const subtasteAdapter = new SubtasteAdapter();

/**
 * Future: Standalone Subtaste Integration
 *
 * When ready to integrate standalone Subtaste:
 *
 * 1. Create SubtasteClient class:
 *
 * class SubtasteClient {
 *   constructor(apiUrl, apiKey) {
 *     this.apiUrl = apiUrl;
 *     this.apiKey = apiKey;
 *   }
 *
 *   async scoreContent(content, tasteProfileId) {
 *     const response = await fetch(`${this.apiUrl}/api/score`, {
 *       method: 'POST',
 *       headers: {
 *         'Authorization': `Bearer ${this.apiKey}`,
 *         'Content-Type': 'application/json'
 *       },
 *       body: JSON.stringify({ content, tasteProfileId })
 *     });
 *     return response.json();
 *   }
 *   // ... other methods
 * }
 *
 * 2. Swap adapter:
 *
 * const subtasteClient = new SubtasteClient(
 *   process.env.SUBTASTE_API_URL,
 *   process.env.SUBTASTE_API_KEY
 * );
 *
 * 3. Export client instead of adapter:
 *
 * module.exports = subtasteClient;
 */

module.exports = subtasteAdapter;
