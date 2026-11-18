/**
 * Admin User Management Service
 * 
 * Handles user listing, block/unblock toggles, role modifications, and deletion.
 */

import apiClient from '../apiClient';
import { ENDPOINTS } from '../../config/apiEndpoints';

export const adminUserService = {
  getAllUsers: async (config = {}) => {
    const response = await apiClient.get(ENDPOINTS.AUTH.ALL_USERS, config);
    return response.data;
  },

  toggleBlockUser: async (userId) => {
    const response = await apiClient.post(ENDPOINTS.AUTH.TOGGLE_BLOCK(userId));
    return response.data;
  },

  changeUserRole: async (userId, newRole) => {
    const response = await apiClient.post(ENDPOINTS.AUTH.CHANGE_ROLE(userId), {
      role: newRole,
    });
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await apiClient.delete(ENDPOINTS.AUTH.DELETE_USER(userId));
    return response.data;
  },
};

export default adminUserService;
