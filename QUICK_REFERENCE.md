# Quick Reference Cheat Sheet

## 🚀 Quick Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔧 Quick Configuration

### OMDb API Key
**File**: `src/services/omdbApi.js`
**Line 7**: `const OMDB_API_KEY = 'YOUR_KEY_HERE';`
**Get Key**: http://www.omdbapi.com/apikey.aspx

### Cache Duration
**File**: `src/services/omdbApi.js`
**Line 9**: `const CACHE_EXPIRY_DAYS = 30;`

### Progress Save Interval
**File**: `src/hooks/usePlayer.js`
**Line 146**: `setInterval(() => { saveProgress(); }, 5000);`

### Theme Colors
**File**: `tailwind.config.js`
**Lines 11-17**: cinema color palette

## 📁 Key File Locations

### Services (API Logic)
- `src/services/xtreamApi.js` - Xtream API
- `src/services/omdbApi.js` - OMDb API
- `src/services/storageService.js` - Progress tracking

### Hooks (Reusable Logic)
- `src/hooks/useAuth.js` - Login/logout
- `src/hooks/useMovies.js` - Movie data
- `src/hooks/usePlayer.js` - Video player

### Components
- `src/components/VideoPlayer.jsx` - HLS player
- `src/components/MovieCard.jsx` - Movie card
- `src/components/ContinueWatching.jsx` - Resume section

### Pages
- `src/pages/Login.jsx` - Login screen
- `src/pages/Home.jsx` - Main page
- `src/pages/Player.jsx` - Video player page

## 🐛 Quick Fixes

### Clear Cache
```javascript
// In browser console:
localStorage.clear();
```

### Videos Won't Play
1. Check stream URL format
2. Try Chrome browser
3. Verify CORS settings
4. Check container extension

### Login Fails
1. Include http:// in server URL
2. Don't add /player_api.php
3. Verify credentials
4. Check console for errors

### Ratings Not Loading
1. Verify API key is set
2. Check API key is activated
3. Monitor rate limits (1000/day free)
4. Clear cache and retry

## 🎨 Customization Quick Guide

### Change Accent Color
**File**: `tailwind.config.js`
```javascript
accent: '#e50914', // Change to your color
```

### Change Fonts
1. Update Google Fonts in `index.html`
2. Update `tailwind.config.js` fontFamily

### Change Progress Save Rate
**File**: `src/hooks/usePlayer.js`
```javascript
setInterval(() => {
  saveProgress();
}, 5000); // Change 5000 to desired ms
```

### Adjust Completion Threshold
**File**: `src/services/storageService.js`
```javascript
const COMPLETED_THRESHOLD = 0.9; // 90% = completed
```

## 📊 localStorage Keys

```javascript
// Credentials
'xtream_credentials'

// IMDb cache
'omdb_cache_MOVIE_TITLE'

// Playback progress
'playback_progress_STREAM_ID'
```

## 🔍 Debugging Tips

### Enable Verbose Logging
Add to component:
```javascript
console.log('Debug:', data);
```

### Check HLS Status
```javascript
// In VideoPlayer.jsx
hlsRef.current.on(Hls.Events.ERROR, (event, data) => {
  console.log('HLS Error:', data);
});
```

### Monitor API Calls
Check Network tab in DevTools for:
- Xtream API calls: `/player_api.php`
- OMDb API calls: `omdbapi.com`

## 🎯 Common Tasks

### Add New Filter
1. Add state in `src/hooks/useMovies.js`
2. Add UI in `src/components/FilterControls.jsx`
3. Update filter logic in `useMemo`

### Change Grid Layout
**File**: `src/components/MovieGrid.jsx`
**Line 35**: Modify grid classes
```javascript
// Example: 7 columns on xl screens
className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7"
```

### Add Loading Message
**File**: `src/components/LoadingSpinner.jsx`
```javascript
<LoadingSpinner size="lg" message="Your message here" />
```

## 🚀 Performance Tips

1. **Image Optimization**: All images use lazy loading
2. **Search Debounce**: 300ms delay (configurable)
3. **API Caching**: 30-day cache for ratings
4. **Smart Rendering**: Uses React.memo where needed
5. **Code Splitting**: Vite handles automatically

## 📱 Mobile Optimization

- Touch-friendly controls (larger tap targets)
- Responsive grid (2 cols mobile → 6 cols desktop)
- Swipeable continue watching section
- Mobile-optimized video controls

## 🔐 Security Notes

- ⚠️ Never commit API keys to git
- ⚠️ Credentials stored in localStorage (client-side)
- ✅ For production, use server-side auth
- ✅ Use environment variables

## 📚 Useful Resources

- React Docs: https://react.dev
- Tailwind Docs: https://tailwindcss.com
- HLS.js Docs: https://github.com/video-dev/hls.js/
- OMDb API: http://www.omdbapi.com

---

**Keep this file handy for quick reference!** 📌
