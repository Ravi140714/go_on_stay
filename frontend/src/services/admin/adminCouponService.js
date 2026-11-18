/**
 * Admin Coupon Management Service
 * 
 * Handles listing, creating, and deleting platform coupons and promotional campaigns.
 */

import apiClient from '../apiClient';
import { ENDPOINTS } from '../../config/apiEndpoints';

export const adminCouponService = {
  getAllCoupons: async (config = {}) => {
    const response = await apiClient.get(ENDPOINTS.COUPONS.LIST_CREATE, config);
    return response.data;
  },

  createCoupon: async (couponData) => {
    const response = await apiClient.post(ENDPOINTS.COUPONS.LIST_CREATE, couponData);
    return response.data;
  },

  deleteCoupon: async (couponId) => {
    const response = await apiClient.delete(ENDPOINTS.COUPONS.DETAIL(couponId));
    return response.data;
  },
};

export default adminCouponService;
