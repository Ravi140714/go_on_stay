/**
 * useWishlist Hook
 * 
 * Manages wishlist state, loading, and optimistic toggling.
 */

import { useState, useEffect, useCallback } from 'react';
import { wishlistService } from '../../services/customer/wishlistService';
import { useAuth } from '../../context/AuthContext';

export const useWishlist = () => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlist([]);
      return;
    }
    setLoading(true);
    try {
      const data = await wishlistService.getWishlist();
      const list = Array.isArray(data) ? data : data.results || [];
      setWishlist(list);
    } catch (err) {
      console.warn('Failed to fetch wishlist:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const isSaved = useCallback(
    (hotelId) => {
      const numId = Number(hotelId);
      return wishlist.some((item) => {
        const itemHotelId = Number(item.hotel?.id || item.hotel || item.id);
        return itemHotelId === numId;
      });
    },
    [wishlist]
  );

  const toggleWishlist = useCallback(
    async (hotelId) => {
      if (!user || togglingId) return { success: false, requireAuth: !user };
      setTogglingId(hotelId);
      try {
        await wishlistService.toggleWishlist(hotelId);
        await fetchWishlist();
        return { success: true };
      } catch (err) {
        return { success: false, error: err };
      } finally {
        setTogglingId(null);
      }
    },
    [user, togglingId, fetchWishlist]
  );

  return {
    wishlist,
    loading,
    isSaved,
    toggleWishlist,
    refreshWishlist: fetchWishlist,
    isToggling: (id) => togglingId === id,
  };
};

export default useWishlist;
