/**
 * Template API Routes - Designer Vault
 * BLUE OCEAN: Save and reuse high-conviction grids
 */

const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const {
  createTemplateFromGrid,
  applyTemplate,
  getUserTemplates,
  getPublicTemplates,
  updateTemplatePerformance,
  deleteTemplate
} = require('../services/templateService');
const GridTemplate = require('../models/GridTemplate');

/**
 * POST /api/templates/create-from-grid
 * Create template from existing grid
 */
router.post('/create-from-grid', auth, async (req, res) => {
  try {
    const { gridId, name, description, category, tags, isPublic } = req.body;

    if (!gridId) {
      return res.status(400).json({ error: 'Grid ID required' });
    }

    const template = await createTemplateFromGrid(
      gridId,
      { name, description, category, tags, isPublic },
      req.userId
    );

    res.json({ template });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/templates/apply/:templateId
 * Apply template to content array
 */
router.post('/apply/:templateId', auth, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { contentIds } = req.body;

    if (!Array.isArray(contentIds)) {
      return res.status(400).json({ error: 'contentIds must be an array' });
    }

    const result = await applyTemplate(templateId, contentIds);

    res.json(result);
  } catch (error) {
    console.error('Error applying template:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/templates/my-templates
 * Get user's templates
 */
router.get('/my-templates', auth, async (req, res) => {
  try {
    const { platform, category, tags, sortBy, limit } = req.query;

    const filters = {
      platform,
      category,
      tags: tags ? tags.split(',') : undefined,
      sortBy,
      limit: limit ? parseInt(limit) : undefined
    };

    const templates = await getUserTemplates(req.userId, filters);

    res.json({ templates });
  } catch (error) {
    console.error('Error getting user templates:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/templates/library
 * Get public template library
 */
router.get('/library', async (req, res) => {
  try {
    const { platform, category, tags, minScore, sortBy, limit } = req.query;

    const filters = {
      platform,
      category,
      tags: tags ? tags.split(',') : undefined,
      minScore: minScore ? parseInt(minScore) : undefined,
      sortBy,
      limit: limit ? parseInt(limit) : undefined
    };

    const templates = await getPublicTemplates(filters);

    res.json({ templates });
  } catch (error) {
    console.error('Error getting public templates:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/templates/:templateId
 * Get single template by ID
 */
router.get('/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;

    const template = await GridTemplate.findById(templateId)
      .populate('userId', 'name avatar');

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ template });
  } catch (error) {
    console.error('Error getting template:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/templates/:templateId
 * Update template metadata
 */
router.put('/:templateId', auth, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { name, description, tags, isPublic, category } = req.body;

    const template = await GridTemplate.findById(templateId);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    if (template.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update fields
    if (name) template.name = name;
    if (description !== undefined) template.description = description;
    if (tags) template.tags = tags;
    if (isPublic !== undefined) template.isPublic = isPublic;
    if (category) template.category = category;

    await template.save();

    res.json({ template });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/templates/:templateId
 * Delete template
 */
router.delete('/:templateId', auth, async (req, res) => {
  try {
    const { templateId } = req.params;

    const result = await deleteTemplate(templateId, req.userId);

    res.json(result);
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/templates/:templateId/update-performance
 * Update template performance after use
 */
router.post('/:templateId/update-performance', auth, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { performanceScore } = req.body;

    if (typeof performanceScore !== 'number') {
      return res.status(400).json({ error: 'performanceScore must be a number' });
    }

    const template = await updateTemplatePerformance(templateId, performanceScore);

    res.json({ template });
  } catch (error) {
    console.error('Error updating template performance:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/templates/:templateId/rate
 * Rate a template (1-5 stars)
 */
router.post('/:templateId/rate', auth, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { rating } = req.body;

    if (rating < 0 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be 0-5' });
    }

    const template = await GridTemplate.findById(templateId);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    template.metrics.rating = rating;
    await template.save();

    res.json({ template });
  } catch (error) {
    console.error('Error rating template:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/templates/stats/summary
 * Get template statistics for user
 */
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const templates = await GridTemplate.find({ userId: req.userId });

    const stats = {
      totalTemplates: templates.length,
      totalUsage: templates.reduce((sum, t) => sum + (t.metrics.timesUsed || 0), 0),
      avgScore: templates.length > 0
        ? Math.round(templates.reduce((sum, t) => sum + (t.metrics.avgConvictionScore || 0), 0) / templates.length)
        : 0,
      bestTemplate: templates.sort((a, b) => (b.metrics.avgConvictionScore || 0) - (a.metrics.avgConvictionScore || 0))[0],
      mostUsedTemplate: templates.sort((a, b) => (b.metrics.timesUsed || 0) - (a.metrics.timesUsed || 0))[0]
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting template stats:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
