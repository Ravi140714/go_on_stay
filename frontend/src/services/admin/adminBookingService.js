/**
 * Admin Booking Service
 * 
 * Handles platform-wide booking queries, audit logs, and status inspections.
 */

import apiClient from '../apiClient';
import { ENDPOINTS } from '../../config/apiEndpoints';

export const adminBookingService = {
  getAllBookings: async (params = {}, config = {}) => {
    const response = await apiClient.get(ENDPOINTS.BOOKINGS.LIST_CREATE, {
      ...config,
      params: { page_size: 1000, ...params },
    });
    return response.data;
  },

  getBookingDetail: async (bookingId, config = {}) => {
    const response = await apiClient.get(ENDPOINTS.BOOKINGS.DETAIL(bookingId), config);
    return response.data;
  },
};

export default adminBookingService;
