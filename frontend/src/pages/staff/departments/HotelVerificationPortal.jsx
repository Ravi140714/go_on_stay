/**
 * Department Portal: Hotel Verification & Compliance
 * 
 * Strict Department-Specific Workspace for HOTEL_VERIFICATION staff.
 * - Displays hotel onboarding audits, property documents, business certificates.
 * - Connects to:
 *   - GET  /api/staff/verifications/?status=SUBMITTED
 *   - GET  /api/staff/verifications/{id}/
 *   - POST /api/staff/verifications/{id}/approve/
 *   - POST /api/staff/verifications/{id}/reject/
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Search, Filter, RefreshCw, AlertCircle, CheckCircle2,
  Clock, FileText, Check, X, ShieldCheck, ExternalLink, MapPin, Phone, Mail
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useStaffDepartment } from '../../../context/StaffDepartmentContext';
import { staffOperationsService } from '../../../services';
import StaffPortalLayout from '../../../components/staff/StaffPortalLayout';
import { formatDisplayDate } from '../../../utils/dateUtils';

export const HotelVerificationPortal = () => {
  const { showToast } = useAuth();
  const { departmentProfile } = useStaffDepartment();

  const [activeTab, setActiveTab] = useState('overview');
  const [statusFilter, setStatusFilter] = useState('SUBMITTED');
  const [metrics, setMetrics] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected Hotel for Review
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [actionModal, setActionModal] = useState(null); // 'APPROVE' | 'REJECT'
  const [processing, setProcessing] = useState(false);

  // Fetch metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const res = await staffOperationsService.getStaffDashboard();
      const m = res.metrics?.hotel_verification || res.dashboard?.metrics?.hotel_verification;
      if (m) setMetrics(m);
    } catch (e) {
      console.warn('Verification metrics notice:', e);
    }
  }, []);

  // Fetch hotels for verification
  const fetchVerifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await staffOperationsService.getVerifications(params);
      const rawResults = res.data?.results || res.results || res.data || (Array.isArray(res) ? res : []);
      setHotels(rawResults);
    } catch (err) {
      console.error('Failed to load verifications:', err);
      showToast('Failed to load hotel verification audits.', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, showToast]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!selectedHotel) return;
    setProcessing(true);
    try {
      const res = await staffOperationsService.approveVerification(selectedHotel.id, {
        notes: approvalNotes.trim() || 'All legal documents verified; property passed compliance audit.',
      });
      showToast(res.message || 'Hotel property successfully approved and listed!');
      setActionModal(null);
      setSelectedHotel(null);
      setApprovalNotes('');
      fetchVerifications();
      fetchMetrics();
    } catch (err) {
      showToast('Failed to approve hotel.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!selectedHotel || !rejectReason.trim()) {
      showToast('Rejection reason is required.', 'error');
      return;
    }
    setProcessing(true);
    try {
      const res = await staffOperationsService.rejectVerification(selectedHotel.id, {
        reason: rejectReason.trim(),
      });
      showToast(res.message || 'Hotel verification rejected. Notice sent to owner.');
      setActionModal(null);
      setSelectedHotel(null);
      setRejectReason('');
      fetchVerifications();
      fetchMetrics();
    } catch (err) {
      showToast('Failed to reject hotel.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleSelectTab = (tabId, filter) => {
    setActiveTab(tabId);
    if (filter) {
      setStatusFilter(filter);
    } else {
      setStatusFilter('ALL');
    }
  };

  return (
    <StaffPortalLayout
      department="HOTEL_VERIFICATION"
      activeTab={activeTab}
      onSelectTab={handleSelectTab}
    >
      {/* Identity Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 border border-amber-800/40 rounded-2xl p-5 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black text-white">Hotel Compliance & Verification</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30">
                Department Portal
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Property registration audit, business license certificate validation, safety inspection, and listing approvals.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => { fetchMetrics(); fetchVerifications(); }}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 self-end md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending Audits</div>
          <div className="text-3xl font-black text-amber-700 mt-1">{metrics?.pending_verifications ?? 0}</div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">Awaiting compliance verification</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Approved Hotels</div>
          <div className="text-3xl font-black text-emerald-700 mt-1">{metrics?.approved_hotels ?? 0}</div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">Live and bookable on GoOnStay</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-bold text-rose-600 uppercase tracking-wider">Rejected Properties</div>
          <div className="text-3xl font-black text-rose-700 mt-1">{metrics?.rejected_hotels ?? 0}</div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">Failed compliance or license invalid</p>
        </div>
      </div>

      {/* STATUS TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setStatusFilter('SUBMITTED')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            statusFilter === 'SUBMITTED'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Submitted For Audit ({metrics?.pending_verifications ?? 0})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('APPROVED')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            statusFilter === 'APPROVED'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Approved Properties
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('REJECTED')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            statusFilter === 'REJECTED'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Rejected Properties
        </button>
      </div>

      {/* PROPERTIES TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-700 font-black uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Property Name</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Owner Contact</th>
                <th className="py-3 px-4">Submitted Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading property verification records...
                  </td>
                </tr>
              ) : hotels.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500 font-bold">
                    No hotel properties found for status: {statusFilter}.
                  </td>
                </tr>
              ) : (
                hotels.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">{h.name}</div>
                      <div className="text-[11px] text-slate-500">ID: #{h.id} • {h.property_type || 'HOTEL'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{h.city || 'City'}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{h.address || '--'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{h.owner_name || 'Owner'}</div>
                      <div className="text-[11px] text-slate-500">{h.owner_phone || h.owner_email || '--'}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {formatDisplayDate(h.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        h.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : h.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {h.status || 'SUBMITTED'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedHotel(h);
                            setActionModal('APPROVE');
                            setApprovalNotes('All legal documents verified; property passed compliance audit.');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedHotel(h);
                            setActionModal('REJECT');
                            setRejectReason('Trade license certificate has expired. Please re-upload current valid certificate.');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* APPROVE / REJECT MODAL */}
      {selectedHotel && actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {actionModal === 'APPROVE' ? 'Approve Hotel Property' : 'Reject Hotel Property'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">{selectedHotel.name} (ID: #{selectedHotel.id})</p>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedHotel(null); setActionModal(null); }}
                className="text-slate-400 hover:text-slate-700 text-sm font-black p-1"
              >
                ✕
              </button>
            </div>

            {actionModal === 'APPROVE' ? (
              <form onSubmit={handleApprove} className="space-y-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900">
                  Approving this property will activate its online listing across GoOnStay search and enable guest bookings.
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Compliance Notes</label>
                  <textarea
                    rows={3}
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="e.g. All legal documents verified; property passed compliance audit."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none select-text"
                  ></textarea>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => { setSelectedHotel(null); setActionModal(null); }}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {processing ? 'Approving...' : 'Confirm Approval & Publish'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleReject} className="space-y-3">
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-900">
                  Provide a specific reason for rejection so the hotel owner can correct their compliance submission.
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Rejection Reason <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Trade license certificate has expired. Please re-upload current valid certificate."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none select-text"
                  ></textarea>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => { setSelectedHotel(null); setActionModal(null); }}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing || !rejectReason.trim()}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {processing ? 'Rejecting...' : 'Confirm Rejection'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </StaffPortalLayout>
  );
};

export default HotelVerificationPortal;
