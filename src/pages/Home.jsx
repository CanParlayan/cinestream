/**
 * Home Page
 * Unified browsing page with tabs, advanced filters, pagination and VidSrc history.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMovies } from '../hooks/useMovies';
import { storageService } from '../services/storageService';
import MovieGrid from '../components/MovieGrid';
import SearchBar from '../components/SearchBar';
import FilterControls from '../components/FilterControls';
import ContinueWatching from '../components/ContinueWatching';

const CONTENT_LABELS = {
  movie: 'Movies',
  live: 'Live TV',
  series: 'Series',
};

const Home = ({ onLogout, userInfo }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    movies,
    filteredCount,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    activeContentType,
    setActiveContentType,
    selectedCategory,
    setSelectedCategory,
    categories,
    ratingRange,
    setRatingRange,
    yearFilter,
    setYearFilter,
    watchedFilter,
    setWatchedFilter,
    pageSize,
    setPageSize,
    pageSizeOptions,
    currentPage,
    setCurrentPage,
    totalPages,
    pageNumbers,
  } = useMovies();

  const [vidsrcInput, setVidsrcInput] = useState('');
  const [activeImdbId, setActiveImdbId] = useState('');
  const vidsrcSessionSavedRef = useRef(false);

  const activeCategories = useMemo(() => {
    const list = categories[activeContentType] || [];
    return list.map((cat) => ({
      id: String(cat.category_id || cat.id || ''),
      name: cat.category_name || cat.name || 'Unknown',
    }));
  }, [categories, activeContentType]);

  const saveVidsrcHistory = (imdbId) => {
    if (!imdbId) return;
    storageService.saveProgress(imdbId, 1, 100, {
      title: `VidSrc ${imdbId}`,
      poster: '',
      containerExtension: 'embed',
      contentType: 'vidsrc',
      imdbId,
    });
    vidsrcSessionSavedRef.current = true;
  };

  const openVidsrc = (rawImdb) => {
    const cleaned = String(rawImdb || '').trim().toLowerCase();
    if (!cleaned) return;
    const imdb = cleaned.startsWith('tt') ? cleaned : `tt${cleaned}`;
    vidsrcSessionSavedRef.current = false;
    setActiveImdbId(imdb);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('vidsrc', imdb);
      return next;
    });
  };

  useEffect(() => {
    const fromQuery = searchParams.get('vidsrc');
    if (fromQuery) {
      openVidsrc(fromQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeImdbId) return;
    const timer = setTimeout(() => {
      if (!vidsrcSessionSavedRef.current) {
        saveVidsrcHistory(activeImdbId);
      }
    }, 5000);
    return () => {
      clearTimeout(timer);
      if (!vidsrcSessionSavedRef.current) {
        saveVidsrcHistory(activeImdbId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeImdbId]);

  const handleVidsrcSubmit = (e) => {
    e.preventDefault();
    openVidsrc(vidsrcInput);
  };

  const closeVidsrc = () => {
    saveVidsrcHistory(activeImdbId);
    setActiveImdbId('');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('vidsrc');
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-cinema-darker">
      <header className="sticky top-0 z-50 bg-cinema-dark/80 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl md:text-3xl font-display gradient-text">CINESTREAM</h1>

            <form onSubmit={handleVidsrcSubmit} className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="text"
                value={vidsrcInput}
                onChange={(e) => setVidsrcInput(e.target.value)}
                placeholder="IMDb ID (tt...)"
                className="w-full md:w-56 px-3 py-2 bg-cinema-card border border-white/10 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:border-cinema-accent"
              />
              <button type="submit" className="px-3 py-2 text-sm bg-cinema-accent rounded-lg text-white">
                VidSrc
              </button>
            </form>

            <div className="flex items-center gap-4">
              {userInfo && (
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-white">{userInfo.username}</p>
                  <p className="text-xs text-white/50">{userInfo.status === 'Active' ? 'Active' : 'Inactive'}</p>
                </div>
              )}
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm font-medium transition-all duration-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <ContinueWatching />

        {activeImdbId && (
          <section className="mb-8 rounded-xl overflow-hidden border border-white/10 bg-black">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <p className="text-sm text-white/80">
                VidSrc IMDb: {activeImdbId}
              </p>
              <button onClick={closeVidsrc} className="text-xs text-white/60 hover:text-white">
                Close
              </button>
            </div>
            <div className="w-full h-[420px] md:h-[560px]">
              <iframe
                src={`https://vidsrcme.ru/embed/movie?imdb=${activeImdbId}`}
                style={{ width: '100%', height: '100%' }}
                frameBorder="0"
                referrerPolicy="origin"
                allowFullScreen
                title="VidSrc Player"
              />
            </div>
          </section>
        )}

        <div className="mb-6 flex flex-wrap gap-2">
          {Object.keys(CONTENT_LABELS).map((type) => (
            <button
              key={type}
              onClick={() => setActiveContentType(type)}
              className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                activeContentType === type
                  ? 'bg-cinema-accent border-cinema-accent text-white'
                  : 'bg-cinema-card border-white/10 text-white/80 hover:text-white'
              }`}
            >
              {CONTENT_LABELS[type]}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder={`Search ${CONTENT_LABELS[activeContentType].toLowerCase()} (local/original title)...`}
            />
            <FilterControls
              ratingRange={ratingRange}
              setRatingRange={setRatingRange}
              yearFilter={yearFilter}
              setYearFilter={setYearFilter}
              watchedFilter={watchedFilter}
              setWatchedFilter={setWatchedFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-white/60">Category</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-cinema-card border border-white/10 rounded-lg text-sm text-white"
            >
              <option value="all">All Categories</option>
              {activeCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <span className="ml-2 text-sm text-white/60">Per page</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-3 py-2 bg-cinema-card border border-white/10 rounded-lg text-sm text-white"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!isLoading && (
          <div className="mb-4">
            <p className="text-white/60 text-sm">
              {filteredCount} items found in {CONTENT_LABELS[activeContentType]}
              {searchTerm && ` for "${searchTerm}"`}
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <MovieGrid movies={movies} isLoading={isLoading} showProgress={activeContentType !== 'live'} />

        {!isLoading && totalPages > 1 && (
          <div className="mt-8 flex flex-wrap items-center gap-2">
            {pageNumbers.map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 rounded border text-sm ${
                  page === currentPage
                    ? 'bg-cinema-accent border-cinema-accent text-white'
                    : 'bg-cinema-card border-white/10 text-white/80 hover:text-white'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 mt-16">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-white/40 text-sm">CineStream © 2026 - Premium IPTV Player</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
