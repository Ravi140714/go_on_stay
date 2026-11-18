/**
 * Hotel Owner Hotel Management Service
 * 
 * Handles property registration, updates, image uploads, document verification, and deletion.
 */

import apiClient from '../apiClient';
import { ENDPOINTS } from '../../config/apiEndpoints';

export const ownerHotelService = {
  createHotel: async (hotelData) => {
    const response = await apiClient.post(ENDPOINTS.HOTELS.LIST, hotelData);
    return response.data;
  },

  getHotelDetail: async (hotelId, config = {}) => {
    const response = await apiClient.get(ENDPOINTS.HOTELS.DETAIL(hotelId), config);
    return response.data;
  },

  updateHotel: async (hotelId, hotelData) => {
    const response = await apiClient.patch(ENDPOINTS.HOTELS.DETAIL(hotelId), hotelData);
    return response.data;
  },

  uploadHotelImage: async (hotelId, formData, onUploadProgress) => {
    const response = await apiClient.upload(
      ENDPOINTS.HOTELS.UPLOAD_IMAGE(hotelId),
      formData,
      onUploadProgress
    );
    return response.data;
  },

  uploadHotelDocuments: async (hotelId, formData, onUploadProgress) => {
    const response = await apiClient.upload(
      ENDPOINTS.HOTELS.DOCUMENTS(hotelId),
      formData,
      onUploadProgress
    );
    return response.data;
  },

  submitForApproval: async (hotelId) => {
    const response = await apiClient.post(ENDPOINTS.HOTELS.SUBMIT_APPROVAL(hotelId));
    return response.data;
  },

  deleteHotel: async (hotelId) => {
    const response = await apiClient.delete(ENDPOINTS.HOTELS.DETAIL(hotelId));
    return response.data;
  },
};

export default ownerHotelService;
