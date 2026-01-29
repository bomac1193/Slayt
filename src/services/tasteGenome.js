/**
 * Taste Genome Service
 * Adapted from Subtaste's core genome system + Refyn's deep learning.
 * Encodes creator taste as a multi-layered genome with archetype classification,
 * keyword-level learning, and temporal evolution.
 */

// ============================================================
// THE TWELVE ARCHETYPES (Adapted from Subtaste Pantheon)
// ============================================================

const ARCHETYPES = {
  'S-0': {
    designation: 'S-0',
    glyph: 'KETH',
    title: 'The Standard-Bearer',
    essence: 'Sets trends others follow without knowing the source',
    creativeMode: 'Visionary',
    shadow: 'Paralysis by standard',
    color: '#FFD700'
  },
  'T-1': {
    designation: 'T-1',
    glyph: 'STRATA',
    title: 'The System-Seer',
    essence: 'Sees production logic and reverse-engineers excellence',
    creativeMode: 'Architectural',
    shadow: 'Over-engineering becomes the end',
    color: '#4169E1'
  },
  'V-2': {
    designation: 'V-2',
    glyph: 'OMEN',
    title: 'The Early Witness',
    essence: 'Found the artist at 500 plays. Temporal vision.',
    creativeMode: 'Prophetic',
    shadow: 'Right too soon',
    color: '#9370DB'
  },
  'L-3': {
    designation: 'L-3',
    glyph: 'SILT',
    title: 'The Patient Cultivator',
    essence: 'Long-term investment in potential across years',
    creativeMode: 'Developmental',
    shadow: 'Patience becomes enabling',
    color: '#2E8B57'
  },
  'C-4': {
    designation: 'C-4',
    glyph: 'CULL',
    title: 'The Essential Editor',
    essence: 'Knows what shouldn\'t exist. Subtractive mastery.',
    creativeMode: 'Editorial',
    shadow: 'Nihilistic rejection',
    color: '#DC143C'
  },
  'N-5': {
    designation: 'N-5',
    glyph: 'LIMN',
    title: 'The Border Illuminator',
    essence: 'Reveals connections between opposites',
    creativeMode: 'Integrative',
    shadow: 'Refuses to choose',
    color: '#20B2AA'
  },
  'H-6': {
    designation: 'H-6',
    glyph: 'TOLL',
    title: 'The Relentless Advocate',
    essence: 'Converts skeptics. Relentless enthusiasm.',
    creativeMode: 'Advocacy',
    shadow: 'Missionary zeal',
    color: '#FF6347'
  },
  'P-7': {
    designation: 'P-7',
    glyph: 'VAULT',
    title: 'The Living Archive',
    essence: 'Deep knowledge of lineage and precedent',
    creativeMode: 'Archival',
    shadow: 'Knowledge that never circulates',
    color: '#8B4513'
  },
  'D-8': {
    designation: 'D-8',
    glyph: 'WICK',
    title: 'The Hollow Channel',
    essence: 'Taste moves through them. Uncanny recommendations.',
    creativeMode: 'Channelling',
    shadow: 'Loses stable identity',
    color: '#DDA0DD'
  },
  'F-9': {
    designation: 'F-9',
    glyph: 'ANVIL',
    title: 'The Manifestor',
    essence: 'Turns vision into tangible reality. Action bias.',
    creativeMode: 'Manifestation',
    shadow: 'Only shipped things matter',
    color: '#B8860B'
  },
  'R-10': {
    designation: 'R-10',
    glyph: 'SCHISM',
    title: 'The Productive Fracture',
    essence: 'Reveals assumptions by breaking them',
    creativeMode: 'Contrarian',
    shadow: 'Reflexive opposition as identity',
    color: '#FF4500'
  },
  'NULL': {
    designation: 'Ø',
    glyph: 'VOID',
    title: 'The Receptive Presence',
    essence: 'Pure reception without distortion',
    creativeMode: 'Receptive',
    shadow: 'Intake with no output',
    color: '#1a1a2e'
  }
};

