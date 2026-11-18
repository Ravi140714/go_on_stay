/**
 * Customer Payment Service
 * 
 * Handles Razorpay order creation, payment verification, and retry flows.
 */

import apiClient from '../apiClient';
import { ENDPOINTS } from '../../config/apiEndpoints';

export const paymentService = {
  createOrder: async (bookingId) => {
    const response = await apiClient.post(ENDPOINTS.PAYMENTS.CREATE_ORDER, {
      booking_id: bookingId,
    });
    return response.data;
  },

  verifyPayment: async (paymentData) => {
    const response = await apiClient.post(ENDPOINTS.PAYMENTS.VERIFY, paymentData);
    return response.data;
  },

  retryPayment: async (bookingId) => {
    const response = await apiClient.post(ENDPOINTS.PAYMENTS.RETRY, {
      booking_id: bookingId,
    });
    return response.data;
  },
};

export default paymentService;
