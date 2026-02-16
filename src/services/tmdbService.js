/**
 * TMDB Service
 * Fetches original title/year by TMDB id with cache support.
 */

import { dataCacheService } from './dataCacheService';

const TMDB_API_KEY = (import.meta.env.VITE_TMDB_API_KEY || '').trim();
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_TTL_MS = 14 * 24 * 60 * 60 * 1000;

class TmdbService {
  isConfigured() {
    return TMDB_API_KEY.length > 0;
  }

  async fetchMetadata(tmdbId, mediaType = 'movie') {
    if (!tmdbId || !this.isConfigured()) return null;

    const id = String(tmdbId).trim();
    const type = mediaType === 'series' ? 'tv' : 'movie';
    const cacheKey = `tmdb_${type}_${id}`;
    const cached = await dataCacheService.get(cacheKey, TMDB_TTL_MS);
    if (cached) return cached;

    try {
      const url = `${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&language=en-US`;
      const response = await fetch(url);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      const payload = {
        originalTitle: data.original_title || data.original_name || '',
        originalName: data.original_name || data.original_title || '',
        year: data.release_date || data.first_air_date || '',
      };
      await dataCacheService.set(cacheKey, payload);
      return payload;
    } catch {
      return null;
    }
  }
}

export const tmdbService = new TmdbService();
