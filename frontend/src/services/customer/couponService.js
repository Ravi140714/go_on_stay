/**
 * Customer Coupon Service
 * 
 * Handles listing available coupons, validating, and applying coupon discounts.
 */

import apiClient from '../apiClient';
import { ENDPOINTS } from '../../config/apiEndpoints';

export const couponService = {
  getAvailableCoupons: async (config = {}) => {
    const response = await apiClient.get(ENDPOINTS.COUPONS.AVAILABLE, config);
    return response.data;
  },

  applyCoupon: async (payload) => {
    // payload: { code, booking_amount or total_amount, hotel_id }
    const response = await apiClient.post(ENDPOINTS.COUPONS.APPLY, payload);
    return response.data;
  },

  validateCoupon: async (payload) => {
    const response = await apiClient.post(ENDPOINTS.COUPONS.VALIDATE, payload);
    return response.data;
  },
};

export default couponService;