// Signal weight constants (from Subtaste)
const SIGNAL_WEIGHTS = {
  // Explicit signals
  rating: 1.0,
  likert: 1.3,
  choice: 1.0,
  preference: 1.0,
  block: 1.5,
  ranking: 1.2,
  // Intentional implicit
  save: 0.6,
  share: 0.7,
  repeat: 0.5,
  // Unintentional implicit
  skip: 0.4,
  dwell: 0.3,
  click: 0.2
};

// Signal → archetype mapping (from Subtaste behavioral inference)
const SIGNAL_ARCHETYPE_MAP = {
  save: { 'P-7': 0.3, 'L-3': 0.2 },
  share: { 'H-6': 0.4, 'F-9': 0.2 },
  repeat: { 'D-8': 0.3, 'L-3': 0.2 },
  skip: { 'C-4': 0.2 },
  publish: { 'F-9': 0.4, 'H-6': 0.2 },
  schedule: { 'T-1': 0.3, 'L-3': 0.2 },
  edit: { 'C-4': 0.3, 'T-1': 0.2 },
  create_grid: { 'T-1': 0.3, 'S-0': 0.2 },
  curate: { 'P-7': 0.3, 'C-4': 0.2 },
  trend_follow: { 'V-2': 0.3, 'D-8': 0.2 },
  collaborate: { 'N-5': 0.3, 'H-6': 0.2 }
};

// ============================================================
// DEEP LEARNING KEYWORDS (Adapted from Refyn)
// ============================================================

const KEYWORD_CATEGORIES = {
  visual: {
    style: ['cinematic', 'photorealistic', 'artistic', 'abstract', 'minimal', 'surreal', 'vintage', 'gothic', 'ethereal', 'cyberpunk', 'aesthetic', 'polished', 'raw', 'clean', 'bold', 'vibrant'],
    mood: ['dramatic', 'peaceful', 'intense', 'serene', 'melancholic', 'uplifting', 'mysterious', 'haunting', 'joyful', 'dark', 'nostalgic', 'energetic'],
    color: ['warm', 'cool', 'vibrant', 'muted', 'pastel', 'neon', 'monochrome', 'teal-orange', 'earth-tones', 'high-contrast'],
    lighting: ['golden-hour', 'blue-hour', 'studio', 'natural', 'dramatic', 'soft', 'backlit', 'moody', 'bright', 'neon-glow'],
    composition: ['rule-of-thirds', 'centered', 'symmetrical', 'negative-space', 'close-up', 'wide-shot', 'flat-lay', 'overhead']
  },
  content: {
    hooks: ['question', 'bold-claim', 'how-to', 'story', 'statistic', 'controversy', 'curiosity-gap', 'social-proof', 'urgency', 'personal', 'listicle', 'challenge'],
    tone: ['edgy', 'chill', 'energetic', 'sincere', 'playful', 'confident', 'sarcastic', 'intense', 'nostalgic', 'provocative', 'vulnerable', 'authoritative'],
    format: ['carousel', 'reel', 'story', 'single-post', 'thread', 'long-form', 'behind-scenes', 'tutorial', 'review', 'collab']
  }
};

// ============================================================
// GAMIFICATION (Adapted from Refyn)
// ============================================================

const XP_REWARDS = {
  like: 10,
  dislike: 8,
  publish: 20,
  schedule: 12,
  save: 15,
  share: 15,
  create_grid: 10,
  edit_caption: 5,
  use_hook: 8,
  score_content: 3,
  daily_login: 10,
  discover_style: 20,
  discover_hook: 15,
  streak_day: 10,
  weekly_milestone: 50,
  monthly_milestone: 200
};

