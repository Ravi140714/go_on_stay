/**
 * Admin Refund Management Service
 * 
 * Handles listing refunds, executing gateway refunds, synchronizing status, and retrying.
 */

import apiClient from '../apiClient';
import { ENDPOINTS } from '../../config/apiEndpoints';

export const adminRefundService = {
  getRefunds: async (params = {}, config = {}) => {
    const response = await apiClient.get(ENDPOINTS.PAYMENTS.ADMIN_REFUNDS, {
      ...config,
      params,
    });
    return response.data;
  },

  processRefund: async (refundData) => {
    // refundData: { booking_id, amount, reason }
    const response = await apiClient.post(ENDPOINTS.PAYMENTS.REFUND, refundData);
    return response.data;
  },

  getRefundStatus: async (bookingId, config = {}) => {
    const response = await apiClient.get(ENDPOINTS.PAYMENTS.REFUND_STATUS(bookingId), config);
    return response.data;
  },

  lookupRefund: async (lookupId, config = {}) => {
    const response = await apiClient.get(ENDPOINTS.PAYMENTS.REFUND_LOOKUP(lookupId), config);
    return response.data;
  },

  retryRefund: async (bookingId) => {
    const response = await apiClient.post(ENDPOINTS.PAYMENTS.REFUND_RETRY(bookingId));
    return response.data;
  },
};

export default adminRefundService;
