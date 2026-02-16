/**
 * Storage Service
 * Manages playback progress, watch history, and user preferences in localStorage
 */
import { supabase, isSupabaseConfigured } from './supabaseClient';

const PROGRESS_KEY_PREFIX = 'playback_progress_';
const WATCHED_KEY_PREFIX = 'watched_';
const COMPLETED_THRESHOLD = 0.9; // 90% watched = completed
const STATE_TABLE = 'app_state';

class StorageService {
  constructor() {
    this.hydrated = false;
  }

  emitChange() {
    try {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('watched-changed'));
    } catch {
      // noop
    }
  }

  async upsertState(stateKey, stateValue) { 
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    const { error } = await supabase.from(STATE_TABLE).upsert({
       state_key: stateKey,
       state_value: stateValue,
       updated_at: new Date().toISOString(),
    }, { onConflict: 'state_key' });
    
    if (error) console.error(`Supabase Sync Error [${stateKey}]:`, error.message);
  } catch (err) {
    console.error('Failed to connect to Supabase:', err);
  }
}

  async deleteState(stateKey) {
    if (!isSupabaseConfigured() || !supabase) return;
    try {
      await supabase.from(STATE_TABLE).delete().eq('state_key', stateKey);
    } catch {
      // noop
    }
  }

  async deleteStatePrefix(prefix) {
    if (!isSupabaseConfigured() || !supabase) return;
    try {
      await supabase.from(STATE_TABLE).delete().like('state_key', `${prefix}%`);
    } catch {
      // noop
    }
  }

  async hydrateFromCloud() {
    if (!isSupabaseConfigured() || !supabase || this.hydrated) return;
    try {
      const { data, error } = await supabase.from(STATE_TABLE).select('state_key, state_value');
      if (error || !Array.isArray(data)) return;
      data.forEach((row) => {
        if (!row.state_key) return;
        localStorage.setItem(row.state_key, JSON.stringify(row.state_value));
      });
      this.hydrated = true;
      this.emitChange();
    } catch {
      // noop
    }
  }
  /**
   * Save playback progress for a movie
   * @param {number} streamId - Stream ID
   * @param {number} currentTime - Current playback time in seconds
   * @param {number} duration - Total video duration in seconds
   * @param {Object} movieData - Additional movie data (title, poster, etc.)
   */
  saveProgress(streamId, currentTime, duration, movieData = {}) {
    try {
      const progress = {
        streamId,
        contentType: movieData.contentType || 'movie',
        currentTime,
        duration,
        percentage: duration > 0 ? (currentTime / duration) * 100 : 0,
        lastWatched: Date.now(),
        isCompleted: duration > 0 ? (currentTime / duration) >= COMPLETED_THRESHOLD : false,
        movieData: {
          title: movieData.title || '',
          poster: movieData.poster || '',
          containerExtension: movieData.containerExtension || 'mp4',
          imdbId: movieData.imdbId || '',
        }
      };

      const key = `${PROGRESS_KEY_PREFIX}${progress.contentType}_${streamId}`;
      localStorage.setItem(key, JSON.stringify(progress));
      this.upsertState(key, progress);
      this.emitChange();
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }

  /**
   * Get playback progress for a movie
   * @param {number} streamId - Stream ID
   * @returns {Object|null} - Progress data or null if not found
   */
  getProgress(streamId, contentType = 'movie') {
    try {
      const typedKey = `${PROGRESS_KEY_PREFIX}${contentType}_${streamId}`;
      const legacyKey = PROGRESS_KEY_PREFIX + streamId;
      const data = localStorage.getItem(typedKey) || localStorage.getItem(legacyKey);
      
      if (!data) return null;
      
      return JSON.parse(data);
    } catch (error) {
      console.error('Error getting progress:', error);
      return null;
    }
  }

  /**
   * Get all movies with saved progress (for Continue Watching section)
   * @param {number} limit - Maximum number of items to return
   * @returns {Array} - Array of progress objects sorted by last watched
   */
  getAllProgress(limit = 10) {
    try {
      const progressItems = [];
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        if (key.startsWith(PROGRESS_KEY_PREFIX)) {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            // Only include items that are not completed and have progress
            if (!data.isCompleted && data.percentage > 0) {
              progressItems.push(data);
            }
          } catch (error) {
            console.error('Error parsing progress item:', error);
          }
        }
      });

      // Sort by last watched (most recent first)
      progressItems.sort((a, b) => b.lastWatched - a.lastWatched);
      
      // Return limited results
      return progressItems.slice(0, limit);
    } catch (error) {
      console.error('Error getting all progress:', error);
      return [];
    }
  }

  /**
   * Delete progress for a specific movie
   * @param {number} streamId - Stream ID
   */
  deleteProgress(streamId, contentType = 'movie') {
    try {
      const key = `${PROGRESS_KEY_PREFIX}${contentType}_${streamId}`;
      localStorage.removeItem(key);
      localStorage.removeItem(PROGRESS_KEY_PREFIX + streamId);
      this.deleteState(key);
      this.deleteState(PROGRESS_KEY_PREFIX + streamId);
      this.emitChange();
    } catch (error) {
      console.error('Error deleting progress:', error);
    }
  }

  /**
   * Clear all playback progress
   */
  clearAllProgress() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(PROGRESS_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      this.deleteStatePrefix(PROGRESS_KEY_PREFIX);
      this.emitChange();
    } catch (error) {
      console.error('Error clearing all progress:', error);
    }
  }

  clearProgressByType(contentType = 'movie') {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(`${PROGRESS_KEY_PREFIX}${contentType}_`)) {
          localStorage.removeItem(key);
          this.deleteState(key);
        }
      });
      this.emitChange();
    } catch (error) {
      console.error('Error clearing progress by type:', error);
    }
  }

  getProgressByType(contentType = 'movie', limit = 10) {
    const all = this.getAllProgress(limit * 5);
    return all.filter((item) => (item.contentType || 'movie') === contentType).slice(0, limit);
  }

  getWatchedKey(streamId, contentType = 'movie') {
    return `${WATCHED_KEY_PREFIX}${contentType}_${streamId}`;
  }

  setWatched(streamId, contentType = 'movie', watched = true) {
    try {
      const key = this.getWatchedKey(streamId, contentType);
      if (watched) {
        const payload = {
          streamId,
          contentType,
          watched: true,
          updatedAt: Date.now(),
        };
        localStorage.setItem(
          key,
          JSON.stringify(payload)
        );
        this.upsertState(key, payload);
      } else {
        localStorage.removeItem(key);
        this.deleteState(key);
      }
      this.emitChange();
    } catch (error) {
      console.error('Error setting watched state:', error);
    }
  }

  isWatched(streamId, contentType = 'movie') {
    try {
      return !!localStorage.getItem(this.getWatchedKey(streamId, contentType));
    } catch {
      return false;
    }
  }

  getWatchedMap(contentType = null) {
    const map = new Map();
    try {
      Object.keys(localStorage).forEach((key) => {
        if (!key.startsWith(WATCHED_KEY_PREFIX)) return;
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        if (!data.streamId) return;
        if (contentType && data.contentType !== contentType) return;
        map.set(`${data.contentType}_${data.streamId}`, true);
      });
    } catch (error) {
      console.error('Error reading watched map:', error);
    }
    return map;
  }

  /**
   * Check if a movie is completed
   * @param {number} streamId - Stream ID
   * @returns {boolean} - True if movie is marked as completed
   */
  isCompleted(streamId, contentType = 'movie') {
    const progress = this.getProgress(streamId, contentType);
    return progress ? progress.isCompleted : false;
  }

  /**
   * Mark a movie as completed
   * @param {number} streamId - Stream ID
   */
  markAsCompleted(streamId, contentType = 'movie') {
    const progress = this.getProgress(streamId, contentType);
    if (progress) {
      progress.isCompleted = true;
      const key = `${PROGRESS_KEY_PREFIX}${contentType}_${streamId}`;
      localStorage.setItem(key, JSON.stringify(progress));
      this.upsertState(key, progress);
    }
  }

  /**
   * Get watch statistics
   * @returns {Object} - Statistics about watch history
   */
  getWatchStats() {
    try {
      const keys = Object.keys(localStorage);
      let totalMovies = 0;
      let completedMovies = 0;
      let inProgressMovies = 0;

      keys.forEach(key => {
        if (key.startsWith(PROGRESS_KEY_PREFIX)) {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            totalMovies++;
            if (data.isCompleted) {
              completedMovies++;
            } else if (data.percentage > 0) {
              inProgressMovies++;
            }
          } catch (error) {
            // Skip invalid entries
          }
        }
      });

      return {
        totalMovies,
        completedMovies,
        inProgressMovies
      };
    } catch (error) {
      console.error('Error getting watch stats:', error);
      return { totalMovies: 0, completedMovies: 0, inProgressMovies: 0 };
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();
