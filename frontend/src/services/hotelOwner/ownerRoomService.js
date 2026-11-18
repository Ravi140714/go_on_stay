/**
 * Hotel Owner Room Service
 * 
 * Handles owner room creation, updates, room inventory, image uploads, and calendar pricing.
 */

import apiClient from '../apiClient';
import { ENDPOINTS } from '../../config/apiEndpoints';

export const ownerRoomService = {
  getRoomsByHotel: async (hotelId, config = {}) => {
    const response = await apiClient.get(ENDPOINTS.ROOMS.BY_HOTEL(hotelId), config);
    return response.data;
  },

  getRoomDetail: async (roomId, config = {}) => {
    const response = await apiClient.get(ENDPOINTS.ROOMS.DETAIL(roomId), config);
    return response.data;
  },

  createRoom: async (roomData) => {
    const response = await apiClient.post(ENDPOINTS.ROOMS.LIST, roomData);
    return response.data;
  },

  updateRoom: async (roomId, roomData) => {
    const response = await apiClient.patch(ENDPOINTS.ROOMS.DETAIL(roomId), roomData);
    return response.data;
  },

  deleteRoom: async (roomId) => {
    const response = await apiClient.delete(ENDPOINTS.ROOMS.DETAIL(roomId));
    return response.data;
  },

  uploadRoomImage: async (roomId, formData, onUploadProgress) => {
    const response = await apiClient.upload(
      ENDPOINTS.ROOMS.UPLOAD_IMAGE(roomId),
      formData,
      onUploadProgress
    );
    return response.data;
  },

  updateCalendar: async (roomId, calendarData) => {
    const response = await apiClient.post(ENDPOINTS.ROOMS.CALENDAR(roomId), calendarData);
    return response.data;
  },
};

export default ownerRoomService;
