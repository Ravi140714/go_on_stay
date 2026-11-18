/**
 * Hotel Owner Payout Account Service
 * 
 * Handles bank account, IFSC, UPI ID configurations for host payouts.
 */

import apiClient from '../apiClient';
import { ENDPOINTS } from '../../config/apiEndpoints';

export const ownerPayoutService = {
  getPayoutAccount: async (config = {}) => {
    const response = await apiClient.get(ENDPOINTS.PAYMENTS.PAYOUT_ACCOUNT, config);
    return response.data;
  },

  savePayoutAccount: async (payoutData) => {
    const response = await apiClient.post(ENDPOINTS.PAYMENTS.PAYOUT_ACCOUNT, payoutData);
    return response.data;
  },

  getHostPayoutHistory: async (config = {}) => {
    const response = await apiClient.get(ENDPOINTS.PAYMENTS.PAYOUTS, config);
    return response.data;
  },
};

export default ownerPayoutService;
