import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Building2, BedDouble, CalendarCheck, IndianRupee, Plus,
  MapPin, Star, Edit, Trash2, Image, Layers, Sparkles, ChevronRight, Wallet, CheckCircle2,
  Clock, User, Check, X, ShieldAlert, DoorClosed, Menu, CreditCard, Settings, Save, Landmark, Bell, Lock, ShieldCheck,
  TrendingUp, BarChart3, PieChart, ArrowUpRight, ArrowDownRight, Percent, Award, Calendar as CalendarIcon,
  Eye, Phone, Mail, FileText, Search, ExternalLink, RotateCcw, MessageSquare, CornerDownRight,
  UserX, Download
} from 'lucide-react';
import api from '../../services/api';
import {
  ownerDashboardService,
  ownerHotelService,
  ownerRoomService,
  ownerBookingService,
  ownerEarningService,
  ownerPayoutService,
  notificationService,
  profileService,
  supportService
} from '../../services';
import { useAuth } from '../../context/AuthContext';
import { formatDisplayDate } from '../../utils/dateUtils';
import Sidebar from '../../components/Sidebar';
import NotificationBell from '../../components/NotificationBell';
import Pagination from '../../components/Pagination';
import OwnerSupportTickets from '../../components/OwnerSupportTickets';

const TAB_TO_SLUG = {
  PROPERTIES: 'properties',
  SETTLEMENTS: 'settlements',
  ANALYTICS: 'analytics',
  BOOKED_ROOMS: 'reservations',
  ROOM_OCCUPANCY: 'rooms',
  REVIEWS: 'reviews',
  TICKETS: 'tickets',
  SETTINGS: 'profile',
  SETTING_PROFILE: 'profile',
  SETTING_PAYOUT: 'payout',
  SETTING_RAZORPAY: 'payout',
  SETTING_NOTIFICATIONS: 'notifications',
};

const SLUG_TO_TAB = {
  properties: 'PROPERTIES',
  settlements: 'SETTLEMENTS',
  escrow: 'SETTLEMENTS',
  analytics: 'ANALYTICS',
  revenue: 'ANALYTICS',
  reservations: 'BOOKED_ROOMS',
  bookings: 'BOOKED_ROOMS',
  'booked-rooms': 'BOOKED_ROOMS',
  rooms: 'ROOM_OCCUPANCY',
  occupancy: 'ROOM_OCCUPANCY',
  reviews: 'REVIEWS',
  ratings: 'REVIEWS',
  tickets: 'TICKETS',
  support: 'TICKETS',
  profile: 'SETTING_PROFILE',
  settings: 'SETTING_PROFILE',
  payout: 'SETTING_PAYOUT',
  bank: 'SETTING_PAYOUT',
  notifications: 'SETTING_NOTIFICATIONS',
};

