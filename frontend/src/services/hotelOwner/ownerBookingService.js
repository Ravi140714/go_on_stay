/**
 * Hotel Owner Booking Management Service
 * 
 * Handles owner booking inquiries, approvals, cancellations, and no-show processing.
 */

import apiClient from '../apiClient';
import { ENDPOINTS } from '../../config/apiEndpoints';

export const ownerBookingService = {
  getOwnerBookings: async (config = {}) => {
    const response = await apiClient.get(ENDPOINTS.BOOKINGS.MY_BOOKINGS, config);
    return response.data;
  },

  getBookingDetail: async (bookingId, config = {}) => {
    const response = await apiClient.get(ENDPOINTS.BOOKINGS.DETAIL(bookingId), config);
    return response.data;
  },

  approveBooking: async (bookingId) => {
    // Attempt dedicated approval endpoint if supported by backend
    const response = await apiClient.post(ENDPOINTS.BOOKINGS.OWNER_APPROVAL(bookingId), {
      action: 'approve',
    });
    return response.data;
  },

  rejectBooking: async (bookingId, reason = '') => {
    try {
      const response = await apiClient.post(ENDPOINTS.BOOKINGS.OWNER_APPROVAL(bookingId), {
        action: 'reject',
        reason,
      });
      return response.data;
    } catch (err) {
      // Fallback to standard booking cancellation
      const cancelRes = await apiClient.post(ENDPOINTS.BOOKINGS.CANCEL(bookingId), {
        reason: reason || 'Declined by host',
      });
      return cancelRes.data;
    }
  },

  markNoShow: async (bookingId) => {
    const response = await apiClient.post(ENDPOINTS.BOOKINGS.NO_SHOW(bookingId));
    return response.data;
  },

  staffCheckIn: async (bookingId) => {
    const response = await apiClient.post(ENDPOINTS.BOOKINGS.CHECK_IN(bookingId));
    return response.data;
  },

  staffCheckOut: async (bookingId) => {
    const response = await apiClient.post(ENDPOINTS.BOOKINGS.CHECK_OUT(bookingId));
    return response.data;
  },
};

export default ownerBookingService;
