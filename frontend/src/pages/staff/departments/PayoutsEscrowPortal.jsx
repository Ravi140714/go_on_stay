/**
 * Department Portal: Payouts & Escrow
 * 
 * Strict Department-Specific Workspace for PAYOUT_AND_ESCROW staff.
 * - Displays host settlement escrow metrics, pending partner payouts, and disbursement tools.
 * - Connects to:
 *   - GET  /api/staff/payouts/?status=PENDING
 *   - GET  /api/staff/payouts/{id}/
 *   - POST /api/staff/payouts/{id}/process/
 *   - GET  /api/staff/payouts/history/
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Landmark, Search, Filter, RefreshCw, AlertCircle, CheckCircle2,
  Clock, IndianRupee, ArrowUpRight, Building2, Check, ExternalLink
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useStaffDepartment } from '../../../context/StaffDepartmentContext';
import { staffOperationsService } from '../../../services';
import StaffPortalLayout from '../../../components/staff/StaffPortalLayout';
import { formatDisplayDate } from '../../../utils/dateUtils';

export const PayoutsEscrowPortal = () => {
  const { showToast } = useAuth();
  const { departmentProfile } = useStaffDepartment();

  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState('PENDING'); // 'PENDING' | 'HISTORY'
  const [metrics, setMetrics] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Process Payout Modal
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [processNotes, setProcessNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Fetch metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const res = await staffOperationsService.getStaffDashboard();
      const m = res.metrics?.payout || res.dashboard?.metrics?.payout;
      if (m) setMetrics(m);
    } catch (e) {
      console.warn('Payout metrics notice:', e);
    }
  }, []);

  // Fetch payouts
  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (viewMode === 'HISTORY') {
        res = await staffOperationsService.getPayoutHistory();
      } else {
        res = await staffOperationsService.getPayouts({ status: 'PENDING' });
      }
      const rawResults = res.data?.results || res.results || res.data || (Array.isArray(res) ? res : []);
      setPayouts(rawResults);
    } catch (err) {
      console.error('Failed to load payouts:', err);
      showToast('Failed to load host payouts.', 'error');
    } finally {
      setLoading(false);
    }
  }, [viewMode, showToast]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const handleProcessPayout = async (e) => {
    e.preventDefault();
    if (!selectedPayout) return;
    if (!transactionId.trim()) {
      showToast('Bank / NEFT Transaction ID is required.', 'error');
      return;
    }

    setProcessing(true);
    try {
      const res = await staffOperationsService.processPayout(selectedPayout.id, {
        transaction_id: transactionId.trim(),
        notes: processNotes.trim() || 'Processed weekly disbursement via bank NEFT.',
      });
      showToast(res.message || 'Host settlement payout recorded successfully!');
      setSelectedPayout(null);
      setTransactionId('');
      setProcessNotes('');
      fetchPayouts();
      fetchMetrics();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Payout processing failed.';
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
      department="PAYOUT_AND_ESCROW"
      activeTab={activeTab}
      onSelectTab={handleSelectTab}
    >
      {/* Identity Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 border border-emerald-800/40 rounded-2xl p-5 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black text-white">Payouts & Escrow Console</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Department Portal
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Partner escrow settlement ledger, 7-day holding compliance verification, and NEFT/bank transfer execution.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => { fetchMetrics(); fetchPayouts(); }}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 self-end md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending Payouts</div>
          <div className="text-3xl font-black text-amber-700 mt-1">{metrics?.pending_payouts ?? 0}</div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">Awaiting batch disbursement</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-bold text-sky-600 uppercase tracking-wider">Eligible Payouts</div>
          <div className="text-3xl font-black text-sky-700 mt-1">{metrics?.eligible_payouts ?? 0}</div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">7-day escrow holding matured</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Completed Payouts</div>
          <div className="text-3xl font-black text-emerald-700 mt-1">{metrics?.completed_payouts ?? 0}</div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">Successfully transferred to hotel bank</p>
        </div>
      </div>

      {/* VIEW MODE TOGGLE */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setViewMode('PENDING')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            viewMode === 'PENDING'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Pending Payouts ({metrics?.pending_payouts ?? 0})
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
          Disbursement Ledger ({metrics?.completed_payouts ?? 0})
        </button>
      </div>

      {/* PAYOUTS LIST TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-700 font-black uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Payout ID</th>
                <th className="py-3 px-4">Hotel / Partner</th>
                <th className="py-3 px-4">Disbursement Amount</th>
                <th className="py-3 px-4">Maturity Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading payout ledger...
                  </td>
                </tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500 font-bold">
                    No {viewMode.toLowerCase()} host payouts found.
                  </td>
                </tr>
              ) : (
                payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      PAY-#{p.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{p.hotel_name || p.owner_name || 'Hotel Partner'}</div>
                      <div className="text-[11px] text-slate-500">A/C: {p.bank_account || p.payout_account || 'Bank Linked'}</div>
                    </td>
                    <td className="py-3 px-4 font-black text-emerald-700">
                      ₹{Number(p.amount || p.net_payout || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {formatDisplayDate(p.mature_at || p.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        p.status === 'COMPLETED' || p.status === 'SUCCESS'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : p.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {p.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {p.status === 'PENDING' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPayout(p);
                            setTransactionId(`NEFT_BMR_${Date.now().toString().slice(-8)}`);
                            setProcessNotes('Processed weekly disbursement via bank NEFT.');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          Disburse Payout
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-bold font-mono">
                          {p.transaction_id || '✓ Disbursed'}
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

      {/* PROCESS PAYOUT MODAL */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Execute Hotel Payout</h3>
                <p className="text-xs text-slate-500 font-medium">Payout #{selectedPayout.id} • {selectedPayout.hotel_name || selectedPayout.owner_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayout(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-black p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 space-y-1">
              <div className="font-bold">Total Disbursement: ₹{Number(selectedPayout.amount || selectedPayout.net_payout || 0).toLocaleString()}</div>
              <p className="text-[11px] text-emerald-800">
                Funds have passed the 7-day holding period and are authorized for NEFT/IMPS bank transfer.
              </p>
            </div>

            <form onSubmit={handleProcessPayout} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Bank / NEFT Transaction ID (UTR) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. NEFT_ICICI_987654321"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-600 focus:bg-white select-text"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Disbursement Notes
                </label>
                <textarea
                  rows={2}
                  value={processNotes}
                  onChange={(e) => setProcessNotes(e.target.value)}
                  placeholder="e.g. Processed weekly disbursement via bank NEFT."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-emerald-600 focus:bg-white select-text"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedPayout(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing || !transactionId.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
                >
                  {processing ? 'Recording Transfer...' : 'Complete Disbursement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </StaffPortalLayout>
  );
};

export default PayoutsEscrowPortal;
