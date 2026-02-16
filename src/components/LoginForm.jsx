/**
 * LoginForm Component
 * Handles user authentication with Xtream API
 */

import { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

const LoginForm = ({ onLogin }) => {
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!serverUrl || !username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      const result = await onLogin(serverUrl, username, password);
      
      if (!result.success) {
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-cinema-darker via-cinema-dark to-cinema-darker">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-cinema-accent/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-cinema-gold/5 rounded-full blur-3xl" />
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        <div className="glass-card rounded-2xl p-8 shadow-2xl animate-scale-in">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-display mb-2 gradient-text">
              CINESTREAM
            </h1>
            <p className="text-white/60 text-sm">Premium IPTV Player</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Server URL Input */}
            <div>
              <label htmlFor="serverUrl" className="block text-sm font-medium text-white/80 mb-2">
                Server URL
              </label>
              <input
                id="serverUrl"
                type="text"
                autoComplete="url"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://example.com:8080"
                className="w-full px-4 py-3 bg-cinema-card border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cinema-accent focus:ring-2 focus:ring-cinema-accent/20 transition-all duration-300"
                disabled={isLoading}
              />
            </div>

            {/* Username Input */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-white/80 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 bg-cinema-card border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cinema-accent focus:ring-2 focus:ring-cinema-accent/20 transition-all duration-300"
                disabled={isLoading}
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 bg-cinema-card border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cinema-accent focus:ring-2 focus:ring-cinema-accent/20 transition-all duration-300"
                disabled={isLoading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg animate-fade-in">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full cinema-button disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span>Connect</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Info */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-white/40 text-center">
              Enter your Xtream API credentials to access your content
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
