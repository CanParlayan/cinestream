/**
 * ContinueWatching Component
 * Split sections for Movies and Series.
 */

import { Link } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { getPlaceholderImage, getRelativeTime } from '../utils/helpers';

const Card = ({ item }) => {
  const isVidSrc = (item.contentType || 'movie') === 'vidsrc';
  const href = isVidSrc
    ? `/?vidsrc=${item.movieData?.imdbId || item.streamId}`
    : `/player/${item.contentType || 'movie'}/${item.streamId}`;

  return (
    <Link
      key={`${item.contentType}_${item.streamId}`}
      to={href}
      state={
        isVidSrc
          ? undefined
          : {
              item: {
                streamId: item.streamId,
                contentType: item.contentType,
                title: item.movieData?.title || 'Untitled',
                poster: item.movieData?.poster || '',
                containerExtension: item.movieData?.containerExtension || 'mp4',
                episodeId: item.movieData?.episodeId || null,
              },
            }
      }
      className="group relative flex-shrink-0 w-44 md:w-52 overflow-hidden rounded-xl bg-cinema-card hover-lift"
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={item.movieData?.poster || getPlaceholderImage()}
          alt={item.movieData?.title || 'Untitled'}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            e.target.src = getPlaceholderImage();
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
          <div className="progress-bar mb-2">
            <div className="progress-fill" style={{ width: `${item.percentage}%` }} />
          </div>
          <p className="text-xs text-white/80">{Math.round(item.percentage)}% complete</p>
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-sm font-semibold text-white line-clamp-2 mb-1">{item.movieData?.title || 'Untitled'}</h3>
        <p className="text-xs text-white/50">{getRelativeTime(item.lastWatched)}</p>
      </div>
    </Link>
  );
};

const Section = ({ title, items, onClear }) => {
  if (!items.length) return null;
  return (
    <section className="mb-8 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-display text-white">{title}</h2>
        <button onClick={onClear} className="text-xs text-white/60 hover:text-cinema-accent">
          Clear
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
        {items.map((item) => (
          <Card key={`${item.contentType}_${item.streamId}`} item={item} />
        ))}
      </div>
    </section>
  );
};

const ContinueWatching = () => {
  const progressItems = storageService.getAllProgress(40);
  const movies = progressItems.filter((p) => (p.contentType || 'movie') === 'movie').slice(0, 12);
  const series = progressItems.filter((p) => (p.contentType || 'movie') === 'series').slice(0, 12);
  const vidsrc = progressItems.filter((p) => (p.contentType || 'movie') === 'vidsrc').slice(0, 12);

  if (!movies.length && !series.length && !vidsrc.length) return null;

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => storageService.clearAllProgress()}
          className="text-sm text-white/60 hover:text-cinema-accent transition-colors duration-200"
        >
          Clear Continue Watching
        </button>
      </div>
      <Section
        title="Continue Watching - Movies"
        items={movies}
        onClear={() => storageService.clearProgressByType('movie')}
      />
      <Section
        title="Continue Watching - Series"
        items={series}
        onClear={() => storageService.clearProgressByType('series')}
      />
      <Section
        title="Continue Watching - VidSrc"
        items={vidsrc}
        onClear={() => storageService.clearProgressByType('vidsrc')}
      />
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
};

export default ContinueWatching;
