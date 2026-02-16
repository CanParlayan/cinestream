# CineStream - Premium IPTV Web Player

A modern, production-ready IPTV web player built with React, featuring HLS streaming, IMDb integration, resume playback, and a beautiful cinematic UI.

## ✨ Features

### Core Features
- **Xtream API Integration** - Full authentication and VOD streaming
- **Video.js Player** - Professional video player with HLS/MP4 support
- **IMDb Ratings** - Automatic rating fetching via OMDb API with smart caching
- **Resume Playback** - Automatic progress saving and resume functionality
- **Continue Watching** - Dedicated section for movies in progress
- **Advanced Filtering** - Search by title, filter by rating, sort by multiple criteria
- **Mobile Responsive** - Fully responsive design for all devices

### Technical Features
- React 18 with Hooks (no Redux)
- Vite for fast development and builds
- Tailwind CSS with custom cinematic theme
- localStorage for caching and progress tracking
- Video.js for reliable video playback (supports HLS and MP4)
- Custom video controls with fullscreen support
- Modular, production-ready code structure

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Xtream API credentials (server URL, username, password)
- OMDb API key (free at http://www.omdbapi.com/apikey.aspx)

### Installation

1. **Clone/Download the project**
```bash
cd iptv-player
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure OMDb API Key**

Open `src/services/omdbApi.js` and replace `YOUR_OMDB_API_KEY` with your actual API key:

```javascript
const OMDB_API_KEY = 'your_actual_api_key_here';
```

4. **Start development server**
```bash
npm run dev
```

5. **Open your browser**
```
http://localhost:3000
```

### Production Build

```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
iptv-player/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── MovieCard.jsx           # Movie card with poster and rating
│   │   ├── MovieGrid.jsx           # Responsive grid layout
│   │   ├── VideoPlayer.jsx         # HLS video player with controls
│   │   ├── LoginForm.jsx           # Authentication form
│   │   ├── SearchBar.jsx           # Search input component
│   │   ├── FilterControls.jsx      # Rating filter and sort controls
│   │   ├── ContinueWatching.jsx    # Continue watching section
│   │   └── LoadingSpinner.jsx      # Loading animation
│   │
│   ├── pages/               # Page components
│   │   ├── Login.jsx               # Login page
│   │   ├── Home.jsx                # Home page with movie grid
│   │   └── Player.jsx              # Video player page
│   │
│   ├── services/            # API and storage services
│   │   ├── xtreamApi.js            # Xtream API client
│   │   ├── omdbApi.js              # OMDb API client with caching
│   │   └── storageService.js       # localStorage manager
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.js              # Authentication hook
│   │   ├── useMovies.js            # Movie data management
│   │   └── usePlayer.js            # Video player hook
│   │
│   ├── utils/               # Utility functions
│   │   └── helpers.js              # Helper functions
│   │
│   ├── App.jsx              # Main app component with routing
│   ├── main.jsx             # React entry point
│   └── index.css            # Global styles and Tailwind
│
├── public/                  # Static assets
├── index.html              # HTML entry point
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
└── README.md               # This file
```

## 🎯 Usage Guide

### 1. Login
- Enter your Xtream server URL (e.g., `http://example.com:8080`)
- Enter your username and password
- Click "Connect"

### 2. Browse Movies
- View all available VOD content
- Use the search bar to find specific movies
- Filter by IMDb rating (5+, 6+, 7+, 8+, 9+)
- Sort by rating or title

### 3. Continue Watching
- Movies you've started appear in the "Continue Watching" section
- Progress bars show how much you've watched
- Click any movie to resume from where you left off

### 4. Watch Movies
- Click any movie card to open the player
- Player features:
  - Play/Pause
  - Skip forward/backward (10 seconds)
  - Volume control
  - Fullscreen mode
  - Progress bar with seek
  - Auto-resume from last position

### 5. Progress Tracking
- Progress is saved automatically every 5 seconds
- Movies over 90% watched are marked as completed
- Progress persists across browser sessions

## 🔧 Configuration

### OMDb API Configuration
The app uses OMDb API for fetching IMDb ratings. To configure:

1. Get a free API key from http://www.omdbapi.com/apikey.aspx
2. Open `src/services/omdbApi.js`
3. Replace the API key:
```javascript
const OMDB_API_KEY = 'your_key_here';
```

### Cache Settings
IMDb ratings are cached for 30 days. To modify:

Open `src/services/omdbApi.js` and change:
```javascript
const CACHE_EXPIRY_DAYS = 30; // Change to desired days
```

### Progress Save Interval
Progress is saved every 5 seconds. To modify:

Open `src/hooks/usePlayer.js` and change:
```javascript
progressIntervalRef.current = setInterval(() => {
  saveProgress();
}, 5000); // Change to desired milliseconds
```

## 🎨 Customization

### Theme Colors
Edit `tailwind.config.js` to customize the color scheme:

```javascript
colors: {
  cinema: {
    dark: '#0a0a0f',      // Background
    darker: '#050508',     // Deeper background
    card: '#14141f',       // Card background
    accent: '#e50914',     // Accent color (red)
    gold: '#ffd700',       // Gold for ratings
  }
}
```

### Fonts
The app uses Google Fonts (Bebas Neue + Outfit). To change fonts:

1. Update `index.html` Google Fonts link
2. Update `tailwind.config.js` font family

## 🐛 Troubleshooting

### Videos won't play
- Ensure the stream URL is correct
- Check if the server supports CORS
- Verify the container extension (mp4, m3u8, etc.)
- Try a different browser (Chrome recommended)

### IMDb ratings not loading
- Verify your OMDb API key is correct
- Check your API key quota (free tier = 1000 requests/day)
- Clear localStorage cache: `localStorage.clear()`

### Login fails
- Double-check server URL format (include http:// or https://)
- Verify username and password
- Ensure the Xtream server is accessible
- Check browser console for errors

### Progress not saving
- Check browser localStorage is enabled
- Clear old data: Open DevTools → Application → Local Storage → Clear

## 📱 Browser Support

- Chrome/Edge 90+ (Recommended)
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🔐 Security Notes

- API credentials are stored in localStorage (client-side)
- For production, consider implementing server-side authentication
- Never commit API keys to version control
- Use environment variables for sensitive data

## 📝 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Code Style
- Uses ESLint and Prettier (recommended)
- Follow React Hooks best practices
- Use functional components only
- Implement proper error handling

## 🚀 Performance Tips

1. **Lazy Loading**: Images use lazy loading by default
2. **Debouncing**: Search is debounced (300ms)
3. **Caching**: IMDb ratings cached for 30 days
4. **Efficient Rendering**: Uses React.memo where beneficial
5. **Code Splitting**: Routes are lazy-loaded automatically by Vite

## 📄 License

This project is provided as-is for educational and personal use.

## 🙏 Acknowledgments

- [Video.js](https://videojs.com/) - Professional HTML5 video player
- [OMDb API](http://www.omdbapi.com/) - Movie information
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- [React Router](https://reactrouter.com/) - Routing
- [Vite](https://vitejs.dev/) - Build tool

## 💡 Tips

- Use a dedicated OMDb API key for best performance
- Clear cache periodically to free up storage
- For large movie libraries, consider implementing pagination
- Monitor API rate limits to avoid service interruptions

---

**Built with ❤️ using React + Vite + Tailwind CSS**

## GitHub ve Vercel Deploy (Adim Adim)

### 1) Projeyi GitHub'a yukleme
1. Terminalde proje klasorune gir:
   - `cd "C:\Users\Huseyin Ergin\Desktop\Cinestream"`
2. Git durumunu kontrol et:
   - `git status`
3. Degisiklikleri ekle:
   - `git add .`
4. Commit at:
   - `git commit -m "chore: prepare project for github and vercel deploy"`
5. GitHub'da yeni bos repo olustur (or: `cinestream`).
6. Remote ekle ve push et:
   - `git branch -M main`
   - `git remote add origin https://github.com/<kullanici-adi>/<repo>.git`
   - `git push -u origin main`

### 2) Supabase tarafini hazirla
1. Supabase projesi ac.
2. SQL Editor'de asagidaki tablolari olustur:

```sql
create table if not exists app_cache (
  cache_key text primary key,
  payload jsonb,
  updated_at timestamptz default now()
);

create table if not exists app_state (
  state_key text primary key,
  state_value jsonb,
  updated_at timestamptz default now()
);
```

3. Gerekirse RLS policy ver (anon key ile select/insert/update/delete).

### 3) Vercel ile deploy
1. Vercel'e GitHub ile giris yap.
2. `New Project` -> GitHub repo'nu sec.
3. Framework: `Vite` (otomatik gelir).
4. Build ayarlari:
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Environment Variables ekle:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_TMDB_API_KEY`
6. `Deploy` butonuna bas.

### 4) Canliya aldiktan sonra kontrol
1. `/` anasayfa aciliyor mu.
2. Router path'leri (ornek: `/player/movie/123`) calisiyor mu.
3. Watched, continue watching ve cache yazimi Supabase tablolarina dusuyor mu.
4. Bir degisiklikte GitHub'a push ettiginde Vercel otomatik redeploy ediyor mu.

### Not
- Gercek gizli degerleri `.env` dosyasinda tut; GitHub'a atma.
- Repo icinde sadece `.env.example` bulunmali.
