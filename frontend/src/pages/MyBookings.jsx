import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar, Building2, MapPin, CheckCircle, CheckCircle2, XCircle, Clock,
  Printer, AlertTriangle, Star, X, MessageSquare, Landmark, CreditCard,
  ShieldCheck, AlertCircle, Lock, ArrowLeft, ArrowRight, RotateCcw, RefreshCw
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDisplayDate } from '../utils/dateUtils';
import Pagination from '../components/Pagination';

const RATING_LABELS = {
  1: '1 ★ - Poor / Needs Improvement',
  2: '2 ★ - Fair / Could Be Better',
  3: '3 ★ - Good / Satisfactory',
  4: '4 ★ - Very Good / Pleasant',
  5: '5 ★ - Exceptional / Outstanding'
};

const BANK_IFSC_PREFIX_MAP = {
  HDFC: 'HDFC Bank',
  SBIN: 'State Bank of India',
  ICIC: 'ICICI Bank',
  UTIB: 'Axis Bank',
  KKBK: 'Kotak Mahindra Bank',
  PUNB: 'Punjab National Bank',
  BARB: 'Bank of Baroda',
  CNRB: 'Canara Bank',
  UBIN: 'Union Bank of India',
  IDIB: 'Indian Bank',
  YESB: 'Yes Bank',
  INDB: 'IndusInd Bank',
  BKID: 'Bank of India',
  MAHB: 'Bank of Maharashtra',
  PSIB: 'Punjab & Sind Bank',
  IOBA: 'Indian Overseas Bank',
  UCOB: 'UCO Bank',
  CENT: 'Central Bank of India',
  FDRL: 'Federal Bank',
  IDFB: 'IDFC FIRST Bank',
  RATN: 'RBL Bank',
  JAKA: 'Jammu & Kashmir Bank',
  KVBL: 'Karur Vysya Bank',
  SIBL: 'South Indian Bank',
  PAYT: 'Paytm Payments Bank',
  AIRP: 'Airtel Payments Bank',
  IPOS: 'India Post Payments Bank',
};

const maskBankAcc = (acc) => {
  if (!acc) return '';
  const clean = String(acc).replace(/\s/g, '');
  if (clean.length <= 4) return clean;
  return 'XXXXXX' + clean.slice(-4);
};

