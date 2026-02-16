/**
 * Utility Helper Functions
 */

/**
 * Format time in seconds to HH:MM:SS or MM:SS
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted time string
 */
export const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Debounce function to limit how often a function is called
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, delay = 300) => {
  let timeoutId;
  
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

/**
 * Throttle function to limit execution rate
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} - Throttled function
 */
export const throttle = (func, limit = 1000) => {
  let inThrottle;
  
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Get a placeholder image URL
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {string} - Placeholder image URL
 */
export const getPlaceholderImage = (width = 300, height = 450) => {
  const safeWidth = Number.isFinite(width) ? width : 300;
  const safeHeight = Number.isFinite(height) ? height : 450;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${safeWidth}' height='${safeHeight}' viewBox='0 0 ${safeWidth} ${safeHeight}'><rect width='100%' height='100%' fill='%2314141f'/><rect x='8' y='8' width='${Math.max(safeWidth - 16, 1)}' height='${Math.max(safeHeight - 16, 1)}' fill='none' stroke='%23e50914' stroke-width='2'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23e50914' font-family='Arial, sans-serif' font-size='22'>No Poster</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid URL
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Extract movie title from filename or path
 * @param {string} name - Filename or path
 * @returns {string} - Cleaned title
 */
export const cleanMovieTitle = (name) => {
  if (!name) return '';
  
  // Remove file extensions
  let title = name.replace(/\.(mp4|mkv|avi|m3u8|ts)$/i, '');
  
  // Remove quality indicators
  title = title.replace(/\b(720p|1080p|2160p|4k|BluRay|WEB-DL|WEBRip|HDTV|HDRip)\b/gi, '');
  
  // Remove extra spaces and dots
  title = title.replace(/[._]/g, ' ').replace(/\s+/g, ' ').trim();
  
  return title;
};

/**
 * Parse IMDb rating to number
 * @param {string} rating - Rating string (e.g., "8.5" or "N/A")
 * @returns {number|null} - Rating as number or null
 */
export const parseRating = (rating) => {
  if (!rating || rating === 'N/A') return null;
  const parsed = parseFloat(rating);
  return isNaN(parsed) ? null : parsed;
};

/**
 * Get rating color based on value
 * @param {number} rating - IMDb rating
 * @returns {string} - Tailwind color class
 */
export const getRatingColor = (rating) => {
  if (!rating) return 'text-gray-400';
  if (rating >= 8) return 'text-cinema-gold';
  if (rating >= 7) return 'text-green-400';
  if (rating >= 6) return 'text-yellow-400';
  if (rating >= 5) return 'text-orange-400';
  return 'text-red-400';
};

/**
 * Calculate percentage
 * @param {number} current - Current value
 * @param {number} total - Total value
 * @returns {number} - Percentage (0-100)
 */
export const calculatePercentage = (current, total) => {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.max(0, (current / total) * 100));
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {string} - Relative time string
 */
export const getRelativeTime = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

/**
 * Generate a unique ID
 * @returns {string} - Unique ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};