const TASTE_TIERS = [
  { name: 'Nascent', minXP: 0, level: 1, description: 'Beginning your creative journey', capabilities: ['basic-scoring'] },
  { name: 'Forming', minXP: 100, level: 2, description: 'Patterns emerging from your taste', capabilities: ['basic-scoring', 'hook-generation'] },
  { name: 'Defined', minXP: 300, level: 3, description: 'Clear creative preferences', capabilities: ['basic-scoring', 'hook-generation', 'keyword-avoidance'] },
  { name: 'Refined', minXP: 600, level: 4, description: 'Deep personalization active', capabilities: ['basic-scoring', 'hook-generation', 'keyword-avoidance', 'style-matching'] },
  { name: 'Intuitive', minXP: 1000, level: 5, description: 'Predictive suggestions enabled', capabilities: ['basic-scoring', 'hook-generation', 'keyword-avoidance', 'style-matching', 'trend-prediction'] },
  { name: 'Attuned', minXP: 2000, level: 6, description: 'Maximum creative intelligence', capabilities: ['basic-scoring', 'hook-generation', 'keyword-avoidance', 'style-matching', 'trend-prediction', 'cross-platform-insights'] }
];

const ACHIEVEMENTS = [
  // Rating milestones
  { id: 'first-score', name: 'First Impression', description: 'Score your first content', condition: 'totalScores >= 1', xp: 25 },
  { id: 'ten-scores', name: 'Pattern Seeker', description: 'Score 10 pieces of content', condition: 'totalScores >= 10', xp: 50 },
  { id: 'fifty-scores', name: 'Taste Architect', description: 'Score 50 pieces of content', condition: 'totalScores >= 50', xp: 100 },
  // Publishing milestones
  { id: 'first-publish', name: 'First Post', description: 'Publish your first content', condition: 'totalPublished >= 1', xp: 30 },
  { id: 'ten-published', name: 'Consistent Creator', description: 'Publish 10 pieces', condition: 'totalPublished >= 10', xp: 75 },
  // Hook generation
  { id: 'first-hook', name: 'Voice Found', description: 'Generate your first hook', condition: 'totalHooksGenerated >= 1', xp: 20 },
  { id: 'hook-master', name: 'Hook Master', description: 'Generate 50 hooks', condition: 'totalHooksGenerated >= 50', xp: 100 },
  // Streaks
  { id: 'streak-3', name: 'On Fire', description: '3-day content streak', condition: 'streak >= 3', xp: 30 },
  { id: 'streak-7', name: 'Week Warrior', description: '7-day content streak', condition: 'streak >= 7', xp: 75 },
  { id: 'streak-30', name: 'Unstoppable', description: '30-day content streak', condition: 'streak >= 30', xp: 250 },
  // Discovery
  { id: 'style-explorer', name: 'Style Explorer', description: 'Discover 5 different styles', condition: 'uniqueStyles >= 5', xp: 40 },
  { id: 'hook-explorer', name: 'Hook Explorer', description: 'Use 8 different hook types', condition: 'uniqueHooks >= 8', xp: 60 },
  // Archetype
  { id: 'glyph-revealed', name: 'True Name', description: 'Complete taste quiz to reveal your archetype', condition: 'archetypeRevealed === true', xp: 50 },
];

// ============================================================
// CORE GENOME FUNCTIONS
// ============================================================

/**
 * Create a new empty TasteGenome
 */
