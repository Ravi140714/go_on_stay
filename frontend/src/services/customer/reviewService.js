/**
 * Review Service
 * 
 * Handles querying hotel reviews and submitting verified customer reviews.
 */

import apiClient from '../apiClient';
import { ENDPOINTS } from '../../config/apiEndpoints';

export const reviewService = {
  getHotelReviews: async (hotelId, config = {}) => {
    const response = await apiClient.get(
      `${ENDPOINTS.REVIEWS.LIST_CREATE}?hotel_id=${hotelId}`,
      config
    );
    return response.data;
  },

  createReview: async (reviewPayload) => {
    const response = await apiClient.post(ENDPOINTS.REVIEWS.LIST_CREATE, reviewPayload);
    return response.data;
  },

  getReviewDetail: async (reviewId, config = {}) => {
    const response = await apiClient.get(ENDPOINTS.REVIEWS.DETAIL(reviewId), config);
    return response.data;
  },
};

export default reviewService;
