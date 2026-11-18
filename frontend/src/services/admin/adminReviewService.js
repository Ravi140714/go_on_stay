/**
 * Admin Review Moderation Service
 * 
 * Handles review moderation and administrative actions on user reviews.
 */

import apiClient from '../apiClient';
import { ENDPOINTS } from '../../config/apiEndpoints';

export const adminReviewService = {
  getAllReviews: async (config = {}) => {
    const response = await apiClient.get(ENDPOINTS.REVIEWS.LIST_CREATE, config);
    return response.data;
  },

  deleteReview: async (reviewId) => {
    const response = await apiClient.delete(ENDPOINTS.REVIEWS.DETAIL(reviewId));
    return response.data;
  },
};

export default adminReviewService;
