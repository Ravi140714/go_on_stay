/**
 * Customer Room Service
 * 
 * Handles room inspection, availability checking, and rooms by hotel.
 */

import apiClient from '../apiClient';
import { ENDPOINTS } from '../../config/apiEndpoints';

export const roomService = {
  getRooms: async (params = {}, config = {}) => {
    const response = await apiClient.get(ENDPOINTS.ROOMS.LIST, {
      ...config,
      params,
    });
    return response.data;
  },

  getRoomById: async (id, config = {}) => {
    const response = await apiClient.get(ENDPOINTS.ROOMS.DETAIL(id), config);
    return response.data;
  },

  getRoomsByHotel: async (hotelId, config = {}) => {
    const response = await apiClient.get(ENDPOINTS.ROOMS.BY_HOTEL(hotelId), config);
    return response.data;
  },

  checkAvailability: async (params, config = {}) => {
    const response = await apiClient.get(ENDPOINTS.ROOMS.CHECK_AVAILABILITY, {
      ...config,
      params,
    });
    return response.data;
  },
};

export default roomService;
