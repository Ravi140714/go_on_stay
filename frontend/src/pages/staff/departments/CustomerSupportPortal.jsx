/**
 * Department Portal: Customer Support Desk
 * 
 * Strict Department-Specific Workspace for CUSTOMER_SUPPORT staff.
 * - Displays customer support metrics, tickets, priority filters, status controls, and internal notes.
 * - Connects to:
 *   - GET /api/staff/support/?status=...&priority=...
 *   - GET /api/staff/support/{id}/
 *   - PATCH /api/staff/support/{id}/update/
 *   - POST /api/staff/support/{id}/notes/
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare, Search, Filter, RefreshCw, AlertCircle, CheckCircle2,
  Clock, Send, User, ChevronRight, Sliders, Shield, Tag, MessageCircle
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useStaffDepartment } from '../../../context/StaffDepartmentContext';
import { staffOperationsService } from '../../../services';
import StaffPortalLayout from '../../../components/staff/StaffPortalLayout';
import { formatDisplayDate } from '../../../utils/dateUtils';

export const CustomerSupportPortal = () => {
  const { showToast } = useAuth();
  const { departmentProfile } = useStaffDepartment();

  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Ticket for Actions
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newStatus, setNewStatus] = useState('IN_PROGRESS');
  const [newPriority, setNewPriority] = useState('HIGH');
  const [internalNote, setInternalNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const res = await staffOperationsService.getStaffDashboard();
      const m = res.metrics?.customer_support || res.dashboard?.metrics?.customer_support;
      if (m) setMetrics(m);
    } catch (e) {
      console.warn('Support metrics notice:', e);
    }
  }, []);

  // Fetch support tickets
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;

      const res = await staffOperationsService.getSupportTickets(params);
      const rawResults = res.data?.results || res.results || res.data || (Array.isArray(res) ? res : []);
      setTickets(rawResults);
    } catch (err) {
      console.error('Failed to load support tickets:', err);
      showToast('Failed to load support ticket inquiries.', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, showToast]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleUpdateTicket = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setActionLoading(true);
    try {
      await staffOperationsService.updateSupportTicket(selectedTicket.id, {
        status: newStatus,
        priority: newPriority,
      });
      showToast('Support ticket updated successfully!');
      fetchTickets();
      fetchMetrics();
    } catch (err) {
      showToast('Failed to update ticket status.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !internalNote.trim()) return;
    setActionLoading(true);
    try {
      await staffOperationsService.addSupportNote(selectedTicket.id, {
        note: internalNote.trim(),
      });
      showToast('Internal coordination note recorded!');
      setInternalNote('');
      fetchTickets();
    } catch (err) {
      showToast('Failed to record staff note.', 'error');
    } finally {
      setActionLoading(false);
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
      department="CUSTOMER_SUPPORT"
      activeTab={activeTab}
      onSelectTab={handleSelectTab}
    >
      {/* Identity Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-800/40 rounded-2xl p-5 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-400/30 flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black text-white">Customer Support Desk</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30">
                Department Portal
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Guest inquiries, complaint tickets resolution, priority escalations, and duty manager coordination notes.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => { fetchMetrics(); fetchTickets(); }}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 self-end md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-bold text-rose-600 uppercase tracking-wider">Open Tickets</div>
          <div className="text-3xl font-black text-rose-700 mt-1">{metrics?.open_tickets ?? 0}</div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">Pending initial staff review</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-bold text-amber-600 uppercase tracking-wider">In Progress</div>
          <div className="text-3xl font-black text-amber-700 mt-1">{metrics?.in_progress_tickets ?? 0}</div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">Under hotel manager investigation</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Resolved Tickets</div>
          <div className="text-3xl font-black text-emerald-700 mt-1">{metrics?.resolved_tickets ?? 0}</div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">Successfully addressed</p>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets by subject, guest..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-purple-600 focus:bg-white select-text"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-purple-600 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-purple-600 cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* TICKETS TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-700 font-black uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Ticket ID</th>
                <th className="py-3 px-4">Guest / Subject</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading support tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500 font-bold">
                    No support tickets found for this criteria.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      #{t.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{t.subject || 'Guest Inquiry'}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-sm">{t.guest_name || t.user_name || 'Guest'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        t.priority === 'URGENT' || t.priority === 'HIGH'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {t.priority || 'NORMAL'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        t.status === 'RESOLVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : t.status === 'IN_PROGRESS'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {t.status || 'OPEN'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {formatDisplayDate(t.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTicket(t);
                          setNewStatus(t.status || 'IN_PROGRESS');
                          setNewPriority(t.priority || 'HIGH');
                        }}
                        className="px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5" /> Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TICKET MANAGEMENT MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Support Ticket #{selectedTicket.id}</h3>
                <p className="text-xs text-slate-500 font-medium">{selectedTicket.subject || 'Guest Complaint'}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-black p-1"
              >
                ✕
              </button>
            </div>

            {/* Status & Priority Form */}
            <form onSubmit={handleUpdateTicket} className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="text-xs font-black uppercase tracking-wider text-slate-700">Update Ticket Lifecycle</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                {actionLoading ? 'Saving...' : 'Update Status & Priority'}
              </button>
            </form>

            {/* Internal Staff Note Form */}
            <form onSubmit={handleAddNote} className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="text-xs font-black uppercase tracking-wider text-slate-700">Add Staff Internal Note</div>
              <textarea
                rows={2}
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="e.g. Contacted hotel duty manager; guest shifted to superior room."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none select-text"
              ></textarea>
              <button
                type="submit"
                disabled={actionLoading || !internalNote.trim()}
                className="w-full py-2 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Recording...' : 'Save Internal Note'}
              </button>
            </form>
          </div>
        </div>
      )}
    </StaffPortalLayout>
  );
};

export default CustomerSupportPortal;
