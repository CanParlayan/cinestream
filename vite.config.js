import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Intercept calls to /api/xtream
      '/api/xtream': {
        target: 'http://proazure.org:8080', // The IPTV Server
        changeOrigin: true,
        secure: false,
        // This removes '/api/xtream' from the URL before sending it to proazure
        // so it hits http://proazure.org:8080/player_api.php instead
        rewrite: (path) => {
          const url = new URL(path, 'http://localhost:3000');
          const params = url.search;
          return `/player_api.php${params}`;
        },
      },
      // You likely need one for the stream proxy too
      '/api/stream': {
        target: 'http://proazure.org:8080',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/stream/, ''), 
      }
    }
  }
});