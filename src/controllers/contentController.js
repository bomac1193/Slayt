const Content = require('../models/Content');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

// Create new content
exports.createContent = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, caption, platform, mediaType } = req.body;

    const mediaUrl = `/uploads/${req.file.filename}`;
    let thumbnailUrl = null;

    // Generate thumbnail for images
    if (req.file.mimetype.startsWith('image/')) {
      const thumbnailFilename = `thumb-${req.file.filename}`;
      const thumbnailPath = path.join(__dirname, '../../uploads/thumbnails', thumbnailFilename);

      await sharp(req.file.path)
        .resize(400, 400, { fit: 'cover' })
        .toFile(thumbnailPath);

      thumbnailUrl = `/uploads/thumbnails/${thumbnailFilename}`;
    }

    // Get image metadata
    let metadata = {};
    if (req.file.mimetype.startsWith('image/')) {
      const imageMetadata = await sharp(req.file.path).metadata();
      metadata = {
        width: imageMetadata.width,
        height: imageMetadata.height,
        aspectRatio: `${imageMetadata.width}:${imageMetadata.height}`,
        fileSize: req.file.size,
        format: imageMetadata.format
      };
    }

    const content = new Content({
      userId: req.userId,
      title: title || 'Untitled Content',
      caption,
      mediaUrl,
      originalMediaUrl: mediaUrl,
      thumbnailUrl,
      mediaType: mediaType || 'image',
      platform: platform || 'instagram',
      metadata
    });

    await content.save();

    res.status(201).json({
      message: 'Content created successfully',
      content
    });
  } catch (error) {
    console.error('Create content error:', error);
    res.status(500).json({ error: 'Failed to create content' });
  }
};

// Create new reel (video with client-generated thumbnail)
exports.createReel = async (req, res) => {
  try {
    const videoFile = req.files?.media?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];

    if (!videoFile) {
      return res.status(400).json({ error: 'Video file required' });
    }

    const { title, duration, width, height, isReel, recommendedType } = req.body;

    const mediaUrl = `/uploads/${videoFile.filename}`;
    let thumbnailUrl = null;

    // Use the client-generated thumbnail if provided
    if (thumbnailFile) {
      // Move thumbnail to thumbnails directory
      const thumbnailFilename = `thumb-${videoFile.filename.replace(/\.[^/.]+$/, '')}.jpg`;
      const thumbnailPath = path.join(__dirname, '../../uploads/thumbnails', thumbnailFilename);

      // Copy the uploaded thumbnail to the thumbnails directory
      await fs.copyFile(thumbnailFile.path, thumbnailPath);
      // Remove the original uploaded thumbnail from uploads directory
      await fs.unlink(thumbnailFile.path);

      thumbnailUrl = `/uploads/thumbnails/${thumbnailFilename}`;
    }

    // Parse metadata
    const metadata = {
      duration: parseFloat(duration) || 0,
      width: parseInt(width) || 0,
      height: parseInt(height) || 0,
      isReel: isReel === 'true' || isReel === true,
      fileSize: videoFile.size
    };

    const content = new Content({
      userId: req.userId,
      title: title || 'Untitled Reel',
      mediaUrl,
      originalMediaUrl: mediaUrl,
      thumbnailUrl,
      mediaType: 'video',
      platform: 'instagram',
      metadata,
      aiSuggestions: {
        recommendedType: recommendedType || 'reel'
      }
    });

    await content.save();

    res.status(201).json({
      message: 'Reel created successfully',
      content
    });
  } catch (error) {
    console.error('Create reel error:', error);
    res.status(500).json({ error: 'Failed to create reel' });
  }
};

// Get all content for user
exports.getAllContent = async (req, res) => {
  try {
    const { platform, status, mediaType, limit = 50, offset = 0 } = req.query;

    const filter = { userId: req.userId };
    if (platform) filter.platform = platform;
    if (status) filter.status = status;
    if (mediaType) filter.mediaType = mediaType;

    const content = await Content.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await Content.countDocuments(filter);

    res.json({
      content,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ error: 'Failed to get content' });
  }
};

// Get content by ID
exports.getContentById = async (req, res) => {
  try {
    const content = await Content.findOne({ _id: req.params.id, userId: req.userId });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json({ content });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ error: 'Failed to get content' });
  }
};

// Update content
exports.updateContent = async (req, res) => {
  try {
    const { title, caption, hashtags, location, status, mentions, audioTrack, scheduledFor } = req.body;

    const content = await Content.findOne({ _id: req.params.id, userId: req.userId });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    if (title !== undefined) content.title = title;
    if (caption !== undefined) content.caption = caption;
    if (hashtags !== undefined) content.hashtags = hashtags;
    if (location !== undefined) content.location = location;
    if (mentions !== undefined) content.mentions = mentions;
    if (audioTrack !== undefined) content.audioTrack = audioTrack;
    if (scheduledFor !== undefined) {
      content.scheduledFor = scheduledFor;
      // Update status to scheduled if a date is set
      if (scheduledFor) {
        content.status = 'scheduled';
      }
    }
    if (status) content.status = status;

    await content.save();

    res.json({
      message: 'Content updated successfully',
      content
    });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({ error: 'Failed to update content' });
  }
};

