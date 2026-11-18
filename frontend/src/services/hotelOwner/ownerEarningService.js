/**
 * Hotel Owner Earnings & Settlements Service
 * 
 * Handles owner earnings, settlements breakdown, and PDF statement download.
 */

import apiClient from '../apiClient';
import { ENDPOINTS } from '../../config/apiEndpoints';

export const ownerEarningService = {
  getSettlements: async (config = {}) => {
    const response = await apiClient.get(ENDPOINTS.PAYMENTS.SETTLEMENTS, config);
    return response.data;
  },

  downloadStatementPdf: async (params = {}) => {
    const response = await apiClient.get(ENDPOINTS.PAYMENTS.SETTLEMENT_STATEMENT, {
      params: { ...params, download: 'pdf' },
      responseType: 'blob',
    });
    return response;
  },
};

export default ownerEarningService;
