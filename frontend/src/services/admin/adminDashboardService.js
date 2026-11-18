/**
 * Admin Dashboard & Platform Settings Service
 * 
 * Handles platform statistics, commission settings, and system audit logs.
 */

import apiClient from '../apiClient';
import { ENDPOINTS } from '../../config/apiEndpoints';

export const adminDashboardService = {
  getPlatformSettings: async (config = {}) => {
    const response = await apiClient.get(ENDPOINTS.PAYMENTS.SETTINGS, config);
    return response.data;
  },

  updatePlatformSettings: async (settingsData) => {
    const response = await apiClient.put(ENDPOINTS.PAYMENTS.SETTINGS, settingsData);
    return response.data;
  },

  getAuditLogs: async (config = {}) => {
    const response = await apiClient.get(ENDPOINTS.PAYMENTS.ADMIN_AUDIT_LOGS, config);
    return response.data;
  },

  getProviderSetupStatus: async (config = {}) => {
    const response = await apiClient.get(ENDPOINTS.PAYMENTS.ADMIN_PROVIDER_STATUS, config);
    return response.data;
  },
};

export default adminDashboardService;
