import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, TrendingUp, DollarSign, Percent, Award, CheckCircle2,
  Building2, Users, ArrowRight, Sparkles, ChevronDown, ChevronUp,
  HelpCircle, Calendar, Zap, Lock, BarChart3, Star, PhoneCall
} from 'lucide-react';

const PartnerBenefits = () => {
  // Interactive Revenue & Savings Calculator State
  const [roomCount, setRoomCount] = useState(15);
  const [adr, setAdr] = useState(3500); // Average Daily Rate in INR
  const [occupancy, setOccupancy] = useState(70); // Occupancy %

  // Calculation Logic
  const monthlyRoomsSold = Math.round(roomCount * 30 * (occupancy / 100));
  const monthlyGrossRevenue = monthlyRoomsSold * adr;
  
  // GoOnStay commission is 10%
  const goonstayCommission = monthlyGrossRevenue * 0.10;
  const goonstayNetEarnings = monthlyGrossRevenue - goonstayCommission;

  // Traditional OTAs charge 20% to 22%
  const traditionalOtaCommission = monthlyGrossRevenue * 0.20;
  const traditionalNetEarnings = monthlyGrossRevenue - traditionalOtaCommission;

  // Monthly & Yearly Savings
  const monthlySavings = traditionalOtaCommission - goonstayCommission;
  const yearlySavings = monthlySavings * 12;

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(0);

  const faqs = [
    {
      q: 'What is GoOnStay\'s revenue sharing and commission model?',
      a: 'GoOnStay operates on a transparent, flat 8% to 10% partner fee model. Unlike legacy booking platforms that extract 18% to 25% from hotel owners, 90% or more of each guest payment goes directly to your verified bank account.'
    },
    {
      q: 'When and how are hotel payouts settled?',
      a: 'Payouts are automated via our integrated Razorpay Route banking infrastructure on a T+1 daily basis. Once a guest completes check-in, net funds are disbursed directly into your registered current/savings bank account with an instant digital settlement invoice.'
    },
    {
      q: 'Are there any upfront setup, listing, or subscription charges?',
      a: 'Zero. Listing your hotel property on GoOnStay is 100% free with no hidden setup fees, software licensing charges, or maintenance subscriptions. We only earn our modest partner fee when you receive confirmed, paid bookings.'
    },
    {
      q: 'Can I set my own room prices, cancellation rules, and blackout dates?',
      a: 'Yes, completely. Through your GoOnStay Owner Dashboard, you retain 100% control over base nightly rates, seasonal peak pricing, weekend surcharges, room inventory availability, and cancellation policies.'
    },
    {
      q: 'How does GoOnStay prevent double-bookings or overlapping dates?',
      a: 'Our date-overlap reservation algorithm checks date ranges down to the exact second. Once a guest books room inventory for given check-in and check-out dates, that room is locked and removed from public search instantly.'
    },
    {
      q: 'What guest verification is conducted before check-in?',
      a: 'All guests booking via GoOnStay provide verified phone numbers, OTP verification, and mandatory government ID details upon booking and check-in to ensure safety, zero fraudulent bookings, and smooth stay experiences.'
    }
  ];

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen pb-24 selection:bg-rose-600 selection:text-white">
      
      {/* HERO SECTION */}
      <section className="relative py-16 sm:py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden border-b border-white/10">
        {/* Ambient Glow Orbs */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-rose-600/15 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full bg-teal-500/15 blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-black uppercase tracking-wider mb-6 backdrop-blur-md shadow-xs">
            <Sparkles className="w-4 h-4 text-rose-400" />
            Hotel Partner Network & Revenue Share
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6">
            Keep More of What You Earn With <br />
            <span className="bg-gradient-to-r from-rose-400 via-rose-500 to-amber-300 bg-clip-text text-transparent">
              Transparent 90%+ Revenue Share
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed mb-10 font-medium">
            Join premier hoteliers and boutique stay owners across India. Experience industry-low commission rates, daily bank payouts, intelligent real-time inventory management, and zero hidden platform charges.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/become-host"
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold text-sm shadow-xl shadow-rose-600/30 hover:scale-105 transition-all flex items-center gap-2 group cursor-pointer"
            >
              <span>List Your Hotel Property</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/login"
              className="px-8 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-extrabold text-sm backdrop-blur-md hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Owner Portal Sign In</span>
            </Link>
          </div>
        </div>
      </section>

      {/* QUICK HIGHLIGHT STRIP */}
      <section className="bg-white border-b border-slate-200 py-6 relative z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="pt-3 md:pt-0">
              <div className="text-2xl sm:text-3xl font-black text-rose-600">90% - 92%</div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Host Retained Revenue</p>
            </div>
            <div className="pt-3 md:pt-0">
              <div className="text-2xl sm:text-3xl font-black text-teal-600">T+1 Daily</div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Automated Bank Settlement</p>
            </div>
            <div className="pt-3 md:pt-0">
              <div className="text-2xl sm:text-3xl font-black text-purple-600">0% Commission</div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">First 30 Days Free</p>
            </div>
            <div className="pt-3 md:pt-0">
              <div className="text-2xl sm:text-3xl font-black text-slate-900">₹0 Fees</div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">No Listing Or Tech Surcharges</p>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE EARNINGS & SAVINGS CALCULATOR */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-extrabold text-rose-600 uppercase tracking-widest block mb-2">
            Calculate Your ROI
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
            How Much More Will You Earn on GoOnStay?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Compare our transparent 10% fee against typical 20% OTA commissions and see your net bank savings.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden p-6 sm:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Sliders Input Panel */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Slider 1: Rooms */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-rose-500" /> Number of Available Rooms
                  </span>
                  <span className="text-sm font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                    {roomCount} Rooms
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="80"
                  step="1"
                  value={roomCount}
                  onChange={(e) => setRoomCount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                  <span>3 Rooms (Boutique)</span>
                  <span>40 Rooms</span>
                  <span>80+ Rooms (Resort)</span>
                </div>
              </div>

              {/* Slider 2: Average Daily Rate (ADR) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-teal-500" /> Average Daily Room Rate (ADR)
                  </span>
                  <span className="text-sm font-black text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                    ₹{adr.toLocaleString('en-IN')} / night
                  </span>
                </div>
                <input
                  type="range"
                  min="1200"
                  max="20000"
                  step="100"
                  value={adr}
                  onChange={(e) => setAdr(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                  <span>₹1,200</span>
                  <span>₹10,000</span>
                  <span>₹20,000+</span>
                </div>
              </div>

              {/* Slider 3: Occupancy Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-purple-500" /> Estimated Monthly Occupancy
                  </span>
                  <span className="text-sm font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                    {occupancy}% Occupancy
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="95"
                  step="5"
                  value={occupancy}
                  onChange={(e) => setOccupancy(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                  <span>30% (Off-season)</span>
                  <span>65% (Average)</span>
                  <span>95% (Peak Season)</span>
                </div>
              </div>

              {/* Summary Stats Pill Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block text-[11px]">Monthly Gross Bookings</span>
                  <span className="text-slate-900 font-black text-base">
                    ₹{monthlyGrossRevenue.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-bold block text-[11px]">Est. Monthly Room Nights</span>
                  <span className="text-slate-900 font-black text-base">
                    {monthlyRoomsSold} nights
                  </span>
                </div>
              </div>

            </div>

            {/* Comparison Results Card */}
            <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden border border-white/10">
              <div className="absolute top-0 right-0 w-36 h-36 bg-rose-500/20 rounded-full blur-2xl"></div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 block mb-1">
                  Your Extra Profit on GoOnStay
                </span>
                <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
                  + ₹{yearlySavings.toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-slate-300 font-medium mt-1">
                  Extra annual profit retained in your pocket compared to typical 20% OTA commissions.
                </p>
              </div>

              <div className="space-y-3 pt-2 border-t border-white/10 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">GoOnStay Net Monthly Payout (90%):</span>
                  <span className="font-extrabold text-white text-sm">
                    ₹{Math.round(goonstayNetEarnings).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Traditional OTA Payout (80%):</span>
                  <span className="font-bold line-through">
                    ₹{Math.round(traditionalNetEarnings).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-teal-300 font-bold pt-1 border-t border-white/5">
                  <span>Monthly Added Profit:</span>
                  <span className="text-emerald-400 font-black">
                    + ₹{Math.round(monthlySavings).toLocaleString('en-IN')} / month
                  </span>
                </div>
              </div>

              <Link
                to="/become-host"
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs text-center block transition-all shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Claim This Profit & List Property Now →
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* CORE PARTNER BENEFITS CARDS GRID */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <span className="text-xs font-extrabold text-teal-600 uppercase tracking-widest block">
            Why Top Hoteliers Partner With Us
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
            Engineered For Hospitality Leaders
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Everything your property needs to operate efficiently, delight guests, and maximize revenue.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Benefit 1 */}
          <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900">T+1 Automated Bank Settlement</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              No 30-day withholding periods. Net accommodation revenues disburse automatically into your registered current bank account the day after guest check-in with complete digital invoices.
            </p>
          </div>

          {/* Benefit 2 */}
          <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
              <Percent className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Lowest Commission in India</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Enjoy our flat 8% to 10% partner commission model. Plus, all new host registrations get their first 30 days of confirmed bookings at 0% commission.
            </p>
          </div>

          {/* Benefit 3 */}
          <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Real-Time Inventory & Dynamic Rates</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Manage room availability, update rates for weekends or festivals in 1 click, and eliminate overbooking with our microsecond date-overlap availability engine.
            </p>
          </div>

          {/* Benefit 4 */}
          <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Verified Guests & Zero Fraud</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Every guest undergoes OTP-verified phone authentication and government ID submission before check-in, preventing unauthorized chargebacks and protecting your property.
            </p>
          </div>

          {/* Benefit 5 */}
          <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Direct Guest Relationship</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Unlike aggregators that mask guest contact details, GoOnStay connects you directly with your guests for seamless arrival coordination, special requests, and direct repeat stays.
            </p>
          </div>

          {/* Benefit 6 */}
          <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <PhoneCall className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Dedicated Property Manager</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Direct access to our dedicated partner desk via phone and WhatsApp. Get listing optimization advice, revenue management suggestions, and 24x7 resolution support.
            </p>
          </div>

        </div>
      </section>

      {/* REVENUE SHARE BREAKDOWN SECTION */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="text-xs font-extrabold text-rose-600 uppercase tracking-widest block">
              100% Transparency Guarantee
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
              Where Does Every Rupee Go?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Clear breakdown of our revenue sharing model with zero hidden processing charges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-3xl bg-emerald-50/70 border border-emerald-200/80 space-y-3">
              <div className="text-3xl font-black text-emerald-600">90%</div>
              <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Direct Hotel Owner Payout
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Deposited directly into your current account. Covers your rooms, operations, housekeeping, and profit margin with complete freedom over how you run your property.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-3xl font-black text-slate-800">8% - 10%</div>
              <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                GoOnStay Platform Fee
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Covers Razorpay payment gateway fees, 24x7 guest concierge operations, cloud servers, SMS/Email OTP infrastructure, and digital marketing driving travelers to your listing.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-rose-50/70 border border-rose-200/80 space-y-3">
              <div className="text-3xl font-black text-rose-600">₹0</div>
              <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Hidden Tech or Cancellation Surcharges
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                No monthly software subscription, no onboarding fees, no penalty for updating rates or managing your own inventory. If you don't earn, we don't charge.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-2">
          <span className="text-xs font-extrabold text-rose-600 uppercase tracking-widest block">
            Got Questions?
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
            Frequently Asked Partner Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Everything you need to know about partnering with GoOnStay.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-800 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    {faq.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 font-medium bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* BOTTOM ACTION CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left max-w-xl">
            <span className="px-3.5 py-1 rounded-full bg-white/20 text-white text-[11px] font-black uppercase tracking-wider inline-block">
              Start Earning More Today
            </span>
            <h3 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Ready to List Your Property on GoOnStay?
            </h3>
            <p className="text-xs sm:text-sm text-rose-100 font-medium">
              Takes less than 5 minutes to register your hotel and publish your room inventory. Enjoy 0% commission for your first 30 days!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              to="/become-host"
              className="px-8 py-3.5 rounded-2xl bg-white text-rose-600 hover:bg-slate-50 font-extrabold text-sm shadow-xl hover:scale-105 transition-all text-center cursor-pointer"
            >
              List Your Hotel Property →
            </Link>
            <Link
              to="/login"
              className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-sm text-center backdrop-blur-md transition-all cursor-pointer"
            >
              Owner Portal Sign In
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default PartnerBenefits;
