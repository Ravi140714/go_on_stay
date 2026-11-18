/**
 * Customer Hotel Service
 * 
 * Handles hotel discovery, listings, search filtering, city lists, and amenities.
 */

import apiClient from '../apiClient';
import { ENDPOINTS } from '../../config/apiEndpoints';

export const hotelService = {
  getHotels: async (params = {}, config = {}) => {
    const mergedParams = { ...(config.params || {}), ...params };
    const response = await apiClient.get(ENDPOINTS.HOTELS.LIST, {
      ...config,
      params: mergedParams,
    });
    return response.data;
  },

  getHotelById: async (id, config = {}) => {
    const response = await apiClient.get(ENDPOINTS.HOTELS.DETAIL(id), config);
    return response.data;
  },

  getCities: async (config = {}) => {
    const response = await apiClient.get(ENDPOINTS.HOTELS.CITIES, config);
    return response.data;
  },

  getAmenities: async (config = {}) => {
    const response = await apiClient.get(ENDPOINTS.HOTELS.AMENITIES, config);
    return response.data;
  },

  searchHotels: async (params = {}, config = {}) => {
    // Both /hotels/ and /hotels/search/ are supported by Django backend
    const mergedParams = { ...(config.params || {}), ...params };
    const response = await apiClient.get(ENDPOINTS.HOTELS.SEARCH, {
      ...config,
      params: mergedParams,
    });
    return response.data;
  },
};

export default hotelService;
