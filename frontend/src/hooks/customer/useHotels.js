/**
 * useHotels Hook
 * 
 * Reusable hook for discovering hotels with filters and cities.
 */

import { useState, useEffect, useCallback } from 'react';
import { hotelService } from '../../services/customer/hotelService';
import { parseApiError } from '../../utils/errorHandler';

export const useHotels = (initialParams = {}) => {
  const [hotels, setHotels] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHotels = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await hotelService.getHotels(params);
      if (Array.isArray(data)) {
        setHotels(data);
        setTotalCount(data.length);
      } else if (data?.results) {
        setHotels(data.results);
        setTotalCount(data.count || data.results.length);
      } else {
        setHotels([]);
        setTotalCount(0);
      }
    } catch (err) {
      setError(parseApiError(err, 'Hotels load nahi ho paaye. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCities = useCallback(async () => {
    try {
      const data = await hotelService.getCities();
      const cityList = Array.isArray(data) ? data : data.results || [];
      setCities(cityList);
    } catch (err) {
      console.warn('Failed to load cities:', err);
    }
  }, []);

  useEffect(() => {
    fetchHotels(initialParams);
    fetchCities();
  }, [fetchHotels, fetchCities]);

  return {
    hotels,
    totalCount,
    cities,
    loading,
    error,
    refetch: fetchHotels,
  };
};

export default useHotels;
