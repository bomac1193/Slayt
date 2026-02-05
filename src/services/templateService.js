/**
 * Template Service - Designer Vault Business Logic
 * Save and apply high-conviction grids as templates
 */

const GridTemplate = require('../models/GridTemplate');
const Grid = require('../models/Grid');
const Content = require('../models/Content');

/**
 * Create template from existing grid
 * @param {String} gridId - Source grid ID
 * @param {Object} templateData - Template metadata
 * @param {String} userId - User ID
 * @returns {Object} Created template
 */
async function createTemplateFromGrid(gridId, templateData, userId) {
  try {
    // Get source grid with content
    const grid = await Grid.findById(gridId).populate('user');

    if (!grid) {
      throw new Error('Grid not found');
    }

    if (grid.user._id.toString() !== userId) {
      throw new Error('Unauthorized - not your grid');
    }

    // Get all content in grid
    const contentIds = grid.cells
      .filter(cell => !cell.isEmpty && cell.contentId)
      .map(cell => cell.contentId);

    const content = await Content.find({ _id: { $in: contentIds } });

    // Build template slots
    const slots = grid.cells
      .filter(cell => !cell.isEmpty)
      .map((cell, index) => {
        const cellContent = content.find(c => c._id.toString() === cell.contentId?.toString());

        return {
          position: cell.row * grid.columns + cell.col,
          row: cell.row,
          col: cell.col,
          contentId: cell.contentId,
          contentType: cellContent?.type || 'post',
          archetypePreference: cellContent?.conviction?.archetypeMatch?.designation,
          colorPalette: cellContent?.metadata?.dominantColors || [],
          metadata: {
            caption: cellContent?.caption?.slice(0, 100),
            hashtags: cellContent?.hashtags || [],
            originalUrl: cellContent?.mediaUrl,
            thumbnailUrl: cellContent?.thumbnailUrl || cellContent?.mediaUrl
          }
        };
      });

    // Calculate metrics
    const convictionScores = content
      .filter(c => c.conviction?.score)
      .map(c => c.conviction.score);

    const avgConvictionScore = convictionScores.length > 0
      ? Math.round(convictionScores.reduce((sum, s) => sum + s, 0) / convictionScores.length)
      : 0;

    // Archetype distribution
    const archetypeDistribution = new Map();
    content.forEach(c => {
      const archetype = c.conviction?.archetypeMatch?.designation;
      if (archetype) {
        archetypeDistribution.set(archetype, (archetypeDistribution.get(archetype) || 0) + 1);
      }
    });

    // Calculate aesthetic score (reuse grid logic)
    const aestheticScore = calculateGridAestheticScore(content, grid.columns);

    // Create template
    const template = new GridTemplate({
      userId,
      profileId: grid.profileId,
      name: templateData.name || `Template ${Date.now()}`,
      description: templateData.description || '',
      category: templateData.category || 'grid',
      tags: templateData.tags || [],
      platform: grid.platform || 'all',
      layout: {
        rows: grid.rows,
        columns: grid.columns
      },
      slots,
      metrics: {
        avgConvictionScore,
        aestheticScore,
        archetypeDistribution,
        colorHarmony: 0, // TODO: Calculate
        visualFlow: calculateVisualFlow(content, grid.columns),
        timesUsed: 0
      },
      sourceGridId: gridId,
      isPublic: templateData.isPublic || false
    });

    await template.save();

    return template;
  } catch (error) {
    console.error('Error creating template from grid:', error);
    throw error;
  }
}

/**
 * Apply template to content array
 * @param {String} templateId - Template ID
 * @param {Array} contentIds - Available content IDs
 * @returns {Object} Arranged content
 */
async function applyTemplate(templateId, contentIds) {
  try {
    const template = await GridTemplate.findById(templateId);

    if (!template) {
      throw new Error('Template not found');
    }

    // Get content
    const content = await Content.find({ _id: { $in: contentIds } });

    if (content.length < template.slots.length) {
      throw new Error(`Need at least ${template.slots.length} content items`);
    }

    // Use template's applyToContent method
    const arrangement = template.applyToContent(content);

    // Update usage stats
    template.metrics.timesUsed++;
    template.lastUsed = new Date();
    await template.save();

    return {
      template,
      arrangement,
      layout: template.layout
    };
  } catch (error) {
    console.error('Error applying template:', error);
    throw error;
  }
}

/**
 * Get user's templates
 */
