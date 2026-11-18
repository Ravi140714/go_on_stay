/**
 * User Profile Service
 * 
 * Handles fetching, updating profile details (JSON and multipart), and preferences.
 */

import apiClient from '../apiClient';
import { ENDPOINTS } from '../../config/apiEndpoints';

export const profileService = {
  getProfile: async (config = {}) => {
    const response = await apiClient.get(ENDPOINTS.AUTH.PROFILE, config);
    return response.data;
  },

  updateProfile: async (data, config = {}) => {
    const isFormData = data instanceof FormData;
    const headers = { ...config.headers };
    if (isFormData) {
      delete headers['Content-Type'];
      delete headers['content-type'];
    }

    try {
      const response = await apiClient.patch(ENDPOINTS.AUTH.PROFILE, data, {
        ...config,
        headers,
      });
      return response.data;
    } catch (patchErr) {
      if (patchErr.response?.status === 405) {
        // Fallback to PUT if PATCH not allowed
        const putResponse = await apiClient.put(ENDPOINTS.AUTH.PROFILE, data, {
          ...config,
          headers,
        });
        return putResponse.data;
      }
      throw patchErr;
    }
  },

  updateLanguagePreference: async (langCode) => {
    const response = await apiClient.patch(ENDPOINTS.AUTH.PROFILE, {
      preferred_language: langCode,
    });
    return response.data;
  },

  updateCurrencyPreference: async (currencyCode) => {
    const response = await apiClient.patch(ENDPOINTS.AUTH.PROFILE, {
      preferred_currency: currencyCode,
    });
    return response.data;
  },

  updateNotificationPreferences: async (preferences) => {
    const response = await apiClient.patch(ENDPOINTS.AUTH.PROFILE, {
      notification_preferences: preferences,
    });
    return response.data;
  },
};

export default profileService;
