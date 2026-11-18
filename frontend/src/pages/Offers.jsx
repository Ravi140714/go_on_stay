import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Tag, Sparkles, Percent, Gift, CheckCircle2, Copy,
  Calendar, ArrowRight, ShieldCheck, Hotel, Clock
} from 'lucide-react';
import api from '../services/api';
import { couponService } from '../services';
import { useAuth } from '../context/AuthContext';

const Offers = () => {
  const { showToast } = useAuth();
  const [copiedCode, setCopiedCode] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveCoupons();
  }, []);

  const fetchActiveCoupons = async () => {
    setLoading(true);
    try {
      const data = await couponService.getAvailableCoupons();
      const list = data?.available_coupons || data?.coupons || data?.results || (Array.isArray(data) ? data : []);
      // Filter only currently active coupons
      const activeOnly = list.filter(c => c && c.is_active !== false);
      setCoupons(activeOnly);
    } catch (err) {
      console.error('Failed to load coupons:', err);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Promo Code "${code}" copied to clipboard!`, 'success');
    setTimeout(() => {
      setCopiedCode(null);
    }, 2500);
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen pb-24 selection:bg-rose-600 selection:text-white">
      
      {/* HERO BANNER */}
      <section className="relative py-16 bg-gradient-to-b from-rose-950 via-slate-950 to-slate-900 text-white overflow-hidden border-b border-white/10">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-rose-600/15 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full bg-amber-500/15 blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-black uppercase tracking-wider mb-6 backdrop-blur-md shadow-xs">
            <Gift className="w-4 h-4 text-rose-400" />
            Special Deals & Promo Discounts
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6">
            Exclusive Hotel Offers & <br />
            <span className="bg-gradient-to-r from-rose-400 via-rose-500 to-amber-300 bg-clip-text text-transparent">
              Direct Booking Savings
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8 font-medium">
            Copy active promo codes, unlock instant discounts, and book verified boutique hotels at the lowest guaranteed rates in India.
          </p>
        </div>
      </section>

      {/* OFFERS CARDS GRID */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold text-slate-500">Loading active offers...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3 shadow-sm">
            <Tag className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-black text-slate-900">No Active Promotional Offers</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              There are no active public coupon codes available at the moment. Please check back soon or browse verified stays.
            </p>
            <div className="pt-2">
              <Link to="/search" className="btn-primary py-2.5 px-6 text-xs font-bold inline-flex">
                Browse All Hotels
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {coupons.map((offer) => {
              const discountText = offer.discount_percentage
                ? `${parseFloat(offer.discount_percentage)}% OFF${offer.max_discount_amount ? ` (Up to ₹${parseFloat(offer.max_discount_amount).toLocaleString('en-IN')})` : ''}`
                : offer.discount_amount
                ? `Flat ₹${parseFloat(offer.discount_amount).toLocaleString('en-IN')} OFF`
                : 'Special Offer';

              const minBookingText = offer.min_booking_amount && parseFloat(offer.min_booking_amount) > 0
                ? `Min. booking value ₹${parseFloat(offer.min_booking_amount).toLocaleString('en-IN')}`
                : 'No minimum booking amount';

              const expiryText = offer.valid_dates_label
                || (offer.valid_until ? `Valid till ${new Date(offer.valid_until).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}` : 'Active Offer');

              return (
                <div
                  key={offer.id || offer.code}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="p-7 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-[10px] font-black uppercase tracking-wider border border-rose-200">
                        {offer.campaign_badge || 'ACTIVE OFFER'}
                      </span>
                      <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {expiryText}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                        {discountText}
                      </h3>
                      <h4 className="text-sm font-extrabold text-rose-600 mt-0.5">
                        {offer.title || offer.campaign_name || offer.code}
                      </h4>
                      {offer.description && (
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2">
                          {offer.description}
                        </p>
                      )}
                      <p className="text-[11px] font-bold text-slate-400 mt-1">
                        • {minBookingText}
                      </p>
                    </div>
                  </div>

                  {/* Coupon Code Pill Bar */}
                  <div className="px-7 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-rose-600" />
                      <span className="font-mono text-sm font-black text-slate-800 tracking-wider">
                        {offer.code}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyCode(offer.code)}
                        className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:border-rose-500 text-slate-700 hover:text-rose-600 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedCode === offer.code ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>

                      <Link
                        to="/search"
                        className="btn-primary py-2 px-4 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                      >
                        <span>Use Code</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
};

export default Offers;
