import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Calendar, Users, Hotel, ShieldCheck,
  Star, Sparkles, Compass, CheckCircle2, ArrowRight, Tag,
  ChevronLeft, ChevronRight, Heart, Wifi, Coffee, Tv,
  Clock, ChevronDown, X, AlertTriangle, RefreshCw,
  LayoutGrid, Map, SlidersHorizontal, ArrowUpDown, Utensils,
  BedDouble, Building2, Check, Eye
} from 'lucide-react';
import api from '../services/api';
import { hotelService, wishlistService } from '../services';
import InteractiveSearchBar from '../components/InteractiveSearchBar';
import CategoryTabs from '../components/CategoryTabs';
import HotelMapView from '../components/HotelMapView';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const DEFAULT_CITY_IMAGES = {
  jaipur: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80',
  udaipur: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=800&q=80',
  mumbai: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80',
  goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
  ahmedabad: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80',
  delhi: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80',
  manali: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
  bengaluru: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80',
  bangalore: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80',
};

const Home = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, showToast } = useAuth();

  const [allProperties, setAllProperties] = useState([]);
  const [featuredHotels, setFeaturedHotels] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [hotelError, setHotelError] = useState(false);

  // Date calculation helpers
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTomorrowStr = (baseDateStr, offsetDays = 1) => {
    let base;
    if (baseDateStr && /^\d{4}-\d{2}-\d{2}$/.test(baseDateStr)) {
      const [y, m, d] = baseDateStr.split('-').map(Number);
      base = new Date(y, m - 1, d);
    } else {
      base = new Date();
    }
    base.setDate(base.getDate() + offsetDays);
    const year = base.getFullYear();
    const month = String(base.getMonth() + 1).padStart(2, '0');
    const day = String(base.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Search state from InteractiveSearchBar
  const [searchCriteria, setSearchCriteria] = useState({
    destination: '',
    checkIn: '',
    checkOut: '',
    rooms: 1,
    guests: 2,
    isSearched: false
  });
  const [selectedHotelForRooms, setSelectedHotelForRooms] = useState(null);
  const [modalRooms, setModalRooms] = useState([]);
  const [modalRoomsLoading, setModalRoomsLoading] = useState(false);
  const [selectedRoomDetail, setSelectedRoomDetail] = useState(null);
  const resultsSectionRef = useRef(null);

  // Wishlist State & Handlers
  const [userWishlist, setUserWishlist] = useState([]);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setUserWishlist([]);
    }
  }, [user]);

  const fetchWishlist = async () => {
    try {
      const data = await wishlistService.getWishlist();
      const list = data.results || data;
      setUserWishlist(list.map((item) => item.hotel));
    } catch (err) {
      console.error('Failed to load user wishlist:', err);
    }
  };

  const handleToggleWishlist = async (e, hotel) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      showToast('Please sign in as a Customer to save hotels to your wishlist.', 'info');
      navigate('/login');
      return;
    }
    try {
      const data = await wishlistService.toggleWishlist(hotel.id);
      if (data.is_favorited) {
        setUserWishlist((prev) => [...prev, hotel.id]);
        showToast(`Saved "${hotel.name}" to your wishlist! ❤️`);
      } else {
        setUserWishlist((prev) => prev.filter((id) => id !== hotel.id));
        showToast(`Removed "${hotel.name}" from your wishlist.`);
      }
    } catch (err) {
      showToast('Failed to update wishlist.', 'error');
    }
  };

  // Scroll Ref for Popular Cities horizontal navigation
  const cityScrollRef = useRef(null);
  const [activeCities, setActiveCities] = useState([]);

  useEffect(() => {
    fetchAllProperties();
    fetchFeaturedHotels();
    fetchActiveCities();
  }, []);

  const fetchAllProperties = async () => {
    try {
      const data = await hotelService.getHotels();
      const rawList = data?.results || data || [];
      if (Array.isArray(rawList)) {
        setAllProperties(rawList);
      }
    } catch (e) {
      console.warn('Failed to load all properties for destinations:', e);
    }
  };

  const fetchActiveCities = async () => {
    try {
      const data = await hotelService.getCities();
      const list = Array.isArray(data) ? data : (data?.results || []);
      setActiveCities(list || []);
    } catch (err) {
      console.warn('Failed to load active cities:', err);
      setActiveCities([]);
    }
  };

  const fetchFeaturedHotels = async (category = selectedCategory) => {
    setLoadingHotels(true);
    setHotelError(false);
    try {
      const params = {};
      if (category === 'VILLAS') {
        params.property_type = 'VILLA,HOMESTAY';
      } else if (category === 'HOTELS') {
        params.property_type = 'HOTEL,RESORT';
      }
      const data = await hotelService.getHotels(params);
      const rawList = data.results || data || [];
      const sorted = [...rawList].sort((a, b) => {
        const ratingA = a.guest_rating !== null && a.guest_rating !== undefined ? parseFloat(a.guest_rating) : (a.star_rating || 0);
        const ratingB = b.guest_rating !== null && b.guest_rating !== undefined ? parseFloat(b.guest_rating) : (b.star_rating || 0);
        if (ratingB !== ratingA) return ratingB - ratingA;
        return (b.reviews_count || 0) - (a.reviews_count || 0);
      });
      setFeaturedHotels(sorted);
      setHotelError(false);
    } catch (err) {
      console.error('Failed to load featured hotels:', err);
      setFeaturedHotels([]);
      setHotelError(true);
      try {
        sessionStorage.removeItem('bmr_cached_featured_hotels');
        sessionStorage.removeItem('bmr_cached_active_cities');
      } catch (e) { }
    } finally {
      setLoadingHotels(false);
    }
  };

  // Derive popular cities dynamically from actual backend cities and hotels
  const popularCities = useMemo(() => {
    if (!activeCities || activeCities.length === 0) return [];
    return activeCities.map((cityName) => {
      const lowerCity = (cityName || '').toLowerCase();
      const propertiesPool = allProperties.length > 0 ? allProperties : featuredHotels;
      const hotelsInCity = propertiesPool.filter(
        (h) => (h.city || '').toLowerCase() === lowerCity
      );
      const firstImgHotel = hotelsInCity.find((h) => h.primary_image || h.cover_image || (h.images && h.images[0]?.display_url));
      const hotelImg = firstImgHotel?.primary_image || firstImgHotel?.cover_image || firstImgHotel?.images?.[0]?.display_url || null;
      const imgUrl = hotelImg || DEFAULT_CITY_IMAGES[lowerCity] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';

      return {
        name: cityName,
        count: `${hotelsInCity.length} Verified ${hotelsInCity.length === 1 ? 'Stay' : 'Stays'}`,
        image: imgUrl,
      };
    });
  }, [activeCities, allProperties, featuredHotels]);

  // Infinite loop array for slider
  const infinitePopularCities = useMemo(() => {
    if (popularCities.length === 0) return [];
    if (popularCities.length < 4) return [...popularCities, ...popularCities, ...popularCities, ...popularCities];
    return [...popularCities, ...popularCities, ...popularCities];
  }, [popularCities]);

  // Auto-slide 1 single card every 3 seconds (3000ms) with seamless infinite forward loop
  const [isPaused, setIsPaused] = useState(false);

  const slideNextCard = () => {
    if (cityScrollRef.current && popularCities.length > 0) {
      const container = cityScrollRef.current;
      const firstCard = container.querySelector('.destination-card') || container.children[0];
      const cardWidth = firstCard ? firstCard.getBoundingClientRect().width : 284;
      const cardStep = cardWidth + 24; // card width + gap (24px = gap-6)
      const singleSetWidth = popularCities.length * cardStep;

      // If we scrolled past the first set, instantly reset scrollLeft back by 1 set width without backward animation
      if (container.scrollLeft >= singleSetWidth) {
        container.style.scrollBehavior = 'auto';
        container.scrollLeft = container.scrollLeft - singleSetWidth;
        container.style.scrollBehavior = 'smooth';
      }

      container.scrollBy({ left: cardStep, behavior: 'smooth' });
    }
  };

  const slidePrevCard = () => {
    if (cityScrollRef.current && popularCities.length > 0) {
      const container = cityScrollRef.current;
      const firstCard = container.querySelector('.destination-card') || container.children[0];
      const cardWidth = firstCard ? firstCard.getBoundingClientRect().width : 284;
      const cardStep = cardWidth + 24;
      const singleSetWidth = popularCities.length * cardStep;

      if (container.scrollLeft <= 0) {
        container.style.scrollBehavior = 'auto';
        container.scrollLeft = singleSetWidth;
        container.style.scrollBehavior = 'smooth';
      }
      container.scrollBy({ left: -cardStep, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (isPaused || popularCities.length === 0) return;
    const timer = setInterval(() => {
      slideNextCard();
    }, 3000);

    return () => clearInterval(timer);
  }, [isPaused, popularCities.length]);

  // Selected Category: 'HOTELS' | 'VILLAS'
  const [selectedCategory, setSelectedCategory] = useState('HOTELS');

  // View Mode: 'list' | 'map'
  const [viewMode, setViewMode] = useState('list');
  const [sortBy, setSortBy] = useState('recommended');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Filter States
  const [priceMax, setPriceMax] = useState(15000);
  const [selectedStars, setSelectedStars] = useState([]);
  const [freeCancellation, setFreeCancellation] = useState(false);
  const [breakfastIncluded, setBreakfastIncluded] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  // Compute active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (priceMax < 15000) count += 1;
    if (selectedStars.length > 0) count += selectedStars.length;
    if (freeCancellation) count += 1;
    if (breakfastIncluded) count += 1;
    if (selectedAmenities.length > 0) count += selectedAmenities.length;
    return count;
  }, [priceMax, selectedStars, freeCancellation, breakfastIncluded, selectedAmenities]);

  const handleStarToggle = (star) => {
    setSelectedStars(prev =>
      prev.includes(star) ? prev.filter(s => s !== star) : [...prev, star]
    );
  };

  const handleAmenityToggle = (amenity) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handleResetFilters = () => {
    setPriceMax(15000);
    setSelectedStars([]);
    setFreeCancellation(false);
    setBreakfastIncluded(false);
    setSelectedAmenities([]);
  };

  const availableAmenities = [
    'WiFi', 'Swimming Pool', 'Air Conditioning', 'Free Parking',
    'Spa & Wellness', 'Gym / Fitness', 'Restaurant', 'Bar', 'Room Service'
  ];

  // Filter properties by selected category (Hotels/Resorts vs Villas/Homestays)
  const categoryFilteredHotels = useMemo(() => {
    if (!featuredHotels) return [];
    if (selectedCategory === 'VILLAS') {
      return featuredHotels.filter(h => h.property_type === 'VILLA' || h.property_type === 'HOMESTAY');
    }
    return featuredHotels.filter(h => h.property_type === 'HOTEL' || h.property_type === 'RESORT' || !h.property_type);
  }, [featuredHotels, selectedCategory]);

  // Combined Filters + Sorting Applied to Category Properties
  const displayedHotels = useMemo(() => {
    if (!categoryFilteredHotels) return [];
    let list = [...categoryFilteredHotels];

    // 0. Search Destination Filter (when user searched via Find Rooms)
    if (searchCriteria.isSearched && searchCriteria.destination) {
      const q = searchCriteria.destination.toLowerCase().trim().split(',')[0].trim();
      list = list.filter(h => {
        const name = (h.name || '').toLowerCase();
        const city = (h.city || '').toLowerCase();
        const state = (h.state || '').toLowerCase();
        const address = (h.address || '').toLowerCase();
        const dest = (h.destination || '').toLowerCase();
        return name.includes(q) || city.includes(q) || q.includes(city) || state.includes(q) || address.includes(q) || dest.includes(q);
      });
    }

    // 1. Price Max
    if (priceMax < 15000) {
      list = list.filter(h => (h.starting_price || 0) <= priceMax);
    }

    // 2. Star Rating
    if (selectedStars.length > 0) {
      list = list.filter(h => selectedStars.includes(Number(h.star_rating)));
    }

    // 3. Free Cancellation
    if (freeCancellation) {
      list = list.filter(h => h.rooms?.some(r => r.free_cancellation) || h.free_cancellation);
    }

    // 4. Breakfast Included
    if (breakfastIncluded) {
      list = list.filter(h => h.rooms?.some(r => r.breakfast_included) || h.breakfast_included);
    }

    // 5. Amenities
    if (selectedAmenities.length > 0) {
      list = list.filter(h => {
        const hotelAmenities = (h.amenities || []).map(a => (typeof a === 'string' ? a : a.name || '').toLowerCase());
        return selectedAmenities.every(reqAm => hotelAmenities.some(ha => ha.includes(reqAm.toLowerCase())));
      });
    }

    // 6. Sorting Logic
    list.sort((a, b) => {
      if (sortBy === 'price_low') {
        return (a.starting_price || 0) - (b.starting_price || 0);
      }
      if (sortBy === 'price_high') {
        return (b.starting_price || 0) - (a.starting_price || 0);
      }
      if (sortBy === 'rating') {
        return (Number(b.guest_rating) || 0) - (Number(a.guest_rating) || 0);
      }
      if (sortBy === 'newest') {
        return (b.id || 0) - (a.id || 0);
      }
      // recommended: highest rating & reviews first
      const scoreA = (Number(a.guest_rating) || 4.5) * 10 + (a.reviews_count || 0);
      const scoreB = (Number(b.guest_rating) || 4.5) * 10 + (b.reviews_count || 0);
      return scoreB - scoreA;
    });

    return list;
  }, [categoryFilteredHotels, priceMax, selectedStars, freeCancellation, breakfastIncluded, selectedAmenities, sortBy, searchCriteria]);

  // City Filter State for Featured Stays
  const [selectedCityFilter, setSelectedCityFilter] = useState('ALL');

  // Dynamic city categories from displayed properties
  const cityCategories = useMemo(() => {
    const cities = new Set(displayedHotels.map((h) => h.city).filter(Boolean));
    return ['ALL', ...Array.from(cities)];
  }, [displayedHotels]);

  const groupedHotelsByCity = useMemo(() => {
    const groups = {};
    displayedHotels.forEach((hotel) => {
      const cityKey = hotel.city || 'Other';
      if (!groups[cityKey]) groups[cityKey] = [];
      groups[cityKey].push(hotel);
    });
    return groups;
  }, [displayedHotels]);

  const activeCitiesList = Object.keys(groupedHotelsByCity);

  // Search Submission from InteractiveSearchBar (without navigating to /search)
  const handleSearchFromBar = (searchData) => {
    const dest = (searchData.destination || '').trim();
    const today = getTodayStr();
    const validIn = searchData.checkIn && searchData.checkIn >= today ? searchData.checkIn : today;
    const validOut = searchData.checkOut && searchData.checkOut > validIn ? searchData.checkOut : getTomorrowStr(validIn, 1);

    setSearchCriteria({
      destination: dest,
      checkIn: validIn,
      checkOut: validOut,
      rooms: Number(searchData.rooms) || 1,
      guests: Number(searchData.guests) || 2,
      isSearched: true
    });
    setShowRecentPopover(false);

    // If destination matches one of the city categories, adjust filter
    if (dest) {
      const cleanDest = dest.toLowerCase().split(',')[0].trim();
      const match = cityCategories.find(c => {
        const cl = (c || '').toLowerCase();
        return cl.includes(cleanDest) || cleanDest.includes(cl);
      });
      if (match) {
        setSelectedCityFilter(match);
      } else {
        setSelectedCityFilter('ALL');
      }
    } else {
      setSelectedCityFilter('ALL');
    }

    // Smooth scroll down to the hotels section
    const triggerScroll = () => {
      const el = document.getElementById('featured-hotels-section') || resultsSectionRef.current;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    setTimeout(triggerScroll, 80);
    setTimeout(triggerScroll, 250);
  };

  // Auto-scroll down to hotels section whenever a search is triggered
  useEffect(() => {
    if (searchCriteria.isSearched) {
      const timer = setTimeout(() => {
        const el = document.getElementById('featured-hotels-section') || resultsSectionRef.current;
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [searchCriteria.isSearched, searchCriteria.destination]);

  const handleClearSearch = () => {
    setSearchCriteria({
      destination: '',
      checkIn: '',
      checkOut: '',
      rooms: 1,
      guests: 2,
      isSearched: false
    });
    setSelectedCityFilter('ALL');
  };

  // Reset search and filters on global clearSearchFilter event (e.g. Logo click)
  useEffect(() => {
    const handleClearAll = () => {
      handleClearSearch();
      handleResetFilters();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('clearSearchFilter', handleClearAll);
    return () => window.removeEventListener('clearSearchFilter', handleClearAll);
  }, []);

  // Open Room Preview Modal for a hotel directly on Home page
  const handleOpenRoomsModal = async (hotel, e) => {
    if (e) e.stopPropagation();
    setSelectedHotelForRooms(hotel);
    setModalRoomsLoading(true);
    try {
      const checkInParam = searchCriteria.checkIn || '';
      const checkOutParam = searchCriteria.checkOut || '';
      const roomsParam = searchCriteria.rooms || 1;
      const res = await api.get(`/rooms/by-hotel/${hotel.id}/?check_in=${checkInParam}&check_out=${checkOutParam}&rooms=${roomsParam}`);
      const rList = res.data.results || res.data || [];
      setModalRooms(Array.isArray(rList) ? rList : []);
    } catch (err) {
      console.error('Failed to load rooms for hotel:', err);
      setModalRooms([]);
    } finally {
      setModalRoomsLoading(false);
    }
  };

  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [showRecentPopover, setShowRecentPopover] = useState(false);
  const recentPopoverRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('bmr_recently_viewed');
      if (!raw) {
        setRecentlyViewed([]);
        return;
      }
      const saved = JSON.parse(raw);
      // Strictly sanitize: ensure valid ID, valid non-empty string name, and remove dummy/corrupt records
      const clean = Array.isArray(saved)
        ? saved.filter(h => (
            h &&
            h.id != null &&
            typeof h.name === 'string' &&
            h.name.trim().length > 0 &&
            !h.name.toLowerCase().includes('test') &&
            !h.name.toLowerCase().includes('dummy')
          ))
        : [];
      setRecentlyViewed(clean);
      if (clean.length > 0) {
        localStorage.setItem('bmr_recently_viewed', JSON.stringify(clean));
      } else {
        localStorage.removeItem('bmr_recently_viewed');
      }
    } catch (e) {
      console.warn('Purged corrupted recently viewed storage entry:', e);
      setRecentlyViewed([]);
      localStorage.removeItem('bmr_recently_viewed');
    }
  }, []);

  const handleRemoveRecent = (e, idToRemove) => {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    const updated = recentlyViewed.filter(item => String(item.id) !== String(idToRemove));
    setRecentlyViewed(updated);
    try {
      if (updated.length > 0) {
        localStorage.setItem('bmr_recently_viewed', JSON.stringify(updated));
      } else {
        localStorage.removeItem('bmr_recently_viewed');
        localStorage.setItem('bmr_recently_viewed', '[]');
      }
    } catch (err) {
      console.warn('Storage error on remove recent:', err);
    }
  };

  const handleClearAllRecent = (e) => {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    setRecentlyViewed([]);
    setShowRecentPopover(false);
    try {
      localStorage.removeItem('bmr_recently_viewed');
      localStorage.setItem('bmr_recently_viewed', '[]');
      localStorage.removeItem('recently_viewed_hotels');
      sessionStorage.removeItem('bmr_recently_viewed');
    } catch (err) {
      console.warn('Storage error on clear recent:', err);
    }
    if (typeof showToast === 'function') {
      showToast('Cleared all recently viewed stays.', 'info');
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (recentPopoverRef.current && !recentPopoverRef.current.contains(e.target)) {
        setShowRecentPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Extract hotel photos from user database hotels for the hero mosaic grid
  const heroHotelPhotos = useMemo(() => {
    const pool = allProperties.length > 0 ? allProperties : featuredHotels;
    if (!pool || pool.length === 0) {
      return [];
    }
    const list = [];
    pool.forEach((hotel) => {
      if (hotel.primary_image) {
        list.push({
          id: hotel.id,
          name: hotel.name,
          city: hotel.city,
          url: hotel.primary_image,
          rating: hotel.guest_rating || hotel.star_rating,
        });
      }
      if (hotel.images && Array.isArray(hotel.images)) {
        hotel.images.forEach((img) => {
          const u = img.display_url || img.image_url || img.image;
          if (u && !list.some((item) => item.url === u)) {
            list.push({
              id: hotel.id,
              name: hotel.name,
              city: hotel.city,
              url: u,
              rating: hotel.guest_rating || hotel.star_rating,
            });
          }
        });
      }
    });

    return list;
  }, [featuredHotels]);

  const heroPhotos = heroHotelPhotos;
  const getPhoto = (index) => (heroPhotos.length > 0 ? heroPhotos[index % heroPhotos.length] : null);

  return (
    <div className="bg-[#eaf3f9] text-slate-900 min-h-screen overflow-x-clip">

      {/* HERO SECTION WITH STAYLURE-STYLE HEADLINE, CAPSULE SEARCH & REAL HOTEL PHOTO MOSAIC */}
      <section className="relative z-30 pt-8 pb-14 sm:pt-12 sm:pb-16 bg-gradient-to-b from-[#d5e7f5] via-[#e2eef7] to-[#eaf3f9] border-b border-sky-100/70">
        <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">

            {/* Left Column: Heading, Subtitle, Search Capsule, Recently Viewed */}
            <div className="lg:col-span-7 space-y-5 text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black text-slate-900 tracking-tight leading-[1.12]">
                {t('hero_title')}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 font-medium max-w-lg leading-relaxed">
                {t('hero_subtitle')}
              </p>

              {/* Pill Search Bar & Action Controls directly below it */}
              <div className="pt-1 relative z-30">
                <InteractiveSearchBar
                  selectedCategory={selectedCategory}
                  onTabChange={() => setShowRecentPopover(false)}
                  onSearch={handleSearchFromBar}
                />

                {/* SEARCH BAR SUB-ROW: Recently Viewed beside Filter Controls (List/Map, Filters Drawer, Sort By) */}
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2.5 relative z-20">
                  {/* RECENTLY VIEWED HOTELS BUTTON & POPUP */}
                  <div className="relative" ref={recentPopoverRef}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowRecentPopover((prev) => !prev);
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      className="px-4 py-2 rounded-full bg-white/95 hover:bg-white border border-slate-200/90 shadow-2xs hover:shadow-md text-xs font-extrabold text-slate-700 hover:text-[#207a72] flex items-center gap-2 transition-all cursor-pointer group"
                    >
                      <Clock className="w-3.5 h-3.5 text-[#207a72] group-hover:rotate-12 transition-transform" />
                      <span>
                        {t('recently_viewed')} {recentlyViewed && recentlyViewed.length > 0 ? `(${recentlyViewed.length})` : ''}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-[#207a72] transition-transform duration-200 ${showRecentPopover ? 'rotate-180' : ''}`} />
                    </button>

                    {/* DROPDOWN POPOVER */}
                    {showRecentPopover && (
                      <div
                        onMouseDown={(e) => e.stopPropagation()}
                        className="absolute top-full mt-2 left-0 w-80 sm:w-96 rounded-3xl bg-white/98 backdrop-blur-xl border border-slate-200 shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200 z-50 text-left"
                      >
                        <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-xl bg-teal-50 text-[#207a72]">
                              <Clock className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">{t('recently_viewed')}</h4>
                              <p className="text-[10px] text-slate-400 font-bold">Pick up right where you left off</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {recentlyViewed && recentlyViewed.length > 0 && (
                              <button
                                type="button"
                                onClick={handleClearAllRecent}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  handleClearAllRecent(e);
                                }}
                                onTouchEnd={(e) => {
                                  e.stopPropagation();
                                  handleClearAllRecent(e);
                                }}
                                className="text-xs font-black text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-all cursor-pointer px-2.5 py-1 rounded-lg active:scale-95 shadow-2xs shrink-0"
                                title="Clear all recent history"
                              >
                                {t('clear_all')}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowRecentPopover(false);
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                              title="Close"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                          {recentlyViewed && recentlyViewed.length > 0 ? (
                            recentlyViewed.map((item) => (
                              <div
                                key={item.id}
                                onClick={() => {
                                  setShowRecentPopover(false);
                                  navigate(`/hotels/${item.id}`);
                                }}
                                className="group p-2 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-teal-50/50 hover:border-teal-200 flex items-center justify-between gap-3 cursor-pointer transition-all"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <img
                                    src={item.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80'}
                                    alt={item.name}
                                    className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200"
                                  />
                                  <div className="min-w-0">
                                    <h5 className="text-xs font-black text-slate-800 group-hover:text-[#207a72] truncate transition-colors">
                                      {item.name}
                                    </h5>
                                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-[#207a72] shrink-0" /> {item.city}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => handleRemoveRecent(e, item.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-100/50 transition-colors cursor-pointer sm:opacity-0 sm:group-hover:opacity-100"
                                    title="Remove from history"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#207a72] group-hover:translate-x-1 transition-all" />
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="py-6 text-center space-y-2">
                              <Clock className="w-6 h-6 text-slate-300 mx-auto" />
                              <p className="text-xs font-bold text-slate-500">No recently viewed hotels</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Filters, View Mode Toggle, and Sort Buttons (under Find Rooms) */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* View Mode Toggle: List View / Map View */}
                    <div className="flex items-center bg-white/95 p-1 rounded-full border border-slate-200/90 shadow-2xs shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setViewMode('list');
                          const el = document.getElementById('featured-hotels-section') || resultsSectionRef.current;
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`py-1.5 px-3 rounded-full font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                          viewMode === 'list'
                            ? 'bg-[#0284C7] text-white shadow-[0_4px_12px_rgba(2,132,199,0.25)]'
                            : 'text-[#475569] hover:text-[#0F172A]'
                        }`}
                        title="Switch to List View"
                      >
                        <LayoutGrid className={`w-3.5 h-3.5 ${viewMode === 'list' ? 'text-white' : 'text-[#475569]'}`} />
                        <span>{t('list_view')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setViewMode('map');
                          const el = document.getElementById('featured-hotels-section') || resultsSectionRef.current;
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`py-1.5 px-3 rounded-full font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                          viewMode === 'map'
                            ? 'bg-[#0284C7] text-white shadow-[0_4px_12px_rgba(2,132,199,0.25)]'
                            : 'text-[#475569] hover:text-[#0F172A]'
                        }`}
                        title="Switch to Map View"
                      >
                        <Map className={`w-3.5 h-3.5 ${viewMode === 'map' ? 'text-white' : 'text-[#475569]'}`} />
                        <span>{t('map_view')}</span>
                      </button>
                    </div>

                    {/* Filter Drawer Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setShowFilterModal(true)}
                      className="py-2 px-3.5 rounded-full border border-slate-200/90 bg-white/95 hover:bg-white text-[#475569] hover:text-[#0F172A] transition-all font-black text-xs flex items-center gap-2 shadow-2xs hover:shadow-xs cursor-pointer shrink-0"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[#0284C7]" />
                      <span>{t('filters')}</span>
                      {activeFiltersCount > 0 ? (
                        <span className="w-5 h-5 rounded-full bg-[#0284C7] text-white text-[10px] font-black flex items-center justify-center">
                          {activeFiltersCount}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{t('all')}</span>
                      )}
                    </button>

                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-2 text-xs font-extrabold shrink-0 bg-white/95 border border-slate-200/90 px-3 py-1.5 rounded-full shadow-2xs">
                      <span className="text-slate-500 hidden sm:flex items-center gap-1 shrink-0 text-xs font-extrabold">
                        <ArrowUpDown className="w-3.5 h-3.5 text-rose-600" /> {t('sort_by')}:
                      </span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-transparent font-black text-xs text-slate-800 outline-none cursor-pointer pr-1"
                      >
                        <option value="recommended">{t('sort_recommended')}</option>
                        <option value="price_low">{t('sort_price_low_high')}</option>
                        <option value="price_high">{t('sort_price_high_low')}</option>
                        <option value="rating">{t('sort_rating_high_low')}</option>
                        <option value="newest">{t('sort_newest')}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Mosaic Grid of Real Database Hotel Photos */}
            <div className="lg:col-span-5 relative">
              <div className="grid grid-cols-3 gap-3 sm:gap-3.5">
                {/* Column 1 */}
                <div className="space-y-3 sm:space-y-3.5">
                  {[
                    { photo: getPhoto(0), h: 'h-36 sm:h-44' },
                    { photo: getPhoto(3), h: 'h-44 sm:h-52' },
                    { photo: getPhoto(6), h: 'h-32 sm:h-40' }
                  ].map((item, idx) => (
                    <div
                      key={`c1-${idx}`}
                      className={`relative ${item.h} rounded-2xl sm:rounded-3xl overflow-hidden shadow-md bg-slate-100 select-none pointer-events-none`}
                    >
                      {item.photo?.url ? (
                        <img
                          src={item.photo.url}
                          alt={item.photo.name}
                          loading="eager"
                          fetchPriority="high"
                          decoding="async"
                          className="w-full h-full object-cover select-none pointer-events-none transition-opacity duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-3 bg-gradient-to-br from-sky-100 to-teal-50 text-slate-400">
                          <Hotel className="w-6 h-6 text-teal-600/40 mb-1" />
                          <span className="text-[9px] font-bold text-slate-400 text-center">Verified Stays</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Column 2 */}
                <div className="space-y-3 sm:space-y-3.5">
                  {[
                    { photo: getPhoto(1), h: 'h-48 sm:h-56' },
                    { photo: getPhoto(4), h: 'h-36 sm:h-44' },
                    { photo: getPhoto(7), h: 'h-36 sm:h-44' }
                  ].map((item, idx) => (
                    <div
                      key={`c2-${idx}`}
                      className={`relative ${item.h} rounded-2xl sm:rounded-3xl overflow-hidden shadow-md bg-slate-100 select-none pointer-events-none`}
                    >
                      {item.photo?.url ? (
                        <img
                          src={item.photo.url}
                          alt={item.photo.name}
                          loading="eager"
                          fetchPriority="high"
                          decoding="async"
                          className="w-full h-full object-cover select-none pointer-events-none transition-opacity duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-3 bg-gradient-to-br from-sky-100 to-teal-50 text-slate-400">
                          <Hotel className="w-6 h-6 text-teal-600/40 mb-1" />
                          <span className="text-[9px] font-bold text-slate-400 text-center">Verified Stays</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Column 3 */}
                <div className="space-y-3 sm:space-y-3.5">
                  {[
                    { photo: getPhoto(2), h: 'h-36 sm:h-44' },
                    { photo: getPhoto(5), h: 'h-48 sm:h-56' },
                    { photo: getPhoto(8), h: 'h-32 sm:h-40' }
                  ].map((item, idx) => (
                    <div
                      key={`c3-${idx}`}
                      className={`relative ${item.h} rounded-2xl sm:rounded-3xl overflow-hidden shadow-md bg-slate-100 select-none pointer-events-none`}
                    >
                      {item.photo?.url ? (
                        <img
                          src={item.photo.url}
                          alt={item.photo.name}
                          loading="eager"
                          fetchPriority="high"
                          decoding="async"
                          className="w-full h-full object-cover select-none pointer-events-none transition-opacity duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-3 bg-gradient-to-br from-sky-100 to-teal-50 text-slate-400">
                          <Hotel className="w-6 h-6 text-teal-600/40 mb-1" />
                          <span className="text-[9px] font-bold text-slate-400 text-center">Verified Stays</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Gradient Fade */}
              <div className="pointer-events-none absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[#eaf3f9] via-[#eaf3f9]/70 to-transparent z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* POPULAR DESTINATIONS SLIDER - 1 SECOND AUTOMATIC STEPPING RECTANGLE CARDS */}
      {popularCities.length > 0 && (
        <section className="relative z-10 py-12 bg-[#eaf3f9]/80 border-b border-sky-100">

          <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
                  {t('popular_destinations')}
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                </h2>
              </div>
            </div>
          </div>

          {/* 1-Second Automatic Stepping Card Container */}
          <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8">
            <div
              ref={cityScrollRef}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              className="flex gap-6 overflow-x-auto scroll-smooth py-4 no-scrollbar border-b border-transparent"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {infinitePopularCities.map((city, index) => (
                <div
                  key={`${city.name}-${index}`}
                  onClick={() => {
                    handleSearchFromBar({
                      destination: city.name,
                      checkIn: searchCriteria.checkIn || getTodayStr(),
                      checkOut: searchCriteria.checkOut || getTomorrowStr(getTodayStr(), 1),
                      rooms: 1,
                      guests: 2
                    });
                  }}
                  className="destination-card w-full sm:w-[calc((100%-1.5rem)/2)] md:w-[calc((100%-3rem)/3)] lg:w-[calc((100%-4.5rem)/4)] min-w-full sm:min-w-[calc((100%-1.5rem)/2)] md:min-w-[calc((100%-3rem)/3)] lg:min-w-[calc((100%-4.5rem)/4)] max-w-full sm:max-w-[calc((100%-1.5rem)/2)] md:max-w-[calc((100%-3rem)/3)] lg:max-w-[calc((100%-4.5rem)/4)] group relative h-64 rounded-xl overflow-hidden cursor-pointer shadow-sm border border-slate-200 flex-shrink-0 transition-all duration-300 hover:border-slate-300 hover:shadow-md"
                >
                  {/* Background Image or Clean Placeholder */}
                  {city.image ? (
                    <img
                      src={city.image}
                      alt={city.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-sky-800 via-slate-800 to-teal-900 flex flex-col items-center justify-center p-4 text-center">
                      <Hotel className="w-10 h-10 text-white/30 mb-1" />
                      <span className="text-xs font-bold text-white/60">{city.name}</span>
                    </div>
                  )}

                  {/* Dark Vignette Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>

                  {/* Bottom Place Name Card */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="bg-black/60 px-3 py-2 rounded-lg flex flex-col gap-0.5 border border-white/20">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <h3 className="text-sm font-bold text-white tracking-tight truncate">
                          {city.name}
                        </h3>
                      </div>
                      <p className="text-[11px] font-medium text-slate-300 pl-5">
                        {city.count}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FEATURED HOTELS & VILLAS SECTION - SEPARATED BY CITY ROWS */}
      <section id="featured-hotels-section" ref={resultsSectionRef} className="py-14 max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 scroll-mt-6">

        {/* TOP CATEGORY SWITCHER TABS: [Hotels] | [Villas & Homestays] */}
        <div className="bg-[#eaf3f9] rounded-2xl border border-sky-200/80 shadow-xs px-4 pt-3 pb-1">
          <CategoryTabs
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setSelectedCityFilter('ALL');
              fetchFeaturedHotels(cat);
            }}
            className="mb-0 border-b-0"
          />
        </div>

        {/* Header & City Filter Tabs */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                {searchCriteria.isSearched
                  ? `Stays in ${searchCriteria.destination || 'All Locations'}`
                  : selectedCategory === 'VILLAS'
                  ? t('handpicked_luxury')
                  : t('featured_stays')}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {searchCriteria.isSearched
                  ? `Showing live properties and rooms available for booking`
                  : t('explore_top_cities')}
              </p>
            </div>
          </div>

          {/* Interactive City Filter Pills Header (List View Only) */}
          {viewMode === 'list' && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              {cityCategories.map((cityName) => (
                <button
                  key={cityName}
                  onClick={() => setSelectedCityFilter(cityName)}
                  className={`px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer whitespace-nowrap ${selectedCityFilter === cityName
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                >
                  {cityName === 'ALL' ? t('all') : cityName}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* LOADING STATE */}
        {loadingHotels ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="card-white animate-pulse p-3.5 space-y-3">
                <div className="w-full h-36 bg-slate-200 rounded-xl"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : hotelError ? (
          <div className="card-white p-12 text-center space-y-4 max-w-lg mx-auto border border-rose-200 shadow-sm">
            <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
            <h3 className="text-lg font-black text-slate-900">Unable to Connect to Server</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              We could not load featured stays from the backend database. Please ensure the backend server is running and try again.
            </p>
            <button
              onClick={() => {
                fetchFeaturedHotels();
                fetchActiveCities();
              }}
              className="btn-rose py-2.5 px-6 text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Connection
            </button>
          </div>
        ) : displayedHotels.length === 0 ? (
          <div className="card-white p-12 text-center space-y-3 max-w-md mx-auto">
            <Hotel className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-black text-slate-900">
              {searchCriteria.isSearched && searchCriteria.destination
                ? `No Properties Found in "${searchCriteria.destination}"`
                : activeFiltersCount > 0
                ? 'No Properties Match Filter'
                : `No ${selectedCategory === 'VILLAS' ? 'Villas or Homestays' : 'Hotels'} Available`}
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              {searchCriteria.isSearched
                ? 'Try searching for a different destination or resetting your search to see all available properties.'
                : activeFiltersCount > 0
                ? 'Try adjusting your price range, star rating, or amenities filters to see more results.'
                : 'No verified properties in this category are currently listed in the database.'}
            </p>
            <div className="pt-2">
              {searchCriteria.isSearched ? (
                <button
                  onClick={handleClearSearch}
                  className="btn-rose py-2 px-5 text-xs font-bold cursor-pointer"
                >
                  Clear Search & Show All Stays
                </button>
              ) : activeFiltersCount > 0 ? (
                <button
                  onClick={handleResetFilters}
                  className="btn-rose py-2 px-5 text-xs font-bold cursor-pointer"
                >
                  Reset All Filters
                </button>
              ) : (
                <button
                  onClick={fetchFeaturedHotels}
                  className="btn-rose py-2 px-5 text-xs font-bold cursor-pointer"
                >
                  Refresh Stays
                </button>
              )}
            </div>
          </div>
        ) : viewMode === 'map' ? (
          <div className="w-full">
            <HotelMapView
              hotels={displayedHotels}
              userWishlist={userWishlist}
              onToggleWishlist={handleToggleWishlist}
              activeCity={selectedCityFilter !== 'ALL' ? selectedCityFilter : ''}
            />
          </div>
        ) : (
          <div className="space-y-12">

            {/* If Selected City Filter is NOT 'ALL' or user searched via Find Rooms, show filtered hotels grid */}
            {selectedCityFilter !== 'ALL' || searchCriteria.isSearched ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-rose-600" />
                    <span>
                      {searchCriteria.isSearched && searchCriteria.destination
                        ? `Available Hotels in "${searchCriteria.destination}"`
                        : selectedCityFilter !== 'ALL'
                        ? `Hotels in ${selectedCityFilter}`
                        : 'All Matching Available Hotels'}
                    </span>
                    <span className="text-xs font-black text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                      {displayedHotels.length} {displayedHotels.length === 1 ? 'Hotel' : 'Hotels'}
                    </span>
                  </h3>
                  {searchCriteria.isSearched ? (
                    <button
                      onClick={handleClearSearch}
                      className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Clear Search & View All
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/search?city=${encodeURIComponent(selectedCityFilter)}`)}
                      className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      View All in {selectedCityFilter}
                    </button>
                  )}
                </div>

                {/* City / Search Specific Hotel Grid */}
                {displayedHotels.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {displayedHotels.map((hotel) => (
                      <div
                        key={hotel.id}
                        onClick={() => {
                          const cIn = searchCriteria.checkIn || '';
                          const cOut = searchCriteria.checkOut || '';
                          navigate(`/hotels/${hotel.id}?check_in=${cIn}&check_out=${cOut}&rooms=${searchCriteria.rooms}&guests=${searchCriteria.guests}`);
                        }}
                        className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col group"
                      >
                        {/* Compact Hotel Image & Badges */}
                        <div className="relative h-44 overflow-hidden bg-slate-100">
                          <img
                            src={hotel.primary_image || hotel.cover_image || (hotel.images && hotel.images[0]?.display_url) || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'}
                            alt={hotel.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2.5 right-2.5 bg-slate-900/80 px-2.5 py-1 rounded-md text-[11px] font-semibold text-white flex items-center gap-1.5 border border-white/20">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                            {hotel.reviews_count > 0 && hotel.guest_rating ? (
                              <>
                                <span className="font-bold text-amber-300">{Number(hotel.guest_rating).toFixed(1)}</span>
                                <span className="text-[10px] text-slate-300">({hotel.reviews_count})</span>
                              </>
                            ) : (
                              <span className="text-amber-300 font-semibold text-[10.5px]">New</span>
                            )}
                          </div>
                          <div className="absolute bottom-2.5 left-2.5 bg-slate-900/80 px-2.5 py-1 rounded-md text-[11px] font-semibold text-white flex items-center gap-1 border border-white/20">
                            <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                            <span>{hotel.city}</span>
                          </div>

                          {/* Wishlist Heart Button */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleWishlist(e, hotel)}
                            className={`absolute top-2.5 left-2.5 p-2 rounded-full backdrop-blur-md shadow-md transition-all duration-300 z-10 cursor-pointer ${userWishlist?.includes(hotel.id)
                              ? 'bg-rose-600 text-white hover:bg-rose-700 scale-105'
                              : 'bg-slate-900/60 text-white hover:bg-rose-600 hover:text-white'
                              }`}
                            title={userWishlist?.includes(hotel.id) ? 'Remove from Wishlist' : 'Save to Wishlist'}
                          >
                            <Heart className={`w-3.5 h-3.5 ${userWishlist?.includes(hotel.id) ? 'fill-current' : ''}`} />
                          </button>
                        </div>

                        {/* Details */}
                        <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-1">
                              {hotel.name}
                            </h3>
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                              {hotel.description || 'Luxury hospitality with world-class amenities and verified booking guarantees.'}
                            </p>
                          </div>
                          <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                            <div>
                              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Price From</span>
                              <span className="text-base font-black text-rose-600">₹{(hotel.starting_price || 2500).toLocaleString()}</span>
                              <span className="text-[10px] text-slate-500"> / night</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const cIn = searchCriteria.checkIn || '';
                                const cOut = searchCriteria.checkOut || '';
                                navigate(`/hotels/${hotel.id}?check_in=${cIn}&check_out=${cOut}&rooms=${searchCriteria.rooms || 1}&guests=${searchCriteria.guests || 2}`);
                              }}
                              className="btn-rose py-1.5 px-3.5 text-[11px] font-extrabold rounded-xl shadow-xs cursor-pointer"
                            >
                              Book Room
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="card-white p-8 text-center space-y-3">
                    <Hotel className="w-10 h-10 text-rose-600 mx-auto opacity-40" />
                    <p className="text-xs font-bold text-slate-500">
                      {searchCriteria.isSearched && searchCriteria.destination
                        ? `No stays found matching "${searchCriteria.destination}".`
                        : `No hotels currently listed in ${selectedCityFilter}.`}
                    </p>
                    {searchCriteria.isSearched ? (
                      <button onClick={handleClearSearch} className="btn-rose py-2 px-4 text-xs font-bold inline-block cursor-pointer">
                        Clear Search & Show All Stays
                      </button>
                    ) : (
                      <button onClick={() => navigate(`/search?city=${encodeURIComponent(selectedCityFilter)}`)} className="btn-rose py-2 px-4 text-xs font-bold inline-block">
                        Browse Search Index for {selectedCityFilter}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* SEPARATE LINE ROWS FOR EACH CITY WHEN 'ALL' IS SELECTED */
              activeCitiesList.map((cityName) => {
                const cityHotels = groupedHotelsByCity[cityName] || [];
                if (cityHotels.length === 0) return null;

                return (
                  <div key={cityName} className="space-y-4">
                    {/* Separate City Row Banner Header */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-black">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <span>{cityName} Stays</span>
                            <span className="text-[10.5px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                              {cityHotels.length} {cityHotels.length === 1 ? 'Hotel' : 'Hotels'}
                            </span>
                          </h3>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedCityFilter(cityName)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        See All in {cityName}
                      </button>
                    </div>

                    {/* Dedicated Horizontal Scrolling Row for this City */}
                    <div className="flex gap-5 overflow-x-auto pb-3 scroll-smooth no-scrollbar">
                      {cityHotels.map((hotel) => (
                        <div
                          key={hotel.id}
                          onClick={() => {
                            const cIn = searchCriteria.checkIn || '';
                            const cOut = searchCriteria.checkOut || '';
                            navigate(`/hotels/${hotel.id}?check_in=${cIn}&check_out=${cOut}&rooms=${searchCriteria.rooms}&guests=${searchCriteria.guests}`);
                          }}
                          className="min-w-[270px] max-w-[270px] bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col group shrink-0"
                        >
                          {/* Compact Hotel Image & Badges */}
                          <div className="relative h-44 overflow-hidden bg-slate-100">
                            <img
                              src={hotel.primary_image || hotel.cover_image || (hotel.images && hotel.images[0]?.display_url) || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'}
                              alt={hotel.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-2.5 right-2.5 bg-slate-900/80 px-2.5 py-1 rounded-md text-[11px] font-semibold text-white flex items-center gap-1.5 border border-white/20">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                              {hotel.reviews_count > 0 && hotel.guest_rating ? (
                                <>
                                  <span className="font-bold text-amber-300">{Number(hotel.guest_rating).toFixed(1)}</span>
                                  <span className="text-[10px] text-slate-300">({hotel.reviews_count})</span>
                                </>
                              ) : (
                                <span className="text-amber-300 font-semibold text-[10.5px]">New</span>
                              )}
                            </div>
                            <div className="absolute bottom-2.5 left-2.5 bg-slate-900/80 px-2.5 py-1 rounded-md text-[11px] font-semibold text-white flex items-center gap-1 border border-white/20">
                              <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                              <span>{hotel.city}</span>
                            </div>

                            {/* Wishlist Heart Button */}
                            <button
                              type="button"
                              onClick={(e) => handleToggleWishlist(e, hotel)}
                              className={`absolute top-2.5 left-2.5 p-2 rounded-full backdrop-blur-md shadow-md transition-all duration-300 z-10 cursor-pointer ${userWishlist?.includes(hotel.id)
                                ? 'bg-rose-600 text-white hover:bg-rose-700 scale-105'
                                : 'bg-slate-900/60 text-white hover:bg-rose-600 hover:text-white'
                                }`}
                              title={userWishlist?.includes(hotel.id) ? 'Remove from Wishlist' : 'Save to Wishlist'}
                            >
                              <Heart className={`w-3.5 h-3.5 ${userWishlist?.includes(hotel.id) ? 'fill-current' : ''}`} />
                            </button>
                          </div>

                          {/* Details */}
                          <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                            <div>
                              <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-1">
                                {hotel.name}
                              </h3>
                              <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                                {hotel.description || 'Luxury hospitality with world-class amenities and verified booking guarantees.'}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                              <div>
                                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">{t('price_from')}</span>
                                <span className="text-base font-black text-rose-600">₹{(hotel.starting_price || 2500).toLocaleString()}</span>
                                <span className="text-[10px] text-slate-500"> / {t('night')}</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const cIn = searchCriteria.checkIn || '';
                                  const cOut = searchCriteria.checkOut || '';
                                  navigate(`/hotels/${hotel.id}?check_in=${cIn}&check_out=${cOut}&rooms=${searchCriteria.rooms || 1}&guests=${searchCriteria.guests || 2}`);
                                }}
                                className="btn-rose py-1.5 px-3.5 text-[11px] font-extrabold rounded-xl shadow-xs cursor-pointer"
                              >
                                Book Room
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}

          </div>
        )}

        {/* FILTER SLIDE-OVER MODAL DRAWER */}
        {showFilterModal && (
          <div className="fixed inset-0 z-[999] bg-slate-950/60 backdrop-blur-xs flex justify-end animate-fade-in">
            <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-slide-left">

              {/* Modal Header */}
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-rose-600" />
                  <h3 className="text-base font-black text-slate-900">{t('filters')}</h3>
                  {activeFiltersCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowFilterModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-6 overflow-y-auto flex-grow space-y-6">

                {/* 1. Price Range Filter */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="text-slate-800 uppercase tracking-wider text-xs">{t('price_range')}</span>
                    <span className="text-rose-600 font-extrabold text-sm">₹{priceMax.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="15000"
                    step="500"
                    value={priceMax}
                    onChange={(e) => setPriceMax(parseInt(e.target.value))}
                    className="w-full accent-rose-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>₹1,000</span>
                    <span>₹15,000+</span>
                  </div>
                </div>

                {/* 2. Star Rating Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                    {t('star_rating')}
                  </label>
                  <div className="flex gap-2">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleStarToggle(star)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${selectedStars.includes(star)
                          ? 'bg-rose-50 border-rose-600 text-rose-600'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                      >
                        <span>{star}</span>
                        <Star className={`w-3.5 h-3.5 ${selectedStars.includes(star) ? 'fill-rose-600' : 'text-slate-400'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Popular Preferences */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                    {t('popular_filters')}
                  </label>
                  <div className="space-y-2.5">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer hover:text-slate-900">
                      <input
                        type="checkbox"
                        checked={freeCancellation}
                        onChange={(e) => setFreeCancellation(e.target.checked)}
                        className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 accent-rose-600 cursor-pointer"
                      />
                      <span>Free Cancellation Available</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer hover:text-slate-900">
                      <input
                        type="checkbox"
                        checked={breakfastIncluded}
                        onChange={(e) => setBreakfastIncluded(e.target.checked)}
                        className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 accent-rose-600 cursor-pointer"
                      />
                      <span>Breakfast Included</span>
                    </label>
                  </div>
                </div>

                {/* 4. Amenities Filter */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                    {t('amenities')}
                  </label>
                  <div className="space-y-2.5">
                    {availableAmenities.map((amenity) => (
                      <label key={amenity} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer hover:text-slate-900">
                        <input
                          type="checkbox"
                          checked={selectedAmenities.includes(amenity)}
                          onChange={() => handleAmenityToggle(amenity)}
                          className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 accent-rose-600 cursor-pointer"
                        />
                        <span>{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {t('clear_filters')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilterModal(false)}
                  className="btn-rose px-6 py-2.5 rounded-xl text-xs font-black flex-1 shadow-md shadow-rose-600/20"
                >
                  {t('apply_filters')} {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ROOM QUICK VIEW MODAL (IN-PLACE PREVIEW ON HOME PAGE) */}
        {selectedRoomDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200">
              
              {/* Modal Image Header */}
              <div className="relative h-56 bg-slate-100">
                <img
                  src={selectedRoomDetail.primary_image || (selectedRoomDetail.images && selectedRoomDetail.images[0]?.display_url) || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'}
                  alt={selectedRoomDetail.title}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setSelectedRoomDetail(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs px-3 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 border border-white/20">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>{selectedRoomDetail.hotel_name} • {selectedRoomDetail.hotel_city}</span>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                      {selectedRoomDetail.room_type || 'Standard'}
                    </span>
                    <span className="text-base font-black text-rose-600">
                      ₹{Number(selectedRoomDetail.price_per_night || 2500).toLocaleString()} <span className="text-xs text-slate-400 font-medium">/ night</span>
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-2">{selectedRoomDetail.title}</h3>
                  {selectedRoomDetail.description && (
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{selectedRoomDetail.description}</p>
                  )}
                </div>

                {/* Features & Specs */}
                <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 text-xs text-slate-700 font-medium">
                  <div className="flex items-center gap-2">
                    <span>🛏️ Bed:</span>
                    <span className="font-bold text-slate-900">{selectedRoomDetail.bed_type || 'Double Bed'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>👥 Capacity:</span>
                    <span className="font-bold text-slate-900">{selectedRoomDetail.capacity_adults || 2} Adults{selectedRoomDetail.capacity_children ? `, ${selectedRoomDetail.capacity_children} Children` : ''}</span>
                  </div>
                  {selectedRoomDetail.room_size_sqft && (
                    <div className="flex items-center gap-2">
                      <span>📐 Size:</span>
                      <span className="font-bold text-slate-900">{selectedRoomDetail.room_size_sqft} sq.ft</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span>🏨 Hotel:</span>
                    <span className="font-bold text-slate-900 truncate">{selectedRoomDetail.hotel_name}</span>
                  </div>
                </div>

                {/* Amenities */}
                {selectedRoomDetail.amenities && selectedRoomDetail.amenities.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider">Amenities</h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedRoomDetail.amenities.map(a => (
                        <span key={a.id || a.name} className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>{a.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedRoomDetail(null)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cIn = searchCriteria.checkIn || getTodayStr();
                    const cOut = searchCriteria.checkOut || getTomorrowStr(cIn, 1);
                    navigate(`/booking/${selectedRoomDetail.id}?check_in=${cIn}&check_out=${cOut}&rooms=${searchCriteria.rooms || 1}&guests=${searchCriteria.guests || 2}`);
                  }}
                  className="btn-rose py-2 px-5 text-xs font-black rounded-xl cursor-pointer shadow-md"
                >
                  Proceed to Book
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ROOM PREVIEW MODAL - SHOWN DIRECTLY ON HOME PAGE WITHOUT REDIRECT */}
        {selectedHotelForRooms && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">

              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/70">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-100 text-[#0284C7] flex items-center justify-center shrink-0">
                    <BedDouble className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base line-clamp-1">{selectedHotelForRooms.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 font-medium mt-0.5">
                      <MapPin className="w-3 h-3 text-rose-500" />
                      <span>{selectedHotelForRooms.city || selectedHotelForRooms.address}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedHotelForRooms(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Selected Dates & Guest Info Banner */}
              <div className="bg-sky-50 px-5 py-2.5 border-b border-sky-100 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-sky-900">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-600" />
                  <span>Stay: {searchCriteria.checkIn || getTodayStr()} → {searchCriteria.checkOut || getTomorrowStr(searchCriteria.checkIn || getTodayStr(), 1)}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-sky-600" />
                  <span>{searchCriteria.guests || 2} Guests • {searchCriteria.rooms || 1} Room</span>
                </span>
              </div>

              {/* Rooms List Body */}
              <div className="p-5 overflow-y-auto space-y-3.5 flex-1 max-h-[58vh]">
                {modalRoomsLoading ? (
                  <div className="py-14 text-center space-y-3">
                    <div className="w-9 h-9 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-bold text-slate-500">Checking room availability...</p>
                  </div>
                ) : modalRooms.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <BedDouble className="w-12 h-12 text-slate-300 mx-auto" />
                    <h4 className="text-sm font-black text-slate-800">No specific rooms found for this property</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      You can view full details or explore other verified stays in this destination.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const cIn = searchCriteria.checkIn || '';
                        const cOut = searchCriteria.checkOut || '';
                        navigate(`/hotels/${selectedHotelForRooms.id}?check_in=${cIn}&check_out=${cOut}&rooms=${searchCriteria.rooms}&guests=${searchCriteria.guests}`);
                      }}
                      className="btn-rose text-xs py-2 px-5 font-bold cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span>View Full Property Page</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {modalRooms.map((room) => {
                      const roomImg = (room.images && room.images[0]?.display_url) || room.primary_image || selectedHotelForRooms.primary_image || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80';
                      return (
                        <div
                          key={room.id}
                          className="border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-sky-300 hover:shadow-xs transition-all bg-white"
                        >
                          <div className="flex items-center gap-3.5">
                            <img
                              src={roomImg}
                              alt={room.title}
                              className="w-20 h-20 rounded-xl object-cover shrink-0 bg-slate-100 border border-slate-100"
                            />
                            <div className="space-y-1">
                              <h4 className="text-sm font-black text-slate-900">{room.title}</h4>
                              <p className="text-xs text-slate-500 font-medium">
                                {room.room_type || 'Standard'} • {room.bed_type || 'Double Bed'}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                Max Capacity: {room.capacity_adults || 2} Adults{room.capacity_children ? `, ${room.capacity_children} Children` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            <div>
                              <span className="text-base font-black text-rose-600">₹{Number(room.price_per_night || 2500).toLocaleString()}</span>
                              <span className="text-[10px] text-slate-400"> / night</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const checkInVal = searchCriteria.checkIn || getTodayStr();
                                const checkOutVal = searchCriteria.checkOut || getTomorrowStr(checkInVal, 1);
                                navigate(`/booking/${room.id}?check_in=${checkInVal}&check_out=${checkOutVal}&rooms=${searchCriteria.rooms || 1}&guests=${searchCriteria.guests || 2}`);
                              }}
                              className="btn-rose text-xs py-1.5 px-4 font-black rounded-xl cursor-pointer"
                            >
                              Book Room
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedHotelForRooms(null)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const checkInVal = searchCriteria.checkIn || '';
                    const checkOutVal = searchCriteria.checkOut || '';
                    navigate(`/hotels/${selectedHotelForRooms.id}?check_in=${checkInVal}&check_out=${checkOutVal}&rooms=${searchCriteria.rooms || 1}&guests=${searchCriteria.guests || 2}`);
                  }}
                  className="text-xs font-black text-[#0284C7] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View Full Property Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ROOM QUICK VIEW MODAL (IN-PLACE PREVIEW ON HOME PAGE) */}
        {selectedRoomDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200">
              
              {/* Modal Image Header */}
              <div className="relative h-56 bg-slate-100">
                <img
                  src={selectedRoomDetail.primary_image || (selectedRoomDetail.images && selectedRoomDetail.images[0]?.display_url) || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'}
                  alt={selectedRoomDetail.title}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setSelectedRoomDetail(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs px-3 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 border border-white/20">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>{selectedRoomDetail.hotel_name} • {selectedRoomDetail.hotel_city}</span>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                      {selectedRoomDetail.room_type || 'Standard'}
                    </span>
                    <span className="text-base font-black text-rose-600">
                      ₹{Number(selectedRoomDetail.price_per_night || 2500).toLocaleString()} <span className="text-xs text-slate-400 font-medium">/ night</span>
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-2">{selectedRoomDetail.title}</h3>
                  {selectedRoomDetail.description && (
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{selectedRoomDetail.description}</p>
                  )}
                </div>

                {/* Features & Specs */}
                <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 text-xs text-slate-700 font-medium">
                  <div className="flex items-center gap-2">
                    <span>🛏️ Bed:</span>
                    <span className="font-bold text-slate-900">{selectedRoomDetail.bed_type || 'Double Bed'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>👥 Capacity:</span>
                    <span className="font-bold text-slate-900">{selectedRoomDetail.capacity_adults || 2} Adults{selectedRoomDetail.capacity_children ? `, ${selectedRoomDetail.capacity_children} Children` : ''}</span>
                  </div>
                  {selectedRoomDetail.room_size_sqft && (
                    <div className="flex items-center gap-2">
                      <span>📐 Size:</span>
                      <span className="font-bold text-slate-900">{selectedRoomDetail.room_size_sqft} sq.ft</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span>🏨 Hotel:</span>
                    <span className="font-bold text-slate-900 truncate">{selectedRoomDetail.hotel_name}</span>
                  </div>
                </div>

                {/* Amenities */}
                {selectedRoomDetail.amenities && selectedRoomDetail.amenities.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider">Amenities</h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedRoomDetail.amenities.map(a => (
                        <span key={a.id || a.name} className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>{a.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedRoomDetail(null)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cIn = searchCriteria.checkIn || getTodayStr();
                    const cOut = searchCriteria.checkOut || getTomorrowStr(cIn, 1);
                    navigate(`/booking/${selectedRoomDetail.id}?check_in=${cIn}&check_out=${cOut}&rooms=${searchCriteria.rooms || 1}&guests=${searchCriteria.guests || 2}`);
                  }}
                  className="btn-rose py-2 px-5 text-xs font-black rounded-xl cursor-pointer shadow-md"
                >
                  Proceed to Book
                </button>
              </div>

            </div>
          </div>
        )}
      </section>

    </div>
  );
};

export default Home;
