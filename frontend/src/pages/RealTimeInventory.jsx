import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Layers, CheckCircle2, RefreshCw, Zap, ShieldCheck,
  Building2, Users, ArrowRight, Sparkles, Sliders, Bell,
  Clock, BedDouble, Lock, ArrowUpRight
} from 'lucide-react';
import api from '../services/api';

const RealTimeInventory = () => {
  const [liveRooms, setLiveRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveRooms();
  }, []);

  const fetchLiveRooms = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rooms/?page_size=6');
      const list = res.data?.results || (Array.isArray(res.data) ? res.data : []);
      setLiveRooms(list);
    } catch (err) {
      console.error('Failed to load real room inventory:', err);
      setLiveRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (isAvailable, remaining) => {
    if (isAvailable && remaining > 0) {
      return (
        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
          Live Available ({remaining} left)
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase tracking-wider">
        Sold Out / Reserved
      </span>
    );
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen pb-24 selection:bg-teal-600 selection:text-white">
      
      {/* HERO SECTION */}
      <section className="relative py-16 sm:py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden border-b border-white/10">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-teal-500/15 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full bg-cyan-500/15 blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-black uppercase tracking-wider mb-6 backdrop-blur-md shadow-xs">
            <RefreshCw className="w-4 h-4 text-teal-400 animate-spin-slow" />
            Next-Gen Hotel Operations Engine
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6">
            Real-Time Room Inventory & <br />
            <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-300 bg-clip-text text-transparent">
              Zero Double-Booking Guarantee
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed mb-10 font-medium">
            Manage your rooms, rates, calendars, front-desk check-ins, and housekeeping from a single cloud console. Our microsecond date-overlap engine mathematically prevents overbooking across all channels.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/login"
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-extrabold text-sm shadow-xl shadow-teal-600/30 hover:scale-105 transition-all flex items-center gap-2 group cursor-pointer"
            >
              <span>Access Inventory Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/become-host"
              className="px-8 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-extrabold text-sm backdrop-blur-md hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>List New Property</span>
            </Link>
          </div>
        </div>
      </section>

      {/* REAL INVENTORY LIVE MONITOR */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-extrabold text-teal-600 uppercase tracking-widest block mb-2">
            Live Database Inventory
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
            Real-Time Hotel Room Units Status
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Directly connected to verified hotel categories and real physical room units from our live database.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                Live Property Room Categories & Availability
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-0.5">
                Current operational database status • Synced with Live Reservations
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Live Available</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Sold Out / Reserved</span>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-slate-500">Loading live inventory...</p>
            </div>
          ) : liveRooms.length === 0 ? (
            <div className="py-16 text-center space-y-3 max-w-md mx-auto">
              <BedDouble className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-base font-black text-slate-900">No Active Room Categories Found</h4>
              <p className="text-xs text-slate-500 font-medium">
                Hotel owners can list hotels and define room categories from the Owner Portal.
              </p>
              <div className="pt-2">
                <Link to="/become-host" className="btn-primary py-2 px-5 text-xs font-bold inline-flex">
                  List Your Property
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveRooms.map((room) => {
                const remaining = room.available_count ?? room.total_rooms ?? 1;
                const isAvail = room.is_available !== false && remaining > 0;

                return (
                  <div
                    key={room.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-teal-50/40 hover:border-teal-300 transition-all shadow-2xs group relative space-y-3"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <span className="text-[11px] font-black text-slate-400 block uppercase tracking-wider truncate">
                          {room.hotel_name || 'Verified Property'} • {room.hotel_city || 'India'}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 group-hover:text-teal-700 transition-colors truncate">
                          {room.title}
                        </h4>
                        <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded mt-1 inline-block">
                          {room.room_type}
                        </span>
                      </div>
                      {getStatusBadge(isAvail, remaining)}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-200/80 text-xs">
                      <span className="font-bold text-teal-600">
                        ₹{parseFloat(room.price_per_night || 0).toLocaleString('en-IN')} <span className="text-slate-400 text-[10px]">/ night</span>
                      </span>
                      {room.hotel && (
                        <Link
                          to={`/hotels/${room.hotel}`}
                          className="text-[11px] font-extrabold text-teal-600 hover:text-teal-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                        >
                          <span>View Hotel</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span className="font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
              Full inventory controls with room photos, amenity tags & pricing tiers are managed live in your Owner Portal.
            </span>
            <Link
              to="/login"
              className="text-teal-700 hover:text-teal-900 font-black flex items-center gap-1 text-xs shrink-0 underline"
            >
              Sign In to Owner Portal →
            </Link>
          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <span className="text-xs font-extrabold text-teal-600 uppercase tracking-widest block">
            Enterprise Architecture
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
            Engineered For Zero Friction
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Powerful tools designed specifically for modern independent hotel operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Date-Overlap Reservation Engine</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Every booking query is evaluated against exact check-in and check-out intervals in milliseconds. If a room is reserved, it disappears from public search immediately.
            </p>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600">
              <Sliders className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Dynamic Pricing & Surge Rules</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Adjust base room prices for high-demand holiday weekends, festival dates, and local events without having to contact any support rep. Changes go live instantly.
            </p>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Instant SMS & Email Alerts</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Receive immediate real-time alerts the moment a guest books, cancels, or reschedules. Never miss a guest arrival with direct guest details available in your dashboard.
            </p>
          </div>

        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left max-w-xl">
            <span className="px-3.5 py-1 rounded-full bg-white/20 text-white text-[11px] font-black uppercase tracking-wider inline-block">
              Hotelier Cloud Console
            </span>
            <h3 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Manage Your Rooms In Real Time
            </h3>
            <p className="text-xs sm:text-sm text-teal-100 font-medium">
              Log in to your Owner Portal or list your hotel property to access full inventory management tools today.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              to="/login"
              className="px-8 py-3.5 rounded-2xl bg-white text-teal-800 hover:bg-slate-50 font-extrabold text-sm shadow-xl hover:scale-105 transition-all text-center cursor-pointer"
            >
              Sign In to Owner Portal →
            </Link>
            <Link
              to="/become-host"
              className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-sm text-center backdrop-blur-md transition-all cursor-pointer"
            >
              List Your Hotel
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default RealTimeInventory;
