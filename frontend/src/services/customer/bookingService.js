/**
 * Customer Booking Service
 * 
 * Handles booking creation, retrieving customer bookings, cancellations, and status details.
 */

import apiClient from '../apiClient';
import { ENDPOINTS } from '../../config/apiEndpoints';

export const bookingService = {
  createBooking: async (bookingPayload) => {
    const response = await apiClient.post(ENDPOINTS.BOOKINGS.LIST_CREATE, bookingPayload);
    return response.data;
  },

  getMyBookings: async (config = {}) => {
    // Backend filter automatically returns bookings belonging to authenticated user
    const response = await apiClient.get('/bookings/', {
      ...config,
      params: {
        page_size: 1000,
        ...(config.params || {})
      }
    });
    return response.data;
  },

  getBookingById: async (id, config = {}) => {
    const response = await apiClient.get(ENDPOINTS.BOOKINGS.DETAIL(id), config);
    return response.data;
  },

  getCancelPreview: async (id, config = {}) => {
    const response = await apiClient.get(ENDPOINTS.BOOKINGS.CANCEL(id), config);
    return response.data;
  },

  cancelBooking: async (id, payload = {}) => {
    const response = await apiClient.post(ENDPOINTS.BOOKINGS.CANCEL(id), payload);
    return response.data;
  },

  resendConfirmationEmail: async (bookingId) => {
    const response = await apiClient.post(ENDPOINTS.BOOKINGS.RESEND_EMAIL(bookingId));
    return response.data;
  },
};

export default bookingService;
