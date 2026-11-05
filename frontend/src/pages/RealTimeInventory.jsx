import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Layers, CheckCircle2, RefreshCw, Zap, ShieldCheck,
  Building2, Users, ArrowRight, Sparkles, Sliders, Bell,
  Clock, BedDouble, Lock, ArrowUpRight
} from 'lucide-react';

const RealTimeInventory = () => {
  // Interactive Room Grid Simulation State
  const [demoRooms, setDemoRooms] = useState([
    { id: 101, name: 'Deluxe Ocean View Suite', type: 'Suite', price: 4500, status: 'AVAILABLE' },
    { id: 102, name: 'Executive King Room', type: 'Standard', price: 2800, status: 'OCCUPIED' },
    { id: 103, name: 'Garden Cottage Villa', type: 'Villa', price: 6200, status: 'AVAILABLE' },
    { id: 104, name: 'Heritage Courtyard Room', type: 'Heritage', price: 3400, status: 'CLEANING' },
    { id: 105, name: 'Royal Penthouse Suite', type: 'Luxury', price: 9500, status: 'BLOCKED' },
    { id: 106, name: 'Standard Twin Room', type: 'Standard', price: 2200, status: 'AVAILABLE' }
  ]);

  const toggleRoomStatus = (id) => {
    setDemoRooms((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const nextStatus =
            r.status === 'AVAILABLE' ? 'OCCUPIED' :
            r.status === 'OCCUPIED' ? 'CLEANING' :
            r.status === 'CLEANING' ? 'BLOCKED' : 'AVAILABLE';
          return { ...r, status: nextStatus };
        }
        return r;
      })
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">Live Available</span>;
      case 'OCCUPIED':
        return <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase">Guest Occupied</span>;
      case 'CLEANING':
        return <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase">Housekeeping</span>;
      case 'BLOCKED':
        return <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black uppercase">Maintenance Blocked</span>;
      default:
        return null;
    }
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

      {/* INTERACTIVE INVENTORY SIMULATOR DEMO */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-extrabold text-teal-600 uppercase tracking-widest block mb-2">
            Try The Live Demo
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
            Click Any Room To Toggle Live Availability
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Experience how seamlessly GoOnStay updates inventory status in real-time without refreshing pages.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                Grand Heritage Palace & Resort — Live Room Floor Grid
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-0.5">
                Current local operational status • Microsecond Sync Active
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Available</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Occupied</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Housekeeping</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Blocked</span>
            </div>
          </div>

          {/* Grid of rooms */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {demoRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => toggleRoomStatus(room.id)}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-teal-50/40 hover:border-teal-300 transition-all cursor-pointer shadow-2xs group relative space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-black text-slate-400 block uppercase tracking-wider">
                      Room #{room.id} • {room.type}
                    </span>
                    <h4 className="text-sm font-black text-slate-900 group-hover:text-teal-700 transition-colors">
                      {room.name}
                    </h4>
                  </div>
                  {getStatusBadge(room.status)}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200/80 text-xs">
                  <span className="font-bold text-teal-600">
                    ₹{room.price.toLocaleString('en-IN')} <span className="text-slate-400 text-[10px]">/ night</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-teal-600 flex items-center gap-1">
                    Click to switch state ↻
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-center justify-between">
            <span className="font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              Full inventory controls with room photos, amenity tags & pricing tiers are available in your Owner Portal.
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
