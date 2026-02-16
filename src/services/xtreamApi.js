/**
 * Xtream API Service
 * Handles all communication with Xtream Codes API
 */
import { dataCacheService } from './dataCacheService';

const CACHE_TTL = {
  streams: 10 * 60 * 1000,
  categories: 30 * 60 * 1000,
  details: 24 * 60 * 60 * 1000,
};

class XtreamApiService {
  constructor() {
    this.baseUrl = null;
    this.username = null;
    this.password = null;
  }

  /**
   * Initialize API credentials
   * @param {string} serverUrl - Xtream server URL
   * @param {string} username - User's username
   * @param {string} password - User's password
   */
  setCredentials(serverUrl, username, password) {
    // Remove trailing slash from server URL
    this.baseUrl = serverUrl.replace(/\/$/, '');
    this.username = username;
    this.password = password;
    
    // Save credentials to localStorage for persistence
    localStorage.setItem('xtream_credentials', JSON.stringify({
      serverUrl: this.baseUrl,
      username,
      password
    }));
  }

  /**
   * Load saved credentials from localStorage
   * @returns {boolean} - True if credentials were loaded successfully
   */
  loadSavedCredentials() {
    const saved = localStorage.getItem('xtream_credentials');
    if (saved) {
      try {
        const { serverUrl, username, password } = JSON.parse(saved);
        this.baseUrl = serverUrl;
        this.username = username;
        this.password = password;
        return true;
      } catch (error) {
        console.error('Failed to load saved credentials:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Clear saved credentials
   */
  clearCredentials() {
    this.baseUrl = null;
    this.username = null;
    this.password = null;
    localStorage.removeItem('xtream_credentials');
    dataCacheService.clearPrefix();
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!(this.baseUrl && this.username && this.password);
  }

  /**
   * Build API URL with credentials
   * @param {string} action - API action (optional)
   * @returns {string} - Complete API URL
   */
  buildApiUrl(action = null) {
    if (!this.isAuthenticated()) {
      throw new Error('API credentials not set');
    }

    let url = `/api/xtream?serverUrl=${encodeURIComponent(this.baseUrl)}&username=${encodeURIComponent(this.username)}&password=${encodeURIComponent(this.password)}`;

    if (action) {
      url += `&action=${encodeURIComponent(action)}`;
    }

    return url;
  }

  /**
   * Authenticate user and get account info
   * @returns {Promise<Object>} - User account information
   */
  async authenticate() {
    try {
      const url = this.buildApiUrl();
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();
      
      if (data.user_info && data.user_info.status === 'Active') {
        return data;
      } else {
        throw new Error('Invalid credentials or inactive account');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  /**
   * Fetch all VOD (Video on Demand) streams
   * @returns {Promise<Array>} - Array of VOD streams
   */
  async getVodStreams() {
    const data = await this.fetchCached('get_vod_streams', CACHE_TTL.streams);
    return Array.isArray(data) ? data : [];
  }

  /**
   * Fetch all Live TV streams
   * @returns {Promise<Array>}
   */
  async getLiveStreams() {
    const data = await this.fetchCached('get_live_streams', CACHE_TTL.streams);
    return Array.isArray(data) ? data : [];
  }

  /**
   * Fetch all Series
   * @returns {Promise<Array>}
   */
  async getSeries() {
    const data = await this.fetchCached('get_series', CACHE_TTL.streams);
    return Array.isArray(data) ? data : [];
  }

  /**
   * Fetch single series detail + episodes
   * @param {number|string} seriesId
   * @returns {Promise<Object>}
   */
  async getSeriesInfo(seriesId) {
    return this.fetchCached('get_series_info', CACHE_TTL.details, { series_id: seriesId });
  }

  /**
   * Get VOD info by stream ID
   * @param {number} vodId - VOD stream ID
   * @returns {Promise<Object>} - VOD information
   */
  async getVodInfo(vodId) {
    return this.fetchCached('get_vod_info', CACHE_TTL.details, { vod_id: vodId });
  }


  shouldProxyMedia() {
    try {
    const isHttpsHost = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const isInsecureServer = String(this.baseUrl || '').startsWith('http://');
    const proxyForced = String(import.meta.env.VITE_USE_STREAM_PROXY || '').toLowerCase() === 'true';
   return (isHttpsHost && isInsecureServer) || proxyForced;
  } catch {
    return false;
  }
}

  shouldUpgradeToHttpsMedia() {
    try {
      return (
        typeof window !== 'undefined' &&
        window.location.protocol === 'https:' &&
        String(this.baseUrl || '').startsWith('http://')
      );
    } catch {
      return false;
    }
  }

  buildProxyStreamUrl(streamId, containerExtension = 'mp4', contentType = 'movie', episodeId = null) {
    const params = new URLSearchParams({
      serverUrl: this.baseUrl,
      username: this.username,
      password: this.password,
      type: contentType,
      id: String(contentType === 'series' ? (episodeId || streamId) : streamId),
      ext: String(containerExtension || (contentType === 'live' ? 'm3u8' : 'mp4')),
    });
    return `/api/stream?${params.toString()}`;
  }

  getSecureBaseUrl() {
    if (String(this.baseUrl || '').startsWith('http://')) {
      return this.baseUrl.replace('http://', 'https://');
    }
    return this.baseUrl;
  }
  /**
   * Build stream URL for a VOD
   * @param {number} streamId - Stream ID
   * @param {string} containerExtension - File extension (e.g., 'mp4', 'm3u8')
   * @returns {string} - Stream URL
   */
  getStreamUrl(streamId, containerExtension = 'mp4') {
    if (!this.isAuthenticated()) {
      throw new Error('API credentials not set');
    }

    if (this.shouldProxyMedia()) {
      return this.buildProxyStreamUrl(streamId, containerExtension, 'movie', null);
    }

    const base = this.shouldUpgradeToHttpsMedia() ? this.getSecureBaseUrl() : this.baseUrl;
    return `${base}/movie/${this.username}/${this.password}/${streamId}.${containerExtension}`;
  }

  /**
   * Build playback URL by content type
   * @param {number|string} streamId
   * @param {string} containerExtension
   * @param {'movie'|'live'|'series'} contentType
   * @param {number|string|null} episodeId
   * @returns {string}
   */
  getPlaybackUrl(streamId, containerExtension = 'mp4', contentType = 'movie', episodeId = null) {
    if (!this.isAuthenticated()) {
      throw new Error('API credentials not set');
    }

    if (this.shouldProxyMedia()) {
      return this.buildProxyStreamUrl(streamId, containerExtension, contentType, episodeId);
    }

    const base = this.shouldUpgradeToHttpsMedia() ? this.getSecureBaseUrl() : this.baseUrl;

    if (contentType === 'live') {
      return `${base}/live/${this.username}/${this.password}/${streamId}.${containerExtension || 'm3u8'}`;
    }

    if (contentType === 'series') {
      const id = episodeId || streamId;
      return `${base}/series/${this.username}/${this.password}/${id}.${containerExtension || 'mp4'}`;
    }

    return this.getStreamUrl(streamId, containerExtension || 'mp4');
  }

  /**
   * Get categories
   * @returns {Promise<Array>} - Array of categories
   */
  async getVodCategories() {
    const data = await this.fetchCached('get_vod_categories', CACHE_TTL.categories);
    return Array.isArray(data) ? data : [];
  }

  /**
   * Get Live TV categories
   * @returns {Promise<Array>}
   */
  async getLiveCategories() {
    const data = await this.fetchCached('get_live_categories', CACHE_TTL.categories);
    return Array.isArray(data) ? data : [];
  }

  /**
   * Get Series categories
   * @returns {Promise<Array>}
   */
  async getSeriesCategories() {
    const data = await this.fetchCached('get_series_categories', CACHE_TTL.categories);
    return Array.isArray(data) ? data : [];
  }

  async fetchCached(action, ttlMs, extraParams = {}) {
    try {
      const query = new URLSearchParams({
        action,
        ...Object.fromEntries(Object.entries(extraParams).map(([k, v]) => [k, String(v)])),
      }).toString();
      const cacheKey = `${this.baseUrl}|${this.username}|${query}`;
      const cached = await dataCacheService.get(cacheKey, ttlMs);
      if (cached !== null && cached !== undefined) {
        return cached;
      }

      let url = this.buildApiUrl(action);
      Object.entries(extraParams).forEach(([k, v]) => {
        url += `&${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`;
      });
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch ${action}`);
      }

      const payload = await response.json();
      await dataCacheService.set(cacheKey, payload);
      return payload;
    } catch (error) {
      console.error(`Error fetching ${action}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const xtreamApi = new XtreamApiService();



