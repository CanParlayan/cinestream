/**
 * useAuth Hook
 * Manages user authentication state and operations
 */

import { useState, useEffect } from 'react';
import { xtreamApi } from '../services/xtreamApi';
import { storageService } from '../services/storageService';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);

  // Check for saved credentials on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const hasSavedCredentials = xtreamApi.loadSavedCredentials();
        
        if (hasSavedCredentials) {
          // Verify credentials are still valid
          const data = await xtreamApi.authenticate();
          setUserInfo(data.user_info);
          setIsAuthenticated(true);
          await storageService.hydrateFromCloud();
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        setIsAuthenticated(false);
        setUserInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  /**
   * Login with credentials
   * @param {string} serverUrl - Xtream server URL
   * @param {string} username - Username
   * @param {string} password - Password
   */
  const login = async (serverUrl, username, password) => {
    setIsLoading(true);
    setError(null);

    try {
      // Set credentials
      xtreamApi.setCredentials(serverUrl, username, password);
      
      // Authenticate
      const data = await xtreamApi.authenticate();
      
      setUserInfo(data.user_info);
      setIsAuthenticated(true);
      await storageService.hydrateFromCloud();
      setIsLoading(false);
      
      return { success: true };
    } catch (error) {
      setError(error.message || 'Login failed');
      setIsAuthenticated(false);
      setUserInfo(null);
      setIsLoading(false);
      
      return { success: false, error: error.message };
    }
  };

  /**
   * Logout and clear credentials
   */
  const logout = () => {
    xtreamApi.clearCredentials();
    setIsAuthenticated(false);
    setUserInfo(null);
    setError(null);
  };

  return {
    isAuthenticated,
    isLoading,
    userInfo,
    error,
    login,
    logout
  };
};