async function getUserTemplates(userId, filters = {}) {
  try {
    const query = { userId };

    if (filters.platform) query.platform = filters.platform;
    if (filters.category) query.category = filters.category;
    if (filters.tags) query.tags = { $in: filters.tags };

    const sort = {};
    if (filters.sortBy === 'score') {
      sort['metrics.avgConvictionScore'] = -1;
    } else if (filters.sortBy === 'used') {
      sort['metrics.timesUsed'] = -1;
    } else {
      sort.createdAt = -1; // Default: newest first
    }

    const templates = await GridTemplate.find(query)
      .sort(sort)
      .limit(filters.limit || 50);

    return templates;
  } catch (error) {
    console.error('Error getting user templates:', error);
    throw error;
  }
}

/**
 * Get public template library
 */
async function getPublicTemplates(filters = {}) {
  try {
    const query = { isPublic: true };

    if (filters.platform) query.platform = filters.platform;
    if (filters.category) query.category = filters.category;
    if (filters.tags) query.tags = { $in: filters.tags };
    if (filters.minScore) query['metrics.avgConvictionScore'] = { $gte: filters.minScore };

    const sort = {};
    if (filters.sortBy === 'score') {
      sort['metrics.avgConvictionScore'] = -1;
    } else if (filters.sortBy === 'popular') {
      sort['metrics.timesUsed'] = -1;
    } else if (filters.sortBy === 'featured') {
      sort.isFeatured = -1;
      sort['metrics.avgConvictionScore'] = -1;
    } else {
      sort.createdAt = -1;
    }

    const templates = await GridTemplate.find(query)
      .sort(sort)
      .limit(filters.limit || 20)
      .populate('userId', 'name avatar');

    return templates;
  } catch (error) {
    console.error('Error getting public templates:', error);
    throw error;
  }
}

/**
 * Update template performance metrics after use
 */
async function updateTemplatePerformance(templateId, performanceScore) {
  try {
    const template = await GridTemplate.findById(templateId);

    if (!template) {
      throw new Error('Template not found');
    }

    // Update average performance (weighted average)
    const currentAvg = template.metrics.avgPerformance || 0;
    const timesUsed = template.metrics.timesUsed;

    const newAvg = ((currentAvg * (timesUsed - 1)) + performanceScore) / timesUsed;

    template.metrics.avgPerformance = Math.round(newAvg);
    await template.save();

    return template;
  } catch (error) {
    console.error('Error updating template performance:', error);
    throw error;
  }
}

/**
 * Delete template
 */
async function deleteTemplate(templateId, userId) {
  try {
    const template = await GridTemplate.findById(templateId);

    if (!template) {
      throw new Error('Template not found');
    }

    if (template.userId.toString() !== userId) {
      throw new Error('Unauthorized - not your template');
    }

    await GridTemplate.deleteOne({ _id: templateId });

    return { success: true, message: 'Template deleted' };
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
}

// Helper functions

function calculateGridAestheticScore(items, columns) {
  if (!items || items.length === 0) return 0;

  const itemsWithConviction = items.filter(item => item.conviction?.score);
  if (itemsWithConviction.length === 0) return 0;

  // Average conviction
  const avgConviction = Math.round(
    itemsWithConviction.reduce((sum, item) => sum + item.conviction.score, 0) / itemsWithConviction.length
  );

  // Archetype consistency
  const archetypes = itemsWithConviction
    .map(item => item.conviction?.archetypeMatch?.designation)
    .filter(Boolean);

  let consistency = 0;
  if (archetypes.length > 0) {
    const counts = {};
    archetypes.forEach(arch => {
      counts[arch] = (counts[arch] || 0) + 1;
    });
    const mostCommon = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    consistency = Math.round((mostCommon[1] / archetypes.length) * 100);
  }

  // Visual flow
  const flow = calculateVisualFlow(itemsWithConviction, columns);

  // Weighted score
  return Math.round(
    avgConviction * 0.5 +
    consistency * 0.3 +
    flow * 0.2
  );
}

function calculateVisualFlow(items, columns) {
  if (items.length < 2) return 100;

  let smoothTransitions = 0;
  let totalPairs = 0;

  items.forEach((item, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;

    // Check right neighbor
    if (col < columns - 1 && items[index + 1]) {
      totalPairs++;
      if (Math.abs(item.conviction.score - items[index + 1].conviction.score) < 20) {
        smoothTransitions++;
      }
    }

    // Check bottom neighbor
    if (items[index + columns]) {
      totalPairs++;
      if (Math.abs(item.conviction.score - items[index + columns].conviction.score) < 20) {
        smoothTransitions++;
      }
    }
  });

  return totalPairs > 0 ? Math.round((smoothTransitions / totalPairs) * 100) : 0;
}

module.exports = {
  createTemplateFromGrid,
  applyTemplate,
  getUserTemplates,
  getPublicTemplates,
  updateTemplatePerformance,
  deleteTemplate
};
