/**
 * Data Cache Service
 * Supabase-first cache with local fallback.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';

const LS_PREFIX = 'xtream_cache_';
const CACHE_TABLE = 'app_cache';

class DataCacheService {
  async get(key, ttlMs = 0) {
    const now = Date.now();
    const namespaced = LS_PREFIX + key;

    // Fast local read.
    try {
      const raw = localStorage.getItem(namespaced);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (ttlMs <= 0 || now - Number(parsed.updatedAt || 0) <= ttlMs) {
          return parsed.payload;
        }
      }
    } catch {
      // ignore parse errors
    }

    if (!isSupabaseConfigured() || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from(CACHE_TABLE)
        .select('payload, updated_at')
        .eq('cache_key', namespaced)
        .maybeSingle();
      if (error || !data) return null;

      const updatedAt = new Date(data.updated_at).getTime();
      if (ttlMs > 0 && now - updatedAt > ttlMs) return null;

      localStorage.setItem(namespaced, JSON.stringify({ payload: data.payload, updatedAt }));
      return data.payload;
    } catch {
      return null;
    }
  }

  async set(key, payload) {
    const namespaced = LS_PREFIX + key;
    const updatedAt = Date.now();

    try {
      localStorage.setItem(namespaced, JSON.stringify({ payload, updatedAt }));
    } catch {
      // ignore local write
    }

    if (!isSupabaseConfigured() || !supabase) return;

    try {
      await supabase.from(CACHE_TABLE).upsert(
        {
          cache_key: namespaced,
          payload,
          updated_at: new Date(updatedAt).toISOString(),
        },
        { onConflict: 'cache_key' }
      );
    } catch {
      // noop
    }
  }

  async clearPrefix(prefix = '') {
    const localPrefix = LS_PREFIX + prefix;
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(localPrefix)) {
        localStorage.removeItem(key);
      }
    });

    if (!isSupabaseConfigured() || !supabase) return;
    try {
      await supabase.from(CACHE_TABLE).delete().like('cache_key', `${localPrefix}%`);
    } catch {
      // noop
    }
  }
}

export const dataCacheService = new DataCacheService();
