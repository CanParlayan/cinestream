# Quick Setup Guide

Follow these steps to get CineStream running in minutes!

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- React & React DOM
- React Router
- HLS.js
- Tailwind CSS
- Vite

## Step 2: Get OMDb API Key

1. Visit http://www.omdbapi.com/apikey.aspx
2. Choose the FREE plan (1,000 daily requests)
3. Enter your email
4. Check your email for the API key
5. Activate the key by clicking the link in the email

## Step 3: Configure API Key

Open `src/services/omdbApi.js` and find this line:

```javascript
const OMDB_API_KEY = 'YOUR_OMDB_API_KEY';
```

Replace `YOUR_OMDB_API_KEY` with your actual API key:

```javascript
const OMDB_API_KEY = 'a1b2c3d4'; // Your actual key
```

## Step 4: Start Development Server

```bash
npm run dev
```

The app will start at `http://localhost:3000`

## Step 5: Login

When the app opens, you'll see a login screen. Enter:

1. **Server URL**: Your Xtream server URL
   - Example: `http://example.com:8080`
   - Must include `http://` or `https://`
   - Do NOT include `/player_api.php`

2. **Username**: Your Xtream username

3. **Password**: Your Xtream password

4. Click "Connect"

## Step 6: Enjoy!

You should now see:
- Your movie library in a beautiful grid
- Search and filter controls at the top
- Continue watching section (after you start watching movies)
- IMDb ratings loading automatically

## Troubleshooting

### "Authentication failed"
- Double-check your server URL format
- Verify username and password
- Ensure server is accessible

### "IMDb ratings not loading"
- Verify your API key is correctly set
- Check you've activated the key via email
- Try clearing cache: `localStorage.clear()` in browser console

### "Videos won't play"
- Check if your browser supports HLS (Chrome/Edge recommended)
- Verify the stream format is supported
- Try refreshing the page

## Need Help?

Check the main README.md for:
- Full feature documentation
- Configuration options
- Advanced troubleshooting
- Browser support details

---

**Total setup time: ~5 minutes** ⚡
