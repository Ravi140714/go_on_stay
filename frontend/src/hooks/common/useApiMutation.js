/**
 * useApiMutation Hook
 * 
 * Reusable mutation hook for POST, PUT, PATCH, DELETE operations with:
 * - Mutex lock: prevents double-click submissions
 * - Independent loading, error, and success states
 * - Error normalization
 */

import { useState, useCallback, useRef } from 'react';
import { parseApiError } from '../../utils/errorHandler';

export const useApiMutation = (mutationFn, options = {}) => {
  const { onSuccess, onError } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const isSubmittingRef = useRef(false);

  const mutate = useCallback(
    async (...args) => {
      // Prevent double submissions
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const result = await mutationFn(...args);
        setData(result);
        setLoading(false);
        isSubmittingRef.current = false;
        if (onSuccess) onSuccess(result);
        return { success: true, data: result };
      } catch (err) {
        const parsed = parseApiError(err);
        setError(parsed);
        setLoading(false);
        isSubmittingRef.current = false;
        if (onError) onError(parsed);
        return { success: false, error: parsed };
      }
    },
    [mutationFn, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    isSubmittingRef.current = false;
  }, []);

  return {
    mutate,
    loading,
    error,
    data,
    reset,
  };
};

export default useApiMutation;
