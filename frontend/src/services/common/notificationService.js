/**
 * Notification Service
 * 
 * Handles in-app notification queries, unread count badge, and read acknowledgments.
 */

import apiClient from '../apiClient';
import { ENDPOINTS } from '../../config/apiEndpoints';

export const notificationService = {
  getNotifications: async (config = {}) => {
    const response = await apiClient.get(ENDPOINTS.NOTIFICATIONS.LIST, config);
    return response.data;
  },

  getUnreadCount: async (config = {}) => {
    const response = await apiClient.get(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT, config);
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await apiClient.post(ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await apiClient.post(ENDPOINTS.NOTIFICATIONS.READ_ALL);
    return response.data;
  },

  sendTestNotification: async () => {
    const response = await apiClient.post(ENDPOINTS.NOTIFICATIONS.SEND_TEST);
    return response.data;
  },

  simulatePayoutDueNotification: async () => {
    const response = await apiClient.post(ENDPOINTS.NOTIFICATIONS.SIMULATE_PAYOUT_DUE);
    return response.data;
  },
};

export default notificationService;
