/**
 * GoOnStay Centralized API Configuration
 * 
 * Provides centralized base URL determination, storage keys,
 * request timeout settings, and standard headers.
 */

export const getBaseApiUrl = () => {
  // 1. Check explicit base API URL from environment variable
  const envBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (envBaseUrl && typeof envBaseUrl === 'string' && envBaseUrl.trim() !== '') {
    return envBaseUrl.replace(/\/$/, '');
  }

  // 2. Check general API host URL from environment variable
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    // Strip trailing slash and append /api
    const cleanUrl = envUrl.replace(/\/$/, '');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }

  // 3. Dynamic browser window hostname fallback
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://127.0.0.1:8000/api';
    }
    return `http://${host}:8000/api`;
  }

  // 4. Default safe fallback
  return 'http://127.0.0.1:8000/api';
};

export const API_BASE_URL = getBaseApiUrl();

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  LANGUAGE: 'preferred_language',
  CURRENCY: 'preferred_currency',
};
