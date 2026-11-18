/**
 * Customer Wishlist Service
 * 
 * Handles user saved hotels/properties.
 */

import apiClient from '../apiClient';
import { ENDPOINTS } from '../../config/apiEndpoints';

export const wishlistService = {
  getWishlist: async (config = {}) => {
    const response = await apiClient.get(ENDPOINTS.WISHLIST.LIST, config);
    return response.data;
  },

  toggleWishlist: async (hotelId) => {
    const response = await apiClient.post(ENDPOINTS.WISHLIST.TOGGLE(hotelId));
    return response.data;
  },
};

export default wishlistService;