function createGenome(userId) {
  return {
    userId,
    version: 1,

    // Public layer - archetype
    archetype: {
      primary: null,
      secondary: null,
      distribution: {},
      confidence: 0,
      classifiedAt: null
    },

    // Deep learning - keyword scores (from Refyn)
    keywordScores: {},
    platformScores: {},
    successfulCombinations: [],
    failedCombinations: [],

    // Performance patterns (from intelligence service)
    performancePatterns: {
      hooks: [],
      sentiment: [],
      structure: [],
      keywords: [],
      bestFormats: [],
      bestTimes: []
    },

    // Aesthetic patterns
    aestheticPatterns: {
      dominantTones: [],
      avoidTones: [],
      voice: 'conversational',
      complexity: 'moderate',
      visualStyle: [],
      colorPalette: []
    },

    // Voice signature
    voiceSignature: {
      sentencePatterns: [],
      rhetoricalDevices: [],
      vocabularyLevel: 'moderate',
      captionLength: 'medium'
    },

    // Signal history (capped at 1000)
    signals: [],

    // Gamification
    gamification: {
      xp: 0,
      tier: 0,
      achievements: [],
      streak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      totalScores: 0,
      totalPublished: 0,
      totalHooksGenerated: 0,
      uniqueStyles: [],
      uniqueHooks: []
    },

    // Metadata
    confidence: 0,
    itemCount: 0,
    lastUpdated: null,
    createdAt: new Date()
  };
}

/**
 * Record a signal and update the genome
 */
function recordSignal(genome, signal) {
  const { type, value, metadata = {}, timestamp = new Date() } = signal;

  // Get signal weight
  const weight = SIGNAL_WEIGHTS[type] || 0.5;
  let isPositive = !['skip', 'dislike', 'block', 'delete'].includes(type);
  let direction = 1;

  // Likert signals can be negative/neutral depending on score
  if (type === 'likert' && metadata.score !== undefined) {
    if (metadata.score <= 2) {
      isPositive = false;
      direction = -1;
    } else if (metadata.score === 3) {
      isPositive = true;
      direction = 0.3; // low weight for neutral
    } else {
      isPositive = true;
      direction = 1;
    }
  }

  // Create signal record
  const signalRecord = {
    type,
    value,
    weight: isPositive ? weight * direction : -weight * Math.abs(direction) * 0.5,
    metadata,
    timestamp,
    archetypeWeights: {}
  };

  // Infer archetype weights from signal type
  const archetypeMap = SIGNAL_ARCHETYPE_MAP[type] || {};
  Object.entries(archetypeMap).forEach(([designation, w]) => {
    signalRecord.archetypeWeights[designation] = isPositive ? w * direction : -w * Math.abs(direction) * 0.5;
  });

  // Preference inputs (Subtaste) should steer archival/integrative archetypes
  if (type === 'preference') {
    const prefWeight = isPositive ? 0.4 : -0.2;
    signalRecord.archetypeWeights['P-7'] = (signalRecord.archetypeWeights['P-7'] || 0) + prefWeight;
    signalRecord.archetypeWeights['N-5'] = (signalRecord.archetypeWeights['N-5'] || 0) + prefWeight * 0.6;
  }

  // Likert with archetype hint
  if (type === 'likert' && metadata.archetypeHint) {
    const likertWeight = isPositive ? 0.6 * direction : -0.3 * Math.abs(direction);
    signalRecord.archetypeWeights[metadata.archetypeHint] = (signalRecord.archetypeWeights[metadata.archetypeHint] || 0) + likertWeight;
  }

  // Infer archetype weights from metadata
  if (metadata.isObscure && isPositive) {
    signalRecord.archetypeWeights['V-2'] = (signalRecord.archetypeWeights['V-2'] || 0) + 0.3;
    signalRecord.archetypeWeights['S-0'] = (signalRecord.archetypeWeights['S-0'] || 0) + 0.2;
  }
  if (metadata.isComplex && isPositive) {
    signalRecord.archetypeWeights['T-1'] = (signalRecord.archetypeWeights['T-1'] || 0) + 0.3;
  }
  if (metadata.isTrending && isPositive) {
    signalRecord.archetypeWeights['D-8'] = (signalRecord.archetypeWeights['D-8'] || 0) + 0.2;
  }

  // Add signal to history (cap at 1000)
  genome.signals.push(signalRecord);
  if (genome.signals.length > 1000) {
    genome.signals = genome.signals.slice(-1000);
  }

  // Update keyword scores if value contains text
  if (value && typeof value === 'string') {
    updateKeywordScores(genome, value, isPositive ? 2 * direction : -2 * Math.abs(direction), metadata.platform);
  }

  // Subtaste freeform inputs: fold authors/topics/books/influences into keyword learning
  if (type === 'preference') {
    const fields = ['authors', 'topics', 'books', 'influences'];
    const textParts = fields
      .map((key) => metadata[key])
      .filter((arr) => Array.isArray(arr) && arr.length)
      .map((arr) => arr.join(' '));

    if (textParts.length) {
      updateKeywordScores(
        genome,
        textParts.join(' '),
        isPositive ? 3 * direction : -3 * Math.abs(direction),
        metadata.platform
      );
    }
  }

  // Likert: treat the prompt as text for keyword learning
  if (type === 'likert' && metadata.prompt) {
    const keywordWeight = direction === 0.3 ? 1 : 2.5 * direction;
    updateKeywordScores(genome, metadata.prompt, keywordWeight, metadata.platform);
  }

  // Update item count and confidence
  genome.itemCount = (genome.itemCount || 0) + 1;
  genome.confidence = calculateConfidence(genome);
  genome.lastUpdated = new Date();

  // Update archetype distribution from signals
  updateArchetypeFromSignals(genome);

  // Update gamification
  updateGamification(genome, type);

  return genome;
}

