import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Tag, Sparkles, Percent, Gift, CheckCircle2, Copy,
  Calendar, ArrowRight, ShieldCheck, Hotel, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Offers = () => {
  const { showToast } = useAuth();
  const [copiedCode, setCopiedCode] = useState(null);

  const promoOffers = [
    {
      id: 1,
      code: 'WELCOME1000',
      discount: 'Flat ₹1,000 OFF',
      minBooking: 'Min. booking value ₹4,000',
      title: 'First Stay Welcome Bonus',
      description: 'Exclusive instant discount for new guests booking luxury and boutique stays across India.',
      expiry: 'Valid till 31 Dec 2026',
      badge: 'POPULAR',
      color: 'from-rose-500 to-rose-700'
    },
    {
      id: 2,
      code: 'GOABEACH20',
      discount: '20% OFF (Up to ₹2,500)',
      minBooking: 'Valid on Goa beach resorts & villas',
      title: 'Goa Coastal Getaways',
      description: 'Special seasonal pricing on handpicked private villas, beachfront cottages, and heritage stays in North & South Goa.',
      expiry: 'Valid on 2+ nights stays',
      badge: 'BEACH SPECIAL',
      color: 'from-teal-500 to-cyan-700'
    },
    {
      id: 3,
      code: 'ROYALSTAY15',
      discount: '15% OFF (Up to ₹3,500)',
      minBooking: 'Heritage & Palace stays in Rajasthan',
      title: 'Rajasthan Royal Heritage',
      description: 'Immerse yourself in regal splendour at verified palace hotels in Jaipur, Udaipur, and Jodhpur.',
      expiry: 'Valid till 30 Nov 2026',
      badge: 'HERITAGE',
      color: 'from-amber-500 to-orange-700'
    },
    {
      id: 4,
      code: 'WEEKENDVIBES',
      discount: 'Flat ₹750 OFF',
      minBooking: 'Valid on Friday - Sunday check-ins',
      title: 'Quick Weekend Escapes',
      description: 'Spontaneous weekend trip? Enjoy flat instant discount on boutique retreats near Mumbai, Pune, and Ahmedabad.',
      expiry: 'Refreshed every weekend',
      badge: 'WEEKEND',
      color: 'from-purple-500 to-indigo-700'
    }
  ];

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {promoOffers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="p-7 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-[10px] font-black uppercase tracking-wider border border-rose-200">
                    {offer.badge}
                  </span>
                  <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {offer.expiry}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {offer.discount}
                  </h3>
                  <h4 className="text-sm font-extrabold text-rose-600 mt-0.5">
                    {offer.title}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2">
                    {offer.description}
                  </p>
                  <p className="text-[11px] font-bold text-slate-400 mt-1">
                    • {offer.minBooking}
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
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>Use Code</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default Offers;
