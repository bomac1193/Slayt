const mongoose = require('mongoose');

/**
 * Rollout Model
 * Represents a campaign rollout with multiple phases/sections
 */
const rolloutSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed'],
    default: 'draft'
  },
  // Rollout-level scheduling
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  targetPlatforms: [{
    type: String,
    enum: ['instagram', 'tiktok', 'youtube', 'twitter', 'facebook']
  }],
  sections: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    order: {
      type: Number,
      default: 0
    },
    color: {
      type: String,
      default: '#6366f1'
    },
    collectionIds: [{
      type: String // Can be YouTube collection IDs or Grid IDs
    }],
    // Section-level scheduling
    startDate: {
      type: Date,
      default: null
    },
    deadline: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed'],
      default: 'pending'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
rolloutSchema.index({ userId: 1, status: 1 });

// Update the updatedAt timestamp before saving
rolloutSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to add a section
rolloutSchema.methods.addSection = function(name, color) {
  const id = new mongoose.Types.ObjectId().toString();
  const order = this.sections.length;
  this.sections.push({
    id,
    name: name || `Section ${order + 1}`,
    order,
    color: color || '#6366f1',
    collectionIds: [],
    startDate: null,
    deadline: null,
    status: 'pending'
  });
  return this.save();
};

// Method to update a section
rolloutSchema.methods.updateSection = function(sectionId, updates) {
  const section = this.sections.find(s => s.id === sectionId);
  if (section) {
    if (updates.name !== undefined) section.name = updates.name;
    if (updates.order !== undefined) section.order = updates.order;
    if (updates.color !== undefined) section.color = updates.color;
    if (updates.collectionIds !== undefined) section.collectionIds = updates.collectionIds;
    if (updates.startDate !== undefined) section.startDate = updates.startDate;
    if (updates.deadline !== undefined) section.deadline = updates.deadline;
    if (updates.status !== undefined) section.status = updates.status;
  }
  return this.save();
};

// Method to delete a section
rolloutSchema.methods.deleteSection = function(sectionId) {
  this.sections = this.sections.filter(s => s.id !== sectionId);
  // Reorder remaining sections
  this.sections.forEach((section, index) => {
    section.order = index;
  });
  return this.save();
};

// Method to reorder sections
rolloutSchema.methods.reorderSections = function(sectionIds) {
  const reordered = [];
  sectionIds.forEach((id, index) => {
    const section = this.sections.find(s => s.id === id);
    if (section) {
      section.order = index;
      reordered.push(section);
    }
  });
  this.sections = reordered;
  return this.save();
};

// Method to add collection to section
rolloutSchema.methods.addCollectionToSection = function(sectionId, collectionId) {
  const section = this.sections.find(s => s.id === sectionId);
  if (section && !section.collectionIds.includes(collectionId)) {
    section.collectionIds.push(collectionId);
  }
  return this.save();
};

// Method to remove collection from section
rolloutSchema.methods.removeCollectionFromSection = function(sectionId, collectionId) {
  const section = this.sections.find(s => s.id === sectionId);
  if (section) {
    section.collectionIds = section.collectionIds.filter(id => id !== collectionId);
  }
  return this.save();
};

// Static method to find by user
rolloutSchema.statics.findByUser = function(userId) {
  return this.find({ userId }).sort({ updatedAt: -1 });
};

// Static method to find active rollouts
rolloutSchema.statics.findActive = function(userId) {
  return this.find({
    userId,
    status: 'active'
  }).sort({ updatedAt: -1 });
};

// Static method to find scheduled rollouts (with start/end dates)
rolloutSchema.statics.findScheduled = function(userId) {
  return this.find({
    userId,
    $or: [
      { startDate: { $ne: null } },
      { endDate: { $ne: null } },
      { 'sections.startDate': { $ne: null } },
      { 'sections.deadline': { $ne: null } }
    ]
  }).sort({ startDate: 1 });
};

// Static method to find rollouts in a date range (for calendar)
rolloutSchema.statics.findInDateRange = function(userId, startDate, endDate) {
  return this.find({
    userId,
    $or: [
      { startDate: { $gte: startDate, $lte: endDate } },
      { endDate: { $gte: startDate, $lte: endDate } },
      { 'sections.startDate': { $gte: startDate, $lte: endDate } },
      { 'sections.deadline': { $gte: startDate, $lte: endDate } }
    ]
  }).sort({ startDate: 1 });
};

// Enable virtuals in JSON
rolloutSchema.set('toJSON', { virtuals: true });
rolloutSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Rollout', rolloutSchema);
