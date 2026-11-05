import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Calendar, Users, Hotel, ShieldCheck,
  Star, Sparkles, Compass, CheckCircle2, ArrowRight, Tag,
  ChevronLeft, ChevronRight, Heart, Wifi, Coffee, Tv,
  Clock, ChevronDown, X
} from 'lucide-react';
import api from '../services/api';
import InteractiveSearchBar from '../components/InteractiveSearchBar';
import CategoryTabs from '../components/CategoryTabs';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, showToast } = useAuth();

  const [featuredHotels, setFeaturedHotels] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(true);

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
      const res = await api.get('/wishlist/');
      const list = res.data.results || res.data;
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
      const res = await api.post(`/wishlist/toggle/${hotel.id}/`);
      if (res.data.is_favorited) {
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

  useEffect(() => {
    fetchFeaturedHotels();
  }, []);

  const fetchFeaturedHotels = async () => {
    setLoadingHotels(true);
    try {
      const res = await api.get('/hotels/');
      const rawList = res.data.results || res.data;
      const sorted = [...rawList].sort((a, b) => {
        const ratingA = a.guest_rating !== null && a.guest_rating !== undefined ? parseFloat(a.guest_rating) : (a.star_rating || 0);
        const ratingB = b.guest_rating !== null && b.guest_rating !== undefined ? parseFloat(b.guest_rating) : (b.star_rating || 0);
        if (ratingB !== ratingA) return ratingB - ratingA;
        return (b.reviews_count || 0) - (a.reviews_count || 0);
      });
      setFeaturedHotels(sorted);
    } catch (err) {
      console.error('Failed to load featured hotels:', err);
    } finally {
      setLoadingHotels(false);
    }
  };

  // Auto-slide 1 single card every 3 seconds (3000ms) with seamless infinite forward loop
  const [isPaused, setIsPaused] = useState(false);

  const slideNextCard = () => {
    if (cityScrollRef.current) {
      const container = cityScrollRef.current;
      const cardStep = 284; // 260px card width + 24px gap
      const singleSetWidth = popularCities.length * cardStep; // 12 * 284 = 3408px

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
    if (cityScrollRef.current) {
      const container = cityScrollRef.current;
      const cardStep = 284;
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
    if (isPaused) return;
    const timer = setInterval(() => {
      slideNextCard();
    }, 3000);

    return () => clearInterval(timer);
  }, [isPaused]);

  // Comprehensive list of all major Indian popular cities
  const popularCities = [
    { name: 'Ahmedabad', count: 'Verified Hotels', image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80' },
    { name: 'Surat', count: 'Diamond & Silk City Stays', image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80' },
    { name: 'Mumbai', count: 'Luxury Stays', image: 'https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=600&q=80' },
    { name: 'Goa', count: 'Beach Resorts', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80' },
    { name: 'Jaipur', count: 'Heritage Palaces', image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=600&q=80' },
    { name: 'Udaipur', count: 'Lake Palaces', image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80' },
  ];

  // Tripled cities array for seamless infinite looping without visible reset
  const infinitePopularCities = [...popularCities, ...popularCities, ...popularCities];

  // Selected Category: 'HOTELS' | 'VILLAS'
  const [selectedCategory, setSelectedCategory] = useState('HOTELS');

  // Filter properties by selected category (Hotels/Resorts vs Villas/Homestays)
  const categoryFilteredHotels = useMemo(() => {
    if (!featuredHotels) return [];
    if (selectedCategory === 'VILLAS') {
      return featuredHotels.filter(h => h.property_type === 'VILLA' || h.property_type === 'HOMESTAY');
    }
    return featuredHotels.filter(h => h.property_type === 'HOTEL' || h.property_type === 'RESORT' || !h.property_type);
  }, [featuredHotels, selectedCategory]);

  // City Filter State for Featured Stays
  const [selectedCityFilter, setSelectedCityFilter] = useState('ALL');

  // Dynamic city categories from category-filtered properties
  const cityCategories = React.useMemo(() => {
    const cities = new Set(categoryFilteredHotels.map((h) => h.city).filter(Boolean));
    return ['ALL', ...Array.from(cities)];
  }, [categoryFilteredHotels]);

  const groupedHotelsByCity = React.useMemo(() => {
    const groups = {};
    categoryFilteredHotels.forEach((hotel) => {
      const cityKey = hotel.city || 'Other';
      if (!groups[cityKey]) groups[cityKey] = [];
      groups[cityKey].push(hotel);
    });
    return groups;
  }, [categoryFilteredHotels]);

  const activeCitiesList = Object.keys(groupedHotelsByCity);

  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [showRecentPopover, setShowRecentPopover] = useState(false);
  const recentPopoverRef = useRef(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('bmr_recently_viewed') || '[]');
      // Filter out any test/dummy hotels automatically
      const clean = Array.isArray(saved)
        ? saved.filter(h => h && h.name && !h.name.toLowerCase().includes('test'))
        : [];
      setRecentlyViewed(clean);
      localStorage.setItem('bmr_recently_viewed', JSON.stringify(clean));
    } catch (e) {
      setRecentlyViewed([]);
    }
  }, []);

  const handleRemoveRecent = (e, idToRemove) => {
    e.stopPropagation();
    const updated = recentlyViewed.filter(item => item.id !== idToRemove);
    setRecentlyViewed(updated);
    localStorage.setItem('bmr_recently_viewed', JSON.stringify(updated));
  };

  const handleClearAllRecent = (e) => {
    e.stopPropagation();
    setRecentlyViewed([]);
    localStorage.removeItem('bmr_recently_viewed');
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
    if (!featuredHotels || featuredHotels.length === 0) return [];
    const list = [];
    featuredHotels.forEach((hotel) => {
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

  const fallbackHeroPhotos = [
    { id: 1, name: 'The Grand Royal Palace & Resort', city: 'Ahmedabad', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80' },
    { id: 2, name: 'Marine Horizon Bay Hotel', city: 'Mumbai', url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80' },
    { id: 3, name: 'Goa Palms Beach Resort & Spa', city: 'Goa', url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80' },
    { id: 28, name: 'The Palm Serenity Private Pool Villa', city: 'Goa', url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80' },
    { id: 29, name: 'Lakeview Heritage Villa & Homestay', city: 'Udaipur', url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80' },
    { id: 30, name: 'Whispering Pines Forest Villa', city: 'Jaipur', url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80' },
    { id: 31, name: 'The Royal Courtyard Traditional Homestay', city: 'Surat', url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80' },
    { id: 32, name: 'oyo Standard Stay', city: 'Ahmedabad', url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80' },
    { id: 1, name: 'Luxury Pool Resort', city: 'Goa', url: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80' }
  ];

  const heroPhotos = heroHotelPhotos.length >= 3 ? heroHotelPhotos : fallbackHeroPhotos;
  const getPhoto = (index) => heroPhotos[index % heroPhotos.length];

  return (
    <div className="bg-[#eaf3f9] text-slate-900 min-h-screen overflow-x-clip">

      {/* HERO SECTION WITH STAYLURE-STYLE HEADLINE, CAPSULE SEARCH & REAL HOTEL PHOTO MOSAIC */}
      <section className="relative z-30 pt-8 pb-14 sm:pt-12 sm:pb-16 bg-gradient-to-b from-[#d5e7f5] via-[#e2eef7] to-[#eaf3f9] border-b border-sky-100/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* Left Column: Heading, Subtitle, Search Capsule, Recently Viewed */}
            <div className="lg:col-span-7 space-y-5 text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black text-slate-900 tracking-tight leading-[1.12]">
                Discover Stays<br />
                Tailored Just For You
              </h1>
              <p className="text-sm sm:text-base text-slate-600 font-medium max-w-lg leading-relaxed">
                Discover Handpicked Hotels, Resorts, And Home-Stays That Match Your Mood, Budget, And Location.
              </p>

              {/* Pill Search Bar */}
              <div className="pt-2">
                <InteractiveSearchBar selectedCategory={selectedCategory} />
              </div>

              {/* RECENTLY VIEWED HOTELS / RECENT SEARCHES BUTTON & POPUP */}
              <div className="pt-1 flex items-center relative z-40" ref={recentPopoverRef}>
                <button
                  onClick={() => setShowRecentPopover(!showRecentPopover)}
                  className="px-4 py-2 rounded-full bg-white/90 hover:bg-white border border-slate-200/90 shadow-2xs hover:shadow-md text-xs font-extrabold text-slate-700 hover:text-[#207a72] flex items-center gap-2 transition-all cursor-pointer group"
                >
                  <Clock className="w-3.5 h-3.5 text-[#207a72] group-hover:rotate-12 transition-transform" />
                  <span>
                    Recently Viewed Hotels {recentlyViewed && recentlyViewed.length > 0 ? `(${recentlyViewed.length})` : ''}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-[#207a72] transition-transform duration-200 ${showRecentPopover ? 'rotate-180' : ''}`} />
                </button>

                {/* DROPDOWN POPOVER */}
                {showRecentPopover && (
                  <div className="absolute top-full mt-2 w-80 sm:w-96 rounded-3xl bg-white/98 backdrop-blur-xl border border-slate-200 shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200 z-50 text-left">
                    <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-xl bg-teal-50 text-[#207a72]">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Recently Viewed Stays</h4>
                          <p className="text-[10px] text-slate-400 font-bold">Pick up right where you left off</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {recentlyViewed && recentlyViewed.length > 0 && (
                          <button
                            onClick={handleClearAllRecent}
                            className="text-[10px] font-bold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer px-1 py-0.5 rounded"
                            title="Clear recent history"
                          >
                            Clear All
                          </button>
                        )}
                        <button
                          onClick={() => setShowRecentPopover(false)}
                          className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
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
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-100/50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                title="Remove from history"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#207a72] group-hover:translate-x-1 transition-all" />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-6 text-center space-y-3">
                          <Sparkles className="w-6 h-6 text-slate-300 mx-auto" />
                          <p className="text-xs font-bold text-slate-500">No recent views yet</p>
                          <div className="space-y-1.5 pt-1">
                            <div
                              onClick={() => { setShowRecentPopover(false); navigate('/search?city=Goa'); }}
                              className="p-2 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 text-xs font-bold text-slate-700 hover:text-[#207a72] flex items-center justify-between cursor-pointer"
                            >
                              <span>Explore Stays in Goa</span>
                              <ArrowRight className="w-3.5 h-3.5 text-[#207a72]" />
                            </div>
                            <div
                              onClick={() => { setShowRecentPopover(false); navigate('/search?city=Mumbai'); }}
                              className="p-2 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 text-xs font-bold text-slate-700 hover:text-[#207a72] flex items-center justify-between cursor-pointer"
                            >
                              <span>Explore Stays in Mumbai</span>
                              <ArrowRight className="w-3.5 h-3.5 text-[#207a72]" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
                      className={`relative ${item.h} rounded-2xl sm:rounded-3xl overflow-hidden shadow-md bg-slate-200 select-none pointer-events-none`}
                    >
                      <img
                        src={item.photo.url}
                        alt={item.photo.name}
                        className="w-full h-full object-cover select-none pointer-events-none"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
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
                      className={`relative ${item.h} rounded-2xl sm:rounded-3xl overflow-hidden shadow-md bg-slate-200 select-none pointer-events-none`}
                    >
                      <img
                        src={item.photo.url}
                        alt={item.photo.name}
                        className="w-full h-full object-cover select-none pointer-events-none"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
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
                      className={`relative ${item.h} rounded-2xl sm:rounded-3xl overflow-hidden shadow-md bg-slate-200 select-none pointer-events-none`}
                    >
                      <img
                        src={item.photo.url}
                        alt={item.photo.name}
                        className="w-full h-full object-cover select-none pointer-events-none"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
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
      <section className="relative z-10 py-12 bg-[#eaf3f9]/80 border-b border-sky-100">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            ref={cityScrollRef}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="flex gap-6 overflow-x-auto scroll-smooth py-4 pr-4 no-scrollbar border-b border-transparent"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {infinitePopularCities.map((city, index) => (
              <div
                key={`${city.name}-${index}`}
                onClick={() => navigate(`/search?city=${encodeURIComponent(city.name)}`)}
                className="min-w-[260px] max-w-[260px] group relative h-64 rounded-xl overflow-hidden cursor-pointer shadow-sm border border-slate-200 flex-shrink-0 transition-all duration-300 hover:border-slate-300 hover:shadow-md"
              >
                {/* Background Image */}
                <img
                  src={city.image}
                  alt={city.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />

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

      {/* FEATURED HOTELS & VILLAS SECTION - SEPARATED BY CITY ROWS */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* TOP CATEGORY SWITCHER TABS: [Hotels] | [Villas & Homestays] */}
        <div className="bg-[#eaf3f9] rounded-2xl border border-sky-200/80 shadow-xs px-4 pt-3 pb-1">
          <CategoryTabs
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setSelectedCityFilter('ALL');
            }}
            className="mb-0 border-b-0"
          />
        </div>

        {/* Header & City Filter Tabs */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                {selectedCategory === 'VILLAS' ? 'Featured Villa & Homestay Stays' : 'Featured Hotel Stays'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Explore luxury properties separated by destination cities
              </p>
            </div>

            <button
              onClick={() => navigate(selectedCategory === 'VILLAS' ? '/search?property_type=VILLA,HOMESTAY' : '/search?property_type=HOTEL,RESORT')}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 bg-rose-50 px-3.5 py-1.5 rounded-xl border border-rose-200 transition-all hover:bg-rose-100"
            >
              Explore All Cities <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Interactive City Filter Pills Header */}
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
                {cityName === 'ALL' ? 'All City Rows' : cityName}
              </button>
            ))}
          </div>
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
        ) : (
          <div className="space-y-12">

            {/* If Selected City Filter is NOT 'ALL', show filtered hotels for that city */}
            {selectedCityFilter !== 'ALL' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-rose-600" />
                    <span>Hotels in {selectedCityFilter}</span>
                  </h3>
                  <button
                    onClick={() => navigate(`/search?city=${encodeURIComponent(selectedCityFilter)}`)}
                    className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
                  >
                    View All in {selectedCityFilter}
                  </button>
                </div>

                {/* City Specific Hotel Grid */}
                {groupedHotelsByCity[selectedCityFilter] && groupedHotelsByCity[selectedCityFilter].length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {groupedHotelsByCity[selectedCityFilter].map((hotel) => (
                      <div
                        key={hotel.id}
                        onClick={() => navigate(`/hotels/${hotel.id}`)}
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
                            <button className="btn-rose py-1.5 px-3.5 text-[11px] font-extrabold rounded-xl">
                              View Stay
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="card-white p-8 text-center space-y-3">
                    <Hotel className="w-10 h-10 text-rose-600 mx-auto opacity-40" />
                    <p className="text-xs font-bold text-slate-500">No hotels currently listed in {selectedCityFilter}.</p>
                    <button onClick={() => navigate(`/search?city=${encodeURIComponent(selectedCityFilter)}`)} className="btn-rose py-2 px-4 text-xs font-bold inline-block">
                      Browse Search Index for {selectedCityFilter}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* SEPARATE LINE ROWS FOR EACH CITY WHEN 'ALL' IS SELECTED */
              (activeCitiesList.length > 0 ? activeCitiesList : ['Ahmedabad', 'Goa', 'Udaipur', 'Mumbai', 'Jaipur']).map((cityName) => {
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
                        onClick={() => navigate(`/search?city=${encodeURIComponent(cityName)}`)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1"
                      >
                        See All in {cityName}
                      </button>
                    </div>

                    {/* Dedicated Horizontal Scrolling Row for this City */}
                    <div className="flex gap-5 overflow-x-auto pb-3 scroll-smooth no-scrollbar">
                      {cityHotels.map((hotel) => (
                        <div
                          key={hotel.id}
                          onClick={() => navigate(`/hotels/${hotel.id}`)}
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
                              className={`absolute top-2.5 left-2.5 p-2 rounded-full backdrop-blur-md shadow-md transition-all duration-300 z-10 cursor-pointer ${
                                userWishlist.includes(hotel.id)
                                  ? 'bg-rose-600 text-white hover:bg-rose-700 scale-105'
                                  : 'bg-slate-900/60 text-white hover:bg-rose-600 hover:text-white'
                              }`}
                              title={userWishlist.includes(hotel.id) ? 'Remove from Wishlist' : 'Save to Wishlist'}
                            >
                              <Heart className={`w-3.5 h-3.5 ${userWishlist.includes(hotel.id) ? 'fill-current' : ''}`} />
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
                              <button className="btn-rose py-1.5 px-3.5 text-[11px] font-extrabold rounded-xl shadow-xs">
                                View Stay
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
      </section>

    </div>
  );
};

export default Home;


