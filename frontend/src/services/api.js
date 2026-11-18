/**
 * GoOnStay API Client Re-export for Backward Compatibility
 * 
 * Redirects to the centralized apiClient.
 */

import apiClient, { normalizeError } from './apiClient';

export { apiClient, normalizeError };
export default apiClient;