const getOwnerApproval = (bookingOrId) => {
  try {
    const existing = JSON.parse(localStorage.getItem('bmr_owner_cancellation_approvals') || '{}');
    if (!bookingOrId) return null;
    if (typeof bookingOrId === 'object') {
      const keys = [
        bookingOrId.id,
        bookingOrId.booking_id,
        bookingOrId.booking_reference,
        bookingOrId.reference_id,
        bookingOrId.booking
      ].filter(Boolean).map(String);
      for (const k of keys) {
        const clean = k.replace(/^#/, '');
        if (existing[k] || existing[clean] || existing[`#${clean}`]) {
          return existing[k] || existing[clean] || existing[`#${clean}`];
        }
      }
      return null;
    }
    const str = String(bookingOrId).trim();
    const clean = str.replace(/^#/, '');
    return existing[str] || existing[clean] || existing[`#${clean}`] || null;
  } catch (e) {
    return null;
  }
};

const getAdminRefund = (bookingOrId) => {
  try {
    const existing = JSON.parse(localStorage.getItem('bmr_admin_refunds') || '{}');
    if (!bookingOrId) return null;
    if (typeof bookingOrId === 'object') {
      const keys = [
        bookingOrId.id,
        bookingOrId.booking_id,
        bookingOrId.booking_reference,
        bookingOrId.reference_id,
        bookingOrId.booking
      ].filter(Boolean).map(String);
      for (const k of keys) {
        const clean = k.replace(/^#/, '');
        if (existing[k] || existing[clean] || existing[`#${clean}`]) {
          return existing[k] || existing[clean] || existing[`#${clean}`];
        }
      }
      return null;
    }
    const str = String(bookingOrId).trim();
    const clean = str.replace(/^#/, '');
    return existing[str] || existing[clean] || existing[`#${clean}`] || null;
  } catch (e) {
    return null;
  }
};

const MyBookings = () => {
  const { user, showToast } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Rating Modal state
  const [ratingBooking, setRatingBooking] = useState(null);
  const [selectedRating, setSelectedRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  // Cancellation Modal state
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [cancelQuote, setCancelQuote] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoadingQuote, setCancelLoadingQuote] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    try {
      const res = await api.get('/bookings/?page_size=1000');
      let rawList = res.data?.results || res.data || [];

      // Check each cancelled or approved booking against backend customer payout status API
      const updatedList = await Promise.all(
        rawList.map(async (b) => {
          const bStatus = (b.booking_status || b.status || '').toUpperCase();
          const pStatus = (b.payment_status || '').toUpperCase();
          const rStatus = (b.refund_status || '').toUpperCase();

          const localRef = getAdminRefund(b);
          if (localRef) {
            return {
              ...b,
              booking_status: 'REFUNDED',
              status: 'REFUNDED',
              payment_status: 'REFUNDED',
              refund_status: 'REFUNDED',
              refund_arn: localRef.refund_arn || b.refund_arn,
              utr: localRef.utr || b.utr
            };
          }

          if (bStatus === 'REFUNDED' || pStatus === 'REFUNDED' || rStatus === 'REFUNDED') {
            return { ...b, booking_status: 'REFUNDED', payment_status: 'REFUNDED', refund_status: 'REFUNDED' };
          }

          // If booking is cancelled or in approval queue, query backend customer payout status directly
          const isCancelled = bStatus === 'CANCELLED' || bStatus === 'CANCELLATION_REQUESTED' || bStatus === 'OWNER_APPROVED' || b.cancellation_status;
          if (isCancelled) {
            try {
              const lookupId = encodeURIComponent(String(b.booking_id || b.id).replace(/^#/, ''));
              const payoutRes = await api.get(`/payments/payouts/customer/${lookupId}/?sync=true`);
              const pData = payoutRes.data;
              if (pData && (pData.payout_id || pData.status || pData.id)) {
                const pStat = (pData.status || '').toUpperCase();
                if (pStat === 'PROCESSED' || pStat === 'SUCCESS' || pStat === 'PROCESSING' || pStat === 'QUEUED' || pData.payout_id) {
                  const refRecord = {
                    status: 'REFUNDED',
                    refund_arn: pData.payout_id || pData.id,
                    utr: pData.utr || `UTR${Date.now().toString().slice(-8)}`,
                    refunded_at: new Date().toISOString()
                  };
                  try {
                    const localRefunds = JSON.parse(localStorage.getItem('bmr_admin_refunds') || '{}');
                    localRefunds[String(b.id)] = refRecord;
                    if (b.booking_id) localRefunds[String(b.booking_id).replace(/^#/, '')] = refRecord;
                    localStorage.setItem('bmr_admin_refunds', JSON.stringify(localRefunds));
                  } catch (e) {}

                  return {
                    ...b,
                    booking_status: 'REFUNDED',
                    status: 'REFUNDED',
                    payment_status: 'REFUNDED',
                    refund_status: 'REFUNDED',
                    refund_arn: refRecord.refund_arn,
                    utr: refRecord.utr
                  };
                }
              }
            } catch (err) {
              // Ignore not found
            }
          }

          return b;
        })
      );

      setBookings(updatedList);
    } catch (err) {
      console.error('Failed to load trips:', err);
      showToast('Failed to load your booking history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCancelModal = async (booking) => {
    setCancelModalBooking(booking);
    setCancelReason('');
    setCancelQuote(null);
    setCancelLoadingQuote(true);

    try {
      const res = await api.get(`/bookings/${booking.id}/cancel/`);
      setCancelQuote(res.data);
    } catch (err) {
      console.error('Failed to fetch cancellation preview:', err);
      showToast('Failed to calculate cancellation policy quote.', 'error');
    } finally {
      setCancelLoadingQuote(false);
    }
  };

  const handleConfirmCancellation = async () => {
    if (!cancelModalBooking) return;

    setCancelling(true);
    try {
      const payload = {
        reason: cancelReason.trim() || 'Guest requested cancellation'
      };

      const res = await api.post(`/bookings/${cancelModalBooking.id}/cancel/`, payload);

      const refundAmount = res.data?.refundable_amount != null 
        ? parseFloat(res.data.refundable_amount).toFixed(2)
        : (cancelQuote ? parseFloat(cancelQuote.refundable_amount).toFixed(2) : '0.00');

      showToast(`🎉 Cancellation requested! Sent to Hotel Owner for approval. Refund due: ₹${refundAmount} (will be refunded to original payment method).`, 'success');
      
      setCancelModalBooking(null);
      fetchMyBookings();
    } catch (err) {
      const errMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to submit cancellation request.';
      showToast(errMsg, 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handleOpenRatingModal = (booking) => {
    setRatingBooking(booking);
    setSelectedRating(booking.user_review ? booking.user_review.rating : 5);
    setRatingComment(booking.user_review ? booking.user_review.comment || '' : '');
    setHoverRating(0);
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    if (!ratingBooking) return;
    setSubmittingRating(true);
    try {
      await api.post('/reviews/', {
        booking: ratingBooking.id,
        rating: selectedRating,
        comment: ratingComment
      });
      showToast('Thank you! Your rating has been recorded and hotel average updated.');
      setRatingBooking(null);
      fetchMyBookings();
    } catch (err) {
      const data = err.response?.data;
      let errorMsg = 'Failed to submit rating.';
      if (data) {
        if (typeof data === 'string') errorMsg = data;
        else if (data.detail) errorMsg = data.detail;
        else if (data.booking) errorMsg = Array.isArray(data.booking) ? data.booking[0] : data.booking;
        else if (data.non_field_errors) errorMsg = data.non_field_errors[0];
        else if (data.error) errorMsg = data.error;
      }
      showToast(errorMsg, 'error');
    } finally {
      setSubmittingRating(false);
    }
  };

  const canCancelBooking = (b) => {
    if (!b) return false;
    const todayStr = new Date().toISOString().split('T')[0];
    if (['CHECKED_OUT', 'COMPLETED', 'CHECKED_IN', 'CANCELLED', 'REFUNDED', 'CANCELLATION_REQUESTED', 'OWNER_APPROVED', 'REFUND_PENDING', 'REFUND_PROCESSING'].includes(b.booking_status) ||
        ['CANCELLATION_REQUESTED', 'OWNER_APPROVED', 'REFUND_PENDING', 'REFUND_PROCESSING'].includes(b.cancellation_status)) {
      return false;
    }
    if (b.check_out && b.check_out <= todayStr) {
      return false;
    }
    return b.booking_status === 'CONFIRMED' || b.booking_status === 'PENDING_PAYMENT' || b.booking_status === 'OWNER_REJECTED';
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'CONFIRMED') return b.booking_status === 'CONFIRMED' || b.booking_status === 'CHECKED_IN';
    if (activeTab === 'CANCELLED') {
      const adminRefund = getAdminRefund(b);
      const approval = getOwnerApproval(b);
      return (
        b.booking_status === 'CANCELLED' ||
        b.booking_status === 'REFUNDED' ||
        b.booking_status === 'CANCELLATION_REQUESTED' ||
        b.booking_status === 'OWNER_APPROVED' ||
        b.booking_status === 'OWNER_REJECTED' ||
        b.cancellation_status === 'CANCELLATION_REQUESTED' ||
        b.payment_status === 'REFUND_PENDING' ||
        b.payment_status === 'REFUNDED' ||
        adminRefund?.status === 'REFUNDED' ||
        approval?.status === 'REFUNDED'
      );
    }
    if (activeTab === 'COMPLETED') return b.booking_status === 'COMPLETED' || b.booking_status === 'CHECKED_OUT';
    return true;
  });

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-200 pb-6">
          <h1 className="text-3xl font-black text-slate-900">My Trips & Reservations</h1>
          <p className="text-xs text-slate-500 font-semibold">View upcoming stays, rate completed trips, download receipts, or manage active bookings</p>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          {['ALL', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all uppercase tracking-wider ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-600/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab === 'ALL' ? 'All Reservations' : tab}
            </button>
          ))}
        </div>

        {/* Trips List */}
        {loading ? (
          <div className="text-center py-20 card-white">
            <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-bold text-slate-500">Loading your reservations...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="card-white p-12 text-center space-y-4">
            <Calendar className="w-12 h-12 text-teal-600 mx-auto opacity-50" />
            <h3 className="text-lg font-black text-slate-900">No Reservations Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              You don't have any {activeTab !== 'ALL' ? activeTab.toLowerCase() : ''} room reservations yet.
            </p>
            <Link to="/search" className="btn-teal py-2.5 px-6 text-xs font-extrabold inline-flex">
              Explore Hotels & Book
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredBookings.slice((currentPage - 1) * 10, currentPage * 10).map((b) => (
              <div key={b.id} className="card-white overflow-hidden flex flex-col md:flex-row border border-slate-200 hover:shadow-md transition-all">
                
                {/* Image */}
                <div className="w-full md:w-64 h-48 md:h-[220px] bg-slate-200 relative shrink-0 overflow-hidden">
                  <img
                    src={b.hotel_details?.primary_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'}
                    alt={b.hotel_details?.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 glass-pill text-white font-mono text-[11px] font-black px-3 py-1 rounded-full shadow-lg border border-white/30">
                    {b.booking_id}
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                  
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-xl font-black text-slate-900">{b.hotel_details?.name}</h3>
                        <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          {b.hotel_details?.address}, {b.hotel_details?.city}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {b.user_review && (
                          <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                            <span>You Rated {b.user_review.rating}/5</span>
                          </div>
                        )}
                        {(() => {
                          const approval = getOwnerApproval(b);
                          const adminRefund = getAdminRefund(b);
                          const bStatus = (b.booking_status || b.status || '').toUpperCase();
                          const pStatus = (b.payment_status || '').toUpperCase();
                          const rStatus = (b.refund_status || '').toUpperCase();

                          const isRefunded = bStatus === 'REFUNDED' || pStatus === 'REFUNDED' || rStatus === 'REFUNDED' || adminRefund?.status === 'REFUNDED' || approval?.status === 'REFUNDED';
                          const isProcessing = pStatus === 'REFUND_PROCESSING' || rStatus === 'PROCESSING' || rStatus === 'REFUND_PROCESSING' || adminRefund?.status === 'PROCESSING';
                          const isRejected = approval?.status === 'REJECTED' || bStatus === 'OWNER_REJECTED' || b.cancellation_status === 'OWNER_REJECTED' || b.owner_approval_status === 'REJECTED' || b.cancellation_breakdown?.owner_approval?.status === 'REJECTED';
                          const isApproved = !isRefunded && !isProcessing && (approval?.status === 'APPROVED' || bStatus === 'OWNER_APPROVED' || b.cancellation_status === 'OWNER_APPROVED' || b.owner_approval_status === 'APPROVED' || b.cancellation_breakdown?.owner_approval?.status === 'APPROVED');

                          if (isRefunded) {
                            return (
                              <span className="badge bg-emerald-50 text-emerald-800 border border-emerald-300 font-black inline-flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-600" /> REFUNDED
                              </span>
                            );
                          }

                          if (isProcessing) {
                            return (
                              <span className="badge bg-purple-50 text-purple-800 border border-purple-200 font-black inline-flex items-center gap-1">
                                <RefreshCw className="w-3 h-3 text-purple-600 animate-spin" /> REFUND PROCESSING
                              </span>
                            );
                          }

                          if (isApproved) {
                            return (
                              <span className="badge bg-sky-50 text-sky-800 border border-sky-300 font-black">
                                ✅ OWNER APPROVED
                              </span>
                            );
                          }

                          if (isRejected) {
                            return (
                              <span className="badge bg-rose-50 text-rose-800 border border-rose-300 font-black">
                                ❌ OWNER REJECTED
                              </span>
                            );
                          }

                          if (bStatus === 'CANCELLATION_REQUESTED' || b.cancellation_status === 'CANCELLATION_REQUESTED' || pStatus === 'REFUND_PENDING') {
                            return (
                              <span className="badge bg-amber-50 text-amber-900 border border-amber-300 font-black">
                                ⏳ CANCELLATION REQUESTED
                              </span>
                            );
                          }

                          if (bStatus === 'CONFIRMED') {
                            return (
                              <span className="badge bg-teal-50 text-teal-800 border border-teal-200">
                                CONFIRMED
                              </span>
                            );
                          }

                          if (bStatus === 'CHECKED_IN') {
                            return (
                              <span className="badge bg-blue-50 text-blue-800 border border-blue-200">
                                CHECKED IN
                              </span>
                            );
                          }

                          if (bStatus === 'COMPLETED' || bStatus === 'CHECKED_OUT') {
                            return (
                              <span className="badge bg-emerald-50 text-emerald-800 border border-emerald-200">
                                COMPLETED
                              </span>
                            );
                          }

                          if (bStatus === 'CANCELLED') {
                            return (
                              <span className="badge bg-rose-50 text-rose-700 border border-rose-200">
                                CANCELLED
                              </span>
                            );
                          }

                          return (
                            <span className="badge bg-slate-100 text-slate-700 border border-slate-200">
                              {bStatus}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold flex flex-wrap gap-4 text-slate-700">
                      <div>
                        <span className="text-slate-400 uppercase text-[10px] block">Reserved Unit / Room</span>
                        <span className="font-extrabold text-slate-900">
                          {b.room_details?.title} {b.room_number ? `(${b.room_number})` : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 uppercase text-[10px] block">Dates</span>
                        <span className="text-teal-700 font-semibold">{formatDisplayDate(b.check_in)} <span className="text-slate-400 font-normal">→</span> {formatDisplayDate(b.check_out)} <span className="text-slate-500 font-normal">({b.number_of_nights} Night{b.number_of_nights > 1 ? 's' : ''})</span></span>
                      </div>
                      <div>
                        <span className="text-slate-400 uppercase text-[10px] block">Guest</span>
                        <span>{b.guest_name}</span>
                      </div>
                    </div>

                    {b.user_review?.comment && (
                      <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 text-xs text-amber-900 flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-[10px] text-amber-700 uppercase block">Your Feedback</span>
                          <p className="italic font-medium">{b.user_review.comment}</p>
                        </div>
                      </div>
                    )}

                    {/* Cancellation & Refund Info Banner */}
                    {(() => {
                      const approval = getOwnerApproval(b);
                      const adminRefund = getAdminRefund(b);
                      const bStatus = (b.booking_status || b.status || '').toUpperCase();
                      const pStatus = (b.payment_status || '').toUpperCase();
                      const rStatus = (b.refund_status || '').toUpperCase();

                      const isRefunded = bStatus === 'REFUNDED' || pStatus === 'REFUNDED' || rStatus === 'REFUNDED' || adminRefund?.status === 'REFUNDED' || approval?.status === 'REFUNDED';
                      const isProcessing = pStatus === 'REFUND_PROCESSING' || rStatus === 'PROCESSING' || rStatus === 'REFUND_PROCESSING' || adminRefund?.status === 'PROCESSING';
                      const isRejected = approval?.status === 'REJECTED' || bStatus === 'OWNER_REJECTED' || b.cancellation_status === 'OWNER_REJECTED' || b.owner_approval_status === 'REJECTED' || b.cancellation_breakdown?.owner_approval?.status === 'REJECTED';
                      const isApproved = !isRefunded && !isProcessing && (approval?.status === 'APPROVED' || bStatus === 'OWNER_APPROVED' || b.cancellation_status === 'OWNER_APPROVED' || b.owner_approval_status === 'APPROVED' || b.cancellation_breakdown?.owner_approval?.status === 'APPROVED');
                      const isCancelledWorkflow = bStatus === 'CANCELLED' || isRefunded || bStatus === 'CANCELLATION_REQUESTED' || isApproved || isRejected || b.cancellation_status || pStatus === 'REFUND_PENDING';

                      if (!isCancelledWorkflow) return null;

                      return (
                        <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                          isRefunded
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                            : isRejected
                            ? 'bg-rose-50 border-rose-200 text-rose-950'
                            : isProcessing
                            ? 'bg-purple-50 border-purple-200 text-purple-950'
                            : 'bg-amber-50/80 border-amber-200 text-amber-950'
                        }`}>
                          <div className="flex items-center justify-between font-black flex-wrap gap-2">
                            <span className="flex items-center gap-1.5">
                              <RotateCcw className={`w-3.5 h-3.5 ${isRefunded ? 'text-emerald-700' : 'text-amber-600'}`} />
                              Cancellation Workflow Status:
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              isRefunded ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                              isProcessing ? 'bg-purple-100 text-purple-900 border border-purple-300' :
                              isApproved ? 'bg-sky-100 text-sky-900 border border-sky-300' :
                              isRejected ? 'bg-rose-100 text-rose-900 border border-rose-300' :
                              'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}>
                              {isRefunded ? '🎉 Refund Successfully Disbursed' :
                               isProcessing ? '🔄 3. Admin Processing Transfer' :
                               isApproved ? '✅ 2. Owner Approved • In Admin Refund Queue' :
                               isRejected ? '❌ Cancellation Denied by Owner' :
                               '⏳ 1. Awaiting Hotel Owner Review'}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-x-6 gap-y-1 font-semibold text-slate-700 text-[11px] pt-1.5 border-t border-slate-200/60">
                            <span>Total Paid: <strong className="text-slate-900">₹{b.total_amount}</strong></span>
                            <span>Cancellation Fee ({b.cancellation_fee_percentage || 0}%): <strong className="text-rose-600">₹{b.cancellation_charge || '0.00'}</strong></span>
                            <span>Refundable: <strong className="text-emerald-700 font-black">₹{b.refundable_amount || b.refund_amount || b.total_amount || '0.00'}</strong></span>
                          </div>

                          {/* Customer Refund Destination: Original Source */}
                          <div className="p-2 rounded-xl bg-white/80 border border-slate-200/80 flex items-center justify-between text-[11px]">
                            <span className="text-slate-600 flex items-center gap-1.5 font-semibold">
                              <CreditCard className="w-3.5 h-3.5 text-teal-600" />
                              Refund Destination: <strong>Original Payment Source (Razorpay)</strong>
                            </span>
                            <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded text-[10px]">
                              Auto-Reversal
                            </span>
                          </div>

                          {/* Refund Disbursed Details Banner */}
                          {isRefunded && (
                            <div className="p-2.5 rounded-xl bg-emerald-100/70 border border-emerald-300 text-emerald-950 text-[11px] flex items-center justify-between font-bold flex-wrap gap-2">
                              <span className="flex items-center gap-1.5">
                                <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                                🎉 Refund Successfully Disbursed to Original Payment Source.
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {(adminRefund?.refund_arn || b.refund_arn || b.razorpay_refund_id) && (
                                  <span className="font-mono text-[10px] text-emerald-800 bg-white/80 px-2 py-0.5 rounded border border-emerald-200">
                                    Refund ID: {adminRefund?.refund_arn || b.refund_arn || b.razorpay_refund_id}
                                  </span>
                                )}
                                {(adminRefund?.refund_amount || b.refundable_amount || b.total_amount) && (
                                  <span className="font-mono text-[10px] text-emerald-900 bg-emerald-200/80 px-2 py-0.5 rounded border border-emerald-300 font-extrabold">
                                    Amount: ₹{adminRefund?.refund_amount || b.refundable_amount || b.total_amount}
                                  </span>
                                )}
                                {(adminRefund?.refunded_at || b.refunded_at) && (
                                  <span className="text-[10px] text-emerald-700 font-semibold">
                                    {new Date(adminRefund?.refunded_at || b.refunded_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Owner Rejection Notice */}
                          {isRejected && (
                            <p className="text-[11px] text-rose-800 font-semibold bg-rose-100/80 p-2 rounded-lg border border-rose-200">
                              <strong>Owner Rejection Note:</strong> {b.rejection_reason || b.cancellation_rejection_reason || 'Hotel policy does not allow cancellation for this reservation.'}
                            </p>
                          )}

                          {/* Owner Approved Notice (only when refund is not yet disbursed) */}
                          {isApproved && (
                            <p className="text-[10px] text-sky-900 font-medium italic pt-0.5">
                              * The Hotel Owner has approved your cancellation request. It is currently in the Admin processing queue to verify and disburse the refund to your original payment source.
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px] block">Total Amount Paid</span>
                      <span className="text-lg font-black text-teal-600">₹{b.total_amount}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Rate Stay Button or Rated Badge */}
                      {(b.booking_status === 'CONFIRMED' || b.booking_status === 'COMPLETED' || b.booking_status === 'CHECKED_OUT') && !b.user_review && (
                        <button
                          onClick={() => handleOpenRatingModal(b)}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Star className="w-3.5 h-3.5 fill-white" /> Rate Your Stay
                        </button>
                      )}

                      {b.user_review && (
                        <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-black text-xs flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" /> Rated {b.user_review.rating}★
                        </div>
                      )}

                      <Link
                        to={`/booking-confirmation/${b.id}`}
                        className="btn-dark py-2 px-4 text-xs font-extrabold flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" /> Receipt
                      </Link>

                      {canCancelBooking(b) && (
                        <button
                          onClick={() => handleOpenCancelModal(b)}
                          className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 font-extrabold hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          Cancel Stay
                        </button>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            ))}
            <Pagination
              currentPage={currentPage}
              totalItems={filteredBookings.length}
              itemsPerPage={10}
              onPageChange={(p) => {
                setCurrentPage(p);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              color="teal"
            />
          </div>
        )}

      </div>

      {/* RATING & REVIEW MODAL */}
      {ratingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Rate Your Stay</h3>
                <p className="text-xs font-bold text-slate-500 truncate max-w-[280px]">
                  {ratingBooking.hotel_details?.name}
                </p>
              </div>
              <button
                onClick={() => setRatingBooking(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitRating} className="space-y-5">
              {/* Star Rating Input */}
              <div className="text-center space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-600 block">
                  Select Rating Stars
                </label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 focus:outline-none transition-transform hover:scale-125 cursor-pointer"
                    >
                      <Star
                        className={`w-9 h-9 ${
                          star <= (hoverRating || selectedRating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300 fill-slate-100'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs font-extrabold text-amber-600 min-h-[20px]">
                  {RATING_LABELS[hoverRating || selectedRating]}
                </p>
              </div>

              {/* Review Comment Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 block">
                  Write Review / Feedback (Optional)
                </label>
                <textarea
                  rows={3}
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Tell us about your room cleanliness, staff behavior, facilities..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-bold outline-none focus:border-amber-500 focus:bg-white transition-all resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRatingBooking(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRating}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md shadow-amber-500/25 flex items-center gap-2 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {submittingRating ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Comprehensive 2-Step Cancellation & Bank Details Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8 max-h-[92vh] overflow-y-auto text-slate-900">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Cancel Room Reservation</h3>
                  <p className="text-xs text-slate-500 font-bold">
                    Booking #{cancelModalBooking.booking_id || cancelModalBooking.id} • Refund via Razorpay
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCancelModalBooking(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Hotel & Stay Details */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="font-black text-slate-900 text-sm">{cancelModalBooking.hotel_details?.name}</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-600 font-semibold">
                <span>Room: <strong className="text-slate-900">{cancelModalBooking.room_details?.title || 'Standard Stay'}</strong></span>
                <span>Check-in: <strong className="text-slate-900">{formatDisplayDate(cancelModalBooking.check_in)}</strong> ({cancelQuote?.check_in_time || '12:00 PM'})</span>
                <span>Check-out: <strong className="text-slate-900">{cancelModalBooking.check_out}</strong></span>
              </div>
            </div>

            {cancelLoadingQuote ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-7 h-7 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-bold text-slate-500">Calculating tiered refund policy...</p>
              </div>
            ) : cancelQuote ? (
              <div className="space-y-4">
                {/* Time Remaining Pill */}
                <div className={`flex items-center justify-between px-3.5 py-2 rounded-xl border text-xs ${
                  cancelQuote.is_immediate_cancellation 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950 font-bold'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <div className="flex items-center gap-2 font-bold">
                    <Clock className={`w-4 h-4 shrink-0 ${cancelQuote.is_immediate_cancellation ? 'text-emerald-600' : 'text-amber-600'}`} />
                    <span>{cancelQuote.is_immediate_cancellation ? 'Booking Status:' : 'Time Before Check-in:'}</span>
                  </div>
                  <span className={`font-black text-sm ${cancelQuote.is_immediate_cancellation ? 'text-emerald-800' : 'text-amber-800'}`}>
                    {cancelQuote.time_display || `${cancelQuote.hours_remaining} Hours`}
                  </span>
                </div>

                {/* Slabs Policy Table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                  <div className="bg-slate-100 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between font-black uppercase text-slate-700">
                    <span>Cancellation Policy Slabs</span>
                    <span className="text-[10px] text-slate-500">Tier Rules</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {(cancelQuote.slabs || []).map((slab, idx) => (
                      <div
                        key={idx}
                        className={`px-3.5 py-2 flex items-center justify-between ${
                          slab.is_applicable 
                            ? 'bg-emerald-50 text-emerald-950 font-bold border-l-4 border-emerald-600 pl-2.5' 
                            : 'text-slate-600 opacity-75'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{slab.time_window}</span>
                          {slab.is_applicable && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-600 text-white">
                              Applied Tier
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-rose-600 mr-2">Fee: {slab.cancellation_charge_percentage ?? slab.charge_percentage ?? 0}%</span>
                          <span className="font-black text-emerald-700">Refund: {slab.refund_percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Summary Box */}
                <div className="p-3.5 rounded-2xl bg-slate-900 text-white space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Total Booking Paid:</span>
                    <span className="font-bold">₹{parseFloat(cancelQuote.total_amount).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-rose-300">
                    <span>Cancellation Fee ({cancelQuote.cancellation_fee_percentage}%):</span>
                    <span className="font-bold">- ₹{parseFloat(cancelQuote.cancellation_charge).toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm font-black text-emerald-400">
                    <span>Estimated Refund Due ({cancelQuote.refund_percentage}%):</span>
                    <span className="text-base text-emerald-300">₹{parseFloat(cancelQuote.refundable_amount).toFixed(2)}</span>
                  </div>
                </div>

                {/* Direct Refund to Original Payment Source Notice */}
                <div className="p-3.5 rounded-2xl bg-teal-50/80 border border-teal-200 text-teal-950 flex items-start gap-2.5 text-xs">
                  <CreditCard className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-black block">Refund Directly to Original Payment Source</span>
                    <p className="text-[11px] text-teal-800 leading-relaxed font-medium">
                      Refunds are automatically processed directly back to your original payment method (Credit/Debit Card, UPI, or NetBanking) via Razorpay once approved by the Hotel Owner. No bank account details required.
                    </p>
                  </div>
                </div>

                {/* Cancellation Reason */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 block">
                    Reason for Cancellation (Optional)
                  </label>
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="e.g. Change in travel plans, flight delayed..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:border-rose-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            ) : null}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setCancelModalBooking(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Keep Reservation
              </button>
              <button
                type="button"
                onClick={handleConfirmCancellation}
                disabled={cancelling || cancelLoadingQuote}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black shadow-md shadow-rose-600/25 flex items-center gap-2 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {cancelling ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <span>Confirm Cancellation</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default MyBookings;

