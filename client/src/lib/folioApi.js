/**
 * Folio API Integration
 * Connects Slayt to Folio's creative intelligence platform
 */

const FOLIO_API_URL = import.meta.env.VITE_FOLIO_API_URL || 'http://localhost:3001';

// Store Folio session token
let folioToken = localStorage.getItem('folio_token') || null;
let folioUser = JSON.parse(localStorage.getItem('folio_user') || 'null');

/**
 * Set Folio authentication
 */
export const setFolioAuth = (token, user) => {
  folioToken = token;
  folioUser = user;
  if (token) {
    localStorage.setItem('folio_token', token);
    localStorage.setItem('folio_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('folio_token');
    localStorage.removeItem('folio_user');
  }
};

/**
 * Get current Folio user
 */
export const getFolioUser = () => folioUser;

/**
 * Check if connected to Folio
 */
export const isFolioConnected = () => !!folioToken;

/**
 * Make authenticated request to Folio API
 */
const folioFetch = async (endpoint, options = {}) => {
  if (!folioToken) {
    throw new Error('Not connected to Folio');
  }

  const response = await fetch(`${FOLIO_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${folioToken}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired, clear auth
      setFolioAuth(null, null);
      throw new Error('Folio session expired');
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Folio API error: ${response.status}`);
  }

  return response.json();
};

/**
 * Folio Authentication
 */
export const folioAuth = {
  /**
   * Login to Folio
   */
  async login(email, password) {
    const response = await fetch(`${FOLIO_API_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    const data = await response.json();
    setFolioAuth(data.token, data.user);
    return data;
  },

  /**
   * Check current session
   */
  async getSession() {
    if (!folioToken) return null;
    try {
      const data = await folioFetch('/api/auth/session');
      return data;
    } catch {
      return null;
    }
  },

  /**
   * Logout from Folio
   */
  logout() {
    setFolioAuth(null, null);
  },

  /**
   * Check if connected
   */
  isConnected: isFolioConnected,

  /**
   * Get current user
   */
  getUser: getFolioUser,
};

/**
 * Folio Taste Profile API
 */
export const folioTasteProfile = {
  /**
   * Get user's taste profile from Folio
   */
  async get() {
    return folioFetch('/api/taste-profile');
  },

  /**
   * Check if rebuild is needed
   */
  async checkRebuild() {
    return folioFetch('/api/taste-profile/rebuild');
  },

  /**
   * Rebuild taste profile from collections
   */
  async rebuild() {
    return folioFetch('/api/taste-profile/rebuild', { method: 'POST' });
  },
};

/**
 * Folio Content Generation API
 */
export const folioGenerate = {
  /**
   * Generate content variants using Folio's AI
   * @param {string} topic - Topic to generate for
   * @param {string} platform - Target platform (YOUTUBE_SHORT, TIKTOK, INSTAGRAM_REEL, etc.)
   * @param {number} count - Number of variants to generate
   * @param {string[]} referenceItems - Collection IDs to use as reference
   * @param {string} mode - 'generate' or 'randomize'
   * @param {string} language - Output language
   */
  async variants(topic, platform = 'INSTAGRAM_REEL', count = 5, referenceItems = [], mode = 'generate', language = 'English') {
    return folioFetch('/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        topic,
        platform,
        count,
        referenceItems,
        mode,
        language,
      }),
    });
  },

  /**
   * Generate random ideas from taste profile
   */
  async randomize(platform = 'INSTAGRAM_REEL', count = 5, referenceItems = []) {
    return folioFetch('/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        platform,
        count,
        referenceItems,
        mode: 'randomize',
      }),
    });
  },
};

/**
 * Folio Content Analysis API
 */
export const folioAnalyze = {
  /**
   * Analyze content and get DNA
   */
  async content(title, platform, views = 0, engagement = 0) {
    return folioFetch('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ title, platform, views, engagement }),
    });
  },
};

/**
 * Folio Collections API
 */
export const folioCollections = {
  /**
   * Get user's saved collections
   */
  async list(limit = 50, offset = 0) {
    return folioFetch(`/api/collections?limit=${limit}&offset=${offset}`);
  },

  /**
   * Get single collection
   */
  async get(id) {
    return folioFetch(`/api/collections/${id}`);
  },

  /**
   * Save new content to collection
   */
  async save(content) {
    return folioFetch('/api/collections', {
      method: 'POST',
      body: JSON.stringify(content),
    });
  },
};

/**
 * Folio Training API
 */
export const folioTraining = {
  /**
   * Get training suggestions
   */
  async getSuggestions(mode = 'pair', count = 10) {
    return folioFetch(`/api/training/suggestions?mode=${mode}&count=${count}`);
  },

  /**
   * Submit a rating
   */
  async rate(ratingData) {
    return folioFetch('/api/training/rate', {
      method: 'POST',
      body: JSON.stringify(ratingData),
    });
  },

  /**
   * Get training stats
   */
  async getStats() {
    return folioFetch('/api/training/stats');
  },

  /**
   * Refine profile from all ratings
   */
  async refine() {
    return folioFetch('/api/training/refine', { method: 'POST' });
  },
};

export default {
  auth: folioAuth,
  tasteProfile: folioTasteProfile,
  generate: folioGenerate,
  analyze: folioAnalyze,
  collections: folioCollections,
  training: folioTraining,
};
