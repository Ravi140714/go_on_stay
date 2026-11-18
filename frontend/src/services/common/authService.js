/**
 * Authentication Service
 * 
 * Handles login, registration, token refresh, OTP verification, and password resets.
 */

import apiClient from '../apiClient';
import { ENDPOINTS } from '../../config/apiEndpoints';
import { STORAGE_KEYS } from '../../config/apiConfig';

export const authService = {
  login: async (credentials) => {
    const response = await apiClient.post(ENDPOINTS.AUTH.LOGIN, credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await apiClient.post(ENDPOINTS.AUTH.REGISTER, userData);
    return response.data;
  },

  becomeHost: async (hostPayload) => {
    try {
      const response = await apiClient.post(ENDPOINTS.AUTH.BECOME_HOST, hostPayload);
      return response.data;
    } catch (err) {
      if (err.response?.status === 404) {
        // Fallback to standard registration with role HOTEL_OWNER
        const registerPayload = {
          username: hostPayload.username,
          email: hostPayload.email,
          password: hostPayload.password,
          password_confirm: hostPayload.password,
          first_name: hostPayload.first_name,
          last_name: hostPayload.last_name,
          phone_number: hostPayload.phone_number,
          role: 'HOTEL_OWNER',
        };
        const res = await apiClient.post(ENDPOINTS.AUTH.REGISTER, registerPayload);
        return res.data;
      }
      throw err;
    }
  },

  refreshToken: async (refresh) => {
    const response = await apiClient.post(ENDPOINTS.AUTH.REFRESH_TOKEN, { refresh });
    return response.data;
  },

  checkEmail: async (email, config = {}) => {
    const response = await apiClient.get(
      `${ENDPOINTS.AUTH.CHECK_EMAIL}?email=${encodeURIComponent(email)}`,
      config
    );
    return response.data;
  },

  checkPhone: async (phone, config = {}) => {
    // Note: Backend endpoint may return 404 if not yet implemented by backend dev
    const response = await apiClient.get(
      `${ENDPOINTS.AUTH.CHECK_PHONE}?phone=${encodeURIComponent(phone)}`,
      config
    );
    return response.data;
  },

  sendOtp: async (payload) => {
    const response = await apiClient.post(ENDPOINTS.AUTH.SEND_OTP, payload);
    return response.data;
  },

  verifyOtp: async (payload) => {
    const response = await apiClient.post(ENDPOINTS.AUTH.VERIFY_OTP, payload);
    return response.data;
  },

  forgotPassword: async (payload) => {
    const response = await apiClient.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, payload);
    return response.data;
  },

  resetPassword: async (payload) => {
    const response = await apiClient.post(ENDPOINTS.AUTH.RESET_PASSWORD, payload);
    return response.data;
  },

  changePassword: async (payload) => {
    const response = await apiClient.post(ENDPOINTS.AUTH.CHANGE_PASSWORD, payload);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },
};

export default authService;
