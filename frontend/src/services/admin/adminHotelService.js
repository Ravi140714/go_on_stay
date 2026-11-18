/**
 * Admin Hotel Management Service
 * 
 * Handles hotel reviews, approvals, rejections, and administrative deletion.
 */

import apiClient from '../apiClient';
import { ENDPOINTS } from '../../config/apiEndpoints';

export const adminHotelService = {
  getAllHotels: async (params = {}, config = {}) => {
    const response = await apiClient.get(ENDPOINTS.HOTELS.LIST, {
      ...config,
      params: { page_size: 1000, sort_by: 'newest', ...params },
    });
    return response.data;
  },

  approveHotel: async (hotelId, notes = '') => {
    const response = await apiClient.post(ENDPOINTS.HOTELS.APPROVAL(hotelId), {
      status: 'APPROVED',
      notes,
    });
    return response.data;
  },

  rejectHotel: async (hotelId, reason = '') => {
    const response = await apiClient.post(ENDPOINTS.HOTELS.APPROVAL(hotelId), {
      status: 'REJECTED',
      rejection_reason: reason,
    });
    return response.data;
  },

  deleteHotel: async (hotelId) => {
    const response = await apiClient.delete(ENDPOINTS.HOTELS.DETAIL(hotelId));
    return response.data;
  },
};

export default adminHotelService;