/**
 * Update keyword scores (from Refyn deep learning)
 */
function updateKeywordScores(genome, text, weight, platform) {
  const lowerText = text.toLowerCase();

  // Scan all keyword categories
  Object.entries(KEYWORD_CATEGORIES).forEach(([category, subcategories]) => {
    Object.entries(subcategories).forEach(([subcat, keywords]) => {
      keywords.forEach(keyword => {
        if (lowerText.includes(keyword.replace('-', ' ')) || lowerText.includes(keyword)) {
          const key = `${category}.${subcat}.${keyword}`;

          // Update global score
          if (!genome.keywordScores[key]) {
            genome.keywordScores[key] = { score: 0, count: 0 };
          }
          genome.keywordScores[key].score = Math.max(-10, Math.min(10,
            genome.keywordScores[key].score + weight
          ));
          genome.keywordScores[key].count++;

          // Update platform-specific score
          if (platform) {
            if (!genome.platformScores[platform]) {
              genome.platformScores[platform] = {};
            }
            if (!genome.platformScores[platform][key]) {
              genome.platformScores[platform][key] = { score: 0, count: 0 };
            }
            genome.platformScores[platform][key].score = Math.max(-10, Math.min(10,
              genome.platformScores[platform][key].score + weight
            ));
            genome.platformScores[platform][key].count++;
          }
        }
      });
    });
  });
}

/**
 * Update archetype distribution from signal history
 */
function updateArchetypeFromSignals(genome) {
  const distribution = {};
  const designations = Object.keys(ARCHETYPES);

  // Initialize
  designations.forEach(d => { distribution[d] = 0; });

  // Apply temporal decay (0.99 per day)
  const now = Date.now();
  genome.signals.forEach(signal => {
    const daysOld = (now - new Date(signal.timestamp).getTime()) / (1000 * 60 * 60 * 24);
    const decay = Math.pow(0.99, daysOld);

    Object.entries(signal.archetypeWeights || {}).forEach(([designation, weight]) => {
      if (distribution[designation] !== undefined) {
        distribution[designation] += weight * decay * Math.abs(signal.weight);
      }
    });
  });

  // Normalize with softmax
  const temperature = 5;
  const expValues = {};
  let sumExp = 0;

  designations.forEach(d => {
    expValues[d] = Math.exp(distribution[d] / temperature);
    sumExp += expValues[d];
  });

  designations.forEach(d => {
    distribution[d] = sumExp > 0 ? expValues[d] / sumExp : 1 / designations.length;
  });

  // Find primary and secondary
  const sorted = Object.entries(distribution).sort((a, b) => b[1] - a[1]);
  const primary = sorted[0];
  const secondary = sorted[1];

  genome.archetype.distribution = distribution;
  genome.archetype.primary = {
    designation: primary[0],
    confidence: primary[1],
    ...ARCHETYPES[primary[0]]
  };

  if (secondary[1] > 0.15) {
    genome.archetype.secondary = {
      designation: secondary[0],
      confidence: secondary[1],
      ...ARCHETYPES[secondary[0]]
    };
  }

  genome.archetype.classifiedAt = new Date();

  // Calculate entropy-based confidence
  let entropy = 0;
  const maxEntropy = Math.log(designations.length);
  Object.values(distribution).forEach(p => {
    if (p > 0) {
      entropy -= p * Math.log(p);
    }
  });
  genome.archetype.confidence = 1 - (entropy / maxEntropy);
}

