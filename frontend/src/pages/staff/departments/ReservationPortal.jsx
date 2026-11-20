/**
 * Department Portal: Reservation & Stays
 * 
 * Strict Department-Specific Workspace for RESERVATION staff.
 * - Displays only reservation operational metrics & authorized bookings
 * - Connects to GET /api/staff/bookings/ and GET /api/staff/bookings/{id}/
 * - Zero exposure to support tickets, refunds, payouts, or hotel verification.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarCheck, Calendar, Search, Filter, RefreshCw, CheckCircle2, Clock,
  Eye, Phone, Mail, User, Hotel, MapPin, AlertCircle, ArrowUpRight, Check
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useStaffDepartment } from '../../../context/StaffDepartmentContext';
import { staffOperationsService } from '../../../services';
import StaffPortalLayout from '../../../components/staff/StaffPortalLayout';
import { formatDisplayDate } from '../../../utils/dateUtils';
import Pagination from '../../../components/Pagination';

export const ReservationPortal = () => {
  const { showToast } = useAuth();
  const { hasPermission, departmentProfile } = useStaffDepartment();

  const [activeTab, setActiveTab] = useState('overview');
  const [activeFilter, setActiveFilter] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Load Operational Metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const res = await staffOperationsService.getStaffDashboard();
      const m = res.metrics?.reservation || res.dashboard?.metrics?.reservation;
      if (m) setMetrics(m);
    } catch (e) {
      console.warn('Reservation metrics notice:', e);
    }
  }, []);

  // Load Bookings Roster
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        page_size: 10,
      };
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await staffOperationsService.getBookings(params);
      const rawResults = res.data?.results || res.results || res.data || (Array.isArray(res) ? res : []);
      setBookings(rawResults);
      setTotalCount(res.data?.count || res.count || rawResults.length);
    } catch (err) {
      console.error('Failed to load bookings:', err);
      showToast('Failed to load reservation roster.', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, showToast]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleOpenDetail = async (id) => {
    setDetailLoading(true);
    try {
      const res = await staffOperationsService.getBookingDetail(id);
      setSelectedBooking(res.data || res);
    } catch (e) {
      showToast('Failed to fetch booking details.', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSelectTab = (tabId, filter) => {
    setActiveTab(tabId);
    if (filter === 'CHECK_IN') {
      setStatusFilter('CONFIRMED');
    } else if (filter === 'CHECK_OUT') {
      setStatusFilter('CHECKED_IN');
    } else {
      setStatusFilter('ALL');
    }
    setCurrentPage(1);
  };

  return (
    <StaffPortalLayout
      department="RESERVATION"
      activeTab={activeTab}
      onSelectTab={handleSelectTab}
    >
      {/* Top Department Identity Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-slate-900 to-sky-950 border border-sky-800/40 rounded-2xl p-5 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black text-white">Reservation & Stays Workspace</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30">
                Department Portal
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Authorized guest room reservations, arrivals coordination, telephone support lookups, and stay verification.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => { fetchMetrics(); fetchBookings(); }}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 self-end md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* OPERATIONAL METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Bookings</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {metrics?.total_bookings ?? totalCount}
          </div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">Platform Reservation Volume</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Confirmed Stays</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">
            {metrics?.confirmed_bookings ?? '--'}
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Ready for guest check-in</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="text-xs font-bold text-sky-600 uppercase tracking-wider">Check-ins Today</div>
          <div className="text-2xl sm:text-3xl font-black text-sky-700 mt-1">
            {metrics?.upcoming_checkins_today ?? 0}
          </div>
          <p className="text-[11px] text-sky-600 font-semibold mt-1">Scheduled guest arrivals</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="text-xs font-bold text-purple-600 uppercase tracking-wider">Check-outs Today</div>
          <div className="text-2xl sm:text-3xl font-black text-purple-700 mt-1">
            {metrics?.upcoming_checkouts_today ?? 0}
          </div>
          <p className="text-[11px] text-purple-600 font-semibold mt-1">Expected departures</p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Booking ID, Guest Name..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-sky-600 focus:bg-white transition-all select-text"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-sky-600 cursor-pointer"
          >
            <option value="ALL">All Booking Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CHECKED_IN">Checked-in</option>
            <option value="CHECKED_OUT">Checked-out</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="PENDING_PAYMENT">Pending Payment</option>
          </select>
        </div>
      </div>

      {/* BOOKINGS TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-700 font-black uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Booking ID</th>
                <th className="py-3 px-4">Guest Details</th>
                <th className="py-3 px-4">Hotel & Room</th>
                <th className="py-3 px-4">Stay Dates</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading reservation records...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500 font-bold">
                    No reservations found matching the criteria.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {b.booking_id || `#${b.id}`}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{b.guest_name || b.customer_name || 'Guest'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{b.guest_phone || '--'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 truncate max-w-xs">{b.hotel_name || b.hotel_details?.name || 'Hotel'}</div>
                      <div className="text-[11px] text-slate-500 truncate">{b.room_name || b.room_details?.title || 'Room'} • Room {b.room_number || 'TBD'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{b.check_in} → {b.check_out}</div>
                      <div className="text-[11px] text-slate-500">{b.number_of_nights} Night(s) • {b.number_of_guests} Guest(s)</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ₹{Number(b.total_amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        b.booking_status === 'CONFIRMED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : b.booking_status === 'CANCELLED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {b.booking_status || b.payment_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(b.id)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BOOKING DETAIL MODAL */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Reservation #{selectedBooking.booking_id || selectedBooking.id}</h3>
                <p className="text-xs text-slate-500 font-medium">{selectedBooking.hotel_name || selectedBooking.hotel_details?.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-black p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">Guest Information</div>
                <div className="font-black text-slate-900 text-sm">{selectedBooking.guest_name}</div>
                <div className="text-slate-600 flex items-center gap-1.5 mt-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {selectedBooking.guest_email || 'N/A'}
                </div>
                <div className="text-slate-600 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {selectedBooking.guest_phone || 'N/A'}
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">Stay Information</div>
                <div className="font-black text-slate-900 text-sm">{selectedBooking.check_in} → {selectedBooking.check_out}</div>
                <div className="text-slate-600">Room: {selectedBooking.room_name || selectedBooking.room_details?.title}</div>
                <div className="text-slate-600">Allocated Room: #{selectedBooking.room_number || 'Unassigned'}</div>
                <div className="text-slate-600 font-bold mt-1">Total: ₹{Number(selectedBooking.total_amount || 0).toLocaleString()}</div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </StaffPortalLayout>
  );
};

export default ReservationPortal;