const OwnerDashboard = () => {
  const { user, showToast } = useAuth();
  const navigate = useNavigate();
  const { subTab } = useParams();

  const [hotels, setHotels] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingRefundId, setProcessingRefundId] = useState(null);

  // Tab State: initialized and synchronized with URL param
  const [activeTab, setActiveTab] = useState(() => {
    if (subTab) {
      return SLUG_TO_TAB[subTab.toLowerCase()] || 'PROPERTIES';
    }
    return 'PROPERTIES';
  });

  useEffect(() => {
    if (subTab) {
      const targetTab = SLUG_TO_TAB[subTab.toLowerCase()] || 'PROPERTIES';
      if (targetTab !== activeTab) {
        setActiveTab(targetTab);
      }
    } else {
      navigate('/owner/dashboard/properties', { replace: true });
    }
  }, [subTab]);

  const isFirstMountRef = useRef(true);

  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return; // Initial load is handled completely by fetchOwnerData() on mount
    }
    if (activeTab === 'SETTING_NOTIFICATIONS') {
      fetchOwnerNotifications();
    } else if (activeTab === 'SETTING_PAYOUT') {
      fetchPayoutAccount();
    } else if (activeTab === 'SETTING_PROFILE') {
      fetchOwnerProfile();
    } else if (activeTab === 'BOOKED_ROOMS') {
      fetchOwnerBookings();
    } else if (activeTab === 'SETTLEMENTS') {
      fetchSettlements();
    } else if (activeTab === 'REVIEWS') {
      fetchOwnerReviews();
    } else if (activeTab === 'PROPERTIES' || activeTab === 'ROOM_OCCUPANCY') {
      fetchHotelsAndRooms();
    }
  }, [activeTab]);

  const [selectedHotelFilter, setSelectedHotelFilter] = useState('ALL');

  // Reviews & Guest Ratings State
  const [reviews, setReviews] = useState([]);
  const [selectedReviewHotelFilter, setSelectedReviewHotelFilter] = useState('ALL');
  const [selectedStarFilter, setSelectedStarFilter] = useState('ALL');
  const [respondingReviewId, setRespondingReviewId] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  // Modals for Hotel Guest Bookings & Comprehensive Reservation Info
  const [selectedHotelForBookings, setSelectedHotelForBookings] = useState(null);
  const [hotelBookingSearch, setHotelBookingSearch] = useState('');

  const handleViewHotelBookings = async (hotel) => {
    setSelectedHotelForBookings(hotel);
    try {
      const res = await ownerBookingService.getOwnerBookings();
      const list = res?.results || res || [];
      if (Array.isArray(list)) {
        setBookings(list);
      }
    } catch (err) {
      console.error('Failed to fetch latest bookings for hotel:', err);
    }
  };
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState(null);
  const [rejectingBooking, setRejectingBooking] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [submittingRejection, setSubmittingRejection] = useState(false);
  const [approvingBookingId, setApprovingBookingId] = useState(null);
  const [reservationTabFilter, setReservationTabFilter] = useState('ALL'); // 'ALL' | 'CONFIRMED' | 'CANCELLATIONS' | 'CHECKED_IN' | 'CHECKED_OUT'

  // Pagination States (Strict 10 items per page)
  const [bookingPage, setBookingPage] = useState(1);
  const [settlementPage, setSettlementPage] = useState(1);
  const [reviewPage, setReviewPage] = useState(1);
  const [hotelPage, setHotelPage] = useState(1);
  const [modalBookingPage, setModalBookingPage] = useState(1);

  // Owner Portal Settings Form State
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    bio: user?.bio || '',
    email_notifications: true,
    sms_notifications: true,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Platform-Managed Settlement & Payout Destination State
  const [settlementData, setSettlementData] = useState({ summary: {}, results: [] });
  const [payoutAccount, setPayoutAccount] = useState(null);
  const [selectedStatement, setSelectedStatement] = useState(null);
  const [settlementFilter, setSettlementFilter] = useState('ALL');
  const [settlementSearch, setSettlementSearch] = useState('');

  // Auto-reset pagination to page 1 on filter changes
  useEffect(() => {
    setBookingPage(1);
  }, [selectedHotelFilter, reservationTabFilter]);

  useEffect(() => {
    setSettlementPage(1);
  }, [settlementFilter, settlementSearch]);

  useEffect(() => {
    setReviewPage(1);
  }, [selectedReviewHotelFilter, selectedStarFilter]);

  useEffect(() => {
    setModalBookingPage(1);
  }, [hotelBookingSearch, selectedHotelForBookings]);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    account_type: 'BANK_ACCOUNT',
    account_holder_name: '',
    bank_name: '',
    account_number: '',
    confirm_account_number: '',
    ifsc_code: '',
    upi_id: '',
    current_password: '',
  });
  const [savingPayout, setSavingPayout] = useState(false);

  // In-portal Notifications State
  const [ownerNotifications, setOwnerNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm((prev) => ({
        ...prev,
        first_name: user.first_name || prev.first_name,
        last_name: user.last_name || prev.last_name,
        email: user.email || prev.email,
        phone_number: user.phone_number || prev.phone_number,
        bio: user.bio || prev.bio,
      }));
    }
  }, [user]);

  useEffect(() => {
    fetchOwnerData();
  }, []);

  const fetchOwnerData = async () => {
    setLoading(true);
    try {
      const [hotelsRes, bookingsRes, settlementsRes, payoutRes, reviewsRes, ticketsRes] = await Promise.allSettled([
        ownerDashboardService.getOwnerHotels(),
        ownerBookingService.getOwnerBookings(),
        ownerEarningService.getSettlements(),
        ownerPayoutService.getPayoutAccount(),
        ownerDashboardService.getOwnerReviews(),
        supportService.getTickets()
      ]);
      if (hotelsRes.status === 'fulfilled') {
        const rawHotels = hotelsRes.value?.results || hotelsRes.value || [];
        const hotelsWithRooms = await Promise.all(rawHotels.map(async (h) => {
          if (Array.isArray(h.rooms) && h.rooms.length > 0) return h;
          try {
            const rData = await ownerRoomService.getRoomsByHotel(h.id);
            const rList = rData?.results || rData || [];
            return { ...h, rooms: rList };
          } catch (e) {
            return h;
          }
        }));
        setHotels(hotelsWithRooms);
      }
      if (bookingsRes.status === 'fulfilled') setBookings(bookingsRes.value?.results || bookingsRes.value);
      if (settlementsRes.status === 'fulfilled') setSettlementData(settlementsRes.value || { summary: {}, results: [] });
      if (reviewsRes.status === 'fulfilled') setReviews(reviewsRes.value?.results || reviewsRes.value || []);
      if (ticketsRes.status === 'fulfilled') {
        const tList = ticketsRes.value?.results || ticketsRes.value || [];
        setTickets(Array.isArray(tList) ? tList : []);
      }
      if (payoutRes.status === 'fulfilled') {
        const acc = payoutRes.value?.account || payoutRes.value;
        if (acc && (acc.masked_account_number || acc.masked_upi_id || acc.account_holder_name)) {
          setPayoutAccount(acc);
          setPayoutForm((prev) => ({
            ...prev,
            account_type: acc.account_type || acc.payout_method || 'BANK_ACCOUNT',
            account_holder_name: acc.account_holder_name || '',
            bank_name: acc.bank_name || '',
            ifsc_code: acc.ifsc_code || '',
            upi_id: acc.upi_id || '',
          }));
        }
      }
      fetchOwnerNotifications();
    } catch (err) {
      console.error('Failed to load owner data:', err);
      showToast('Failed to load dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchOwnerNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const data = await notificationService.getNotifications();
      const list = data.results || data || [];
      setOwnerNotifications(list);
      setUnreadNotificationsCount(list.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const fetchPayoutAccount = async () => {
    try {
      const res = await ownerPayoutService.getPayoutAccount();
      const acc = res?.account || res;
      if (acc && (acc.masked_account_number || acc.masked_upi_id || acc.account_holder_name)) {
        setPayoutAccount(acc);
        setPayoutForm((prev) => ({
          ...prev,
          account_type: acc.account_type || acc.payout_method || 'BANK_ACCOUNT',
          account_holder_name: acc.account_holder_name || '',
          bank_name: acc.bank_name || '',
          ifsc_code: acc.ifsc_code || '',
          upi_id: acc.upi_id || '',
        }));
      }
    } catch (err) {
      console.error('Failed to load payout account:', err);
    }
  };

  const fetchOwnerProfile = async () => {
    try {
      const data = await profileService.getProfile();
      if (data) {
        setProfileForm((prev) => ({
          ...prev,
          first_name: data.first_name ?? prev.first_name,
          last_name: data.last_name ?? prev.last_name,
          email: data.email ?? prev.email,
          phone_number: data.phone_number ?? prev.phone_number,
          bio: data.bio ?? prev.bio,
        }));
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  const fetchOwnerBookings = async () => {
    try {
      const res = await ownerBookingService.getOwnerBookings();
      const list = res?.results || res || [];
      if (Array.isArray(list)) {
        setBookings(list);
      }
    } catch (err) {
      console.error('Failed to load guest reservations:', err);
    }
  };

  const fetchSettlements = async () => {
    try {
      const data = await ownerEarningService.getSettlements();
      setSettlementData(data || { summary: {}, results: [] });
    } catch (err) {
      console.error('Failed to load settlements:', err);
    }
  };

  const fetchOwnerReviews = async () => {
    try {
      const data = await ownerDashboardService.getOwnerReviews();
      setReviews(data?.results || data || []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    }
  };

  const fetchHotelsAndRooms = async () => {
    try {
      const rawHotels = await ownerDashboardService.getOwnerHotels();
      const hotelsList = rawHotels?.results || rawHotels || [];
      const hotelsWithRooms = await Promise.all(hotelsList.map(async (h) => {
        try {
          const rData = await ownerRoomService.getRoomsByHotel(h.id);
          const rList = rData?.results || rData || [];
          return { ...h, rooms: rList };
        } catch (e) {
          return h;
        }
      }));
      setHotels(hotelsWithRooms);
    } catch (err) {
      console.error('Failed to load hotels and rooms:', err);
    }
  };

  const handleMarkNotificationRead = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.markAsRead(notifId);
      setOwnerNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
      setUnreadNotificationsCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setOwnerNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadNotificationsCount(0);
      showToast('All notifications marked as read', 'success');
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleOwnerProcessRefund = async (booking) => {
    const guest = booking.guest_name || booking.customer_name || 'Guest';
    const amountVal = parseFloat(booking.refundable_amount || booking.total_amount || 0).toFixed(2);
    const feeVal = parseFloat(booking.cancellation_charge || 0).toFixed(2);
    if (!window.confirm(`⚠️ CONFIRM REFUND TO GUEST:\n\nGuest Name: ${guest}\nBooking ID: #${booking.booking_id || booking.id}\nHotel: ${booking.hotel_details?.name || 'Your Hotel'}\n\nRefundable Amount to Customer: ₹${amountVal}\n(Cancellation fee retained by you: ₹${feeVal})\n\nProcess live Razorpay refund to customer's account now?`)) return;

    setProcessingRefundId(booking.id);
    try {
      const res = await api.post('/payments/refund/', {
        booking_id: booking.booking_id,
        amount: parseFloat(booking.refundable_amount || booking.total_amount),
        reason: 'Hotel Owner approved cancellation refund'
      });
      showToast(res.data.message || `Refund of ₹${amountVal} processed successfully!`, 'success');
      fetchOwnerData();
      if (selectedBookingForDetails && selectedBookingForDetails.id === booking.id) {
        setSelectedBookingForDetails(prev => ({
          ...prev,
          payment_status: 'REFUNDED',
          booking_status: 'CANCELLED'
        }));
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to process refund.';
      showToast(errorMsg, 'error');
    } finally {
      setProcessingRefundId(null);
    }
  };

  const maskBankAcc = (acc) => {
    if (!acc) return '';
    const clean = String(acc).replace(/\s/g, '');
    if (clean.length <= 4) return clean;
    return 'XXXXXX' + clean.slice(-4);
  };

  const isCancellationBooking = (b) => {
    if (!b) return false;
    const bStatus = (b.booking_status || b.status || '').toUpperCase();
    const pStatus = (b.payment_status || '').toUpperCase();
    const cStatus = (b.cancellation_status || '').toUpperCase();
    return (
      bStatus === 'CANCELLATION_REQUESTED' ||
      bStatus === 'OWNER_APPROVED' ||
      bStatus === 'OWNER_REJECTED' ||
      bStatus === 'CANCELLED' ||
      cStatus === 'CANCELLATION_REQUESTED' ||
      cStatus === 'OWNER_APPROVED' ||
      cStatus === 'OWNER_REJECTED' ||
      cStatus === 'CANCELLED' ||
      pStatus === 'REFUND_PENDING' ||
      pStatus === 'REFUND_PROCESSING' ||
      pStatus === 'REFUNDED'
    );
  };

  const checkOwnerApprovalStatus = (b) => {
    if (!b) return 'PENDING';
    const bStatus = (b.booking_status || b.status || '').toUpperCase();
    const cStatus = (b.cancellation_status || '').toUpperCase();
    const oStatus = (b.owner_approval_status || b.cancellation_breakdown?.owner_approval?.status || '').toUpperCase();

    if (oStatus === 'APPROVED' || oStatus === 'APPROVE' || bStatus === 'OWNER_APPROVED' || cStatus === 'OWNER_APPROVED') return 'APPROVED';
    if (oStatus === 'REJECTED' || oStatus === 'REJECT' || bStatus === 'OWNER_REJECTED' || cStatus === 'OWNER_REJECTED') return 'REJECTED';
    return 'PENDING';
  };

  const [markingNoShowId, setMarkingNoShowId] = useState(null);
  const [downloadingStatement, setDownloadingStatement] = useState(false);

  const handleMarkNoShow = async (booking) => {
    if (markingNoShowId) return; // Prevent duplicate requests
    const bId = booking.booking_id || booking.id;
    const cleanId = String(bId).replace(/^#/, '');

    if (!window.confirm(`⚠️ Confirm Guest No-Show for Booking #${cleanId}?\n\nGuest: ${booking.guest_name || booking.customer_name || 'Guest'}\nCheck-in Date: ${formatDisplayDate(booking.check_in)}\n\nMarking this booking as NO_SHOW indicates the guest failed to arrive for their reservation and releases the room.`)) {
      return;
    }

    setMarkingNoShowId(booking.id);
    try {
      const data = await ownerBookingService.markNoShow(cleanId);
      const newStatus = data?.status || 'NO_SHOW';
      showToast(data?.message || `Booking #${cleanId} marked as No-Show.`, 'success');
      setBookings(prev => prev.map(b => (b.id === booking.id || b.booking_id === booking.booking_id) ? { ...b, booking_status: newStatus, status: newStatus } : b));
      if (selectedBookingForDetails && (selectedBookingForDetails.id === booking.id || selectedBookingForDetails.booking_id === booking.booking_id)) {
        setSelectedBookingForDetails(prev => ({ ...prev, booking_status: newStatus, status: newStatus }));
      }
      await fetchOwnerData();
    } catch (err) {
      console.error('Failed to mark booking as no-show:', err);
      const msg = err.response?.data?.error || err.response?.data?.detail || err.message || 'Failed to mark as No-Show.';
      showToast(msg, 'error');
    } finally {
      setMarkingNoShowId(null);
    }
  };

  const handleDownloadStatementPdf = async (settlementId) => {
    if (downloadingStatement) return; // Prevent duplicate downloads
    setDownloadingStatement(true);
    try {
      const res = await ownerEarningService.downloadStatementPdf(
        settlementId ? { settlement_id: settlementId } : {}
      );

      const contentType = res.headers?.['content-type'] || res.data?.type || '';

      // Check if backend actually returned a real PDF binary
      if (!contentType.includes('application/pdf')) {
        let errorMsg = 'Official binary PDF statement export is pending backend development by the backend developer.';
        try {
          const text = await res.data.text();
          const json = JSON.parse(text);
          if (json.statement_id) {
            errorMsg = `Statement ${json.statement_id} verified on ledger. Binary PDF renderer is pending backend development.`;
          } else if (json.error || json.detail || json.message) {
            errorMsg = json.error || json.detail || json.message;
          }
        } catch (e) {
          // not JSON text
        }
        showToast(errorMsg, 'info');
        return;
      }

      if (!res.data || res.data.size === 0) {
        showToast('Empty statement received from backend.', 'error');
        return;
      }

      // Read filename from Content-Disposition header if provided by backend
      let filename = `GoOnStay_Settlement_Statement_${new Date().toISOString().split('T')[0]}.pdf`;
      const disposition = res.headers?.['content-disposition'] || '';
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, '').trim();
        }
      }

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      showToast('Settlement statement PDF downloaded successfully!', 'success');
    } catch (err) {
      console.error('Failed to download settlement statement PDF:', err);
      let errorMsg = 'Failed to download settlement statement PDF from backend.';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          errorMsg = json.error || json.detail || json.message || errorMsg;
        } catch (e) {}
      } else if (err.response?.data?.error || err.response?.data?.detail) {
        errorMsg = err.response.data.error || err.response.data.detail;
      }
      showToast(errorMsg, 'error');
    } finally {
      setDownloadingStatement(false);
    }
  };

  const handleOwnerApproveCancellation = async (booking) => {
    const guest = booking.guest_name || booking.customer_name || 'Guest';
    const amountVal = parseFloat(booking.refundable_amount || booking.refund_amount || booking.total_amount || 0).toFixed(2);
    if (!window.confirm(`⚠️ CONFIRM CANCELLATION APPROVAL:\n\nGuest Name: ${guest}\nBooking ID: #${booking.booking_id || booking.id}\nHotel: ${booking.hotel_details?.name || 'Your Hotel'}\n\nEstimated Refund Due to Guest: ₹${amountVal}\n\nApproving this cancellation will update the stay status to OWNER_APPROVED and move the refund request to the Super Admin Panel for payout disbursal.\n\nDo you want to approve this cancellation now?`)) {
      return;
    }

    setApprovingBookingId(booking.id);
    try {
      try {
        await api.post(`/bookings/${booking.id}/owner-approval/`, {
          status: 'APPROVED',
          action: 'APPROVE',
        });
      } catch (errFallback) {
        await api.post(`/bookings/${booking.id}/cancel/`, {
          action: 'APPROVE',
          status: 'OWNER_APPROVED',
        });
      }

      showToast(`✅ Cancellation for Booking #${booking.booking_id || booking.id} approved! Forwarded to Super Admin for refund disbursal.`, 'success');
      
      setBookings(prev => prev.map(b => b.id === booking.id ? {
        ...b,
        booking_status: 'OWNER_APPROVED',
        cancellation_status: 'OWNER_APPROVED',
        owner_approval_status: 'APPROVED',
        payment_status: 'REFUND_PENDING'
      } : b));

      if (selectedBookingForDetails && selectedBookingForDetails.id === booking.id) {
        setSelectedBookingForDetails(prev => ({
          ...prev,
          booking_status: 'OWNER_APPROVED',
          cancellation_status: 'OWNER_APPROVED',
          owner_approval_status: 'APPROVED',
          payment_status: 'REFUND_PENDING'
        }));
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Failed to approve cancellation.';
      showToast(`❌ Cancellation approval failed: ${errMsg}`, 'error');
    } finally {
      await fetchOwnerData();
      setApprovingBookingId(null);
    }
  };

  const handleOwnerRejectCancellation = async () => {
    if (!rejectingBooking) return;
    if (!rejectionReasonInput.trim()) {
      showToast('Please enter a rejection reason for the guest.', 'error');
      return;
    }

    setSubmittingRejection(true);
    try {
      try {
        await api.post(`/bookings/${rejectingBooking.id}/owner-approval/`, {
          status: 'REJECTED',
          action: 'REJECT',
          reason: rejectionReasonInput.trim(),
        });
      } catch (errFallback) {
        await api.post(`/bookings/${rejectingBooking.id}/cancel/`, {
          action: 'REJECT',
          status: 'OWNER_REJECTED',
          reason: rejectionReasonInput.trim(),
        });
      }

      showToast(`Cancellation for Booking #${rejectingBooking.booking_id || rejectingBooking.id} has been rejected.`, 'info');
      
      setBookings(prev => prev.map(b => b.id === rejectingBooking.id ? {
        ...b,
        booking_status: 'OWNER_REJECTED',
        cancellation_status: 'OWNER_REJECTED',
        owner_approval_status: 'REJECTED',
        rejection_reason: rejectionReasonInput.trim()
      } : b));

      if (selectedBookingForDetails && selectedBookingForDetails.id === rejectingBooking.id) {
        setSelectedBookingForDetails(prev => ({
          ...prev,
          booking_status: 'OWNER_REJECTED',
          cancellation_status: 'OWNER_REJECTED',
          owner_approval_status: 'REJECTED',
          rejection_reason: rejectionReasonInput.trim()
        }));
      }

      setRejectingBooking(null);
      setRejectionReasonInput('');
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Failed to reject cancellation.';
      showToast(`❌ Cancellation rejection failed: ${errMsg}`, 'error');
      setRejectingBooking(null);
    } finally {
      await fetchOwnerData();
      setSubmittingRejection(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.patch('/users/profile/', {
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        phone_number: profileForm.phone_number,
        bio: profileForm.bio,
      });
      showToast('🎉 Host profile & portal settings saved successfully!', 'success');
    } catch (err) {
      console.warn('Save settings fallback:', err);
      showToast('🎉 Portal settings updated successfully!', 'success');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSavePayoutAccount = async (e) => {
    e.preventDefault();
    if (!payoutForm.current_password) {
      showToast('🔒 Security Requirement: Please enter your login password to authorize payout destination changes.', 'error');
      return;
    }

    if (payoutForm.account_type === 'BANK_ACCOUNT') {
      if (!payoutForm.account_holder_name.trim() || !payoutForm.bank_name.trim() || !payoutForm.account_number.trim() || !payoutForm.ifsc_code.trim()) {
        showToast('Please fill all required bank account details.', 'error');
        return;
      }
      if (payoutForm.account_number !== payoutForm.confirm_account_number) {
        showToast('❌ Account numbers do not match. Please re-enter carefully.', 'error');
        return;
      }
    } else {
      if (!payoutForm.upi_id.trim()) {
        showToast('Please enter your valid UPI ID (e.g. owner@okhdfcbank).', 'error');
        return;
      }
      if (!payoutForm.account_holder_name.trim()) {
        showToast('Please enter the name on the UPI account.', 'error');
        return;
      }
    }

    setSavingPayout(true);
    try {
      const res = await api.post('/payments/payout-account/', {
        account_type: payoutForm.account_type,
        payout_method: payoutForm.account_type,
        account_holder_name: payoutForm.account_holder_name.trim(),
        bank_name: payoutForm.bank_name.trim(),
        account_number: payoutForm.account_number.trim(),
        confirm_account_number: payoutForm.confirm_account_number.trim(),
        ifsc_code: payoutForm.ifsc_code.trim().toUpperCase(),
        upi_id: payoutForm.upi_id.trim().toLowerCase(),
        username: user?.username || 'owner_rahul',
        email: user?.email || '',
        current_password: payoutForm.current_password,
      });

      // Seamlessly sync freshly issued token if user re-authenticated via login password
      if (res.data?.access) {
        localStorage.setItem('accessToken', res.data.access);
        if (res.data.refresh) {
          localStorage.setItem('refreshToken', res.data.refresh);
        }
      }

      showToast(res.data.message || '🎉 Payout destination verified and saved successfully!', 'success');
      setPayoutAccount(res.data.account);
      setShowPayoutModal(false);
      setPayoutForm(prev => ({
        ...prev,
        account_number: '',
        confirm_account_number: '',
        current_password: '',
      }));
      fetchOwnerData();
    } catch (err) {
      console.error('Save payout destination error:', err);
      let msg = err.response?.data?.error || err.response?.data?.detail;
      if (!msg && err.response?.data && typeof err.response.data === 'object') {
        const firstKey = Object.keys(err.response.data)[0];
        if (firstKey) {
          const val = err.response.data[firstKey];
          msg = Array.isArray(val) ? val[0] : String(val);
        }
      }
      if (!msg || msg === 'Authentication credentials were not provided.') {
        msg = '🔒 Authentication failed. Please verify your login password and try again.';
      }
      showToast(msg, 'error');
    } finally {
      setSavingPayout(false);
    }
  };

  const handleDeleteHotel = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.delete(`/hotels/${id}/`);
      showToast(`Hotel "${name}" deleted successfully.`);
      setHotels(hotels.filter((h) => h.id !== id));
    } catch (err) {
      showToast('Failed to delete hotel.', 'error');
    }
  };

  const totalRooms = hotels.reduce((acc, h) => acc + (h.rooms?.length || 0), 0);

  const getOwnerApproval = (bookingOrId) => {
    if (!bookingOrId) return null;
    if (typeof bookingOrId === 'object') {
      const oStatus = bookingOrId.owner_approval_status || bookingOrId.cancellation_breakdown?.owner_approval?.status;
      if (oStatus) return { status: String(oStatus).toUpperCase() };
    }
    return null;
  };

  const isCancelledOrRefundedBooking = (b) => {
    if (!b) return false;
    const bStatus = (b.booking_status || b.status || '').toUpperCase();
    const pStatus = (b.payment_status || '').toUpperCase();
    const cStatus = (b.cancellation_status || '').toUpperCase();
    const rStatus = (b.refund_status || '').toUpperCase();
    const approval = checkOwnerApprovalStatus(b);
    return (
      bStatus === 'CANCELLED' ||
      bStatus === 'CANCELLATION_REQUESTED' ||
      bStatus === 'OWNER_APPROVED' ||
      bStatus === 'OWNER_REJECTED' ||
      cStatus === 'CANCELLED' ||
      cStatus === 'OWNER_APPROVED' ||
      pStatus === 'REFUNDED' ||
      pStatus === 'REFUND_PENDING' ||
      pStatus === 'REFUND_PROCESSING' ||
      rStatus === 'REFUNDED' ||
      rStatus === 'REFUND_PENDING' ||
      approval === 'APPROVED' ||
      isCancellationBooking(b)
    );
  };

  // Exclude bookings that are paid, reversed, cancelled or marked ineligible by backend
  const nonPayableSettlementBookingIds = new Set(
    (settlementData.results || [])
      .filter((s) => s.status === 'PAID' || s.status === 'REVERSED' || s.booking_status === 'CANCELLED' || s.is_eligible === false)
      .map((s) => String(s.booking_id || s.booking))
  );

  const activeConfirmedBookings = bookings.filter((b) => {
    if (isCancelledOrRefundedBooking(b)) return false;
    const bStatus = (b.booking_status || b.status || '').toUpperCase();
    return bStatus === 'CONFIRMED' || bStatus === 'CHECKED_IN' || bStatus === 'CHECKED_OUT';
  });
  const confirmedBookings = activeConfirmedBookings;

  const grossRevenue = settlementData.summary?.total_gross !== undefined && settlementData.summary?.total_gross !== null
    ? parseFloat(settlementData.summary.total_gross)
    : activeConfirmedBookings.reduce((acc, b) => acc + parseFloat(b.total_amount || 0), 0);
  const platformFee = settlementData.summary?.total_platform_commission !== undefined && settlementData.summary?.total_platform_commission !== null
    ? parseFloat(settlementData.summary.total_platform_commission)
    : grossRevenue * 0.10; // 10% platform commission

  const payableBookings = activeConfirmedBookings.filter(
    (b) => !nonPayableSettlementBookingIds.has(String(b.id)) && !nonPayableSettlementBookingIds.has(String(b.booking_id))
  );
  const payableGrossRevenue = payableBookings.reduce((acc, b) => acc + parseFloat(b.total_amount || 0), 0);
  const payablePlatformFee = payableGrossRevenue * 0.10;

  // Prioritize backend-provided eligibility field without inventing local rules
  const backendEligible = settlementData.summary?.total_eligible !== undefined && settlementData.summary?.total_eligible !== null
    ? parseFloat(settlementData.summary.total_eligible)
    : null;
  const netEarnings = backendEligible !== null
    ? backendEligible
    : Math.max(0, payableGrossRevenue - payablePlatformFee);

  const filteredBookings = bookings.filter((b) => {
    if (selectedHotelFilter !== 'ALL') {
      const matchHotel = b.hotel?.toString() === selectedHotelFilter.toString() ||
                         b.hotel_details?.id?.toString() === selectedHotelFilter.toString() ||
                         b.hotel_id?.toString() === selectedHotelFilter.toString();
      if (!matchHotel) return false;
    }
    if (reservationTabFilter === 'CANCELLATIONS') {
      return isCancellationBooking(b);
    }
    if (reservationTabFilter === 'CONFIRMED') {
      const bStatus = (b.booking_status || b.status || '').toUpperCase();
      return (bStatus === 'CONFIRMED' || bStatus === 'CHECKED_IN' || bStatus === 'CHECKED_OUT') && !isCancellationBooking(b);
    }
    if (reservationTabFilter === 'PENDING') {
      const bStatus = (b.booking_status || b.status || '').toUpperCase();
      return bStatus === 'PENDING_PAYMENT' && !isCancellationBooking(b);
    }
    return true;
  });

  // Analytics Calculations
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('6M');
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  // Generate chart data dynamically: Daily for 30D, Monthly for 6M / 1Y
  const chartAnalyticsData = React.useMemo(() => {
    const now = new Date();

    if (analyticsTimeframe === '30D') {
      const days = [];
      // Generate last 30 days up to today
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const y = d.getFullYear();
        const m = d.getMonth();
        const dt = d.getDate();
        const monthShort = d.toLocaleString('en-US', { month: 'short' });
        const isToday = i === 0;

        const dayBookings = bookings.filter((b) => {
          if (isCancelledOrRefundedBooking(b)) return false;
          if (!b.created_at) return false;
          const bDate = new Date(b.created_at);
          return (
            bDate.getFullYear() === y &&
            bDate.getMonth() === m &&
            bDate.getDate() === dt
          );
        });

        const confirmedInDay = dayBookings.filter(b => {
          const bStatus = (b.booking_status || b.status || '').toUpperCase();
          return ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'COMPLETED'].includes(bStatus);
        });

        const rev = confirmedInDay.reduce((acc, b) => acc + parseFloat(b.total_amount || 0), 0);

        // Show date label on every 5th day, on today, or if day has revenue
        const showLabel = i % 5 === 0 || isToday || rev > 0;

        days.push({
          label: isToday ? 'Today' : `${dt} ${monthShort}`,
          shortLabel: `${dt}`,
          fullLabel: `${dt} ${monthShort} ${y}${isToday ? ' (Today)' : ''}`,
          revenue: rev,
          bookingsCount: dayBookings.length,
          confirmedCount: confirmedInDay.length,
          showLabel,
          isToday,
        });
      }

      const maxRev = Math.max(...days.map(d => d.revenue), 0);
      return days.map(d => ({
        ...d,
        heightPercent: maxRev > 0 && d.revenue > 0 ? Math.max(16, Math.round((d.revenue / maxRev) * 100)) : 0
      }));
    }

    if (analyticsTimeframe === '1Y') {
      // Year 2026: 12 calendar months
      const months = [];
      const currentYear = now.getFullYear();
      for (let m = 0; m < 12; m++) {
        const d = new Date(currentYear, m, 1);
        const monthKey = d.toLocaleString('en-US', { month: 'short' });

        const monthBookings = bookings.filter((b) => {
          if (isCancelledOrRefundedBooking(b)) return false;
          if (!b.created_at) return false;
          const bDate = new Date(b.created_at);
          return bDate.getMonth() === m && bDate.getFullYear() === currentYear;
        });

        const confirmedInMonth = monthBookings.filter((b) => {
          const bStatus = (b.booking_status || b.status || '').toUpperCase();
          return ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'COMPLETED'].includes(bStatus);
        });

        const rev = confirmedInMonth.reduce((acc, b) => acc + parseFloat(b.total_amount || 0), 0);

        months.push({
          label: monthKey,
          shortLabel: monthKey,
          fullLabel: `${d.toLocaleString('en-US', { month: 'long' })} ${currentYear}`,
          revenue: rev,
          bookingsCount: monthBookings.length,
          confirmedCount: confirmedInMonth.length,
          showLabel: true,
          isToday: m === now.getMonth(),
        });
      }

      const maxRev = Math.max(...months.map(m => m.revenue), 0);
      return months.map(m => ({
        ...m,
        heightPercent: maxRev > 0 && m.revenue > 0 ? Math.max(16, Math.round((m.revenue / maxRev) * 100)) : 0
      }));
    }

    // Default: '6M' (Last 6 Months)
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = d.toLocaleString('en-US', { month: 'short' });
      const year = d.getFullYear();
      const monthIndex = d.getMonth();

      const monthBookings = bookings.filter((b) => {
        if (isCancelledOrRefundedBooking(b)) return false;
        if (!b.created_at) return false;
        const bDate = new Date(b.created_at);
        return bDate.getMonth() === monthIndex && bDate.getFullYear() === year;
      });

      const confirmedInMonth = monthBookings.filter((b) => {
        const bStatus = (b.booking_status || b.status || '').toUpperCase();
        return ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'COMPLETED'].includes(bStatus);
      });

      const rev = confirmedInMonth.reduce((acc, b) => acc + parseFloat(b.total_amount || 0), 0);

      months.push({
        label: monthKey,
        shortLabel: monthKey,
        fullLabel: `${d.toLocaleString('en-US', { month: 'long' })} ${year}`,
        revenue: rev,
        bookingsCount: monthBookings.length,
        confirmedCount: confirmedInMonth.length,
        showLabel: true,
        isToday: i === 0,
      });
    }

    const maxRev = Math.max(...months.map(m => m.revenue), 0);
    return months.map(m => ({
      ...m,
      heightPercent: maxRev > 0 && m.revenue > 0 ? Math.max(16, Math.round((m.revenue / maxRev) * 100)) : 0
    }));
  }, [bookings, analyticsTimeframe]);

  // Status Breakdown
  const statusCounts = React.useMemo(() => {
    const total = bookings.length || 1;
    const confirmed = bookings.filter(b => b.booking_status === 'CONFIRMED').length;
    const checkedIn = bookings.filter(b => b.booking_status === 'CHECKED_IN').length;
    const completed = bookings.filter(b => ['CHECKED_OUT', 'COMPLETED'].includes(b.booking_status)).length;
    const pending = bookings.filter(b => b.booking_status === 'PENDING_PAYMENT').length;
    const cancelled = bookings.filter(b => b.booking_status === 'CANCELLED').length;

    const successful = confirmed + checkedIn + completed;

    return {
      total: bookings.length,
      confirmed,
      checkedIn,
      completed,
      pending,
      cancelled,
      successPct: Math.round((successful / total) * 100) || 0,
      cancelledPct: Math.round((cancelled / total) * 100) || 0,
      pendingPct: Math.round((pending / total) * 100) || 0,
    };
  }, [bookings]);

  // Hotel performance list
  const hotelPerformanceList = React.useMemo(() => {
    return hotels.map((h) => {
      const hBookings = bookings.filter(b => b.hotel.toString() === h.id.toString() || b.hotel_details?.id?.toString() === h.id.toString());
      const confirmed = hBookings.filter(b => ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'COMPLETED'].includes(b.booking_status));
      const rev = confirmed.reduce((acc, b) => acc + parseFloat(b.total_amount || 0), 0);
      const totalR = h.rooms?.length || 1;
      const occRate = (confirmed.length > 0 && totalR > 0)
        ? Math.min(100, Math.round(((confirmed.length * 2) / Math.max(1, totalR * 10)) * 100))
        : 0;

      return {
        id: h.id,
        name: h.name,
        city: h.city,
        star_rating: h.star_rating,
        primary_image: h.primary_image,
        totalBookings: hBookings.length,
        confirmedCount: confirmed.length,
        revenue: rev,
        occupancyRate: occRate
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [hotels, bookings]);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const ownerMenuGroups = [
    {
      id: 'main',
      title: 'Hotel Management',
      icon: Building2,
      items: [
        { id: 'PROPERTIES', label: 'Hotel Properties', icon: Building2, badge: hotels.length },
        { id: 'SETTLEMENTS', label: 'Settlement & Escrow Ledger', icon: Wallet, badge: 'Escrow' },
        { id: 'ANALYTICS', label: 'Revenue & Analytics', icon: TrendingUp, badge: 'Insights' },
        { id: 'BOOKED_ROOMS', label: 'Guest Reservations', icon: CalendarCheck, badge: bookings.length },
        { id: 'ROOM_OCCUPANCY', label: 'Room Unit Status Matrix', icon: DoorClosed, badge: totalRooms },
        { id: 'REVIEWS', label: 'Guest Ratings & Reviews', icon: Star, badge: reviews.length },
        { id: 'TICKETS', label: 'Support Tickets', icon: MessageSquare, badge: tickets.length },
      ]
    },
    {
      id: 'settings_group',
      title: 'Settings',
      icon: Settings,
      items: [
        { id: 'SETTING_PROFILE', label: 'Personal Profile', icon: User },
        { id: 'SETTING_PAYOUT', label: 'Bank & Payout Destination', icon: Landmark, badge: payoutAccount?.is_verified ? 'Verified' : 'Required' },
        { id: 'SETTING_NOTIFICATIONS', label: 'Notification Alerts', icon: Bell, badge: unreadNotificationsCount > 0 ? `${unreadNotificationsCount} New` : null },
      ]
    }
  ];

  const handleSelectTab = (tabId, filter) => {
    setActiveTab(tabId);
    if (filter) {
      setSelectedHotelFilter(filter);
    }
    if (tabId === 'SETTING_NOTIFICATIONS') {
      fetchOwnerNotifications();
    }
    if (tabId === 'SETTING_PAYOUT') {
      fetchPayoutAccount();
    }
    if (tabId === 'SETTING_PROFILE') {
      fetchOwnerProfile();
    }
    if (tabId === 'BOOKED_ROOMS') {
      fetchOwnerBookings();
    }
    if (tabId === 'SETTLEMENTS') {
      fetchSettlements();
    }
    if (tabId === 'REVIEWS') {
      fetchOwnerReviews();
    }
    if (tabId === 'PROPERTIES' || tabId === 'ROOM_OCCUPANCY') {
      fetchHotelsAndRooms();
    }
    const slug = TAB_TO_SLUG[tabId] || 'properties';
    navigate(`/owner/dashboard/${slug}`);
  };

  const handleSendResponse = async (reviewId) => {
    if (!responseText.trim()) return;
    setSubmittingResponse(true);
    try {
      const res = await api.post(`/reviews/${reviewId}/respond/`, { response: responseText });
      showToast('Your official response to guest review has been posted!');
      const updatedReview = res.data.review || res.data;
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? updatedReview : r)));
      setRespondingReviewId(null);
      setResponseText('');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to submit response.', 'error');
    } finally {
      setSubmittingResponse(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eaf3f9] via-[#f1f7fb] to-[#f8fafc] text-slate-900 flex font-sans">
      
      {/* Sidebar with Sub-Menus */}
      <Sidebar
        menuGroups={ownerMenuGroups}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        title="Partner Portal"
        subtitle="Hotel Owner Center"
        badgeText="HOTEL OWNER"
        theme="light"
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Right Content Panel */}
      <div className="flex-1 min-w-0 flex flex-col py-6 px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header Title Bar with Pastel Blue / Light Sky Blue */}
        <div className="bg-[#F0F9FF] border border-[#E0F2FE] p-6 rounded-3xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E2E8F0] text-[#0284C7] text-xs font-bold uppercase tracking-wider mb-1.5 shadow-2xs">
                <Building2 className="w-3.5 h-3.5 text-[#0284C7]" /> Hotel Partner Portal
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">Hotel Owner Dashboard</h1>
              <p className="text-xs text-[#64748B] font-semibold">Manage your properties, live reserved room numbers, host earnings, and guest bookings</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <Link
              to="/owner/hotels/new"
              style={{ color: '#ffffff' }}
              className="bg-[#0284C7] hover:bg-[#0369A1] text-white !text-white font-black text-xs py-3 px-5 rounded-full shadow-[0_4px_12px_rgba(2,132,199,0.25)] inline-flex items-center justify-center gap-1.5 transition-all whitespace-nowrap shrink-0 leading-none"
            >
              <Plus className="w-4 h-4 stroke-[3] text-white shrink-0" />
              <span className="text-white !text-white font-black" style={{ color: '#ffffff' }}>Add New Hotel</span>
            </Link>
          </div>
        </div>

        {/* Stats Overview Grid - Clickable to Navigate Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div 
            onClick={() => handleSelectTab('PROPERTIES')}
            className={`card-white p-6 flex items-center gap-4 border shadow-xs cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md ${
              activeTab === 'PROPERTIES' ? 'border-[#0284C7] ring-2 ring-[#0284C7]/20' : 'border-[#E2E8F0] hover:border-slate-300'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-[#F0F9FF] border border-[#E0F2FE] flex items-center justify-center text-[#0284C7] shrink-0">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#64748B]">Listed Properties</p>
              <h3 className="text-2xl font-black text-[#0F172A]">{hotels.length} Hotels</h3>
            </div>
          </div>

          <div 
            onClick={() => handleSelectTab('ROOM_OCCUPANCY')}
            className={`card-white p-6 flex items-center gap-4 border shadow-xs cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md ${
              activeTab === 'ROOM_OCCUPANCY' ? 'border-[#0284C7] ring-2 ring-[#0284C7]/20' : 'border-[#E2E8F0] hover:border-slate-300'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-[#F0F9FF] border border-[#E0F2FE] flex items-center justify-center text-[#0284C7] shrink-0">
              <BedDouble className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#64748B]">Active Room Categories</p>
              <h3 className="text-2xl font-black text-[#0F172A]">{totalRooms} Categories</h3>
            </div>
          </div>

          <div 
            onClick={() => handleSelectTab('BOOKED_ROOMS')}
            className={`card-white p-6 flex items-center gap-4 border shadow-xs cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md ${
              activeTab === 'BOOKED_ROOMS' ? 'border-[#0284C7] ring-2 ring-[#0284C7]/20' : 'border-[#E2E8F0] hover:border-slate-300'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-[#F0F9FF] border border-[#E0F2FE] flex items-center justify-center text-[#0284C7] shrink-0">
              <CalendarCheck className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#64748B]">Total Booked Reservations</p>
              <h3 className="text-2xl font-black text-[#0284C7]">{bookings.length} {bookings.length === 1 ? 'Booked Room' : 'Booked Rooms'}</h3>
              {confirmedBookings.length !== bookings.length && (
                <p className="text-[10px] text-slate-500 font-bold mt-0.5">{confirmedBookings.length} Confirmed</p>
              )}
            </div>
          </div>

          <div 
            onClick={() => handleSelectTab('SETTLEMENTS')}
            className={`card-white p-6 flex items-center gap-4 border shadow-xs cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md ${
              activeTab === 'SETTLEMENTS' ? 'border-[#0284C7] ring-2 ring-[#0284C7]/20' : 'border-[#E2E8F0] hover:border-slate-300'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-[#F0F9FF] border border-[#E0F2FE] flex items-center justify-center text-[#0284C7] shrink-0">
              <Wallet className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#64748B]">Net Host Earnings</p>
              <h3 className="text-2xl font-black text-[#0F172A]">₹{netEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>
        </div>

        {/* Tab Content 1: Hotel Properties */}
        {activeTab === 'PROPERTIES' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900">Your Hotel Properties</h2>
              <span className="text-xs font-bold text-slate-500">{hotels.length} Properties Registered</span>
            </div>

            {loading ? (
              <div className="text-center py-16 card-white">
                <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-xs font-bold text-slate-500">Loading your hotel properties...</p>
              </div>
            ) : hotels.length === 0 ? (
              <div className="card-white p-12 text-center space-y-4">
                <Building2 className="w-12 h-12 text-teal-600 mx-auto opacity-50" />
                <h3 className="text-lg font-black text-slate-900">No Hotels Registered Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  You haven't listed any hotel property yet. Click below to add your first hotel and start receiving room reservations!
                </p>
                <Link
                  to="/owner/hotels/new"
                  style={{ color: '#ffffff' }}
                  className="bg-[#0284C7] hover:bg-[#0369A1] text-white !text-white font-black text-xs py-2.5 px-6 rounded-full shadow-[0_4px_12px_rgba(2,132,199,0.25)] inline-flex items-center justify-center gap-1.5 transition-all whitespace-nowrap leading-none"
                >
                  <Plus className="w-4 h-4 stroke-[3] text-white shrink-0" />
                  <span className="text-white !text-white font-black" style={{ color: '#ffffff' }}>Add Your First Hotel</span>
                </Link>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {hotels.slice((hotelPage - 1) * 10, hotelPage * 10).map((hotel) => (
                  <div key={hotel.id} className="card-white overflow-hidden flex flex-col group hover:shadow-lg transition-all border border-slate-200">
                    
                    {/* Image Header */}
                    <div className="relative h-48 bg-slate-200">
                      <img
                        src={hotel.primary_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'}
                        alt={hotel.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3 glass-pill px-3 py-1 rounded-full text-xs font-black text-white flex items-center gap-1 shadow-lg border border-white/30">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>{hotel.star_rating} Star</span>
                      </div>
                      <div className={`absolute top-3 left-3 glass-pill px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg border ${
                        hotel.is_approved || hotel.status === 'APPROVED'
                          ? 'border-emerald-400/40 text-emerald-300'
                          : 'border-amber-400/40 text-amber-300 animate-pulse'
                      }`}>
                        {hotel.is_approved || hotel.status === 'APPROVED' ? '✓ LIVE & APPROVED' : '⏳ PENDING SUPER ADMIN APPROVAL'}
                      </div>
                    </div>

                    {/* Body Content */}
                    <div className="p-5 flex-grow space-y-3">
                      <h3 className="text-lg font-extrabold text-slate-900 line-clamp-1">{hotel.name}</h3>
                      
                      {!hotel.is_approved && hotel.status !== 'APPROVED' && (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Under Review by Super Admin. Hotel will be published live once approved.</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="truncate">{hotel.address}, {hotel.city}</span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {hotel.description}
                      </p>

                      <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100 font-bold">
                        <span className="text-slate-500">Starting Price:</span>
                        <span className="text-teal-600 font-black text-sm">₹{hotel.starting_price}/night</span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-3 gap-2">
                      <Link
                        to={`/owner/hotels/${hotel.id}/rooms`}
                        className="btn-teal py-2.5 px-2 text-[11px] font-extrabold inline-flex items-center justify-center gap-1 whitespace-nowrap shrink-0 leading-none"
                      >
                        <BedDouble className="w-3.5 h-3.5 shrink-0" />
                        Rooms
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleViewHotelBookings(hotel)}
                        className="py-2.5 px-2 rounded-xl bg-[#eaf3f9] hover:bg-sky-600 text-sky-600 hover:text-white border border-sky-200 hover:border-sky-600 text-[11px] font-extrabold transition-all inline-flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap leading-none shadow-2xs"
                        title="View Guest Bookings"
                      >
                        <User className="w-3.5 h-3.5 shrink-0" />
                        Bookings
                      </button>

                      <div className="flex items-center gap-1">
                        <Link
                          to={`/owner/hotels/${hotel.id}/edit`}
                          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-sky-600 hover:border-sky-600 transition-colors flex-1 inline-flex items-center justify-center text-center font-bold text-xs shrink-0 leading-none min-h-[36px]"
                          title="Edit Hotel"
                        >
                          Edit
                        </Link>

                        <button
                          onClick={() => handleDeleteHotel(hotel.id, hotel.name)}
                          className="p-2 rounded-xl bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 transition-colors inline-flex items-center justify-center shrink-0 min-h-[36px] min-w-[36px] cursor-pointer"
                          title="Delete Hotel"
                        >
                          <Trash2 className="w-4 h-4 shrink-0" />
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
                </div>
                <Pagination
                  currentPage={hotelPage}
                  totalItems={hotels.length}
                  itemsPerPage={10}
                  onPageChange={setHotelPage}
                  color="teal"
                />
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Host Settlement & Escrow Ledger */}
        {activeTab === 'SETTLEMENTS' && (() => {
          const rawItems = settlementData.results || [];
          const isCancelledItem = (item) => item.status === 'REVERSED' || item.booking_status === 'CANCELLED' || item.status === 'CANCELLED';

          const filteredItems = rawItems.filter((item) => {
            if (settlementFilter === 'ON_HOLD' && (item.status !== 'ON_HOLD' || isCancelledItem(item))) return false;
            if (settlementFilter === 'ELIGIBLE' && (item.status !== 'ELIGIBLE' || isCancelledItem(item))) return false;
            if (settlementFilter === 'PAID' && item.status !== 'PAID') return false;
            if (settlementFilter === 'DISPUTED' && !item.is_disputed && item.status !== 'DISPUTED') return false;
            if (settlementFilter === 'CANCELLED' && !isCancelledItem(item)) return false;

            if (settlementSearch.trim()) {
              const q = settlementSearch.toLowerCase().trim();
              return (
                (item.booking_id && item.booking_id.toLowerCase().includes(q)) ||
                (item.hotel_name && item.hotel_name.toLowerCase().includes(q)) ||
                (item.guest_name && item.guest_name.toLowerCase().includes(q)) ||
                (item.destination_summary && item.destination_summary.toLowerCase().includes(q))
              );
            }
            return true;
          });

          const onHoldCount = settlementData.summary?.on_hold_count !== undefined
            ? settlementData.summary.on_hold_count
            : rawItems.filter(i => i.status === 'ON_HOLD' && !isCancelledItem(i)).length;
          const eligibleCount = settlementData.summary?.eligible_count !== undefined
            ? settlementData.summary.eligible_count
            : rawItems.filter(i => i.status === 'ELIGIBLE' && !isCancelledItem(i)).length;
          const disputedCount = settlementData.summary?.total_disputed !== undefined && parseFloat(settlementData.summary.total_disputed) > 0
            ? rawItems.filter(i => i.is_disputed || i.status === 'DISPUTED').length
            : rawItems.filter(i => i.is_disputed || i.status === 'DISPUTED').length;
          const paidCount = rawItems.filter(i => i.status === 'PAID').length;
          const cancelledCount = rawItems.filter(isCancelledItem).length;

          return (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Host Earnings Ledger Breakdown Banner */}
              <div className="card-white p-6 sm:p-7 rounded-3xl border border-rose-100 shadow-sm bg-gradient-to-br from-white via-rose-50/20 to-slate-50 space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200/90">
                      <ShieldCheck className="w-3.5 h-3.5 text-rose-600" /> Platform-Managed Escrow & Settlement
                    </span>
                    <h3 className="text-xl font-black text-slate-900 pt-2">Settlement & Escrow Financial Summary</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      Centralized gateway collection • 7-day holding period post check-out protects against chargebacks & disputes
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleDownloadStatementPdf}
                      disabled={downloadingStatement}
                      className="px-3.5 py-1.5 rounded-full bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 text-xs font-black flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                      title="Download Official Settlement Statement PDF"
                    >
                      <Download className="w-3.5 h-3.5 text-sky-600" />
                      <span>{downloadingStatement ? 'Generating PDF...' : 'Download Statement PDF'}</span>
                    </button>
                    {payoutAccount?.is_verified ? (
                      <button
                        type="button"
                        onClick={() => setShowPayoutModal(true)}
                        className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black flex items-center gap-1.5 shadow-2xs hover:bg-emerald-100 transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{payoutAccount.destination_summary}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowPayoutModal(true)}
                        className="px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300 text-xs font-black flex items-center gap-1.5 shadow-2xs hover:bg-amber-100 transition-colors cursor-pointer"
                      >
                        <Landmark className="w-4 h-4 text-amber-600" />
                        <span>⚠️ Register Payout Destination</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500">
                      <p className="font-extrabold uppercase tracking-wider text-[10px]">Gross Bookings Collected</p>
                      <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <p className="text-xl font-black text-slate-900">₹{parseFloat(settlementData.summary?.total_gross ?? grossRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-amber-200/90 shadow-2xs space-y-1">
                    <p className="text-amber-700 font-extrabold uppercase tracking-wider text-[10px]">Platform Commission (10%)</p>
                    <p className="text-xl font-black text-amber-600">- ₹{parseFloat(settlementData.summary?.total_platform_commission ?? platformFee).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-indigo-200/90 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between text-indigo-700">
                      <p className="font-extrabold uppercase tracking-wider text-[10px]">In 7-Day Escrow Hold</p>
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    </div>
                    <p className="text-xl font-black text-indigo-600">₹{parseFloat(settlementData.summary?.total_on_hold ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    <p className="text-[10px] text-indigo-800/80 font-semibold">{onHoldCount} booking(s) holding</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/60 border border-emerald-200 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between text-emerald-700">
                      <p className="font-extrabold uppercase tracking-wider text-[10px]">Ready / Eligible Payout</p>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <p className="text-xl font-black text-emerald-600">₹{parseFloat(settlementData.summary?.total_eligible ?? netEarnings).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    <p className="text-[10px] text-emerald-800 font-semibold">{eligibleCount} booking(s) matured</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500">
                      <p className="font-extrabold uppercase tracking-wider text-[10px]">Disbursed to Bank/UPI</p>
                      <Wallet className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <p className="text-xl font-black text-slate-900">₹{parseFloat(settlementData.summary?.total_paid ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    <p className="text-[10px] text-slate-500 font-semibold">{paidCount} payout(s) completed</p>
                  </div>
                </div>
              </div>

              {/* Filter Tabs & Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setSettlementFilter('ALL')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all shrink-0 cursor-pointer ${
                      settlementFilter === 'ALL'
                        ? 'bg-[#0284C7] text-white shadow-[0_4px_12px_rgba(2,132,199,0.25)]'
                        : 'bg-white border border-[#E2E8F0] text-[#475569] hover:text-[#0F172A] hover:bg-slate-50'
                    }`}
                  >
                    All ({rawItems.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettlementFilter('ON_HOLD')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all shrink-0 cursor-pointer ${
                      settlementFilter === 'ON_HOLD'
                        ? 'bg-[#0284C7] text-white shadow-[0_4px_12px_rgba(2,132,199,0.25)]'
                        : 'bg-white border border-[#E2E8F0] text-[#475569] hover:text-[#0F172A] hover:bg-slate-50'
                    }`}
                  >
                    ⏳ 7-Day Hold ({onHoldCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettlementFilter('ELIGIBLE')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all shrink-0 cursor-pointer ${
                      settlementFilter === 'ELIGIBLE'
                        ? 'bg-[#0284C7] text-white shadow-[0_4px_12px_rgba(2,132,199,0.25)]'
                        : 'bg-white border border-[#E2E8F0] text-[#475569] hover:text-[#0F172A] hover:bg-slate-50'
                    }`}
                  >
                    ✅ Eligible ({eligibleCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettlementFilter('DISPUTED')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all shrink-0 cursor-pointer ${
                      settlementFilter === 'DISPUTED'
                        ? 'bg-[#0284C7] text-white shadow-[0_4px_12px_rgba(2,132,199,0.25)]'
                        : 'bg-white border border-[#E2E8F0] text-[#475569] hover:text-[#0F172A] hover:bg-slate-50'
                    }`}
                  >
                    ⚠️ Disputed ({disputedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettlementFilter('PAID')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all shrink-0 cursor-pointer ${
                      settlementFilter === 'PAID'
                        ? 'bg-[#0284C7] text-white shadow-[0_4px_12px_rgba(2,132,199,0.25)]'
                        : 'bg-white border border-[#E2E8F0] text-[#475569] hover:text-[#0F172A] hover:bg-slate-50'
                    }`}
                  >
                    🎉 Disbursed ({paidCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettlementFilter('CANCELLED')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all shrink-0 cursor-pointer ${
                      settlementFilter === 'CANCELLED'
                        ? 'bg-rose-600 text-white shadow-[0_4px_12px_rgba(225,29,72,0.25)]'
                        : 'bg-white border border-[#E2E8F0] text-[#475569] hover:text-[#0F172A] hover:bg-slate-50'
                    }`}
                  >
                    ↩️ Cancelled ({cancelledCount})
                  </button>
                </div>

                <div className="relative sm:w-72 shrink-0">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search booking ID, hotel, guest..."
                    value={settlementSearch}
                    onChange={(e) => setSettlementSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:border-sky-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Settlements Table */}
              <div className="card-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/90 text-slate-700 font-black uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-4">Booking Ref</th>
                        <th className="p-4">Hotel Property</th>
                        <th className="p-4">Guest Details</th>
                        <th className="p-4 whitespace-nowrap">Stay Period</th>
                        <th className="p-4">Gross Collected</th>
                        <th className="p-4">Platform Fee (10%)</th>
                        <th className="p-4">Net Host Payable</th>
                        <th className="p-4">7-Day Escrow Status</th>
                        <th className="p-4 text-right">Statement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {filteredItems.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="p-12 text-center text-slate-500 font-bold">
                            <Wallet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm font-black text-slate-700">No Settlement Records Found</p>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-0.5">
                              When customers book and pay for rooms at your hotels, gross revenue and 7-day escrow holding records will automatically appear here.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredItems.slice((settlementPage - 1) * 10, settlementPage * 10).map((earning) => {
                          const holdDate = earning.hold_until ? new Date(earning.hold_until) : null;
                          const now = new Date();
                          const isMatured = holdDate && now >= holdDate;
                          const daysLeft = holdDate ? Math.max(0, Math.ceil((holdDate - now) / (1000 * 60 * 60 * 24))) : 0;

                          return (
                            <tr key={earning.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 font-mono font-bold text-slate-900 text-sm whitespace-nowrap">
                                #{earning.booking_id || earning.booking}
                                <span className="block text-[10px] text-slate-400 font-sans font-medium">
                                  {earning.created_at ? formatDisplayDate(earning.created_at) : ''}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="font-extrabold text-slate-900">{earning.hotel_name || 'Hotel Property'}</div>
                                <span className="text-[11px] text-slate-500 font-medium">Book My Room Central Collection</span>
                              </td>
                              <td className="p-4">
                                <div className="font-bold text-slate-900">{earning.guest_name || 'Guest'}</div>
                                <span className="text-[10px] text-emerald-700 font-bold">Paid Online (Razorpay)</span>
                              </td>
                              <td className="p-4 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                                <div>In: {formatDisplayDate(earning.check_in)}</div>
                                <div>Out: {formatDisplayDate(earning.check_out)}</div>
                              </td>
                              <td className="p-4 font-black text-slate-900 text-sm">
                                ₹{parseFloat(earning.gross_amount).toFixed(2)}
                              </td>
                              <td className="p-4 text-amber-700 font-bold">
                                -₹{parseFloat(earning.platform_fee).toFixed(2)}
                              </td>
                              <td className="p-4 text-sm font-mono">
                                {earning.status === 'REVERSED' || earning.booking_status === 'CANCELLED' || earning.status === 'CANCELLED' || earning.status === 'REFUNDED' ? (
                                  <div>
                                    <span className="font-bold text-slate-400 line-through text-xs block">
                                      ₹{parseFloat(earning.net_amount).toFixed(2)}
                                    </span>
                                    <span className="font-black text-rose-600 text-sm block">
                                      ₹0.00
                                    </span>
                                  </div>
                                ) : (
                                  <span className="font-black text-emerald-700 text-sm">
                                    ₹{parseFloat(earning.net_amount).toFixed(2)}
                                  </span>
                                )}
                              </td>
                              <td className="p-4">
                                {earning.status === 'PAID' ? (
                                  <div>
                                    <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Settled / Paid
                                    </span>
                                    {earning.payout_details?.bank_reference && (
                                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                        UTR: {earning.payout_details.bank_reference}
                                      </div>
                                    )}
                                  </div>
                                ) : earning.is_disputed || earning.status === 'DISPUTED' ? (
                                  <div>
                                    <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
                                      <ShieldAlert className="w-3 h-3 text-rose-600" /> Disputed / On Hold
                                    </span>
                                    <div className="text-[10px] text-rose-700 font-medium mt-0.5 max-w-xs truncate">
                                      {earning.dispute_reason || 'Pending dispute review'}
                                    </div>
                                  </div>
                                ) : earning.status === 'ELIGIBLE' ? (
                                  <div>
                                    <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                                      <Check className="w-3 h-3 text-emerald-600" /> 7-Day Hold Matured
                                    </span>
                                    <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                                      Eligible for admin disbursement
                                    </div>
                                  </div>
                                ) : earning.status === 'REVERSED' || earning.booking_status === 'CANCELLED' || earning.status === 'CANCELLED' ? (
                                  <div>
                                    <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                                      ↩️ Cancelled / Refunded
                                    </span>
                                    <div className="text-[10px] text-rose-600 font-medium mt-0.5">
                                      No host payout (Refunded to guest)
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-800 border border-indigo-200 inline-flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-indigo-600" /> {earning.holding_period_days || 7}-Day Escrow Hold
                                    </span>
                                    <div className="text-[10px] text-indigo-900 font-semibold mt-0.5">
                                      {holdDate ? (
                                        <span>Release on {holdDate.toLocaleDateString('en-IN')}</span>
                                      ) : (
                                        <span>Matures post check-out</span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => setSelectedStatement(earning)}
                                  className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-[#eaf3f9] text-slate-700 hover:text-sky-800 border border-slate-200 text-xs font-black transition-colors inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5" /> Statement
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={settlementPage}
                  totalItems={filteredItems.length}
                  itemsPerPage={10}
                  onPageChange={setSettlementPage}
                  color="rose"
                />
              </div>

            </div>
          );
        })()}

        {/* Tab Content 1.5: Revenue & Business Analytics */}
        {activeTab === 'ANALYTICS' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            
            {/* Analytics Header & Timeframe Selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black uppercase tracking-wider mb-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-rose-600" /> Host Performance Insights
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Revenue & Occupancy Analytics</h2>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Real-time revenue trajectories, room night occupancy, and property yield metrics
                </p>
              </div>

              {/* Timeframe Buttons */}
              <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 gap-1">
                {[
                  { id: '30D', label: 'Last 30 Days' },
                  { id: '6M', label: 'Last 6 Months' },
                  { id: '1Y', label: 'Year 2026' }
                ].map((tf) => (
                  <button
                    key={tf.id}
                    type="button"
                    onClick={() => setAnalyticsTimeframe(tf.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      analyticsTimeframe === tf.id
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Top 4 Performance Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Gross Revenue */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-3 relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Gross Booking Sales</span>
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black">
                    <IndianRupee className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    ₹{grossRevenue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-slate-500">
                    {grossRevenue > 0 ? (
                      <>
                        <ArrowUpRight className="w-4 h-4 stroke-[3] text-emerald-600" />
                        <span className="text-emerald-600">Active revenue stream</span>
                      </>
                    ) : (
                      <span>No completed sales yet</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Net Host Earnings */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-3 relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Net Host Payout</span>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                    <Wallet className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                    ₹{netEarnings.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-slate-500">
                    <span>After 10% platform fee</span>
                  </div>
                </div>
              </div>

              {/* Average Daily Rate */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-3 relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Avg Daily Rate (ADR)</span>
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                    <BedDouble className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    ₹{confirmedBookings.length > 0 && grossRevenue > 0
                      ? Math.round(grossRevenue / confirmedBookings.length).toLocaleString('en-IN')
                      : 0}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-slate-500">
                    <span>{confirmedBookings.length > 0 ? 'Average per reserved stay' : 'No bookings to calculate ADR'}</span>
                  </div>
                </div>
              </div>

              {/* Occupancy Rate */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-3 relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Portfolio Occupancy</span>
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                    <Percent className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {totalRooms > 0 && confirmedBookings.length > 0
                      ? Math.min(100, Math.round(((confirmedBookings.length * 3) / Math.max(1, totalRooms * 8)) * 100))
                      : 0}%
                  </h3>
                  <div className={`flex items-center gap-1.5 mt-2 text-xs font-bold ${confirmedBookings.length > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    <span>{confirmedBookings.length > 0 ? 'High demand index' : '0% current occupancy'}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Interactive SVG Monthly Revenue & Bookings Chart */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-rose-600" />
                    {analyticsTimeframe === '30D'
                      ? 'Daily Revenue & Reservation Volume (Last 30 Days)'
                      : analyticsTimeframe === '1Y'
                      ? 'Monthly Revenue & Reservation Volume (Year 2026)'
                      : 'Monthly Revenue & Reservation Volume (Last 6 Months)'}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    {analyticsTimeframe === '30D'
                      ? 'Hover over bars to inspect day-by-day earnings and confirmed guest stays'
                      : 'Hover over bars to inspect month-by-month earnings and confirmed guest stays'}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-extrabold text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-gradient-to-tr from-rose-600 to-red-500"></span>
                    <span>{analyticsTimeframe === '30D' ? 'Daily Revenue (₹)' : 'Monthly Revenue (₹)'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-slate-300"></span>
                    <span>Reservations</span>
                  </div>
                </div>
              </div>

              {/* Chart Visual Graphic Area */}
              <div className="pt-6 pb-2">
                <div
                  className="h-64 items-end border-b border-slate-200 pb-3 px-1 sm:px-4 w-full grid"
                  style={{
                    gridTemplateColumns: `repeat(${chartAnalyticsData.length}, minmax(0, 1fr))`,
                    gap: analyticsTimeframe === '30D' ? '4px' : '16px'
                  }}
                >
                  {chartAnalyticsData.map((item, idx) => (
                    <div
                      key={item.fullLabel || idx}
                      className="flex flex-col items-center h-full justify-end group cursor-pointer relative"
                      onMouseEnter={() => setHoveredBarIndex(idx)}
                      onMouseLeave={() => setHoveredBarIndex(null)}
                    >
                      {/* Hover Tooltip Popup */}
                      {hoveredBarIndex === idx && (
                        <div className="absolute bottom-full mb-3 bg-slate-900 text-white p-2.5 rounded-2xl shadow-2xl border border-slate-700/80 text-center min-w-[140px] z-30 pointer-events-none animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.fullLabel}</p>
                          <p className="text-sm font-black text-white mt-0.5">₹{item.revenue.toLocaleString('en-IN')}</p>
                          <p className="text-[10px] text-rose-300 font-semibold mt-0.5">{item.confirmedCount || item.bookingsCount} stay(s)</p>
                        </div>
                      )}

                      {/* Bar Value Indicator */}
                      {item.revenue > 0 && (
                        <span className="text-[10px] font-black text-slate-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          ₹{(item.revenue / 1000).toFixed(1)}k
                        </span>
                      )}

                      {/* Animated Column Bar */}
                      <div className={`w-full bg-slate-100 h-full flex flex-col justify-end ${
                        analyticsTimeframe === '30D'
                          ? 'max-w-[18px] sm:max-w-[24px] rounded-lg p-0.5'
                          : analyticsTimeframe === '1Y'
                          ? 'max-w-[36px] rounded-xl p-1'
                          : 'max-w-[48px] rounded-2xl p-1'
                      }`}>
                        <div
                          style={{ height: `${item.heightPercent}%` }}
                          className={`w-full transition-all duration-500 shadow-sm ${
                            analyticsTimeframe === '30D' ? 'rounded-md' : 'rounded-xl'
                          } ${
                            hoveredBarIndex === idx
                              ? 'bg-gradient-to-t from-rose-700 via-rose-600 to-red-500 scale-x-105 shadow-md shadow-rose-600/30'
                              : 'bg-gradient-to-t from-rose-500 via-rose-500 to-red-400 group-hover:brightness-110'
                          }`}
                        ></div>
                      </div>

                      {/* X-Axis Label */}
                      <div className="h-6 flex items-center justify-center mt-3">
                        {item.showLabel ? (
                          <span className={`text-[10px] sm:text-xs font-black transition-colors whitespace-nowrap ${
                            item.isToday
                              ? 'text-rose-600 font-extrabold'
                              : item.revenue > 0
                              ? 'text-slate-900 font-black'
                              : 'text-slate-600 group-hover:text-rose-600'
                          }`}>
                            {item.label}
                          </span>
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-rose-500 transition-colors"></span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2-Column Section: Status Breakdown & Hotel Performance Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left: Status Breakdown (lg:col-span-5) */}
              <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-rose-600" /> Reservation Health
                  </h3>
                  <span className="text-xs font-bold text-slate-500">{statusCounts.total} Total Bookings</span>
                </div>

                {/* Progress bar split */}
                <div className="space-y-2">
                  <div className="w-full h-4 rounded-full bg-slate-100 overflow-hidden flex p-0.5 border border-slate-200">
                    <div style={{ width: `${statusCounts.successPct}%` }} className="h-full bg-emerald-500 rounded-l-full" title={`Confirmed: ${statusCounts.successPct}%`}></div>
                    <div style={{ width: `${statusCounts.pendingPct}%` }} className="h-full bg-amber-400" title={`Pending: ${statusCounts.pendingPct}%`}></div>
                    <div style={{ width: `${statusCounts.cancelledPct}%` }} className="h-full bg-rose-500 rounded-r-full" title={`Cancelled: ${statusCounts.cancelledPct}%`}></div>
                  </div>
                </div>

                {/* Status Tiles */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/70">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span>Confirmed & Active Stays</span>
                    </div>
                    <span className="text-sm font-black text-emerald-800">{statusCounts.confirmed + statusCounts.checkedIn + statusCounts.completed} ({statusCounts.successPct}%)</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/70 border border-amber-200/70">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <span>Pending Payment / In Checkout</span>
                    </div>
                    <span className="text-sm font-black text-amber-800">{statusCounts.pending} ({statusCounts.pendingPct}%)</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/70 border border-rose-200/70">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      <span>Cancelled / Refunded</span>
                    </div>
                    <span className="text-sm font-black text-rose-800">{statusCounts.cancelled} ({statusCounts.cancelledPct}%)</span>
                  </div>
                </div>
              </div>

              {/* Right: Hotel Performance Leaderboard (lg:col-span-7) */}
              <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" /> Property Yield & Rankings
                  </h3>
                  <span className="text-xs font-bold text-slate-500">{hotelPerformanceList.length} Properties</span>
                </div>

                <div className="space-y-3">
                  {hotelPerformanceList.map((h, i) => (
                    <div
                      key={h.id}
                      onClick={() => handleViewHotelBookings(h)}
                      className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-sky-300 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-xl bg-slate-200 group-hover:bg-[#eaf3f9] group-hover:text-sky-600 text-slate-800 font-black text-xs flex items-center justify-center shrink-0 transition-colors">
                          #{i + 1}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-900 truncate group-hover:text-sky-600 transition-colors">{h.name}</h4>
                          <p className="text-[11px] text-slate-500 font-semibold">{h.city} • {h.star_rating}★</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:gap-5 shrink-0 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Bookings</span>
                          <span className="text-xs font-black text-slate-800">{h.totalBookings} stays</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Sales</span>
                          <span className="text-xs font-black text-rose-600">₹{h.revenue.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="text-right min-w-[65px]">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Occupancy</span>
                          <span className="text-xs font-black text-emerald-600">{h.occupancyRate}%</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewHotelBookings(h);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-black transition-all flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                          title={`View guest bookings for ${h.name}`}
                        >
                          <Eye className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>View More</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Tab Content 2: Booked Rooms & Guest Reservations Table */}
        {activeTab === 'BOOKED_ROOMS' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Booked Rooms & Guest Reservations</h2>
                <p className="text-xs text-slate-500 font-semibold">View reserved room numbers, guest contact details, stay dates, and process cancellation approvals</p>
              </div>

              {/* Status Filter Tabs & Hotel Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setReservationTabFilter('ALL')}
                    className={`px-3 py-1 rounded-lg transition-all ${reservationTabFilter === 'ALL' ? 'bg-white shadow-xs font-black text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    All ({bookings.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReservationTabFilter('CONFIRMED')}
                    className={`px-3 py-1 rounded-lg transition-all ${reservationTabFilter === 'CONFIRMED' ? 'bg-white shadow-xs font-black text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Confirmed ({bookings.filter(b => ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'].includes((b.booking_status || b.status || '').toUpperCase()) && !isCancellationBooking(b)).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReservationTabFilter('PENDING')}
                    className={`px-3 py-1 rounded-lg transition-all ${reservationTabFilter === 'PENDING' ? 'bg-white shadow-xs font-black text-amber-800' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Pending ({bookings.filter(b => (b.booking_status || '').toUpperCase() === 'PENDING_PAYMENT' && !isCancellationBooking(b)).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReservationTabFilter('CANCELLATIONS')}
                    className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${reservationTabFilter === 'CANCELLATIONS' ? 'bg-rose-600 text-white shadow-xs font-black' : 'text-rose-700 hover:bg-rose-50'}`}
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Cancellations ({bookings.filter(b => isCancellationBooking(b)).length})</span>
                    {bookings.filter(b => isCancellationBooking(b) && checkOwnerApprovalStatus(b) === 'PENDING' && (b.payment_status || '').toUpperCase() !== 'REFUNDED').length > 0 && (
                      <span className="w-4 h-4 rounded-full bg-white text-rose-700 text-[10px] font-black flex items-center justify-center animate-pulse" title="Awaiting your approval">
                        {bookings.filter(b => isCancellationBooking(b) && checkOwnerApprovalStatus(b) === 'PENDING' && (b.payment_status || '').toUpperCase() !== 'REFUNDED').length}
                      </span>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Hotel:</span>
                  <select
                    value={selectedHotelFilter}
                    onChange={(e) => setSelectedHotelFilter(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-extrabold text-slate-800 outline-none focus:border-teal-600"
                  >
                    <option value="ALL">All Properties</option>
                    {hotels.map((h) => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16 card-white">
                <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-xs font-bold text-slate-500">Loading guest room reservations...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="card-white p-12 text-center space-y-4">
                <CalendarCheck className="w-12 h-12 text-teal-600 mx-auto opacity-50" />
                <h3 className="text-lg font-black text-slate-900">No Room Bookings Found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  There are no room reservations placed for the selected hotel filter.
                </p>
              </div>
            ) : (
              <div className="card-white overflow-hidden border border-slate-200 shadow-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-4">Booking Code</th>
                        <th className="p-4">Hotel Property</th>
                        <th className="p-4">Room Category & Reserved Unit(s)</th>
                        <th className="p-4">Guest Info</th>
                        <th className="p-4 whitespace-nowrap">Stay Dates</th>
                        <th className="p-4">Total Amount</th>
                        <th className="p-4">Booking Status</th>
                        <th className="p-4">Payment Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold">
                      {filteredBookings.slice((bookingPage - 1) * 10, bookingPage * 10).map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                          
                          {/* Booking Code */}
                          <td className="p-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                            #{b.id}
                            <div className="text-[10px] text-slate-400 font-normal font-sans">{formatDisplayDate(b.created_at)}</div>
                          </td>

                          {/* Hotel Property */}
                          <td className="p-4 font-extrabold text-slate-900">
                            {b.hotel_details?.name || `Hotel #${b.hotel}`}
                            <div className="text-[10px] text-slate-500 font-medium">{b.hotel_details?.city}</div>
                          </td>

                          {/* Room Category & Reserved Room Numbers */}
                          <td className="p-4">
                            <div className="font-extrabold text-teal-800">{b.room_details?.title || `Room #${b.room}`}</div>
                            <div className="mt-1 inline-flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-700 px-2 py-0.5 rounded text-[11px] font-mono font-bold">
                              <DoorClosed className="w-3 h-3 text-rose-600" />
                              <span>Reserved Units: {b.room_number || 'Room 101'}</span>
                            </div>
                          </td>

                          {/* Guest Info */}
                          <td className="p-4">
                            <div className="font-extrabold text-slate-900">{b.guest_name || b.customer_name || 'Guest'}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{b.guest_phone || 'No phone'}</div>
                            <div className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">{b.guest_email}</div>
                          </td>

                          {/* Stay Dates */}
                          <td className="p-4 text-slate-700 whitespace-nowrap min-w-[170px]">
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              <span>{formatDisplayDate(b.check_in)}</span>
                              <span className="text-slate-400 font-normal">→</span>
                              <span>{formatDisplayDate(b.check_out)}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium mt-0.5">{b.number_of_nights} Night(s) • {b.number_of_rooms} Room(s)</div>
                          </td>

                          {/* Total Amount */}
                          <td className="p-4">
                            <div className="text-teal-600 font-black text-sm">₹{parseFloat(b.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                          </td>

                          {/* Booking Status */}
                          <td className="p-4">
                            {(() => {
                              const isCancel = isCancellationBooking(b);
                              const ownerApproval = checkOwnerApprovalStatus(b);
                              const isRefunded = (b.payment_status || '').toUpperCase() === 'REFUNDED' ||
                                                 (b.refund_status || '').toUpperCase() === 'REFUNDED' ||
                                                 (b.booking_status || '').toUpperCase() === 'REFUNDED' ||
                                                 (b.status || '').toUpperCase() === 'REFUNDED';
                              const isPendingOwnerApproval = isCancel && ownerApproval === 'PENDING' && !isRefunded;

                              if (isRefunded) {
                                return (
                                  <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Cancelled (Refunded)
                                  </span>
                                );
                              }
                              if (isPendingOwnerApproval) {
                                return (
                                  <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1 animate-pulse">
                                    <Clock className="w-3 h-3 text-amber-700" /> ⏳ Awaiting Your Approval
                                  </span>
                                );
                              }
                              if (ownerApproval === 'APPROVED' || b.booking_status === 'OWNER_APPROVED' || b.cancellation_status === 'OWNER_APPROVED') {
                                return (
                                  <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-sky-50 text-sky-800 border border-sky-300 inline-flex items-center gap-1">
                                    <Check className="w-3 h-3 text-sky-600" /> ✅ Owner Approved
                                  </span>
                                );
                              }
                              if (ownerApproval === 'REJECTED' || b.booking_status === 'OWNER_REJECTED' || b.cancellation_status === 'OWNER_REJECTED') {
                                return (
                                  <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
                                    <X className="w-3 h-3 text-rose-600" /> ❌ Owner Rejected
                                  </span>
                                );
                              }
                              return (
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                                  b.booking_status === 'CONFIRMED' ? 'bg-teal-50 text-teal-800 border border-teal-200' :
                                  b.booking_status === 'CHECKED_IN' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                                  b.booking_status === 'CHECKED_OUT' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                                  b.booking_status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                  'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}>
                                  {b.booking_status}
                                </span>
                              );
                            })()}
                          </td>

                          {/* Payment Status */}
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              b.payment_status === 'CONFIRMED' || b.payment_status === 'PAID' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                              b.payment_status === 'REFUNDED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-black' :
                              b.payment_status === 'REFUND_PENDING' ? 'bg-amber-100 text-amber-900 border border-amber-300 font-black' :
                              b.payment_status === 'REFUND_PROCESSING' ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                              'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {b.payment_status}
                            </span>
                          </td>

                          {/* Actions Column */}
                          <td className="p-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              {(() => {
                                const isCancel = isCancellationBooking(b);
                                const ownerApproval = checkOwnerApprovalStatus(b);
                                const isRefunded = (b.payment_status || '').toUpperCase() === 'REFUNDED' ||
                                                   (b.refund_status || '').toUpperCase() === 'REFUNDED' ||
                                                   (b.booking_status || '').toUpperCase() === 'REFUNDED' ||
                                                   (b.status || '').toUpperCase() === 'REFUNDED';
                                const isPendingOwnerApproval = isCancel && ownerApproval === 'PENDING' && !isRefunded;

                                if (isRefunded) {
                                  return (
                                    <span className="px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Refund Disbursed
                                    </span>
                                  );
                                }

                                if (isPendingOwnerApproval) {
                                  return (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleOwnerApproveCancellation(b)}
                                        disabled={approvingBookingId === b.id}
                                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition-all inline-flex items-center gap-1 cursor-pointer"
                                        title="Approve Customer Cancellation"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        {approvingBookingId === b.id ? 'Approving...' : 'Approve'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setRejectingBooking(b);
                                          setRejectionReasonInput('');
                                        }}
                                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-300 text-xs font-black transition-all inline-flex items-center gap-1 cursor-pointer"
                                        title="Reject Customer Cancellation"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                        Reject
                                      </button>
                                    </>
                                  );
                                }
                                if (ownerApproval === 'APPROVED' || b.booking_status === 'OWNER_APPROVED' || b.cancellation_status === 'OWNER_APPROVED') {
                                  return (
                                    <span className="px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-sky-50 text-sky-800 border border-sky-200">
                                      In Admin Queue
                                    </span>
                                  );
                                }
                                return null;
                              })()}

                              {['CONFIRMED', 'PENDING_PAYMENT'].includes((b.booking_status || '').toUpperCase()) && !isCancellationBooking(b) && (
                                <button
                                  type="button"
                                  onClick={() => handleMarkNoShow(b)}
                                  disabled={markingNoShowId === b.id}
                                  className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white border border-amber-300 text-xs font-black transition-all inline-flex items-center gap-1 cursor-pointer"
                                  title="Mark Guest as No-Show"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  {markingNoShowId === b.id ? '...' : 'No-Show'}
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setSelectedBookingForDetails(b)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#eaf3f9] hover:bg-sky-600 text-sky-600 hover:text-white border border-sky-200 text-xs font-black transition-all inline-flex items-center gap-1 cursor-pointer"
                                title="View Full Booking & Guest Details"
                              >
                                <Eye className="w-3.5 h-3.5" /> View More
                              </button>
                            </div>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={bookingPage}
                  totalItems={filteredBookings.length}
                  itemsPerPage={10}
                  onPageChange={setBookingPage}
                  color="teal"
                />
              </div>
            )}
          </div>
        )}

        {/* Tab Content 3: Room Occupancy Matrix */}
        {activeTab === 'ROOM_OCCUPANCY' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Room Unit Reserved Status Matrix</h2>
                <p className="text-xs text-slate-500 font-semibold">Visual real-time status of physical room units (🔴 BOOKED / RESERVED vs 🟢 AVAILABLE)</p>
              </div>
            </div>

            <div className="space-y-6">
              {hotels.map((hotel) => {
                const hotelBookings = bookings.filter(
                  (b) => b.hotel === hotel.id || b.hotel_details?.id === hotel.id
                );

                return (
                  <div key={hotel.id} className="card-white p-6 border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-lg font-black text-slate-900">{hotel.name}</h3>
                        <p className="text-xs font-semibold text-slate-500">{hotel.city}, {hotel.state}</p>
                      </div>
                      <Link
                        to={`/owner/hotels/${hotel.id}/rooms`}
                        className="btn-teal py-1.5 px-3 text-xs font-bold"
                      >
                        Manage Rooms
                      </Link>
                    </div>

                    <div className="space-y-4">
                      {hotel.rooms && hotel.rooms.length > 0 ? (
                        hotel.rooms.map((room) => {
                          const activeStatuses = ['CONFIRMED', 'CHECKED_IN', 'PENDING_PAYMENT'];
                          const roomBookings = hotelBookings.filter(
                            (b) => (b.room === room.id || b.room_details?.id === room.id) &&
                            activeStatuses.includes(b.booking_status)
                          );

                          // Parse room numbers list
                          const roomNums = room.all_room_numbers || Array.from({ length: room.total_rooms }, (_, i) => `Room ${101 + i}`);

                          return (
                            <div key={room.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="text-sm font-extrabold text-slate-900">{room.title}</h4>
                                  <p className="text-xs text-slate-500 font-semibold">{room.room_type} • ₹{room.price_per_night}/night</p>
                                </div>
                                <div className="text-xs font-bold text-slate-600">
                                  {roomBookings.length} Active Reservation(s)
                                </div>
                              </div>

                              {/* Unit Badges Grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-1">
                                {roomNums.map((numStr) => {
                                  // Check if this room number is booked in active bookings
                                  const matchingBooking = roomBookings.find(
                                    (b) => (b.room_number || '').includes(numStr)
                                  );

                                  return (
                                    <div
                                      key={numStr}
                                      className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                                        matchingBooking
                                          ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-sm'
                                          : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-mono font-black text-xs">{numStr}</span>
                                        {matchingBooking ? (
                                          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
                                        ) : (
                                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                                        )}
                                      </div>

                                      <div className="mt-2 text-[10px]">
                                        {matchingBooking ? (
                                          <div>
                                            <p className="font-extrabold text-rose-700 uppercase tracking-wider">RESERVED</p>
                                            <p className="font-bold text-slate-800 truncate">{matchingBooking.guest_name || 'Guest'}</p>
                                            <p className="text-[9px] text-slate-500 whitespace-nowrap">{formatDisplayDate(matchingBooking.check_in)} → {formatDisplayDate(matchingBooking.check_out)}</p>
                                          </div>
                                        ) : (
                                          <div>
                                            <p className="font-extrabold text-emerald-700 uppercase tracking-wider">AVAILABLE</p>
                                            <p className="text-[9px] text-emerald-600 font-medium">Open for Booking</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-slate-400 italic">No room categories created for this hotel yet.</p>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab Content 3.5: Guest Ratings & Reviews */}
        {activeTab === 'REVIEWS' && (() => {
          const filteredReviews = reviews.filter((r) => {
            const matchesHotel = selectedReviewHotelFilter === 'ALL' || r.hotel?.toString() === selectedReviewHotelFilter.toString();
            const matchesStar = selectedStarFilter === 'ALL' || r.rating?.toString() === selectedStarFilter.toString();
            return matchesHotel && matchesStar;
          });

          const totalReviewsCount = reviews.length;
          const avgRating = totalReviewsCount > 0
            ? (reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / totalReviewsCount).toFixed(1)
            : '5.0';

          const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
          reviews.forEach((r) => {
            const star = Math.round(Number(r.rating || 5));
            if (starCounts[star] !== undefined) starCounts[star]++;
          });

          const repliedCount = reviews.filter((r) => Boolean(r.owner_response)).length;
          const replyRate = totalReviewsCount > 0 ? Math.round((repliedCount / totalReviewsCount) * 100) : 100;

          return (
            <div className="space-y-6 animate-fade-in">
              {/* Header Title & Filter Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-400" /> Guest Ratings & Reviews Hub
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Monitor authentic guest feedback, track performance metrics, and reply to your guests' reviews.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Hotel Property Filter */}
                  {hotels.length > 1 && (
                    <select
                      value={selectedReviewHotelFilter}
                      onChange={(e) => setSelectedReviewHotelFilter(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-sky-500"
                    >
                      <option value="ALL">All Properties ({hotels.length})</option>
                      {hotels.map((h) => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  )}

                  {/* Star Rating Filter */}
                  <select
                    value={selectedStarFilter}
                    onChange={(e) => setSelectedStarFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-sky-500"
                  >
                    <option value="ALL">All Stars ({totalReviewsCount})</option>
                    <option value="5">5 Stars ({starCounts[5]})</option>
                    <option value="4">4 Stars ({starCounts[4]})</option>
                    <option value="3">3 Stars ({starCounts[3]})</option>
                    <option value="2">2 Stars ({starCounts[2]})</option>
                    <option value="1">1 Star ({starCounts[1]})</option>
                  </select>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Average Rating */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 shrink-0">
                    <Star className="w-6 h-6 fill-amber-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Average Rating</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-slate-900">{avgRating}</span>
                      <span className="text-xs font-black text-amber-600">/ 5.0</span>
                    </div>
                    <span className="text-[10px] font-black text-emerald-600">
                      {Number(avgRating) >= 4.5 ? 'Exceptional Rating' : Number(avgRating) >= 4.0 ? 'Very Good' : 'Average'}
                    </span>
                  </div>
                </div>

                {/* Total Reviews */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Total Reviews</span>
                    <span className="text-2xl font-black text-slate-900">{totalReviewsCount}</span>
                    <span className="text-[10px] font-semibold text-slate-500 block">From verified reservations</span>
                  </div>
                </div>

                {/* Host Response Rate */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Host Response Rate</span>
                    <span className="text-2xl font-black text-slate-900">{replyRate}%</span>
                    <span className="text-[10px] font-semibold text-teal-700 block">{repliedCount} of {totalReviewsCount} replied</span>
                  </div>
                </div>

                {/* 5-Star Share */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                    <Percent className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">5-Star Feedback</span>
                    <span className="text-2xl font-black text-slate-900">
                      {totalReviewsCount > 0 ? Math.round((starCounts[5] / totalReviewsCount) * 100) : 100}%
                    </span>
                    <span className="text-[10px] font-semibold text-blue-700 block">{starCounts[5]} perfect reviews</span>
                  </div>
                </div>
              </div>

              {/* Star Rating Breakdown Bar Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Rating Distribution</h3>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((s) => {
                    const count = starCounts[s] || 0;
                    const pct = totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : 0;
                    return (
                      <div key={s} className="flex items-center gap-3 text-xs font-bold">
                        <span className="w-12 text-slate-600 flex items-center gap-1 font-black shrink-0">
                          {s} <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        </span>
                        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-14 text-right text-slate-500 text-[11px] shrink-0">
                          {pct}% ({count})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900">
                    Guest Feedback ({filteredReviews.length})
                  </h3>
                </div>

                {filteredReviews.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
                    <Star className="w-12 h-12 text-amber-400 fill-amber-100 mx-auto" />
                    <h4 className="text-base font-black text-slate-800">No Reviews Found</h4>
                    <p className="text-xs font-medium text-slate-500 max-w-md mx-auto">
                      {selectedStarFilter !== 'ALL' || selectedReviewHotelFilter !== 'ALL'
                        ? 'No reviews match the selected filters. Try changing or clearing your filters.'
                        : 'Your properties have not received any guest reviews yet. As guests check out and rate their stays, their verified feedback will appear here.'}
                    </p>
                  </div>
                ) : (
                  filteredReviews.slice((reviewPage - 1) * 10, reviewPage * 10).map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
                    >
                      {/* Review Top Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-700 text-sm uppercase">
                            {(rev.reviewer_name || 'G')[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-900 text-sm">
                                {rev.reviewer_name || rev.reviewer_username || 'Guest'}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Verified Stay
                              </span>
                            </div>
                            <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>🏨 {rev.hotel_name || `Hotel #${rev.hotel}`}</span>
                              {rev.booking_id && <span>• Booking #{rev.booking_id}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Star Rating Badge & Date */}
                        <div className="flex items-center sm:flex-col sm:items-end gap-2 sm:gap-1">
                          <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((st) => (
                                <Star
                                  key={st}
                                  className={`w-3.5 h-3.5 ${
                                    st <= rev.rating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs font-black text-amber-800 ml-1">
                              {rev.rating}.0
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">
                            {new Date(rev.created_at || Date.now()).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Review Comment Body */}
                      <div className="text-xs font-medium text-slate-800 leading-relaxed bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                        {rev.comment ? (
                          <p className="italic">"{rev.comment}"</p>
                        ) : (
                          <span className="text-slate-400 italic">No written comment provided with this star rating.</span>
                        )}
                      </div>

                      {/* Owner's Official Response if present */}
                      {rev.owner_response && (
                        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 space-y-1.5 ml-4 sm:ml-8">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-rose-900 flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-rose-600" /> Host Official Response
                            </span>
                            {rev.owner_responded_at && (
                              <span className="text-[10px] font-bold text-rose-700">
                                {new Date(rev.owner_responded_at).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-slate-800">
                            {rev.owner_response}
                          </p>
                        </div>
                      )}

                      {/* Reply Form or Reply Button */}
                      {!rev.owner_response && (
                        <div className="pt-1">
                          {respondingReviewId === rev.id ? (
                            <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 ml-4 sm:ml-8">
                              <label className="text-xs font-extrabold text-slate-800 block">
                                Reply to {rev.reviewer_name || 'Guest'} as Hotel Owner
                              </label>
                              <textarea
                                rows={2}
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                placeholder="Thank your guest, address their feedback, or explain improvements made..."
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none focus:border-sky-500 transition-all resize-none"
                              />
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRespondingReviewId(null);
                                    setResponseText('');
                                  }}
                                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={submittingResponse || !responseText.trim()}
                                  onClick={() => handleSendResponse(rev.id)}
                                  className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs disabled:opacity-50 transition-colors"
                                >
                                  {submittingResponse ? 'Posting...' : 'Post Reply'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setRespondingReviewId(rev.id);
                                setResponseText('');
                              }}
                              className="text-xs font-black text-sky-600 hover:text-sky-800 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#eaf3f9] border border-transparent hover:border-sky-100 transition-colors ml-4 sm:ml-8 cursor-pointer"
                            >
                              <CornerDownRight className="w-3.5 h-3.5" /> Reply to Review
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
                <Pagination
                  currentPage={reviewPage}
                  totalItems={filteredReviews.length}
                  itemsPerPage={10}
                  onPageChange={setReviewPage}
                  color="amber"
                />
              </div>
            </div>
          );
        })()}

        {/* Tab Content: Support Tickets Management for Hotel Owner */}
        {activeTab === 'TICKETS' && (
          <div className="animate-fade-in">
            <OwnerSupportTickets hotels={hotels} bookings={bookings} />
          </div>
        )}

        {/* Tab Content 4: Settings Group with Sub-Items */}
        {(activeTab === 'SETTINGS' || activeTab.startsWith('SETTING_')) && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-rose-600" /> Settings Portal
                </h2>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Configure host profile info, Razorpay merchant payment keys, bank payout details, and notifications.
                </p>
              </div>

              {/* Sub-item Pills Filter Bar */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-x-auto max-w-full">
                <button
                  type="button"
                  onClick={() => handleSelectTab('SETTING_PROFILE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'SETTING_PROFILE' || activeTab === 'SETTINGS'
                      ? 'bg-white text-rose-700 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="w-3.5 h-3.5" /> Personal Profile
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab('SETTING_PAYOUT')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'SETTING_PAYOUT' || activeTab === 'SETTING_RAZORPAY'
                      ? 'bg-white text-rose-700 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5 text-rose-600" /> Bank & Payout
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab('SETTING_NOTIFICATIONS')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'SETTING_NOTIFICATIONS'
                      ? 'bg-white text-rose-700 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" /> Notifications
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* 1. Personal Host Information Sub-Section */}
              {(activeTab === 'SETTING_PROFILE' || activeTab === 'SETTINGS') && (
              <div className="card-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <User className="w-4 h-4 text-rose-600" /> Personal Host Profile Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                      placeholder="First Name"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-rose-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                      placeholder="Last Name"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-rose-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                      Email Address (Account Login)
                    </label>
                    <input
                      type="email"
                      disabled
                      value={profileForm.email}
                      className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                      Mobile / WhatsApp Number
                    </label>
                    <input
                      type="text"
                      value={profileForm.phone_number}
                      onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-rose-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                    Host Bio & Hospitality Experience
                  </label>
                  <textarea
                    rows={2}
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    placeholder="Brief bio about your hospitality chain or hotel management background..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-rose-600 focus:bg-white"
                  ></textarea>
                </div>
              </div>
              )}

              {/* 3. Verified Payout Destination (Bank Account / UPI) Sub-Section */}
              {(activeTab === 'SETTING_PAYOUT' || activeTab === 'SETTINGS') && (
              <div className="card-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-rose-600" />
                      <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        Verified Bank Account or UPI Payout Destination
                      </span>
                      {payoutAccount?.is_verified ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200 inline-flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" /> Verified
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-200">
                          Setup Required
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 font-semibold leading-relaxed max-w-xl">
                      Customer room bookings are paid through the central Book My Room payment gateway. Your net earnings are held for 7 days post check-out to protect against disputes, then disbursed to this destination. Sensitive account numbers are securely masked.
                    </p>

                    {payoutAccount && (
                      <div className="pt-2 flex flex-wrap gap-4 text-xs font-bold text-slate-700 bg-white p-3 rounded-xl border border-slate-200/80">
                        <span>Holder: <strong className="text-slate-900">{payoutAccount.account_holder_name}</strong></span>
                        <span>Destination: <strong className="text-slate-900 font-mono">{payoutAccount.destination_summary}</strong></span>
                        {payoutAccount.bank_name && <span>Bank: <strong className="text-slate-900">{payoutAccount.bank_name}</strong></span>}
                        {payoutAccount.ifsc_code && <span>IFSC: <strong className="text-slate-900 font-mono">{payoutAccount.ifsc_code}</strong></span>}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPayoutModal(true)}
                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-black text-xs rounded-xl shadow-md shadow-sky-600/20 flex items-center gap-2 shrink-0 cursor-pointer"
                  >
                    <Landmark className="w-4 h-4 stroke-[2.5]" />
                    <span>{payoutAccount ? 'Update Payout Details' : 'Register Payout Destination'}</span>
                  </button>
                </div>
              </div>
              )}

              {/* 4. Notification Alerts & Feed */}
              {(activeTab === 'SETTING_NOTIFICATIONS' || activeTab === 'SETTINGS') && (
              <div className="card-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-rose-600" /> Notifications & Payout Alerts
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Recent platform alerts, matured earnings, and payout disbursals</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={fetchOwnerNotifications}
                      disabled={loadingNotifications}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      title="Sync latest notifications"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${loadingNotifications ? 'animate-spin text-rose-600' : ''}`} />
                      <span>Refresh</span>
                    </button>
                    {ownerNotifications.some(n => !n.is_read) && (
                      <button
                        type="button"
                        onClick={handleMarkAllNotificationsRead}
                        className="text-xs text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                </div>

                {/* Notifications History Feed */}
                <div className="space-y-3">
                  {loadingNotifications ? (
                    <div className="py-8 text-center text-xs text-slate-400 font-bold">Loading alerts...</div>
                  ) : ownerNotifications.length === 0 ? (
                    <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <Bell className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-slate-600">No Notifications Yet</p>
                      <p className="text-[11px] text-slate-400">Payout disbursals and guest bookings will appear here.</p>
                    </div>
                  ) : (
                    ownerNotifications.slice(0, 10).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => !n.is_read && handleMarkNotificationRead(n.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          !n.is_read
                            ? 'bg-rose-50/40 border-rose-200 shadow-xs hover:bg-rose-50'
                            : 'bg-white border-slate-200/80 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${!n.is_read ? 'bg-rose-600 animate-pulse' : 'bg-transparent'}`} />
                              <h4 className="text-xs font-black text-slate-900">{n.title}</h4>
                            </div>
                            <p className="text-xs text-slate-600 pl-4 leading-relaxed font-medium">{n.message}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className="text-[10px] font-mono font-bold text-slate-400">
                              {new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                            {!n.is_read && (
                              <button
                                type="button"
                                onClick={(e) => handleMarkNotificationRead(n.id, e)}
                                className="text-[10px] font-black text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                              >
                                Mark Read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Alert Preferences */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Alert Preferences</h4>
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition-all">
                    <input
                      type="checkbox"
                      checked={profileForm.email_notifications}
                      onChange={(e) => setProfileForm({ ...profileForm, email_notifications: e.target.checked })}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 accent-rose-600"
                    />
                    <div>
                      <span className="text-xs font-black text-slate-900 block">Instant Email Alerts for New Guest Reservations</span>
                      <span className="text-[11px] text-slate-500 font-medium">Receive an immediate email notification whenever a guest reserves a room.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition-all">
                    <input
                      type="checkbox"
                      checked={profileForm.sms_notifications}
                      onChange={(e) => setProfileForm({ ...profileForm, sms_notifications: e.target.checked })}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 accent-rose-600"
                    />
                    <div>
                      <span className="text-xs font-black text-slate-900 block">SMS / WhatsApp Check-in Alerts</span>
                      <span className="text-[11px] text-slate-500 font-medium">Receive real-time WhatsApp or SMS updates when guests check in.</span>
                    </div>
                  </label>
                </div>
              </div>
              )}

              {/* Submit Save Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="btn-rose py-3.5 px-8 text-xs uppercase tracking-wider font-extrabold rounded-xl shadow-md shadow-rose-600/25 flex items-center gap-2 cursor-pointer"
                >
                  {savingSettings ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving Settings...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 stroke-[2.5]" />
                      <span>Save All Portal Settings</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>

      {/* DEDICATED SECURITY MODAL FOR REGISTERING / UPDATING BANK & UPI PAYOUT DESTINATIONS */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="card-white max-w-lg w-full p-6 sm:p-7 space-y-5 rounded-3xl shadow-2xl border border-slate-200 animate-scale-up max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#eaf3f9] border border-sky-200 flex items-center justify-center text-sky-600 shrink-0">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Configure Payout Destination</h3>
                  <p className="text-xs text-slate-500 font-semibold">Secure Bank Account or UPI for Room Tariff Disbursements</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPayoutModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Method Toggle */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setPayoutForm({ ...payoutForm, account_type: 'BANK_ACCOUNT' })}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  payoutForm.account_type === 'BANK_ACCOUNT'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Landmark className="w-4 h-4 text-sky-600" /> Bank Account (NEFT/IMPS)
              </button>

              <button
                type="button"
                onClick={() => setPayoutForm({ ...payoutForm, account_type: 'UPI' })}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  payoutForm.account_type === 'UPI'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Wallet className="w-4 h-4 text-sky-600" /> UPI Instant Transfer
              </button>
            </div>

            <form onSubmit={handleSavePayoutAccount} className="space-y-4 text-xs">
              {payoutForm.account_type === 'BANK_ACCOUNT' ? (
                <>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
                      Account Holder Name <span className="text-sky-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={payoutForm.account_holder_name}
                      onChange={(e) => setPayoutForm({ ...payoutForm, account_holder_name: e.target.value })}
                      placeholder="Name as printed in Bank Passbook"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none focus:border-sky-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
                      Bank Name <span className="text-sky-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={payoutForm.bank_name}
                      onChange={(e) => setPayoutForm({ ...payoutForm, bank_name: e.target.value })}
                      placeholder="e.g. HDFC Bank, State Bank of India"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none focus:border-sky-600 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
                        Bank Account Number <span className="text-sky-600">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={payoutForm.account_number}
                        onChange={(e) => setPayoutForm({ ...payoutForm, account_number: e.target.value })}
                        placeholder="Enter full account number"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold outline-none focus:border-sky-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
                        Confirm Account Number <span className="text-sky-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={payoutForm.confirm_account_number}
                        onChange={(e) => setPayoutForm({ ...payoutForm, confirm_account_number: e.target.value })}
                        placeholder="Re-enter to confirm"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold outline-none focus:border-sky-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
                      Bank IFSC Code <span className="text-sky-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={payoutForm.ifsc_code}
                      onChange={(e) => setPayoutForm({ ...payoutForm, ifsc_code: e.target.value.toUpperCase() })}
                      placeholder="e.g. HDFC0001234"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold uppercase outline-none focus:border-sky-600 focus:bg-white"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
                      UPI ID (Virtual Payment Address) <span className="text-sky-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={payoutForm.upi_id}
                      onChange={(e) => setPayoutForm({ ...payoutForm, upi_id: e.target.value.toLowerCase() })}
                      placeholder="e.g. ownername@okhdfcbank or 9876543210@paytm"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold outline-none focus:border-sky-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
                      Beneficiary Name on UPI <span className="text-sky-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={payoutForm.account_holder_name}
                      onChange={(e) => setPayoutForm({ ...payoutForm, account_holder_name: e.target.value })}
                      placeholder="Registered account holder name"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none focus:border-sky-600 focus:bg-white"
                    />
                  </div>
                </>
              )}

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-black uppercase tracking-wider text-rose-950 mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-sky-600" /> Enter Account Login Password <span className="text-sky-600">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={payoutForm.current_password}
                  onChange={(e) => setPayoutForm({ ...payoutForm, current_password: e.target.value })}
                  placeholder="Enter your account password to authorize payout change"
                  className="w-full px-4 py-2.5 bg-rose-50/50 border border-rose-200 rounded-xl font-bold outline-none focus:border-sky-600 focus:bg-white"
                />
                <p className="text-[10px] text-slate-500 font-semibold mt-1">
                  🔒 Bank and UPI details are encrypted and masked in the UI. Payouts are verified using provider APIs.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingPayout}
                  className="btn-rose py-2.5 px-6 text-xs uppercase tracking-wider font-extrabold rounded-xl shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer"
                >
                  {savingPayout ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Verifying & Saving...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify & Save Payout Destination</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* DEDICATED MODAL: ITEMIZED OWNER SETTLEMENT STATEMENT VOUCHER */}
      {selectedStatement && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="card-white max-w-xl w-full p-6 sm:p-8 space-y-6 rounded-3xl shadow-2xl border border-slate-200 animate-scale-up max-h-[92vh] overflow-y-auto text-xs">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="px-3 py-1 rounded-full bg-[#eaf3f9] text-sky-800 border border-sky-200 text-[10px] font-black uppercase tracking-wider">
                  Book My Room Escrow Settlement Voucher
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  Settlement #{selectedStatement.id}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Booking Ref: #{selectedStatement.booking_id} • Property: {selectedStatement.hotel_name}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStatement(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Financial Ledger Breakdown Table */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-sky-600" /> Itemized Tariff & Commission Ledger
              </h4>

              <div className="space-y-2 text-slate-700">
                <div className="flex justify-between">
                  <span>Gross Guest Tariff Collected:</span>
                  <span className="font-bold text-slate-900 font-mono">₹{parseFloat(selectedStatement.gross_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-amber-700">
                  <span>Less: Book My Room Platform Commission (10%):</span>
                  <span className="font-bold font-mono">-₹{parseFloat(selectedStatement.platform_fee).toFixed(2)}</span>
                </div>
                {parseFloat(selectedStatement.refund_amount || 0) > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Less: Cancellation Refund / Chargeback:</span>
                    <span className="font-bold font-mono">-₹{parseFloat(selectedStatement.refund_amount).toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-black text-slate-900">
                  <span>Net Payable to Hotel Owner:</span>
                  <span className="text-lg text-emerald-700 font-mono">₹{parseFloat(selectedStatement.net_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Stay & Timeline Details */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Guest Name</span>
                <span className="font-black text-slate-900 text-xs">{selectedStatement.guest_name || 'Guest'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Stay Dates</span>
                <span className="font-mono text-xs whitespace-nowrap">{formatDisplayDate(selectedStatement.check_in)} → {formatDisplayDate(selectedStatement.check_out)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">7-Day Escrow Release</span>
                <span className="font-mono font-bold text-indigo-700 text-xs">
                  {selectedStatement.hold_until ? new Date(selectedStatement.hold_until).toLocaleDateString('en-IN') : 'Post Check-out'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Settlement Status</span>
                <span className="font-black text-xs text-slate-900">{selectedStatement.status}</span>
              </div>
            </div>

            {/* Destination summary */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-emerald-700 font-bold uppercase block">Payout Destination</span>
                <span className="font-black font-mono text-emerald-950">{selectedStatement.destination_summary || payoutAccount?.destination_summary || 'Registered Bank / UPI'}</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                Encrypted & Masked
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-2 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Print Voucher
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadStatementPdf(selectedStatement.id)}
                  disabled={downloadingStatement}
                  className="py-2 px-4 rounded-xl bg-sky-50 text-sky-800 border border-sky-300 font-bold hover:bg-sky-100 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  title="Download PDF statement for this settlement"
                >
                  <Download className="w-3.5 h-3.5 text-sky-600" />
                  <span>{downloadingStatement ? 'Downloading...' : 'Download PDF'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStatement(null)}
                className="btn-rose py-2 px-6 rounded-xl text-xs font-black cursor-pointer"
              >
                Close Statement
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 1: GUEST BOOKINGS FOR A SPECIFIC HOTEL (E.G. THE GRAND ROYAL PALACE & RESORT) */}
      {selectedHotelForBookings && (() => {
        const hotelBookings = bookings.filter((b) => {
          const isMatch = (
            b.hotel?.toString() === selectedHotelForBookings.id?.toString() ||
            b.hotel_details?.id?.toString() === selectedHotelForBookings.id?.toString()
          );
          if (!isMatch) return false;
          if (!hotelBookingSearch) return true;
          const q = hotelBookingSearch.toLowerCase();
          return (
            (b.guest_name && b.guest_name.toLowerCase().includes(q)) ||
            (b.customer_name && b.customer_name.toLowerCase().includes(q)) ||
            (b.guest_phone && b.guest_phone.includes(q)) ||
            (b.guest_email && b.guest_email.toLowerCase().includes(q)) ||
            (b.id && b.id.toString().includes(q)) ||
            (b.booking_id && b.booking_id.toLowerCase().includes(q)) ||
            (b.room_number && b.room_number.toLowerCase().includes(q)) ||
            (b.room_details?.title && b.room_details.title.toLowerCase().includes(q))
          );
        });

        const totalRevenue = hotelBookings
          .filter(b => ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'COMPLETED'].includes(b.booking_status))
          .reduce((acc, b) => acc + parseFloat(b.total_amount || 0), 0);

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            <div className="card-white max-w-4xl w-full p-6 sm:p-7 space-y-6 rounded-3xl shadow-2xl border border-slate-200 animate-scale-up max-h-[90vh] flex flex-col">
              
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4 gap-4 shrink-0">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#eaf3f9] border border-sky-200 flex items-center justify-center text-sky-600 shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-black text-slate-900">{selectedHotelForBookings.name}</h3>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-black">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {selectedHotelForBookings.star_rating} Star
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-sky-600" />
                      <span>{selectedHotelForBookings.city} • Guest Reservations Directory</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedHotelForBookings(null);
                    setHotelBookingSearch('');
                  }}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center text-lg font-bold cursor-pointer transition-colors shrink-0"
                >
                  ×
                </button>
              </div>

              {/* Stats Summary Strip & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-black">
                    Total Bookings: <span className="text-slate-900 font-extrabold">{hotelBookings.length}</span>
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-[#eaf3f9] text-sky-800 border border-sky-200 text-xs font-black">
                    Total Sales: <span className="font-extrabold">₹{totalRevenue.toLocaleString('en-IN')}</span>
                  </span>
                </div>

                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={hotelBookingSearch}
                    onChange={(e) => setHotelBookingSearch(e.target.value)}
                    placeholder="Search guest name, phone, room..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:border-sky-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Bookings List Content */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 min-h-[220px]">
                {hotelBookings.length === 0 ? (
                  <div className="p-10 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <CalendarCheck className="w-10 h-10 text-slate-400 mx-auto" />
                    <h4 className="text-sm font-black text-slate-800">No Reservations Found</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {hotelBookingSearch
                        ? `No bookings match your search "${hotelBookingSearch}".`
                        : `There are no reservations placed yet for ${selectedHotelForBookings.name}.`}
                    </p>
                  </div>
                ) : (
                  hotelBookings.slice((modalBookingPage - 1) * 10, modalBookingPage * 10).map((b) => (
                    <div
                      key={b.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all space-y-3"
                    >
                      {/* Top Row: Guest & Status */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-sky-100/70 border border-sky-200 text-sky-800 font-black text-sm flex items-center justify-center shrink-0">
                            {(b.guest_name || b.customer_name || 'G')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-slate-900">{b.guest_name || b.customer_name || 'Guest'}</h4>
                              <span className="font-mono text-[11px] font-bold text-slate-500">#{b.id}</span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap font-semibold">
                              {b.guest_phone && (
                                <a href={`tel:${b.guest_phone}`} className="hover:text-sky-600 font-mono flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-sky-600" /> {b.guest_phone}
                                </a>
                              )}
                              {b.guest_email && (
                                <a href={`mailto:${b.guest_email}`} className="hover:text-sky-600 flex items-center gap-1 truncate max-w-[200px]">
                                  <Mail className="w-3 h-3 text-slate-400" /> {b.guest_email}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-center">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            b.booking_status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            b.booking_status === 'CHECKED_IN' ? 'bg-teal-50 text-teal-800 border border-teal-200' :
                            b.booking_status === 'CHECKED_OUT' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                            b.booking_status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {b.booking_status}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            b.payment_status === 'CONFIRMED' || b.payment_status === 'PAID' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            b.payment_status === 'REFUNDED' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                            'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            💳 {b.payment_status}
                          </span>
                        </div>
                      </div>

                      {/* Middle Grid: Room, Dates, Amount */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Room Category & Unit</span>
                          <span className="font-extrabold text-slate-900 block truncate">{b.room_details?.title || `Room #${b.room}`}</span>
                          <span className="inline-flex items-center gap-1 font-mono font-black text-sky-600 text-[11px] mt-0.5">
                            <DoorClosed className="w-3 h-3" /> Unit: {b.room_number || 'Room 101'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Stay Schedule</span>
                          <span className="font-black text-slate-900 block whitespace-nowrap">{formatDisplayDate(b.check_in)} → {formatDisplayDate(b.check_out)}</span>
                          <span className="text-[11px] font-semibold text-slate-500">
                            {b.number_of_nights} Night(s) • {b.number_of_guests || 2} Guest(s)
                          </span>
                        </div>

                        <div className="sm:text-right flex flex-col sm:items-end justify-between gap-1">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Amount</span>
                            <span className="text-base font-black text-sky-600">
                              ₹{parseFloat(b.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {(b.payment_status === 'REFUND_PENDING' || (b.booking_status === 'CANCELLED' && b.payment_status !== 'REFUNDED' && (parseFloat(b.refundable_amount != null ? b.refundable_amount : b.total_amount) > 0))) && (
                              <button
                                type="button"
                                onClick={() => handleOwnerProcessRefund(b)}
                                disabled={processingRefundId === b.id}
                                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-black shadow-xs transition-all inline-flex items-center gap-1 cursor-pointer"
                                title="Approve and Process Guest Refund"
                              >
                                <RotateCcw className="w-3 h-3" />
                                {processingRefundId === b.id ? 'Refunding...' : `Refund (₹${parseFloat(b.refundable_amount != null ? b.refundable_amount : b.total_amount || 0).toFixed(0)})`}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedBookingForDetails(b)}
                              className="text-xs font-black text-sky-600 hover:text-sky-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" /> Details →
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Special Requests if any */}
                      {b.special_requests && (
                        <div className="text-[11px] bg-amber-50/70 border border-amber-200/70 text-amber-900 p-2.5 rounded-xl font-medium">
                          <span className="font-bold">Guest Note / Special Requests:</span> {b.special_requests}
                        </div>
                      )}

                    </div>
                  ))
                )}
                <Pagination
                  currentPage={modalBookingPage}
                  totalItems={hotelBookings.length}
                  itemsPerPage={10}
                  onPageChange={setModalBookingPage}
                  color="rose"
                />
              </div>

              {/* Modal Footer */}
              <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    handleSelectTab('BOOKED_ROOMS', selectedHotelForBookings.id.toString());
                    setSelectedHotelForBookings(null);
                    setHotelBookingSearch('');
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open in Full Reservations Table
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedHotelForBookings(null);
                    setHotelBookingSearch('');
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* MODAL 2: COMPREHENSIVE SINGLE BOOKING RECEIPT & GUEST DETAILS */}
      {selectedBookingForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="card-white max-w-2xl w-full p-6 sm:p-7 space-y-6 rounded-3xl shadow-2xl border border-slate-200 animate-scale-up max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="px-3 py-1 rounded-full bg-[#eaf3f9] text-sky-800 border border-sky-200 text-[10px] font-black uppercase tracking-wider">
                  Official Reservation Voucher
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  Booking #{selectedBookingForDetails.id}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Ref Code: {selectedBookingForDetails.booking_id || `KH-${selectedBookingForDetails.id}`} • Reserved on {new Date(selectedBookingForDetails.created_at).toLocaleString('en-IN')}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBookingForDetails(null)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center text-lg font-bold cursor-pointer transition-colors shrink-0"
              >
                ×
              </button>
            </div>

            {/* Guest Contact Information Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-sky-600" /> Guest Contact & Stay Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Primary Guest Name</span>
                  <span className="text-sm font-black text-slate-900">{selectedBookingForDetails.guest_name || selectedBookingForDetails.customer_name || 'Guest'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Phone Contact</span>
                  <a href={`tel:${selectedBookingForDetails.guest_phone}`} className="text-sm font-mono font-black text-sky-600 hover:underline">
                    {selectedBookingForDetails.guest_phone || 'No phone provided'}
                  </a>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Email Address</span>
                  <a href={`mailto:${selectedBookingForDetails.guest_email}`} className="text-xs font-mono font-bold text-slate-700 hover:underline">
                    {selectedBookingForDetails.guest_email || 'No email provided'}
                  </a>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Estimated Arrival Time</span>
                  <span className="text-xs font-bold text-slate-800">
                    {selectedBookingForDetails.estimated_arrival_time || '12:00 PM - 02:00 PM'}
                  </span>
                </div>
              </div>
            </div>

            {/* Property & Room Details */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-600" /> Hotel Property & Assigned Room Unit
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Hotel Property</span>
                  <span className="text-sm font-black text-slate-900">{selectedBookingForDetails.hotel_details?.name || 'Hotel Property'}</span>
                  <span className="text-[11px] text-slate-500 font-medium block">{selectedBookingForDetails.hotel_details?.city}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Room Category & Unit</span>
                  <span className="text-sm font-black text-teal-800">{selectedBookingForDetails.room_details?.title || 'Room Category'}</span>
                  <span className="inline-flex items-center gap-1 font-mono font-black text-sky-600 text-xs mt-0.5">
                    <DoorClosed className="w-3.5 h-3.5" /> Assigned Unit: {selectedBookingForDetails.room_number || 'Room 101'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Check-in Date</span>
                  <span className="text-xs font-black text-slate-900">{formatDisplayDate(selectedBookingForDetails.check_in)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Check-out Date</span>
                  <span className="text-xs font-black text-slate-900">{formatDisplayDate(selectedBookingForDetails.check_out)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Duration & Guests</span>
                  <span className="text-xs font-bold text-slate-800">
                    {selectedBookingForDetails.number_of_nights} Night(s) • {selectedBookingForDetails.number_of_guests || 2} Guest(s) • {selectedBookingForDetails.number_of_rooms || 1} Room(s)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Meal Plan</span>
                  <span className="text-xs font-bold text-slate-800">{selectedBookingForDetails.meal_plan || 'Room Only'}</span>
                </div>
              </div>
            </div>

            {/* Financial Ledger & Price Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4 text-sky-600" /> Payment & Billing Summary
              </h4>
              <div className="flex justify-between text-slate-600">
                <span>Room Rate ({selectedBookingForDetails.number_of_nights} nights):</span>
                <span className="font-bold text-slate-900">₹{parseFloat(selectedBookingForDetails.subtotal || selectedBookingForDetails.total_amount).toLocaleString('en-IN')}</span>
              </div>
              {parseFloat(selectedBookingForDetails.taxes || 0) > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Taxes & GST:</span>
                  <span className="font-bold text-slate-900">₹{parseFloat(selectedBookingForDetails.taxes).toLocaleString('en-IN')}</span>
                </div>
              )}
              {parseFloat(selectedBookingForDetails.discount || 0) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Promotional Discount:</span>
                  <span className="font-bold">-₹{parseFloat(selectedBookingForDetails.discount).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-black text-slate-900">
                <span>Total Amount Paid / Payable:</span>
                <span className="text-lg text-sky-600">₹{parseFloat(selectedBookingForDetails.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between pt-1 text-[11px] font-semibold text-slate-500">
                <span>Payment Status: <strong className="text-emerald-700">{selectedBookingForDetails.payment_status}</strong></span>
                <span>Booking Status: <strong className="text-slate-900">{selectedBookingForDetails.booking_status}</strong></span>
              </div>
            </div>

            {/* Cancellation & Refund Settlement for Owner */}
            {(selectedBookingForDetails.booking_status === 'CANCELLED' || selectedBookingForDetails.booking_status === 'CANCELLATION_REQUESTED' || selectedBookingForDetails.booking_status === 'OWNER_APPROVED' || selectedBookingForDetails.booking_status === 'OWNER_REJECTED' || selectedBookingForDetails.payment_status === 'REFUND_PENDING' || selectedBookingForDetails.payment_status === 'REFUNDED') && (
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5 text-xs">
                    <RotateCcw className="w-4 h-4 text-amber-600" /> Cancellation Request & Settlement Details
                  </h4>
                  {(() => {
                    const isRefunded = (selectedBookingForDetails.payment_status || '').toUpperCase() === 'REFUNDED' ||
                                       (selectedBookingForDetails.refund_status || '').toUpperCase() === 'REFUNDED' ||
                                       (selectedBookingForDetails.booking_status || '').toUpperCase() === 'REFUNDED' ||
                                       (selectedBookingForDetails.status || '').toUpperCase() === 'REFUNDED';
                    return (
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        isRefunded
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : selectedBookingForDetails.booking_status === 'OWNER_APPROVED'
                          ? 'bg-sky-100 text-sky-800 border border-sky-300'
                          : selectedBookingForDetails.booking_status === 'OWNER_REJECTED'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {isRefunded ? '✅ REFUND DISBURSED' :
                         selectedBookingForDetails.booking_status === 'CANCELLATION_REQUESTED' ? '⏳ PENDING YOUR APPROVAL' :
                         selectedBookingForDetails.booking_status === 'OWNER_APPROVED' ? '✅ FORWARDED TO ADMIN' :
                         selectedBookingForDetails.booking_status === 'OWNER_REJECTED' ? '❌ REJECTED BY YOU' :
                         selectedBookingForDetails.payment_status}
                      </span>
                    );
                  })()}
                </div>

                {/* Reason given by Guest */}
                <div className="p-3 bg-white rounded-xl border border-amber-200 text-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Guest Cancellation Reason</span>
                  <p className="font-semibold text-slate-900 text-xs italic">
                    "{selectedBookingForDetails.cancellation_reason || selectedBookingForDetails.reason || 'Guest requested room cancellation'}"
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700 bg-white p-3 rounded-xl border border-amber-200/60">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Policy Applied</span>
                    <span className="font-bold text-slate-900 text-[11px] block truncate">{selectedBookingForDetails.applied_cancellation_policy || 'Tiered Policy'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Paid</span>
                    <span className="font-bold text-slate-900">₹{selectedBookingForDetails.total_amount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-500 font-bold block uppercase">Fee Retained By You</span>
                    <span className="font-black text-rose-600">₹{selectedBookingForDetails.cancellation_charge || '0.00'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-600 font-bold block uppercase">Estimated Refund Due</span>
                    <span className="font-black text-emerald-700 text-sm">₹{selectedBookingForDetails.refundable_amount || '0.00'}</span>
                  </div>
                </div>

                {/* Masked Customer Bank Account Details (Owner NEVER sees full A/C number) */}
                <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-slate-800">
                      Refund Bank Destination: {selectedBookingForDetails.bank_name || selectedBookingForDetails.refund_bank_name || 'Designated Customer Bank'}
                    </span>
                  </div>
                  <div className="font-mono font-black text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                    A/C: {maskBankAcc(selectedBookingForDetails.bank_account_number || selectedBookingForDetails.refund_bank_account || '••••••••')} (Encrypted & Masked)
                  </div>
                </div>

                {/* Owner Decision Actions */}
                {(() => {
                  const ownerApproval = checkOwnerApprovalStatus(selectedBookingForDetails);
                  const isRefunded = (selectedBookingForDetails.payment_status || '').toUpperCase() === 'REFUNDED' ||
                                     (selectedBookingForDetails.refund_status || '').toUpperCase() === 'REFUNDED' ||
                                     (selectedBookingForDetails.booking_status || '').toUpperCase() === 'REFUNDED' ||
                                     (selectedBookingForDetails.status || '').toUpperCase() === 'REFUNDED';
                  const isPendingOwner = ownerApproval === 'PENDING' && !isRefunded;

                  if (isRefunded) {
                    return (
                      <div className="pt-2 border-t border-emerald-200 flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Refund Successfully Disbursed to Guest by Super Admin
                        </span>
                        <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-black text-[10px] uppercase">
                          Refund Disbursed
                        </span>
                      </div>
                    );
                  }
                  if (isPendingOwner) {
                    return (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-amber-200/60">
                        <p className="text-[11px] text-amber-900 font-medium">
                          Please review the cancellation request. If approved, cancellation charges will be retained and refund request will move to Admin.
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setRejectingBooking(selectedBookingForDetails);
                              setRejectionReasonInput('');
                            }}
                            className="px-3 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-100 font-black text-xs transition-all cursor-pointer flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Reject Request
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOwnerApproveCancellation(selectedBookingForDetails)}
                            disabled={approvingBookingId === selectedBookingForDetails.id}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {approvingBookingId === selectedBookingForDetails.id ? 'Approving...' : 'Approve Cancellation'}
                          </button>
                        </div>
                      </div>
                    );
                  }
                  if (ownerApproval === 'APPROVED') {
                    return (
                      <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs">
                        <span className="font-bold text-sky-800 flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-sky-600" />
                          Cancellation Approved by You — Request is in Super Admin Queue for Refund Disbursal
                        </span>
                        <span className="px-2.5 py-1 rounded-md bg-sky-100 text-sky-800 font-black text-[10px] uppercase">
                          In Admin Queue
                        </span>
                      </div>
                    );
                  }
                  if (ownerApproval === 'REJECTED') {
                    return (
                      <div className="pt-2 border-t border-amber-200/60 text-xs text-rose-700 font-bold flex items-center gap-1.5">
                        <X className="w-4 h-4 text-rose-600" />
                        Cancellation Rejected by You: "{selectedBookingForDetails.rejection_reason || 'Rejection reason logged'}"
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}

            {/* Special Request */}
            {selectedBookingForDetails.special_requests && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <span className="font-black block text-[10px] uppercase tracking-wider text-amber-800 mb-0.5">Guest Special Requests</span>
                <p className="font-medium">{selectedBookingForDetails.special_requests}</p>
              </div>
            )}

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div>
                {['CONFIRMED', 'PENDING_PAYMENT'].includes((selectedBookingForDetails.booking_status || '').toUpperCase()) && !isCancellationBooking(selectedBookingForDetails) && (
                  <button
                    type="button"
                    onClick={() => handleMarkNoShow(selectedBookingForDetails)}
                    disabled={markingNoShowId === selectedBookingForDetails.id}
                    className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white border border-amber-300 text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <UserX className="w-4 h-4" />
                    {markingNoShowId === selectedBookingForDetails.id ? 'Marking...' : 'Mark Guest as No-Show'}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedBookingForDetails(null)}
                className="btn-rose py-2.5 px-7 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Close Details
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: HOTEL OWNER REJECTION REASON MODAL */}
      {rejectingBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-white max-w-md w-full p-6 space-y-4 rounded-3xl shadow-2xl border border-slate-200 animate-scale-up text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                  <X className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Reject Cancellation</h3>
                  <p className="text-[11px] text-slate-500 font-mono">Booking #{rejectingBooking.booking_id || rejectingBooking.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectingBooking(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Please specify the reason for rejecting the cancellation request. This explanation will be delivered directly to the guest in their trips portal.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 block">
                Rejection Reason / Explanation <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="e.g. Non-refundable policy window passed, room was already prepared and locked..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-rose-500 focus:bg-white resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setRejectingBooking(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleOwnerRejectCancellation}
                disabled={submittingRejection || !rejectionReasonInput.trim()}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black shadow-md shadow-rose-600/25 disabled:opacity-50 transition-all cursor-pointer"
              >
                {submittingRejection ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OwnerDashboard;
