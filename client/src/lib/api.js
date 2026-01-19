import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Create axios instance with defaults
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login if we had a token that expired
    // Don't redirect if user is in demo mode (no token)
    if (error.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  async login(email, password) {
    const { data } = await api.post('/api/auth/login', { email, password });
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  async register(email, password, name) {
    const { data } = await api.post('/api/auth/register', { email, password, name });
    return data;
  },

  async logout() {
    localStorage.removeItem('token');
    await api.post('/api/auth/logout');
  },

  async getMe() {
    const { data } = await api.get('/api/auth/me');
    return data;
  },

  async getGoogleAuthUrl() {
    const { data } = await api.get('/api/auth/google');
    return data.url;
  },

  async updateProfile(profileData) {
    const { data } = await api.put('/api/auth/profile', profileData);
    return data;
  },
};

// YouTube API
export const youtubeApi = {
  // Collections
  async getCollections() {
    const { data } = await api.get('/api/youtube/collections');
    return data;
  },
  async getCollection(id) {
    const { data } = await api.get(`/api/youtube/collections/${id}`);
    return data;
  },
  async createCollection(collectionData) {
    const { data } = await api.post('/api/youtube/collections', collectionData);
    return data;
  },
  async updateCollection(id, updates) {
    const { data } = await api.put(`/api/youtube/collections/${id}`, updates);
    return data;
  },
  async deleteCollection(id) {
    const { data } = await api.delete(`/api/youtube/collections/${id}`);
    return data;
  },

  // Videos
  async getVideos(collectionId) {
    const params = collectionId ? { collectionId } : {};
    const { data } = await api.get('/api/youtube/videos', { params });
    return data;
  },
  async getVideo(id) {
    const { data } = await api.get(`/api/youtube/videos/${id}`);
    return data;
  },
  async createVideo(videoData) {
    const { data } = await api.post('/api/youtube/videos', videoData);
    return data;
  },
  async updateVideo(id, updates) {
    const { data } = await api.put(`/api/youtube/videos/${id}`, updates);
    return data;
  },
  async deleteVideo(id) {
    const { data } = await api.delete(`/api/youtube/videos/${id}`);
    return data;
  },
  async reorderVideos(collectionId, videoIds) {
    const { data } = await api.post('/api/youtube/videos/reorder', { collectionId, videoIds });
    return data;
  },
};

// Rollout API
export const rolloutApi = {
  // Rollouts
  async getAll() {
    const { data } = await api.get('/api/rollout');
    return data;
  },
  async getById(id) {
    const { data } = await api.get(`/api/rollout/${id}`);
    return data;
  },
  async create(rolloutData) {
    const { data } = await api.post('/api/rollout', rolloutData);
    return data;
  },
  async update(id, updates) {
    const { data } = await api.put(`/api/rollout/${id}`, updates);
    return data;
  },
  async delete(id) {
    const { data } = await api.delete(`/api/rollout/${id}`);
    return data;
  },

  // Sections
  async addSection(rolloutId, sectionData) {
    const { data } = await api.post(`/api/rollout/${rolloutId}/sections`, sectionData);
    return data;
  },
  async updateSection(rolloutId, sectionId, updates) {
    const { data } = await api.put(`/api/rollout/${rolloutId}/sections/${sectionId}`, updates);
    return data;
  },
  async deleteSection(rolloutId, sectionId) {
    const { data } = await api.delete(`/api/rollout/${rolloutId}/sections/${sectionId}`);
    return data;
  },
  async reorderSections(rolloutId, sectionIds) {
    const { data } = await api.post(`/api/rollout/${rolloutId}/sections/reorder`, { sectionIds });
    return data;
  },

  // Collections in sections
  async addCollectionToSection(rolloutId, sectionId, collectionId) {
    const { data } = await api.post(`/api/rollout/${rolloutId}/sections/${sectionId}/collections`, { collectionId });
    return data;
  },
  async removeCollectionFromSection(rolloutId, sectionId, collectionId) {
    const { data } = await api.delete(`/api/rollout/${rolloutId}/sections/${sectionId}/collections/${collectionId}`);
    return data;
  },
};

// Content API
export const contentApi = {
  async getAll(params = {}) {
    const { data } = await api.get('/api/content', { params });
    return data;
  },

  async getById(id) {
    const { data } = await api.get(`/api/content/${id}`);
    return data;
  },

  async upload(file, metadata = {}) {
    const formData = new FormData();
    formData.append('media', file);
    Object.entries(metadata).forEach(([key, value]) => {
      formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
    });

    const { data } = await api.post('/api/content', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async uploadReel(videoFile, thumbnailBlob, metadata = {}) {
    const formData = new FormData();
    formData.append('media', videoFile);
    formData.append('thumbnail', thumbnailBlob, 'thumbnail.jpg');
    Object.entries(metadata).forEach(([key, value]) => {
      formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
    });

    const { data } = await api.post('/api/content/reel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async update(id, updates) {
    const { data } = await api.put(`/api/content/${id}`, updates);
    return data;
  },

  async delete(id) {
    const { data } = await api.delete(`/api/content/${id}`);
    return data;
  },

  async addVersion(id, versionData) {
    const { data } = await api.post(`/api/content/${id}/versions`, versionData);
    return data;
  },
};

// Grid API
export const gridApi = {
  async getAll() {
    const { data } = await api.get('/api/grid');
    return data;
  },

  async getById(id) {
    const { data } = await api.get(`/api/grid/${id}`);
    return data;
  },

  async create(gridData) {
    const { data } = await api.post('/api/grid', gridData);
    return data;
  },

  async update(id, updates) {
    const { data } = await api.put(`/api/grid/${id}`, updates);
    return data;
  },

  async delete(id) {
    const { data } = await api.delete(`/api/grid/${id}`);
    return data;
  },

  async addContent(gridId, contentId, position) {
    // Position can be { row, col } object or a number
    let row, col;
    if (typeof position === 'object') {
      row = position.row;
      col = position.col;
    } else {
      // Convert flat position to row/col (assuming 3 columns default)
      row = Math.floor(position / 3);
      col = position % 3;
    }
    const { data } = await api.post(`/api/grid/${gridId}/add-content`, { contentId, row, col });
    return data;
  },

  async removeContent(gridId, contentId) {
    const { data } = await api.post(`/api/grid/${gridId}/remove-content`, { contentId });
    return data;
  },

  async reorder(gridId, items) {
    const { data } = await api.post(`/api/grid/${gridId}/reorder`, { items });
    return data;
  },
};

// AI API
export const aiApi = {
  async analyzeContent(contentId) {
    const { data } = await api.post('/api/ai/analyze', { contentId });
    return data;
  },

  async generateCaption(idea, tone = 'casual', options = {}) {
    const { data } = await api.post('/api/alchemy/captions', { idea, tone, ...options });
    return data.captions || [];
  },

  async generateHashtags(contentId, count = 20) {
    const { data } = await api.post('/api/ai/generate-hashtags', { contentId, count });
    return data.hashtags || [];
  },

  async suggestContentType(contentId) {
    const { data } = await api.post('/api/ai/suggest-type', { contentId });
    return data;
  },

  async generateIdeas(niche, examples = []) {
    const { data } = await api.post('/api/alchemy/ideas', { niche, examples });
    return data.ideas || [];
  },

  async compareVersions(contentId, versionIds) {
    const { data } = await api.post('/api/ai/compare-versions', { contentId, versionIds });
    return data;
  },

  async getOptimalTiming(platform, contentType) {
    const { data } = await api.post('/api/ai/optimal-timing', { platform, contentType });
    return data;
  },
};

// Collection/Scheduling API
export const collectionApi = {
  async getAll() {
    const { data } = await api.get('/api/collection');
    return data;
  },

  async getById(id) {
    const { data } = await api.get(`/api/collection/${id}`);
    return data;
  },

  async create(collectionData) {
    const { data } = await api.post('/api/collection', collectionData);
    return data;
  },

  async update(id, updates) {
    const { data } = await api.put(`/api/collection/${id}`, updates);
    return data;
  },

  async delete(id) {
    const { data } = await api.delete(`/api/collection/${id}`);
    return data;
  },

  async schedule(id, scheduleData) {
    const { data } = await api.post(`/api/collection/${id}/schedule`, scheduleData);
    return data;
  },

  async pause(id) {
    const { data } = await api.post(`/api/collection/${id}/pause`);
    return data;
  },

  async resume(id) {
    const { data } = await api.post(`/api/collection/${id}/resume`);
    return data;
  },
};

// Posting API
export const postingApi = {
  async postNow(contentId, platforms, options = {}) {
    const { data } = await api.post('/api/post/now', { contentId, platforms, ...options });
    return data;
  },

  async schedulePost(contentId, platforms, scheduledAt, options = {}) {
    const { data } = await api.post('/api/post/schedule', {
      contentId,
      platforms,
      scheduledAt,
      ...options
    });
    return data;
  },

  async cancelScheduled(postId) {
    const { data } = await api.post(`/api/post/${postId}/cancel`);
    return data;
  },

  async getScheduled() {
    const { data } = await api.get('/api/post/scheduled');
    return data;
  },

  async getHistory(params = {}) {
    const { data } = await api.get('/api/post/history', { params });
    return data;
  },
};

// Platform Connection API
export const platformApi = {
  async getConnections() {
    const { data } = await api.get('/api/auth/connections');
    return data;
  },

  async getInstagramAuthUrl() {
    const { data } = await api.get('/api/auth/instagram');
    return data.url;
  },

  async getTikTokAuthUrl() {
    const { data } = await api.get('/api/auth/tiktok');
    return data.url;
  },

  async disconnect(platform) {
    const { data } = await api.post(`/api/auth/${platform}/disconnect`);
    return data;
  },

  async refreshToken(platform) {
    const { data } = await api.post(`/api/auth/${platform}/refresh`);
    return data;
  },
};

export default api;
