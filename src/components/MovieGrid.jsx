/**
 * MovieGrid Component
 * Displays movies in a responsive grid layout
 */

import MovieCard from './MovieCard';
import LoadingSpinner from './LoadingSpinner';

const MovieGrid = ({ movies, isLoading, showProgress = false }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" message="Loading movies..." />
      </div>
    );
  }

  if (!movies || movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <svg
          className="w-24 h-24 text-white/20 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
          />
        </svg>
        <h3 className="text-xl font-semibold text-white mb-2">No movies found</h3>
        <p className="text-white/60">Try adjusting your filters or search term</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
      {movies.map((movie, index) => (
        <div
          key={`${movie.contentType || 'movie'}_${movie.streamId}`}
          style={{
            animationDelay: `${index * 0.05}s`,
          }}
        >
          <MovieCard movie={movie} showProgress={showProgress} />
        </div>
      ))}
    </div>
  );
};

export default MovieGrid;
