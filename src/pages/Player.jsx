/**
 * Player Page
 * Supports movie, live and series playback.
 */

import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { xtreamApi } from '../services/xtreamApi';
import { storageService } from '../services/storageService';
import VideoPlayer from '../components/VideoPlayer';
import LoadingSpinner from '../components/LoadingSpinner';

const normalizeEpisodes = (rawEpisodes = {}) => {
  const seasons = Object.entries(rawEpisodes);
  const flattened = [];

  seasons.forEach(([season, items]) => {
    if (!Array.isArray(items)) return;
    items.forEach((episode) => {
      flattened.push({
        season,
        id: episode.id || episode.stream_id || episode.episode_id,
        title: episode.title || episode.name || `S${season} Episode`,
        containerExtension: (episode.container_extension || 'mp4').toLowerCase(),
      });
    });
  });

  return flattened;
};

const Player = () => {
  const { streamId, contentType: routeType } = useParams();
  const contentType = routeType || 'movie';
  const navigate = useNavigate();
  const location = useLocation();

  const [item, setItem] = useState(location.state?.item || null);
  const [isLoading, setIsLoading] = useState(!location.state?.item);
  const [seriesEpisodes, setSeriesEpisodes] = useState([]);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState(null);
  const [movieDetails, setMovieDetails] = useState(null);
  const [seriesDetails, setSeriesDetails] = useState(null);
  const [watched, setWatched] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadItem = async () => {
      if (location.state?.item) {
        const stateItem = location.state.item;
        setItem({
          ...stateItem,
          streamId: stateItem.streamId || Number(streamId),
          contentType: stateItem.contentType || contentType,
        });
        if (contentType === 'series' && stateItem.episodeId) {
          setSelectedEpisodeId(stateItem.episodeId);
        }
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        if (contentType === 'movie') {
          const vod = await xtreamApi.getVodStreams();
          const found = vod.find((s) => Number(s.stream_id || s.num) === Number(streamId));
          if (!cancelled && found) {
            setItem({
              streamId: found.stream_id || found.num,
              title: found.name || 'Untitled',
              poster: found.stream_icon || found.cover || '',
              containerExtension: (found.container_extension || 'mp4').toLowerCase(),
              contentType: 'movie',
            });
          }
        } else if (contentType === 'live') {
          const live = await xtreamApi.getLiveStreams();
          const found = live.find((s) => Number(s.stream_id || s.num) === Number(streamId));
          if (!cancelled && found) {
            setItem({
              streamId: found.stream_id || found.num,
              title: found.name || 'Untitled',
              poster: found.stream_icon || found.cover || '',
              containerExtension: 'm3u8',
              contentType: 'live',
            });
          }
        } else if (contentType === 'series') {
          const series = await xtreamApi.getSeries();
          const found = series.find((s) => Number(s.series_id) === Number(streamId));
          if (!cancelled && found) {
            setItem({
              streamId: found.series_id,
              title: found.name || 'Untitled',
              poster: found.cover || '',
              containerExtension: 'mp4',
              contentType: 'series',
            });
          }
        }
      } catch (error) {
        console.error('Error loading player item:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadItem();
    return () => {
      cancelled = true;
    };
  }, [location.state?.item, streamId, contentType]);

  useEffect(() => {
    let cancelled = false;

    const loadVodInfo = async () => {
      if (contentType !== 'movie' || !item?.streamId) return;
      try {
        const data = await xtreamApi.getVodInfo(item.streamId);
        if (!cancelled) {
          setMovieDetails(data || null);
        }
      } catch (error) {
        console.error('Error loading VOD info:', error);
      }
    };

    loadVodInfo();
    return () => {
      cancelled = true;
    };
  }, [contentType, item?.streamId]);

  useEffect(() => {
    let cancelled = false;

    const loadSeriesInfo = async () => {
      if (contentType !== 'series' || !item?.streamId) return;
      try {
        const data = await xtreamApi.getSeriesInfo(item.streamId);
        const episodes = normalizeEpisodes(data?.episodes);
        if (!cancelled) {
          setSeriesDetails(data || null);
          setSeriesEpisodes(episodes);
          if (!selectedEpisodeId && episodes.length > 0) {
            const saved = storageService.getProgress(item.streamId, 'series');
            const savedEpisodeId = saved?.movieData?.episodeId;
            const foundSavedEpisode = episodes.find((ep) => String(ep.id) === String(savedEpisodeId));
            setSelectedEpisodeId(foundSavedEpisode ? foundSavedEpisode.id : episodes[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading series episodes:', error);
      }
    };

    loadSeriesInfo();
    return () => {
      cancelled = true;
    };
  }, [contentType, item?.streamId, selectedEpisodeId]);

  const selectedEpisode = useMemo(
    () => seriesEpisodes.find((ep) => String(ep.id) === String(selectedEpisodeId)) || null,
    [seriesEpisodes, selectedEpisodeId]
  );

  useEffect(() => {
    if (!item?.streamId) return;
    setWatched(storageService.isWatched(item.streamId, contentType));
  }, [item?.streamId, contentType]);

  const resolvedMovieInfo = useMemo(() => {
    const info = movieDetails?.info || {};
    const movieData = movieDetails?.movie_data || {};
    return {
      rating: info.rating || movieData.rating || item?.imdbRating || item?.rating || '',
      genre: info.genre || movieData.genre || item?.imdbData?.genre || '',
      plot: info.plot || info.description || movieData.plot || item?.imdbData?.plot || '',
      runtime: info.duration || info.duration_secs || movieData.duration || '',
      year: info.releasedate || movieData.year || item?.imdbData?.year || '',
      director: info.director || movieData.director || '',
      cast: info.cast || movieData.cast || '',
    };
  }, [movieDetails, item]);
  const resolvedYear = useMemo(() => {
    const match = String(resolvedMovieInfo.year || '').match(/(19|20)\d{2}/);
    return match ? match[0] : resolvedMovieInfo.year;
  }, [resolvedMovieInfo.year]);

  const playerMovieData = useMemo(() => {
    if (!item) return null;
    if (contentType === 'series') {
      return {
        title: selectedEpisode ? `${item.title} - ${selectedEpisode.title}` : item.title,
        poster: item.poster,
        contentType: 'series',
        containerExtension: selectedEpisode?.containerExtension || 'mp4',
        episodeId: selectedEpisode?.id || null,
      };
    }

    return {
      title: item.title,
      poster: item.poster,
      contentType: contentType,
      containerExtension: item.containerExtension,
    };
  }, [item, contentType, selectedEpisode]);

  const handleBack = () => navigate('/');
  const toggleWatched = () => {
    if (!item?.streamId) return;
    const next = !watched;
    setWatched(next);
    storageService.setWatched(item.streamId, contentType, next);
  };

  if (isLoading || !item || (contentType === 'series' && !selectedEpisode && seriesEpisodes.length === 0)) {
    return (
      <div className="min-h-screen bg-cinema-dark flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" message="Loading stream..." />
          <button onClick={handleBack} className="mt-6 cinema-button">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const displayTitle = contentType === 'series' && selectedEpisode ? `${item.title} - ${selectedEpisode.title}` : item.title;

  return (
    <div className="min-h-screen bg-cinema-darker flex flex-col">
      <header className="bg-cinema-dark/80 backdrop-blur-lg border-b border-white/10 px-4 py-3">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white hover:text-cinema-accent transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Back</span>
          </button>

          <h1 className="text-lg md:text-xl font-semibold text-white line-clamp-1 mx-4">{displayTitle}</h1>

          <div className="w-20" />
        </div>
      </header>

      {contentType === 'series' && seriesEpisodes.length > 0 && (
        <div className="bg-cinema-dark px-4 py-3 border-b border-white/10">
          <div className="container mx-auto flex items-center gap-3">
            <span className="text-sm text-white/70">Episode</span>
            <select
              value={selectedEpisodeId || ''}
              onChange={(e) => setSelectedEpisodeId(e.target.value)}
              className="px-3 py-2 bg-cinema-card border border-white/10 rounded-lg text-sm text-white"
            >
              {seriesEpisodes.map((ep) => (
                <option key={ep.id} value={ep.id}>
                  S{ep.season} - {ep.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="w-full h-full max-h-[calc(100vh-60px)]">
          <VideoPlayer streamId={String(streamId)} movieData={playerMovieData} />
        </div>
      </div>

      <div className="bg-cinema-dark border-t border-white/10 px-4 py-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row gap-6">
            {item.poster && (
              <div className="w-24 h-36 rounded-lg overflow-hidden flex-shrink-0 hidden md:block">
                <img src={item.poster} alt={item.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-2">{displayTitle}</h2>
              {(contentType === 'movie' || contentType === 'series') && (
                <button
                  onClick={toggleWatched}
                    className={`mb-3 px-3 py-1.5 rounded text-sm border ${
                    watched
                      ? 'bg-green-600/90 border-green-500 text-white'
                      : 'bg-white/5 border-white/20 text-white/80'
                  }`}
                >
                  {watched ? 'Watched' : 'Mark as Watched'}
                </button>
              )}
              {contentType === 'movie' && (
                <div className="space-y-2 text-sm">
                  {resolvedMovieInfo.rating && (
                    <p className="text-white/90">Rating: {resolvedMovieInfo.rating}</p>
                  )}
                  {resolvedMovieInfo.genre && (
                    <p className="text-white/80">
                      <span className="text-white/50">Genre:</span> {resolvedMovieInfo.genre}
                    </p>
                  )}
                  {resolvedMovieInfo.runtime && (
                    <p className="text-white/80">
                      <span className="text-white/50">Runtime:</span> {resolvedMovieInfo.runtime}
                    </p>
                  )}
                  {resolvedYear && (
                    <p className="text-white/80">
                      <span className="text-white/50">Year:</span> {resolvedYear}
                    </p>
                  )}
                  {resolvedMovieInfo.director && (
                    <p className="text-white/80 line-clamp-1">
                      <span className="text-white/50">Director:</span> {resolvedMovieInfo.director}
                    </p>
                  )}
                  {resolvedMovieInfo.cast && (
                    <p className="text-white/80 line-clamp-1">
                      <span className="text-white/50">Cast:</span> {resolvedMovieInfo.cast}
                    </p>
                  )}
                  {resolvedMovieInfo.plot && (
                    <p className="text-white/70 mt-2 line-clamp-3">{resolvedMovieInfo.plot}</p>
                  )}
                </div>
              )}
              {contentType === 'series' && (
                <div className="space-y-2 text-sm">
                  {(seriesDetails?.info?.genre || seriesDetails?.info?.plot || seriesDetails?.info?.rating) ? (
                    <>
                      {seriesDetails?.info?.rating && (
                        <p className="text-white/90">Rating: {seriesDetails.info.rating}</p>
                      )}
                      {seriesDetails?.info?.genre && (
                        <p className="text-white/80">
                          <span className="text-white/50">Genre:</span> {seriesDetails.info.genre}
                        </p>
                      )}
                      {seriesDetails?.info?.plot && (
                        <p className="text-white/70 mt-2 line-clamp-3">{seriesDetails.info.plot}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-white/70 text-sm uppercase">{contentType}</p>
                  )}
                </div>
              )}
              {contentType === 'live' && <p className="text-white/70 text-sm uppercase">{contentType}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;
