import axios from 'axios';

const getBaseApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && !envUrl.includes('192.168.1.114') && !envUrl.includes('192.168.1.8')) {
    return `${envUrl.replace(/\/$/, '')}/api`;
  }
  if (typeof window !== 'undefined' && window.location.hostname) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://127.0.0.1:8000/api';
    }
    return `http://${host}:8000/api`;
  }
  return 'http://127.0.0.1:8000/api';
};

const API_BASE_URL = getBaseApiUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/users/token/refresh/`, {
            refresh: refreshToken,
          });

          const newAccessToken = res.data.access;
          localStorage.setItem('accessToken', newAccessToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// Map to track in-flight GET requests and deduplicate identical concurrent calls
// Eliminates duplicate requests caused by React StrictMode double-mounting or concurrent component renders
const inFlightGetRequests = new Map();

const originalGet = api.get.bind(api);
api.get = function (url, config) {
  if (config?.skipDedupe) {
    return originalGet(url, config);
  }

  const serializedParams = config?.params ? JSON.stringify(config.params) : '';
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

export default api;