/**
 * Calculate overall genome confidence
 */
function calculateConfidence(genome) {
  const signalCount = genome.signals.length;
  const recentSignals = genome.signals.filter(s => {
    const daysOld = (Date.now() - new Date(s.timestamp).getTime()) / (1000 * 60 * 60 * 24);
    return daysOld <= 30;
  }).length;

  const uniqueSources = new Set(genome.signals.map(s => s.type)).size;

  const countConfidence = Math.min(signalCount / 50, 1);
  const recencyConfidence = Math.min(recentSignals / 20, 1);
  const diversityConfidence = Math.min(uniqueSources / 5, 1);

  return Math.min(0.95,
    (countConfidence * 0.4) + (recencyConfidence * 0.4) + (diversityConfidence * 0.2)
  );
}

/**
 * Update gamification state
 */
function updateGamification(genome, actionType) {
  const gam = genome.gamification;

  // Award XP
  const xpReward = XP_REWARDS[actionType] || 5;
  gam.xp += xpReward;

  // Update tier
  for (let i = TASTE_TIERS.length - 1; i >= 0; i--) {
    if (gam.xp >= TASTE_TIERS[i].minXP) {
      gam.tier = i;
      break;
    }
  }

  // Track action-specific stats
  if (actionType === 'score_content') gam.totalScores++;
  if (actionType === 'publish') gam.totalPublished++;
  if (actionType === 'use_hook') gam.totalHooksGenerated++;

  // Update streak
  const today = new Date().toISOString().split('T')[0];
  if (gam.lastActiveDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (gam.lastActiveDate === yesterday) {
      gam.streak++;
      gam.xp += XP_REWARDS.streak_day;
    } else {
      gam.streak = 1;
    }
    gam.longestStreak = Math.max(gam.longestStreak, gam.streak);
    gam.lastActiveDate = today;
  }

  // Check achievements
  checkAchievements(genome);
}

/**
 * Check and award achievements
 */
function checkAchievements(genome) {
  const gam = genome.gamification;
  const earned = new Set(gam.achievements.map(a => a.id));

  ACHIEVEMENTS.forEach(achievement => {
    if (earned.has(achievement.id)) return;

    let unlocked = false;

    // Simple condition checking
    if (achievement.condition.includes('totalScores')) {
      const required = parseInt(achievement.condition.match(/\d+/)[0]);
      unlocked = gam.totalScores >= required;
    } else if (achievement.condition.includes('totalPublished')) {
      const required = parseInt(achievement.condition.match(/\d+/)[0]);
      unlocked = gam.totalPublished >= required;
    } else if (achievement.condition.includes('totalHooksGenerated')) {
      const required = parseInt(achievement.condition.match(/\d+/)[0]);
      unlocked = gam.totalHooksGenerated >= required;
    } else if (achievement.condition.includes('streak')) {
      const required = parseInt(achievement.condition.match(/\d+/)[0]);
      unlocked = gam.streak >= required;
    } else if (achievement.condition.includes('uniqueStyles')) {
      const required = parseInt(achievement.condition.match(/\d+/)[0]);
      unlocked = gam.uniqueStyles.length >= required;
    } else if (achievement.condition.includes('uniqueHooks')) {
      const required = parseInt(achievement.condition.match(/\d+/)[0]);
      unlocked = gam.uniqueHooks.length >= required;
    } else if (achievement.condition.includes('archetypeRevealed')) {
      unlocked = genome.archetype.primary !== null;
    }

    if (unlocked) {
      gam.achievements.push({
        id: achievement.id,
        name: achievement.name,
        unlockedAt: new Date()
      });
      gam.xp += achievement.xp;
    }
  });
}

