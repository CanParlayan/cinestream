/**
 * useMovies Hook
 * Handles movies/live/series data, filters, sorting and pagination.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { xtreamApi } from '../services/xtreamApi';
import { storageService } from '../services/storageService';
import { tmdbService } from '../services/tmdbService';
import { cleanMovieTitle, parseRating } from '../utils/helpers';

const CONTENT_TYPES = {
  MOVIE: 'movie',
  LIVE: 'live',
  SERIES: 'series',
};

const PAGE_SIZE_OPTIONS = [20, 50, 100, 250, 500];

const parseLiveExtension = (streamType = '') => {
  const lower = String(streamType).toLowerCase();
  if (lower.includes('m3u8') || lower.includes('hls')) return 'm3u8';
  return 'ts';
};

const normalizeYear = (value) => {
  const m = String(value || '').match(/(19|20)\d{2}/);
  return m ? Number(m[0]) : null;
};

const normalizeMovie = (stream) => ({
  id: stream.stream_id || stream.num,
  streamId: stream.stream_id || stream.num,
  title: stream.name || 'Untitled',
  originalTitle: stream.o_name || stream.original_name || stream.stream_display_name || '',
  cleanTitle: cleanMovieTitle(stream.name || 'Untitled'),
  poster: stream.stream_icon || stream.cover || '',
  categoryId: String(stream.category_id || ''),
  containerExtension: String(stream.container_extension || 'mp4').toLowerCase(),
  added: stream.added || '',
  year: normalizeYear(stream.year || stream.releaseDate || stream.releasedate || ''),
  yearText: String(stream.year || stream.releaseDate || stream.releasedate || ''),
  rating: stream.rating || (stream.rating_5based ? String(Number(stream.rating_5based) * 2) : ''),
  imdbData: {
    plot: stream.plot || stream.description || '',
    genre: stream.genre || '',
    year: stream.year || stream.releaseDate || '',
  },
  tmdbId: stream.tmdb || stream.tmdb_id || '',
  contentType: CONTENT_TYPES.MOVIE,
});

const normalizeLive = (stream) => ({
  id: stream.stream_id || stream.num,
  streamId: stream.stream_id || stream.num,
  title: stream.name || 'Untitled',
  originalTitle: stream.epg_channel_id || '',
  cleanTitle: cleanMovieTitle(stream.name || 'Untitled'),
  poster: stream.stream_icon || stream.cover || '',
  categoryId: String(stream.category_id || ''),
  containerExtension: parseLiveExtension(stream.stream_type),
  added: stream.added || '',
  year: null,
  rating: '',
  contentType: CONTENT_TYPES.LIVE,
});

const normalizeSeries = (series) => ({
  id: series.series_id,
  streamId: series.series_id,
  title: series.name || 'Untitled',
  originalTitle: series.original_name || series.o_name || '',
  cleanTitle: cleanMovieTitle(series.name || 'Untitled'),
  poster: series.cover || series.stream_icon || '',
  categoryId: String(series.category_id || ''),
  containerExtension: String(series.container_extension || 'mp4').toLowerCase(),
  added: series.last_modified || series.releaseDate || '',
  year: normalizeYear(series.year || series.releaseDate || series.last_modified || ''),
  yearText: String(series.year || series.releaseDate || series.last_modified || ''),
  rating: series.rating || '',
  imdbRating: series.rating || null,
  imdbData: {
    plot: series.plot || series.description || '',
    genre: series.genre || '',
    year: series.year || '',
  },
  tmdbId: series.tmdb || series.tmdb_id || '',
  contentType: CONTENT_TYPES.SERIES,
});

export const useMovies = () => {
  const [contentMap, setContentMap] = useState({
    movie: [],
    live: [],
    series: [],
  });
  const [categories, setCategories] = useState({
    movie: [],
    live: [],
    series: [],
  });
  const [loadedTypes, setLoadedTypes] = useState({
    movie: false,
    live: false,
    series: false,
  });
  const [loadingTypes, setLoadingTypes] = useState({
    movie: false,
    live: false,
    series: false,
  });

  const [activeContentType, setActiveContentType] = useState(CONTENT_TYPES.MOVIE);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingRange, setRatingRange] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [watchedFilter, setWatchedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const [watchedVersion, setWatchedVersion] = useState(0);
  const inFlightRef = useRef({
    movie: false,
    live: false,
    series: false,
  });
  const tmdbInFlightRef = useRef({
    movie: false,
    series: false,
  });

  const enrichWithTmdb = useCallback(async (type, items) => {
    if (!tmdbService.isConfigured()) return;
    if (type !== CONTENT_TYPES.MOVIE && type !== CONTENT_TYPES.SERIES) return;
    if (tmdbInFlightRef.current[type]) return;
    tmdbInFlightRef.current[type] = true;

    try {
      // Change this line in useMovies.js
      const targets = items.filter((item) => item.tmdbId).slice(0, 50); // 1200 çoktu 50'ye çektim ekrandaki sayı artırılırsa yükseltilebilir.
      if (!targets.length) return;

      const updates = new Map();
      const concurrency = 6;
      for (let i = 0; i < targets.length; i += concurrency) {
        const chunk = targets.slice(i, i + concurrency);
        const results = await Promise.all(
          chunk.map(async (item) => {
            const meta = await tmdbService.fetchMetadata(item.tmdbId, type);
            return { item, meta };
          })
        );
        results.forEach(({ item, meta }) => {
          if (!meta) return;
          updates.set(item.streamId, {
            originalTitle: meta.originalTitle || meta.originalName || item.originalTitle || '',
            year: normalizeYear(meta.year) || item.year || null,
            yearText: meta.year || item.yearText || '',
          });
        });
      }

      if (updates.size > 0) {
        setContentMap((prev) => ({
          ...prev,
          [type]: (prev[type] || []).map((item) => {
            const patch = updates.get(item.streamId);
            return patch ? { ...item, ...patch } : item;
          }),
        }));
      }
    } finally {
      tmdbInFlightRef.current[type] = false;
    }
  }, []);

  const fetchType = useCallback(async (type) => {
    if (inFlightRef.current[type]) return;
    inFlightRef.current[type] = true;
    setLoadingTypes((prev) => ({ ...prev, [type]: true }));
    setError(null);
    try {
      if (type === CONTENT_TYPES.MOVIE) {
        const [streams, cats] = await Promise.all([xtreamApi.getVodStreams(), xtreamApi.getVodCategories()]);
        const mapped = streams.map(normalizeMovie);
        setContentMap((prev) => ({ ...prev, movie: mapped }));
        setCategories((prev) => ({ ...prev, movie: Array.isArray(cats) ? cats : [] }));
        enrichWithTmdb(CONTENT_TYPES.MOVIE, mapped);
      } else if (type === CONTENT_TYPES.LIVE) {
        const [streams, cats] = await Promise.all([xtreamApi.getLiveStreams(), xtreamApi.getLiveCategories()]);
        setContentMap((prev) => ({ ...prev, live: streams.map(normalizeLive) }));
        setCategories((prev) => ({ ...prev, live: Array.isArray(cats) ? cats : [] }));
      } else if (type === CONTENT_TYPES.SERIES) {
        const [streams, cats] = await Promise.all([xtreamApi.getSeries(), xtreamApi.getSeriesCategories()]);
        const mapped = streams.map(normalizeSeries);
        setContentMap((prev) => ({ ...prev, series: mapped }));
        setCategories((prev) => ({ ...prev, series: Array.isArray(cats) ? cats : [] }));
        enrichWithTmdb(CONTENT_TYPES.SERIES, mapped);
      }
      setLoadedTypes((prev) => ({ ...prev, [type]: true }));
    } catch (fetchError) {
      console.error(`Error fetching ${type}:`, fetchError);
      setError(fetchError.message || `Failed to fetch ${type} content`);
    } finally {
      inFlightRef.current[type] = false;
      setLoadingTypes((prev) => ({ ...prev, [type]: false }));
    }
  }, [enrichWithTmdb]);

  useEffect(() => {
    fetchType(CONTENT_TYPES.MOVIE);
    // Background prefetch for quicker tab switches.
    setTimeout(() => fetchType(CONTENT_TYPES.LIVE), 100);
    setTimeout(() => fetchType(CONTENT_TYPES.SERIES), 200);
  }, [fetchType]);

  useEffect(() => {
    if (!loadedTypes[activeContentType]) {
      fetchType(activeContentType);
    }
  }, [activeContentType, loadedTypes, fetchType]);

  useEffect(() => {
    const onStorage = () => setWatchedVersion((v) => v + 1);
    window.addEventListener('storage', onStorage);
    window.addEventListener('watched-changed', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('watched-changed', onStorage);
    };
  }, []);

  useEffect(() => {
    setSelectedCategory('all');
    setCurrentPage(1);
    setSortBy('default');
  }, [activeContentType]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchTerm, ratingRange, yearFilter, watchedFilter, sortBy, pageSize]);

  const activeItems = contentMap[activeContentType] || [];
  const watchedMap = useMemo(
    () => storageService.getWatchedMap(activeContentType),
    [activeContentType, activeItems.length, watchedVersion]
  );

  const filteredAndSortedItems = useMemo(() => {
    let result = [...activeItems];

    if (selectedCategory !== 'all') {
      result = result.filter((item) => String(item.categoryId) === String(selectedCategory));
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((item) => {
        const values = [item.title, item.originalTitle, item.cleanTitle].map((v) => (v || '').toLowerCase());
        return values.some((v) => v.includes(term));
      });
    }

    if (ratingRange !== 'all') {
      const [min, max] = ratingRange.split('-').map(Number);
      result = result.filter((item) => {
        const rating = parseRating(item.imdbRating || item.rating);
        if (rating === null) return false;
        return rating >= min && rating < max;
      });
    }

    if (yearFilter !== 'all') {
      const [start, end] = yearFilter.split('-').map(Number);
      result = result.filter((item) => item.year && item.year >= start && item.year <= end);
    }

    if (watchedFilter !== 'all') {
      result = result.filter((item) => {
        const watched = watchedMap.get(`${item.contentType}_${item.streamId}`) === true;
        return watchedFilter === 'watched' ? watched : !watched;
      });
    }

    switch (sortBy) {
      case 'rating_desc':
        result.sort((a, b) => (parseRating(b.imdbRating || b.rating) || 0) - (parseRating(a.imdbRating || a.rating) || 0));
        break;
      case 'rating_asc':
        result.sort((a, b) => (parseRating(a.imdbRating || a.rating) || 0) - (parseRating(b.imdbRating || b.rating) || 0));
        break;
      case 'title_asc':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title_desc':
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'year_asc':
        result.sort((a, b) => (a.year || 0) - (b.year || 0));
        break;
      case 'year_desc':
        result.sort((a, b) => (b.year || 0) - (a.year || 0));
        break;
      default:
        break;
    }

    return result;
  }, [activeItems, selectedCategory, searchTerm, ratingRange, yearFilter, watchedFilter, sortBy, watchedMap]);

  const totalItems = filteredAndSortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedItems = filteredAndSortedItems.slice((safePage - 1) * pageSize, safePage * pageSize);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  const allContent = useMemo(
    () => [...(contentMap.movie || []), ...(contentMap.live || []), ...(contentMap.series || [])],
    [contentMap]
  );

  const refreshMovies = async () => {
    await fetchType(activeContentType);
  };

  return {
    movies: paginatedItems,
    filteredCount: totalItems,
    allMovies: allContent,
    isLoading: loadingTypes[activeContentType] || !loadedTypes[activeContentType],
    error,
    searchTerm,
    setSearchTerm,
    minRating: 0,
    setMinRating: () => {},
    sortBy,
    setSortBy,
    activeContentType,
    setActiveContentType,
    selectedCategory,
    setSelectedCategory,
    categories,
    refreshMovies,
    ratingRange,
    setRatingRange,
    yearFilter,
    setYearFilter,
    watchedFilter,
    setWatchedFilter,
    pageSize,
    setPageSize,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    currentPage: safePage,
    setCurrentPage,
    totalPages,
    pageNumbers,
  };
};
