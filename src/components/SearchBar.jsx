/**
 * SearchBar Component
 * Search input with icon and clear button
 */

import { useState, useEffect } from 'react';
import { debounce } from '../utils/helpers';

const SearchBar = ({ value, onChange, placeholder = 'Search movies...' }) => {
  const [inputValue, setInputValue] = useState(value);

  // Debounced onChange to avoid excessive calls
  useEffect(() => {
    const debouncedOnChange = debounce((val) => {
      onChange(val);
    }, 300);

    debouncedOnChange(inputValue);
  }, [inputValue, onChange]);

  const handleClear = () => {
    setInputValue('');
    onChange('');
  };

  return (
    <div className="relative w-full max-w-md">
      {/* Search Icon */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg
          className="w-5 h-5 text-white/40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Input Field */}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-12 pr-12 py-3 bg-cinema-card border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cinema-accent focus:ring-2 focus:ring-cinema-accent/20 transition-all duration-300"
      />

      {/* Clear Button */}
      {inputValue && (
        <button
          onClick={handleClear}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors duration-200"
          aria-label="Clear search"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SearchBar;
