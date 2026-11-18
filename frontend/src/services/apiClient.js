/**
 * GoOnStay Centralized HTTP Client (apiClient)
 * 
 * Powered by Axios with:
 * - Centralized environment baseURL
 * - Automatic JWT Bearer token attachment
 * - Concurrent 401 token refresh mutex (stampede prevention)
 * - Safe in-flight GET request deduplication
 * - Native AbortController request cancellation support
 * - Multipart/form-data upload helper
 * - Normalized error responses
 */

import axios from 'axios';
import { API_CONFIG, STORAGE_KEYS, API_BASE_URL } from '../config/apiConfig';
import { parseApiError } from '../utils/errorHandler';

// Create core Axios instance
const apiClient = axios.create(API_CONFIG);

// Request interceptor: Attach Authorization header if token exists & handle multipart
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Never force manual multipart/form-data Content-Type; allow browser/axios to set boundary automatically
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Token refresh mutex state
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor: Handle 401 and refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If request was canceled by AbortController, rethrow immediately without refresh attempt
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    // Do not attempt refresh on login or token refresh endpoints
    const isAuthRoute =
      originalRequest?.url?.includes('/users/login/') ||
      originalRequest?.url?.includes('/users/token/refresh/');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        // Enqueue request while another refresh is already in flight
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

      if (refreshToken) {
        try {
          // Use a raw axios post to bypass interceptors
          const res = await axios.post(`${API_BASE_URL}/users/token/refresh/`, {
            refresh: refreshToken,
          });

          const newAccessToken = res.data.access;
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
          apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);
          isRefreshing = false;

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          isRefreshing = false;

          // Clear credentials upon refresh failure
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);

          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshErr);
        }
      } else {
        isRefreshing = false;
        // No refresh token available
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    }

    return Promise.reject(error);
  }
);

// In-flight GET request deduplication map
const inFlightGetRequests = new Map();

const originalGet = apiClient.get.bind(apiClient);

/**
 * Enhanced GET with deduplication and cancellation support
 */
apiClient.get = function (url, config = {}) {
  // If skipDedupe is specified or request has an AbortController signal, don't deduplicate
  if (config.skipDedupe || config.signal) {
    return originalGet(url, config);
  }

  const serializedParams = config.params ? JSON.stringify(config.params) : '';
  const requestKey = `${url}::${serializedParams}`;

  if (inFlightGetRequests.has(requestKey)) {
    return inFlightGetRequests.get(requestKey);
  }

  const promise = originalGet(url, config).finally(() => {
    inFlightGetRequests.delete(requestKey);
  });

  inFlightGetRequests.set(requestKey, promise);
  return promise;
};

/**
 * Helper for Multipart/Form-Data File Uploads
 */
apiClient.upload = function (url, formData, onUploadProgress, config = {}) {
  const headers = { ...config.headers };
  delete headers['Content-Type'];
  delete headers['content-type'];
  return apiClient.post(url, formData, {
    ...config,
    headers,
    onUploadProgress,
  });
};

/**
 * Helper to normalize any API error
 */
export const normalizeError = (error, fallbackMessage) => {
  return parseApiError(error, fallbackMessage);
};

export default apiClient;
