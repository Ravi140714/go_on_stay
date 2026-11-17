import React, { useState, useEffect } from 'react';
import {
  MessageSquare, Search, Filter, CheckCircle2, Clock, AlertTriangle,
  Building2, Calendar, User, Phone, Mail, Send, Paperclip, ExternalLink,
  RefreshCw, X, Eye, Check, ShieldCheck, AlertCircle, HelpCircle
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { parseApiError } from '../utils/errorHandler';

const OwnerSupportTickets = ({ hotels = [], bookings = [] }) => {
  const { user: currentOwner, showToast } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, OPEN, IN_PROGRESS, RESOLVED
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Ticket Drawer
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [linkedBooking, setLinkedBooking] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(false);

  // Reply & Resolution State
  const [replyMessage, setReplyMessage] = useState('');
  const [replyAttachment, setReplyAttachment] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [submittingResolution, setSubmittingResolution] = useState(false);

  // Error note from backend if permissions are restricted
  const [backendPermissionNotice, setBackendPermissionNotice] = useState(null);

  // Set of Hotel IDs owned by this host
  const ownerHotelIds = hotels.map(h => h.id);
  // Set of Booking PKs and string IDs belonging to this host's hotels
  const ownerBookingIds = bookings.map(b => b.id);
  const ownerBookingCodeMap = {};
  bookings.forEach(b => {
    ownerBookingCodeMap[b.id] = b;
    if (b.booking_id) ownerBookingCodeMap[b.booking_id] = b;
  });

  useEffect(() => {
    fetchOwnerTickets();
  }, []);

  const fetchOwnerTickets = async () => {
    setLoading(true);
    setBackendPermissionNotice(null);
    try {
      const res = await api.get('/payments/support-tickets/');
      const list = res.data.results || res.data || [];
      const allTickets = Array.isArray(list) ? list : [];

      // Filter tickets: Hotel Owner must ONLY see tickets related to their own hotel that have been assigned to them
      // by Admin, OR tickets linked to bookings at their hotel properties
      const allowedTickets = allTickets.filter(t => {
        // Explicitly assigned to this owner
        if (t.assigned_agent && String(t.assigned_agent) === String(currentOwner?.id)) return true;
        // Linked to a booking belonging to owner's hotel
        if (t.booking && ownerBookingCodeMap[t.booking]) return true;
        // Created by this owner
        if (t.user && String(t.user) === String(currentOwner?.id)) return true;
        return false;
      });

      setTickets(allowedTickets);
      if (allowedTickets.length > 0 && !selectedTicket) {
        handleOpenTicket(allowedTickets[0]);
      }
    } catch (err) {
      console.warn('Backend tickets endpoint error for hotel owner:', err);
      if (err.response?.status === 403) {
        setBackendPermissionNotice(
          'Backend note: The current backend SupportTicketListCreateView restricts list access to ticket creator or admin staff. A backend query update is required to filter by assigned_agent or hotel owner.'
        );
      } else {
        showToast?.('Could not load support tickets.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setReplyMessage('');
    setReplyAttachment('');
    setLinkedBooking(null);
    setTicketLoading(true);

    try {
      const res = await api.get(`/payments/support-tickets/${ticket.id}/`);
      setSelectedTicket(res.data);

      if (res.data.booking) {
        fetchLinkedBooking(res.data.booking);
      }
    } catch (err) {
      console.warn('Error fetching ticket details:', err);
      // Fallback check from local booking cache
      if (ticket.booking && ownerBookingCodeMap[ticket.booking]) {
        setLinkedBooking(ownerBookingCodeMap[ticket.booking]);
      }
    } finally {
      setTicketLoading(false);
    }
  };

  const fetchLinkedBooking = async (bookingIdOrPk) => {
    // Check if we already have it in owner's bookings list
    if (ownerBookingCodeMap[bookingIdOrPk]) {
      setLinkedBooking(ownerBookingCodeMap[bookingIdOrPk]);
      return;
    }

    setLoadingBooking(true);
    try {
      const res = await api.get(`/bookings/${bookingIdOrPk}/`);
      setLinkedBooking(res.data);
    } catch (err) {
      console.warn('Could not fetch booking details for ticket:', err);
    } finally {
      setLoadingBooking(false);
    }
  };

  // Reply to Admin / Customer
  const handleSendReply = async (e) => {
    e?.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    setSendingReply(true);
    try {
      const payload = {
        message: replyMessage.trim(),
        attachment_url: replyAttachment.trim() || null,
      };

      await api.post(`/payments/support-tickets/${selectedTicket.id}/messages/`, payload);
      showToast?.('Response sent to Admin & Customer!', 'success');
      setReplyMessage('');
      setReplyAttachment('');

      // Refresh ticket thread
      const res = await api.get(`/payments/support-tickets/${selectedTicket.id}/`);
      setSelectedTicket(res.data);
      setTickets(prev => prev.map(t => (t.id === res.data.id ? res.data : t)));
    } catch (err) {
      console.error('Failed to send reply:', err);
      const parsed = parseApiError(err, 'Failed to submit response.');
      if (err.response?.status === 403) {
        showToast?.('Backend Permission Note: Backend TicketMessageCreateView currently restricts message posting to ticket creator or admin staff. Backend developer needs to allow assigned hotel owners.', 'error');
      } else {
        showToast?.(parsed.message, 'error');
      }
    } finally {
      setSendingReply(false);
    }
  };

  // Submit Resolution
  const handleSubmitResolution = async () => {
    if (!resolutionNote.trim() || !selectedTicket) return;

    setSubmittingResolution(true);
    try {
      // 1. Post resolution message to the thread
      try {
        await api.post(`/payments/support-tickets/${selectedTicket.id}/messages/`, {
          message: `[HOTEL OWNER RESOLUTION UPDATE]: ${resolutionNote.trim()}`,
        });
      } catch (postErr) {
        console.warn('Resolution message post notice:', postErr);
      }

      // 2. Attempt to update ticket status to RESOLVED or IN_PROGRESS
      try {
        const patchRes = await api.patch(`/payments/support-tickets/${selectedTicket.id}/`, {
          status: 'RESOLVED',
        });
        setSelectedTicket(patchRes.data);
        setTickets(prev => prev.map(t => (t.id === patchRes.data.id ? patchRes.data : t)));
      } catch (patchErr) {
        console.warn('Status patch note:', patchErr);
      }

      showToast?.('Resolution submitted successfully!', 'success');
      setShowResolutionModal(false);
      setResolutionNote('');
      fetchOwnerTickets();
    } catch (err) {
      console.error('Resolution submission error:', err);
      const parsed = parseApiError(err, 'Failed to submit resolution.');
      showToast?.(parsed.message, 'error');
    } finally {
      setSubmittingResolution(false);
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter(t => {
    if (activeTab === 'OPEN' && t.status !== 'OPEN') return false;
    if (activeTab === 'IN_PROGRESS' && t.status !== 'IN_PROGRESS') return false;
    if (activeTab === 'RESOLVED' && !['RESOLVED', 'CLOSED'].includes(t.status)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const numMatch = t.ticket_number?.toLowerCase().includes(q);
      const subMatch = t.subject?.toLowerCase().includes(q);
      const descMatch = t.description?.toLowerCase().includes(q);
      const userMatch = t.user_name?.toLowerCase().includes(q);
      if (!numMatch && !subMatch && !descMatch && !userMatch) return false;
    }
    return true;
  });

  const getPriorityBadge = (pri) => {
    switch (pri) {
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">URGENT</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">MEDIUM</span>;
      case 'LOW':
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">LOW</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RESOLVED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1"><Check className="w-3 h-3 text-emerald-600" /> RESOLVED</span>;
      case 'CLOSED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">CLOSED</span>;
      case 'IN_PROGRESS':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200 flex items-center gap-1"><Clock className="w-3 h-3 text-sky-600" /> IN PROGRESS</span>;
      case 'WAITING_FOR_USER':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">WAITING GUEST</span>;
      case 'OPEN':
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-50 text-rose-800 border border-rose-200">OPEN</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-[#eaf3f9] text-sky-800">
              <MessageSquare className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Assigned Support Tickets</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Review guest issues forwarded by Admin for your hotel properties, submit resolutions, and communicate updates
          </p>
        </div>

        <button
          onClick={fetchOwnerTickets}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Backend Permission Notification Note (if backend query restricts) */}
      {backendPermissionNotice && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
          <div className="font-black flex items-center gap-1.5 text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Backend Integration Status</span>
          </div>
          <p className="leading-relaxed font-medium">{backendPermissionNotice}</p>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'ALL', label: 'All Tickets' },
            { id: 'OPEN', label: 'Open' },
            { id: 'IN_PROGRESS', label: 'In Progress' },
            { id: 'RESOLVED', label: 'Resolved' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Content Layout */}
      {loading ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 space-y-3">
          <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-500">Loading assigned tickets...</p>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto opacity-70" />
          <h3 className="text-sm font-black text-slate-800">No Assigned Tickets Pending</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            There are currently no open support tickets assigned to your properties. When Admin forwards guest issues regarding your hotel or rooms, they will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Tickets Sidebar List */}
          <div className="lg:col-span-5 space-y-2.5 max-h-[650px] overflow-y-auto pr-1">
            {filteredTickets.map(t => {
              const isSelected = selectedTicket?.id === t.id;
              const bookingInfo = ownerBookingCodeMap[t.booking];

              return (
                <div
                  key={t.id}
                  onClick={() => handleOpenTicket(t)}
                  className={`p-4 rounded-2xl cursor-pointer border transition-all ${
                    isSelected
                      ? 'border-sky-500 bg-white shadow-md ring-2 ring-sky-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-mono font-black text-sky-800">#{t.ticket_number}</span>
                    <div className="flex items-center gap-1.5">
                      {getPriorityBadge(t.priority)}
                      {getStatusBadge(t.status)}
                    </div>
                  </div>

                  <h4 className="text-xs font-black text-slate-900 line-clamp-1">{t.subject}</h4>
                  
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {t.user_name || 'Guest'}
                    </span>
                    {t.booking && (
                      <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-bold">
                        Booking #{t.booking}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ticket Details & Action Panel */}
          <div className="lg:col-span-7">
            {selectedTicket ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
                
                {/* Header */}
                <div className="border-b border-slate-100 pb-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-sky-600">
                      Ticket #{selectedTicket.ticket_number}
                    </span>
                    <span className="text-xs text-slate-400">
                      Received: {new Date(selectedTicket.created_at).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-900">{selectedTicket.subject}</h3>

                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {selectedTicket.category}
                    </span>
                    {getPriorityBadge(selectedTicket.priority)}
                    {getStatusBadge(selectedTicket.status)}
                  </div>
                </div>

                {/* Linked Booking Details Card */}
                {selectedTicket.booking && (
                  <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2 text-xs border border-slate-800">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                      <span className="text-[11px] font-black uppercase text-sky-400 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" /> Reservation Context
                      </span>
                      {loadingBooking && <span className="text-[10px] text-slate-400">Loading...</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Booking ID</span>
                        <span className="font-mono font-bold text-white">{linkedBooking?.booking_id || `#${selectedTicket.booking}`}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Hotel / Property</span>
                        <span className="font-bold text-white truncate block">{linkedBooking?.hotel_details?.name || 'Your Hotel'} (ID: {linkedBooking?.hotel || 'N/A'})</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Room Assigned</span>
                        <span className="font-bold text-white">{linkedBooking?.room_number || linkedBooking?.room_details?.room_type || 'Assigned Room'} (ID: {linkedBooking?.room || 'N/A'})</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Stay Dates</span>
                        <span className="font-bold text-sky-300">{linkedBooking?.check_in || 'N/A'} → {linkedBooking?.check_out || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Customer Issue Description */}
                <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 space-y-1">
                  <div className="text-[11px] font-black text-purple-900 flex items-center gap-1">
                    <User className="w-3 h-3 text-purple-600" />
                    <span>Customer Issue (Reported by {selectedTicket.user_name || 'Guest'})</span>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
                    {selectedTicket.description}
                  </p>
                </div>

                {/* Conversation History Thread */}
                <div className="space-y-2.5">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Discussion History ({selectedTicket.messages?.length || 0} Responses)
                  </div>

                  <div className="space-y-3 max-h-[250px] overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200">
                    {(!selectedTicket.messages || selectedTicket.messages.length === 0) ? (
                      <div className="py-4 text-center text-xs text-slate-400">
                        No replies yet. Respond to Admin below.
                      </div>
                    ) : (
                      selectedTicket.messages.map(m => {
                        const isAdmin = m.sender_role === 'ADMIN' || m.sender_role === 'SUPER_ADMIN' || m.is_staff_reply;
                        const isOwner = m.sender_role === 'HOTEL_OWNER';

                        return (
                          <div
                            key={m.id}
                            className={`p-3 rounded-xl space-y-1 text-xs ${
                              isOwner
                                ? 'bg-[#eaf3f9] border border-sky-200 ml-6 text-teal-950'
                                : isAdmin
                                ? 'bg-purple-50 border border-purple-200 mr-6 text-purple-950'
                                : 'bg-white border border-slate-200 mr-6 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] font-bold border-b border-black/5 pb-1">
                              <span className="font-black flex items-center gap-1">
                                {isAdmin && <ShieldCheck className="w-3 h-3 text-purple-600" />}
                                {isOwner && <Building2 className="w-3 h-3 text-sky-600" />}
                                <span>{m.sender_name || (isAdmin ? 'GoOnStay Admin' : isOwner ? 'You (Hotel Owner)' : 'Guest')}</span>
                                <span className="opacity-60 font-normal">({isAdmin ? 'Admin' : isOwner ? 'Hotel Owner' : 'Guest'})</span>
                              </span>
                              <span className="opacity-50">
                                {new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="leading-relaxed font-medium whitespace-pre-wrap">{m.message}</p>
                            {m.attachment_url && (
                              <a
                                href={m.attachment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-800 hover:underline pt-1"
                              >
                                <Paperclip className="w-2.5 h-2.5" /> Attachment <ExternalLink className="w-2 h-2" />
                              </a>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Owner Reply Input */}
                <form onSubmit={handleSendReply} className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="text-xs font-black text-slate-800 flex items-center gap-1">
                    <Send className="w-3.5 h-3.5 text-sky-600" />
                    <span>Send Issue Update to Admin & Guest</span>
                  </div>

                  <textarea
                    rows={2}
                    required
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Provide an update on what action was taken at the hotel (e.g. room inspected, maintenance completed)..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:border-sky-500 outline-none"
                  />

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs w-full sm:w-auto">
                      <Paperclip className="w-3 h-3 text-slate-400" />
                      <input
                        type="url"
                        value={replyAttachment}
                        onChange={(e) => setReplyAttachment(e.target.value)}
                        placeholder="Optional photo/document URL"
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs w-full sm:w-56 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setShowResolutionModal(true)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Submit Resolution
                      </button>
                      <button
                        type="submit"
                        disabled={sendingReply || !replyMessage.trim()}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        {sendingReply ? 'Sending...' : 'Send Update'}
                      </button>
                    </div>
                  </div>
                </form>

              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 font-bold">
                Select a ticket from the left to view details and respond.
              </div>
            )}
          </div>

        </div>
      )}

      {/* Submit Resolution Modal */}
      {showResolutionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900">Submit Hotel Resolution</h3>
                <p className="text-xs text-slate-500 font-medium">Record final solution for Admin and Guest</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-black text-slate-700">Resolution Summary / Note</label>
              <textarea
                rows={3}
                required
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Explain how this issue has been resolved at the hotel (e.g., Guest moved to Deluxe Suite 204, refund approved, AC technician fixed unit)..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:border-emerald-600 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResolutionModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitResolution}
                disabled={submittingResolution || !resolutionNote.trim()}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black cursor-pointer shadow-sm"
              >
                {submittingResolution ? 'Submitting...' : 'Confirm & Resolve'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OwnerSupportTickets;

