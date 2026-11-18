/**
 * Admin Payment & Payout Service
 * 
 * Handles platform transaction logs, payout executions, and dispute freezes.
 */

import apiClient from '../apiClient';
import { ENDPOINTS } from '../../config/apiEndpoints';

export const adminPaymentService = {
  getAllPayments: async (params = {}, config = {}) => {
    const response = await apiClient.get(ENDPOINTS.PAYMENTS.ADMIN_ALL, {
      ...config,
      params: { page_size: 1000, ...params },
    });
    return response.data;
  },

  initiatePayout: async (payoutPayload) => {
    const response = await apiClient.post(
      ENDPOINTS.PAYMENTS.ADMIN_INITIATE_PAYOUT,
      payoutPayload
    );
    return response.data;
  },

  toggleDispute: async (earningId, isDisputed) => {
    const response = await apiClient.post(ENDPOINTS.PAYMENTS.ADMIN_TOGGLE_DISPUTE, {
      earning_id: earningId,
      is_disputed: isDisputed,
    });
    return response.data;
  },
};

export default adminPaymentService;