/**
 * Get top performing keywords from the genome
 */
function getTopKeywords(genome, category = null, limit = 10) {
  const entries = Object.entries(genome.keywordScores || {})
    .filter(([key, data]) => {
      if (!category) return true;
      return key.startsWith(category);
    })
    .sort((a, b) => b[1].score - a[1].score);

  return entries.slice(0, limit).map(([key, data]) => ({
    keyword: key.split('.').pop(),
    category: key.split('.').slice(0, 2).join('.'),
    score: data.score,
    count: data.count
  }));
}

/**
 * Get keywords to avoid
 */
function getAvoidKeywords(genome, limit = 10) {
  const entries = Object.entries(genome.keywordScores || {})
    .filter(([, data]) => data.score < -2 && data.count >= 2)
    .sort((a, b) => a[1].score - b[1].score);

  return entries.slice(0, limit).map(([key, data]) => ({
    keyword: key.split('.').pop(),
    category: key.split('.').slice(0, 2).join('.'),
    score: data.score,
    count: data.count
  }));
}

/**
 * Get the current taste tier information
 */
function getCurrentTier(genome) {
  const tier = TASTE_TIERS[genome.gamification.tier] || TASTE_TIERS[0];
  const nextTier = TASTE_TIERS[genome.gamification.tier + 1];

  return {
    ...tier,
    currentXP: genome.gamification.xp,
    nextTierXP: nextTier?.minXP || null,
    progress: nextTier
      ? (genome.gamification.xp - tier.minXP) / (nextTier.minXP - tier.minXP)
      : 1
  };
}

/**
 * Get genome summary for display
 */
function getGenomeSummary(genome) {
  return {
    archetype: genome.archetype.primary ? {
      designation: genome.archetype.primary.designation,
      glyph: genome.archetype.primary.glyph,
      title: genome.archetype.primary.title,
      essence: genome.archetype.primary.essence,
      creativeMode: genome.archetype.primary.creativeMode,
      color: genome.archetype.primary.color,
      confidence: genome.archetype.confidence,
      secondary: genome.archetype.secondary ? {
        designation: genome.archetype.secondary.designation,
        glyph: genome.archetype.secondary.glyph,
        title: genome.archetype.secondary.title,
        confidence: genome.archetype.secondary.confidence
      } : null
    } : null,
    tier: getCurrentTier(genome),
    topKeywords: getTopKeywords(genome, null, 8),
    avoidKeywords: getAvoidKeywords(genome, 5),
    performancePatterns: genome.performancePatterns,
    aestheticPatterns: genome.aestheticPatterns,
    confidence: genome.confidence,
    itemCount: genome.itemCount,
    gamification: {
      xp: genome.gamification.xp,
      streak: genome.gamification.streak,
      achievements: genome.gamification.achievements.length,
      totalAchievements: ACHIEVEMENTS.length
    }
  };
}

module.exports = {
  ARCHETYPES,
  SIGNAL_WEIGHTS,
  KEYWORD_CATEGORIES,
  XP_REWARDS,
  TASTE_TIERS,
  ACHIEVEMENTS,
  createGenome,
  recordSignal,
  updateKeywordScores,
  calculateConfidence,
  getTopKeywords,
  getAvoidKeywords,
  getCurrentTier,
  getGenomeSummary,
  updateGamification,
  checkAchievements,
  updateArchetypeFromSignals
};
