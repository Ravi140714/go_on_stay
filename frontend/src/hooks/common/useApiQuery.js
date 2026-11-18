/**
 * useApiQuery Hook
 * 
 * Reusable data-fetching hook with:
 * - Independent loading, error, success, empty states
 * - Automatic AbortController request cancellation on unmount
 * - Strict unmounted component memory leak guard
 * - Refetch and parameter reactivity
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { parseApiError } from '../../utils/errorHandler';

export const useApiQuery = (queryFn, dependencies = [], options = {}) => {
  const { enabled = true, initialData = null, onSuccess, onError } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(null);

  const execute = useCallback(async () => {
    if (!enabled) return;

    // Cancel any previous pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }

    try {
      const result = await queryFn({ signal: abortControllerRef.current.signal });
      if (isMountedRef.current) {
        setData(result);
        setLoading(false);
        if (onSuccess) onSuccess(result);
      }
    } catch (err) {
      // Don't report cancellation as an error
      if (err.name === 'CanceledError' || err.name === 'AbortError') {
        return;
      }
      if (isMountedRef.current) {
        const parsed = parseApiError(err);
        setError(parsed);
        setLoading(false);
        if (onError) onError(parsed);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...dependencies]);

  useEffect(() => {
    isMountedRef.current = true;
    execute();

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [execute]);

  return {
    data,
    loading,
    error,
    refetch: execute,
    setData,
  };
};

export default useApiQuery;
