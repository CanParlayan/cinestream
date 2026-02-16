/**
 * FilterControls Component
 * Advanced filters for rating/year/watched and sorting.
 */

const FilterControls = ({
  ratingRange,
  setRatingRange,
  yearFilter,
  setYearFilter,
  watchedFilter,
  setWatchedFilter,
  sortBy,
  setSortBy,
}) => {
  const ratingOptions = [
    { value: 'all', label: 'All Ratings' },
    { value: '5-6', label: '5-6' },
    { value: '6-7', label: '6-7' },
    { value: '7-8', label: '7-8' },
    { value: '8-9', label: '8-9' },
    { value: '9-10', label: '9-10' },
  ];

  const yearOptions = [
    { value: 'all', label: 'All Years' },
    { value: '1960-1979', label: '1960-1979' },
    { value: '1980-1989', label: '1980-1989' },
    { value: '1990-1999', label: '1990-1999' },
    { value: '2000-2009', label: '2000-2009' },
    { value: '2010-2019', label: '2010-2019' },
    { value: '2020-2030', label: '2020-2030' },
  ];

  const watchedOptions = [
    { value: 'all', label: 'All' },
    { value: 'unwatched', label: 'Unwatched' },
    { value: 'watched', label: 'Watched' },
  ];

  const sortOptions = [
    { value: 'default', label: 'Default' },
    { value: 'rating_desc', label: 'Rating (High-Low)' },
    { value: 'rating_asc', label: 'Rating (Low-High)' },
    { value: 'title_asc', label: 'Title (A-Z)' },
    { value: 'title_desc', label: 'Title (Z-A)' },
    { value: 'year_desc', label: 'Year (New-Old)' },
    { value: 'year_asc', label: 'Year (Old-New)' },
  ];

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <select
        value={ratingRange}
        onChange={(e) => setRatingRange(e.target.value)}
        className="px-3 py-2 bg-cinema-card border border-white/10 rounded-lg text-white text-sm"
      >
        {ratingOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        value={yearFilter}
        onChange={(e) => setYearFilter(e.target.value)}
        className="px-3 py-2 bg-cinema-card border border-white/10 rounded-lg text-white text-sm"
      >
        {yearOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        value={watchedFilter}
        onChange={(e) => setWatchedFilter(e.target.value)}
        className="px-3 py-2 bg-cinema-card border border-white/10 rounded-lg text-white text-sm"
      >
        {watchedOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="px-3 py-2 bg-cinema-card border border-white/10 rounded-lg text-white text-sm"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FilterControls;