// Update thumbnail for content (e.g., reel)
exports.updateThumbnail = async (req, res) => {
  try {
    const thumbnailFile = req.file;

    if (!thumbnailFile) {
      return res.status(400).json({ error: 'Thumbnail file required' });
    }

    const content = await Content.findOne({ _id: req.params.id, userId: req.userId });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Delete old thumbnail if exists
    if (content.thumbnailUrl) {
      try {
        const oldThumbnailPath = path.join(__dirname, '../../uploads', content.thumbnailUrl.replace('/uploads/', ''));
        await fs.unlink(oldThumbnailPath);
      } catch (err) {
        // Ignore error if old thumbnail doesn't exist
        console.error('Could not delete old thumbnail:', err.message);
      }
    }

    // Move new thumbnail to thumbnails directory
    const thumbnailFilename = `thumb-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
    const thumbnailPath = path.join(__dirname, '../../uploads/thumbnails', thumbnailFilename);

    // Copy the uploaded thumbnail to the thumbnails directory
    await fs.copyFile(thumbnailFile.path, thumbnailPath);
    // Remove the original uploaded file from uploads directory
    await fs.unlink(thumbnailFile.path);

    // Update content with new thumbnail URL
    content.thumbnailUrl = `/uploads/thumbnails/${thumbnailFilename}`;
    await content.save();

    res.json({
      message: 'Thumbnail updated successfully',
      content
    });
  } catch (error) {
    console.error('Update thumbnail error:', error);
    res.status(500).json({ error: 'Failed to update thumbnail' });
  }
};

// Delete content
exports.deleteContent = async (req, res) => {
  try {
    const content = await Content.findOneAndDelete({ _id: req.params.id, userId: req.userId });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Delete associated files
    try {
      const mediaPath = path.join(__dirname, '../../public', content.mediaUrl);
      await fs.unlink(mediaPath);

      if (content.thumbnailUrl) {
        const thumbnailPath = path.join(__dirname, '../../public', content.thumbnailUrl);
        await fs.unlink(thumbnailPath);
      }
    } catch (fileError) {
      console.error('Error deleting files:', fileError);
    }

    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({ error: 'Failed to delete content' });
  }
};

// Add version to content
exports.addVersion = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { versionName, caption } = req.body;

    const content = await Content.findOne({ _id: req.params.id, userId: req.userId });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const mediaUrl = `/uploads/${req.file.filename}`;
    let thumbnailUrl = null;

    if (req.file.mimetype.startsWith('image/')) {
      const thumbnailFilename = `thumb-${req.file.filename}`;
      const thumbnailPath = path.join(__dirname, '../../uploads/thumbnails', thumbnailFilename);

      await sharp(req.file.path)
        .resize(400, 400, { fit: 'cover' })
        .toFile(thumbnailPath);

      thumbnailUrl = `/uploads/thumbnails/${thumbnailFilename}`;
    }

    content.versions.push({
      versionName: versionName || `Version ${content.versions.length + 1}`,
      mediaUrl,
      thumbnailUrl,
      caption,
      isSelected: false
    });

    await content.save();

    res.status(201).json({
      message: 'Version added successfully',
      content
    });
  } catch (error) {
    console.error('Add version error:', error);
    res.status(500).json({ error: 'Failed to add version' });
  }
};

// Select version
exports.selectVersion = async (req, res) => {
  try {
    const content = await Content.findOne({ _id: req.params.id, userId: req.userId });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const version = content.versions.id(req.params.versionId);
    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    // Deselect all versions
    content.versions.forEach(v => v.isSelected = false);

    // Select the specified version
    version.isSelected = true;

    // Update main content with selected version
    content.mediaUrl = version.mediaUrl;
    content.thumbnailUrl = version.thumbnailUrl;
    if (version.caption) content.caption = version.caption;
    if (version.aiScores) content.aiScores = version.aiScores;

    await content.save();

    res.json({
      message: 'Version selected successfully',
      content
    });
  } catch (error) {
    console.error('Select version error:', error);
    res.status(500).json({ error: 'Failed to select version' });
  }
};

// Delete version
exports.deleteVersion = async (req, res) => {
  try {
    const content = await Content.findOne({ _id: req.params.id, userId: req.userId });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    content.versions.id(req.params.versionId).remove();
    await content.save();

    res.json({
      message: 'Version deleted successfully',
      content
    });
  } catch (error) {
    console.error('Delete version error:', error);
    res.status(500).json({ error: 'Failed to delete version' });
  }
};

// Schedule content
exports.scheduleContent = async (req, res) => {
  try {
    const { scheduledFor } = req.body;

    const content = await Content.findOne({ _id: req.params.id, userId: req.userId });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    content.scheduledFor = new Date(scheduledFor);
    content.status = 'scheduled';

    await content.save();

    res.json({
      message: 'Content scheduled successfully',
      content
    });
  } catch (error) {
    console.error('Schedule content error:', error);
    res.status(500).json({ error: 'Failed to schedule content' });
  }
};

// Publish content
exports.publishContent = async (req, res) => {
  try {
    const content = await Content.findOne({ _id: req.params.id, userId: req.userId });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Here you would integrate with Instagram/TikTok APIs to publish
    // For now, we'll just mark it as published

    content.publishedAt = new Date();
    content.status = 'published';

    await content.save();

    res.json({
      message: 'Content published successfully',
      content
    });
  } catch (error) {
    console.error('Publish content error:', error);
    res.status(500).json({ error: 'Failed to publish content' });
  }
};
