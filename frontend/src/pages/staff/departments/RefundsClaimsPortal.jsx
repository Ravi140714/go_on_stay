/**
 * Department Portal: Refunds & Claims
 * 
 * Strict Department-Specific Workspace for REFUNDS_AND_CLAIMS staff.
 * - Displays refund metrics, pending cancellation claims, and refund processing tools.
 * - Connects to:
 *   - GET  /api/staff/refunds/?status=PENDING
 *   - GET  /api/staff/refunds/{id}/
 *   - POST /api/staff/refunds/{id}/process/
 *   - GET  /api/staff/refunds/history/
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  RotateCcw, Search, Filter, RefreshCw, AlertCircle, CheckCircle2,
  Clock, IndianRupee, ShieldAlert, ArrowRight, Check, X
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useStaffDepartment } from '../../../context/StaffDepartmentContext';
import { staffOperationsService } from '../../../services';
import StaffPortalLayout from '../../../components/staff/StaffPortalLayout';
import { formatDisplayDate } from '../../../utils/dateUtils';

export const RefundsClaimsPortal = () => {
  const { showToast } = useAuth();
  const { departmentProfile } = useStaffDepartment();

  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState('PENDING'); // 'PENDING' | 'HISTORY'
  const [metrics, setMetrics] = useState(null);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Process Refund Modal
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [processNotes, setProcessNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Fetch metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const res = await staffOperationsService.getStaffDashboard();
      const m = res.metrics?.refund || res.dashboard?.metrics?.refund;
      if (m) setMetrics(m);
    } catch (e) {
      console.warn('Refund metrics notice:', e);
    }
  }, []);

  // Fetch refunds
  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (viewMode === 'HISTORY') {
        res = await staffOperationsService.getRefundHistory();
      } else {
        res = await staffOperationsService.getRefunds({ status: 'PENDING' });
      }
      const rawResults = res.data?.results || res.results || res.data || (Array.isArray(res) ? res : []);
      setRefunds(rawResults);
    } catch (err) {
      console.error('Failed to load refunds:', err);
      showToast('Failed to load refund claims.', 'error');
    } finally {
      setLoading(false);
    }
  }, [viewMode, showToast]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  const handleProcessRefund = async (e) => {
    e.preventDefault();
    if (!selectedRefund) return;
    setProcessing(true);
    try {
      const res = await staffOperationsService.processRefund(selectedRefund.id, {
        notes: processNotes.trim() || 'Approved cancellation within free refund window.',
      });
      showToast(res.message || 'Refund successfully processed and disbursed!');
      setSelectedRefund(null);
      setProcessNotes('');
      fetchRefunds();
      fetchMetrics();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Refund processing failed.';
      showToast(msg, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleSelectTab = (tabId, filter) => {
    setActiveTab(tabId);
    if (filter === 'HISTORY') {
      setViewMode('HISTORY');
    } else {
      setViewMode('PENDING');
    }
  };

  return (
    <StaffPortalLayout
      department="REFUNDS_AND_CLAIMS"
      activeTab={activeTab}
      onSelectTab={handleSelectTab}
    >
      {/* Identity Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 border border-rose-800/40 rounded-2xl p-5 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-400/30 flex items-center justify-center shrink-0">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black text-white">Refunds & Claims Console</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-400/30">
                Department Portal
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Cancellation eligibility audit, dispute claims resolution, and automated Razorpay refund execution.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => { fetchMetrics(); fetchRefunds(); }}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 self-end md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-bold text-rose-600 uppercase tracking-wider">Pending Refunds</div>
          <div className="text-3xl font-black text-rose-700 mt-1">{metrics?.pending_refunds ?? 0}</div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">Awaiting refund disbursement</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Processed Refunds</div>
          <div className="text-3xl font-black text-emerald-700 mt-1">{metrics?.processed_refunds ?? 0}</div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">Returned to guest bank accounts</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Failed / Disputed</div>
          <div className="text-3xl font-black text-slate-700 mt-1">{metrics?.failed_refunds ?? 0}</div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">Bank gateway retries required</p>
        </div>
      </div>

      {/* VIEW MODE TOGGLE */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setViewMode('PENDING')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            viewMode === 'PENDING'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Pending Claims ({metrics?.pending_refunds ?? 0})
        </button>
        <button
          type="button"
          onClick={() => setViewMode('HISTORY')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            viewMode === 'HISTORY'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Disbursement History
        </button>
      </div>

      {/* REFUNDS LIST TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-700 font-black uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Claim / ID</th>
                <th className="py-3 px-4">Booking Reference</th>
                <th className="py-3 px-4">Guest Details</th>
                <th className="py-3 px-4">Refund Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading refund records...
                  </td>
                </tr>
              ) : refunds.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500 font-bold">
                    No {viewMode.toLowerCase()} refund requests found.
                  </td>
                </tr>
              ) : (
                refunds.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      REF-#{r.id}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-800">
                      {r.booking_id || r.booking_reference || `#${r.booking}`}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{r.customer_name || r.guest_name || 'Guest'}</div>
                      <div className="text-[11px] text-slate-500">{r.customer_email || '--'}</div>
                    </td>
                    <td className="py-3 px-4 font-black text-rose-700">
                      ₹{Number(r.amount || r.refund_amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        r.status === 'PROCESSED' || r.status === 'SUCCESS'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : r.status === 'PENDING'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {r.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {r.status === 'PENDING' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRefund(r);
                            setProcessNotes('Approved cancellation within policy.');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          Process Refund
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-bold">
                          ✓ Completed
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PROCESS REFUND MODAL */}
      {selectedRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Process Cancellation Refund</h3>
                <p className="text-xs text-slate-500 font-medium">Claim #{selectedRefund.id} • Booking {selectedRefund.booking_id || selectedRefund.booking}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRefund(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-black p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-900 space-y-1">
              <div className="font-bold">Refund Amount: ₹{Number(selectedRefund.amount || selectedRefund.refund_amount || 0).toLocaleString()}</div>
              <p className="text-[11px] text-rose-800">
                Executing this action will disburse monetary funds directly to the guest's source payment method via Razorpay.
              </p>
            </div>

            <form onSubmit={handleProcessRefund} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Staff Approval Notes <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={processNotes}
                  onChange={(e) => setProcessNotes(e.target.value)}
                  placeholder="e.g. Approved cancellation within free refund window."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-rose-600 focus:bg-white select-text"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedRefund(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing || !processNotes.trim()}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
                >
                  {processing ? 'Processing Disbursement...' : 'Execute Razorpay Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </StaffPortalLayout>
  );
};

export default RefundsClaimsPortal;
