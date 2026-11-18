/**
 * Hotel Owner Dashboard Service
 * 
 * Aggregates owner statistics, property performance, earnings summary, and reviews.
 */

import apiClient from '../apiClient';
import { ENDPOINTS } from '../../config/apiEndpoints';

export const ownerDashboardService = {
  getOwnerHotels: async (config = {}) => {
    const response = await apiClient.get(ENDPOINTS.HOTELS.OWNER_HOTELS, config);
    return response.data;
  },

  getOwnerBookings: async (config = {}) => {
    const response = await apiClient.get(ENDPOINTS.BOOKINGS.MY_BOOKINGS, config);
    return response.data;
  },

  getOwnerSettlements: async (config = {}) => {
    const response = await apiClient.get(ENDPOINTS.PAYMENTS.SETTLEMENTS, config);
    return response.data;
  },

  getOwnerPayoutAccount: async (config = {}) => {
    const response = await apiClient.get(ENDPOINTS.PAYMENTS.PAYOUT_ACCOUNT, config);
    return response.data;
  },

  getOwnerReviews: async (config = {}) => {
    const response = await apiClient.get(`${ENDPOINTS.REVIEWS.LIST_CREATE}?owner=true`, config);
    return response.data;
  },

  respondToReview: async (reviewId, responseText) => {
    const response = await apiClient.post(ENDPOINTS.REVIEWS.RESPOND(reviewId), {
      response: responseText,
    });
    return response.data;
  },
};

export default ownerDashboardService;
