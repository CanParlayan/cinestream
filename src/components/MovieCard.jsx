/**
 * MovieCard Component
 * Displays a movie card with poster, title, IMDb rating, and watch progress
 */

import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { storageService } from '../services/storageService';
import { getPlaceholderImage, getRatingColor, parseRating } from '../utils/helpers';

const MovieCard = ({ movie, showProgress = false }) => {
  const progress = showProgress && movie.contentType === 'movie'
    ? storageService.getProgress(movie.streamId, movie.contentType)
    : null;
  const posterUrl = movie.poster || getPlaceholderImage();
  const rating = parseRating(movie.imdbRating || movie.rating);
  const contentType = movie.contentType || 'movie';
  const [watched, setWatched] = useState(storageService.isWatched(movie.streamId, contentType));
  const yearMatch = String(movie.yearText || movie.year || '').match(/(19|20)\d{2}/);
  const displayYear = yearMatch ? yearMatch[0] : (movie.year ? String(movie.year) : '');
  const originalLine = [movie.originalTitle || '', displayYear ? `(${displayYear})` : ''].join(' ').trim();

  useEffect(() => {
    setWatched(storageService.isWatched(movie.streamId, contentType));
  }, [movie.streamId, contentType]);

  const toggleWatched = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !watched;
    setWatched(next);
    storageService.setWatched(movie.streamId, contentType, next);
  };

  return (
    <Link
      to={`/player/${contentType}/${movie.streamId}`}
      state={{ item: movie }}
      className="group relative block overflow-hidden rounded-xl bg-cinema-card hover-lift animate-fade-in"
    >
      {/* Poster Image */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            e.target.src = getPlaceholderImage();
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* IMDb Rating Badge */}
        {(contentType === 'movie' || contentType === 'series') && rating && (
          <div className="rating-badge">
            <svg
              className="w-4 h-4 text-cinema-gold"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className={getRatingColor(rating)}>{movie.imdbRating}</span>
          </div>
        )}

        {(contentType === 'movie' || contentType === 'series') && (
          <button
            onClick={toggleWatched}
            className={`absolute z-20 top-2 left-2 px-2 py-1 rounded text-xs border ${
              watched
                ? 'bg-green-600/90 border-green-500 text-white'
                : 'bg-black/60 border-white/20 text-white/80'
            }`}
          >
            {watched ? 'Watched' : 'Mark Watched'}
          </button>
        )}

        {/* Watch Progress Bar */}
        {contentType === 'movie' && progress && progress.percentage > 0 && (
          <div className="watch-progress">
            <div
              className="watch-progress-fill transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        )}
      </div>

      {/* Movie Title */}
      <div className="p-4">
        <h3 className="text-white font-semibold text-sm md:text-base line-clamp-2 group-hover:text-cinema-accent transition-colors duration-300">
          {movie.title}
        </h3>
        {originalLine && originalLine.toLowerCase() !== movie.title.toLowerCase() && (
          <p className="text-xs text-white/55 mt-1 line-clamp-1">{originalLine}</p>
        )}
        
        {/* Resume Indicator */}
        {contentType === 'movie' && progress && progress.percentage > 0 && (
          <p className="text-xs text-cinema-accent mt-1 font-medium">
            {Math.round(progress.percentage)}% watched
          </p>
        )}
      </div>

      {/* Hover Overlay - Play Icon */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="w-16 h-16 rounded-full bg-cinema-accent/90 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300">
          <svg
            className="w-8 h-8 text-white ml-1"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
        </div>
      </div>
    </Link>
  );
};

export default MovieCard;
