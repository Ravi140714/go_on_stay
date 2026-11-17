import React, { useState, useEffect } from 'react';
import {
  HelpCircle, Plus, MessageSquare, Send, CheckCircle2, Clock, AlertTriangle, ShieldCheck,
  Building2, Calendar, User, Paperclip, ExternalLink, RefreshCw, X, Search, ChevronRight,
  Check, AlertCircle, Image as ImageIcon
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const TICKET_CATEGORIES = [
  { value: 'BOOKING', label: 'Booking Issue', requiresBooking: true },
  { value: 'PAYMENT', label: 'Payment Issue', requiresBooking: true },
  { value: 'CANCELLATION', label: 'Cancellation Issue', requiresBooking: true },
  { value: 'REFUND', label: 'Refund Request', requiresBooking: true },
  { value: 'HOTEL', label: 'Hotel / Room Issue', requiresBooking: true },
  { value: 'ACCOUNT', label: 'General Query', requiresBooking: false },
];

const TICKET_PRIORITIES = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'URGENT', label: 'Urgent' },
];

const SupportTickets = () => {
  const { user, showToast } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Customer Bookings
  const [userBookings, setUserBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // New Ticket Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('BOOKING');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newDescription, setNewDescription] = useState('');
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Ticket Conversation State
  const [replyMessage, setReplyMessage] = useState('');
  const [replyAttachment, setReplyAttachment] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [linkedBookingDetails, setLinkedBookingDetails] = useState(null);
  const [loadingLinkedBooking, setLoadingLinkedBooking] = useState(false);

  useEffect(() => {
    fetchTickets();
    fetchUserBookings();
  }, []);

  // Fetch Tickets List
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments/support-tickets/');
      const list = res.data.results || res.data || [];
      const safeList = Array.isArray(list) ? list : [];
      setTickets(safeList);
      if (safeList.length > 0 && !selectedTicket) {
        handleSelectTicket(safeList[0]);
      }
    } catch (err) {
      console.error('Failed to load support tickets:', err);
      showToast('Failed to load support tickets.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Customer's Actual Bookings
  const fetchUserBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await api.get('/bookings/');
      const list = res.data.results || res.data || [];
      const safeList = Array.isArray(list) ? list : [];
      setUserBookings(safeList);
      if (safeList.length > 0 && !selectedBookingId) {
        setSelectedBookingId(String(safeList[0].id));
      }
    } catch (err) {
      console.warn('Could not fetch user bookings for ticket dropdown:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Handle Selecting a Ticket
  const handleSelectTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setReplyMessage('');
    setReplyAttachment('');
    setLinkedBookingDetails(null);

    // Fetch fresh details with thread
    try {
      const res = await api.get(`/payments/support-tickets/${ticket.id}/`);
      setSelectedTicket(res.data);

      if (res.data.booking) {
        fetchLinkedBooking(res.data.booking);
      }
    } catch (err) {
      console.error('Error fetching ticket thread:', err);
    }
  };

  const fetchLinkedBooking = async (bookingIdOrPk) => {
    setLoadingLinkedBooking(true);
    try {
      const res = await api.get(`/bookings/${bookingIdOrPk}/`);
      setLinkedBookingDetails(res.data);
    } catch (err) {
      // Fallback check from existing loaded user bookings
      const found = userBookings.find(b => b.id === bookingIdOrPk || b.booking_id === bookingIdOrPk);
      if (found) setLinkedBookingDetails(found);
    } finally {
      setLoadingLinkedBooking(false);
    }
  };

  // Check if active category requires a booking
  const activeCategoryObj = TICKET_CATEGORIES.find(c => c.value === newCategory) || TICKET_CATEGORIES[0];
  const requiresBooking = activeCategoryObj.requiresBooking;

  // Selected Booking Details for Create Modal
  const selectedBookingObj = userBookings.find(b => String(b.id) === String(selectedBookingId));

  // Create Ticket Submission
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim()) {
      showToast('Subject and description are required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        subject: newSubject.trim(),
        category: newCategory,
        priority: newPriority,
        description: newDescription.trim(),
        booking: requiresBooking && selectedBookingId ? Number(selectedBookingId) : null,
      };

      const res = await api.post('/payments/support-tickets/', payload);
      const createdTicket = res.data;

      // If customer provided an attachment URL, post it as the first message
      if (newAttachmentUrl.trim() && createdTicket.id) {
        try {
          await api.post(`/payments/support-tickets/${createdTicket.id}/messages/`, {
            message: 'Screenshot / Reference attachment provided with ticket submission.',
            attachment_url: newAttachmentUrl.trim(),
          });
        } catch (attErr) {
          console.warn('Initial attachment post failed:', attErr);
        }
      }

      showToast('Support ticket submitted successfully!');
      setShowNewModal(false);
      setNewSubject('');
      setNewDescription('');
      setNewAttachmentUrl('');
      setNewCategory('BOOKING');
      setNewPriority('MEDIUM');

      // Refresh tickets list and select the newly created ticket
      await fetchTickets();
      if (createdTicket.id) {
        handleSelectTicket(createdTicket);
      }
    } catch (err) {
      console.error('Failed to create ticket:', err);
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Failed to submit ticket.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Send Reply in Conversation Thread
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    setSendingReply(true);
    try {
      const payload = {
        message: replyMessage.trim(),
        attachment_url: replyAttachment.trim() || null,
      };

      await api.post(`/payments/support-tickets/${selectedTicket.id}/messages/`, payload);
      showToast('Reply sent successfully!');
      setReplyMessage('');
      setReplyAttachment('');

      // Refresh selected ticket thread
      const res = await api.get(`/payments/support-tickets/${selectedTicket.id}/`);
      setSelectedTicket(res.data);
      setTickets(tickets.map(t => (t.id === res.data.id ? res.data : t)));
    } catch (err) {
      console.error('Failed to send reply:', err);
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Failed to send reply.';
      showToast(msg, 'error');
    } finally {
      setSendingReply(false);
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter(t => {
    if (filterStatus === 'OPEN' && t.status !== 'OPEN') return false;
    if (filterStatus === 'IN_PROGRESS' && t.status !== 'IN_PROGRESS') return false;
    if (filterStatus === 'RESOLVED' && !['RESOLVED', 'CLOSED'].includes(t.status)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = t.ticket_number?.toLowerCase().includes(q);
      const matchSub = t.subject?.toLowerCase().includes(q);
      const matchCat = t.category?.toLowerCase().includes(q);
      if (!matchNum && !matchSub && !matchCat) return false;
    }
    return true;
  });

  const getPriorityBadge = (pri) => {
    switch (pri) {
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">Urgent</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">High</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Medium</span>;
      case 'LOW':
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">Low</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RESOLVED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1"><Check className="w-3 h-3 text-emerald-600" /> Resolved</span>;
      case 'CLOSED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">Closed</span>;
      case 'IN_PROGRESS':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200 flex items-center gap-1"><Clock className="w-3 h-3 text-sky-600" /> In Progress</span>;
      case 'WAITING_FOR_USER':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">Waiting for You</span>;
      case 'OPEN':
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-50 text-rose-800 border border-rose-200">Open</span>;
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#eaf3f9] via-[#f1f7fb] to-[#f8fafc] text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 bg-white p-6 rounded-3xl border shadow-xs">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-xs font-bold uppercase tracking-wider mb-2">
              <HelpCircle className="w-3.5 h-3.5 text-purple-600" /> Customer Support Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Help & Support Tickets</h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Get official support for booking issues, refund requests, cancellations, and property queries
            </p>
          </div>

          <button
            onClick={() => {
              fetchUserBookings();
              setShowNewModal(true);
            }}
            className="btn-teal py-3 px-5 text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-teal-600/25 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Create New Ticket
          </button>
        </div>

        {/* Content Layout */}
        {loading ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 space-y-3">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold text-slate-500">Loading support ticket threads...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
            <HelpCircle className="w-12 h-12 text-teal-600 mx-auto opacity-50" />
            <h3 className="text-lg font-black text-slate-900">No Support Tickets Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              You don't have any open support tickets. Need help with a booking, payment, cancellation or room issue? Click below to submit an inquiry!
            </p>
            <button
              onClick={() => {
                fetchUserBookings();
                setShowNewModal(true);
              }}
              className="btn-teal py-2.5 px-6 text-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Open Support Ticket
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Ticket List Sidebar */}
            <div className="lg:col-span-4 space-y-3">
              
              {/* Search & Filter Controls */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-2.5 shadow-2xs">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search your tickets..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-600"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[11px] font-bold">
                  {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(st => (
                    <button
                      key={st}
                      onClick={() => setFilterStatus(st)}
                      className={`flex-1 py-1 rounded-lg text-center transition-all cursor-pointer ${
                        filterStatus === st
                          ? 'bg-slate-900 text-white font-black'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {st === 'ALL' ? 'All' : st === 'OPEN' ? 'Open' : st === 'IN_PROGRESS' ? 'Progress' : 'Resolved'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tickets Cards List */}
              <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
                {filteredTickets.map((t) => {
                  const isSelected = selectedTicket?.id === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleSelectTicket(t)}
                      className={`p-4 rounded-2xl cursor-pointer border transition-all ${
                        isSelected
                          ? 'border-teal-600 bg-white shadow-md ring-2 ring-teal-600/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-mono font-black text-teal-700">#{t.ticket_number}</span>
                        {getStatusBadge(t.status)}
                      </div>
                      <h4 className="text-xs font-black text-slate-900 line-clamp-1">{t.subject}</h4>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mt-2 pt-2 border-t border-slate-100">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-bold">{t.category}</span>
                        <span>{new Date(t.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Conversation & Ticket Detail Panel */}
            <div className="lg:col-span-8">
              {selectedTicket ? (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
                  
                  {/* Ticket Header */}
                  <div className="border-b border-slate-100 pb-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-teal-600">
                        Ticket #{selectedTicket.ticket_number}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        Submitted: {new Date(selectedTicket.created_at).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <h2 className="text-xl font-black text-slate-900">{selectedTicket.subject}</h2>

                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                        Category: {selectedTicket.category}
                      </span>
                      {getPriorityBadge(selectedTicket.priority)}
                      {getStatusBadge(selectedTicket.status)}
                    </div>
                  </div>

                  {/* Clean Booking Details Card (When linked to a booking) */}
                  {selectedTicket.booking && (
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-700 space-y-3">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-teal-400">
                          <Building2 className="w-4 h-4" />
                          <span>Linked Reservation Details</span>
                        </div>
                        {loadingLinkedBooking && (
                          <span className="text-[10px] text-slate-400 font-medium">Loading details...</span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-black block">Booking ID</span>
                          <span className="font-mono font-bold text-white mt-0.5 block">
                            {linkedBookingDetails?.booking_id || `#${selectedTicket.booking}`}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-black block">Hotel Name</span>
                          <span className="font-bold text-white mt-0.5 block truncate" title={linkedBookingDetails?.hotel_details?.name}>
                            {linkedBookingDetails?.hotel_details?.name || 'Hotel Stay'} (ID: {linkedBookingDetails?.hotel || 'N/A'})
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-black block">Room Number</span>
                          <span className="font-bold text-white mt-0.5 block">
                            {linkedBookingDetails?.room_number || linkedBookingDetails?.room_details?.room_type || 'Room Details'} (ID: {linkedBookingDetails?.room || 'N/A'})
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-black block">Stay Dates</span>
                          <span className="font-bold text-teal-200 mt-0.5 block">
                            {linkedBookingDetails?.check_in || 'N/A'} → {linkedBookingDetails?.check_out || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Conversation History Thread */}
                  <div className="space-y-3">
                    <div className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Ticket Discussion Thread
                    </div>

                    <div className="space-y-4 max-h-[380px] overflow-y-auto p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      
                      {/* Initial Customer Description */}
                      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 border-b border-slate-100 pb-1">
                          <span className="text-slate-900 font-black flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {selectedTicket.user_name || 'You (Customer)'}
                          </span>
                          <span>{new Date(selectedTicket.created_at).toLocaleString('en-IN')}</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                          {selectedTicket.description}
                        </p>
                      </div>

                      {/* Replies */}
                      {selectedTicket.messages?.map((m) => {
                        const isStaff = m.sender_role === 'ADMIN' || m.sender_role === 'SUPER_ADMIN' || m.is_staff_reply;
                        const isOwner = m.sender_role === 'HOTEL_OWNER';

                        return (
                          <div
                            key={m.id}
                            className={`p-4 rounded-xl space-y-1.5 ${
                              isStaff
                                ? 'bg-teal-50/80 border border-teal-200 ml-6 text-teal-950'
                                : isOwner
                                ? 'bg-amber-50/80 border border-amber-200 ml-4 mr-4 text-amber-950'
                                : 'bg-white border border-slate-200 mr-6 text-slate-800 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px] font-bold border-b border-black/5 pb-1">
                              <span className={isStaff ? 'text-teal-900 font-black flex items-center gap-1.5' : isOwner ? 'text-amber-900 font-black flex items-center gap-1.5' : 'text-slate-900 font-black flex items-center gap-1.5'}>
                                {isStaff && <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />}
                                {isOwner && <Building2 className="w-3.5 h-3.5 text-amber-600" />}
                                {!isStaff && !isOwner && <User className="w-3.5 h-3.5 text-slate-400" />}
                                <span>{m.sender_name || (isStaff ? 'GoOnStay Support Team' : isOwner ? 'Hotel Owner' : 'You')}</span>
                                <span className="text-[10px] font-normal opacity-70">
                                  ({isStaff ? 'Official Support' : isOwner ? 'Hotel Property' : 'Guest'})
                                </span>
                              </span>
                              <span className="text-[10px] opacity-60">
                                {new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <p className="text-xs leading-relaxed font-medium whitespace-pre-wrap">
                              {m.message}
                            </p>

                            {m.attachment_url && (
                              <div className="pt-1">
                                <a
                                  href={m.attachment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:underline"
                                >
                                  <Paperclip className="w-3 h-3" /> View Attachment / Proof <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </div>
                            )}
                          </div>
                        );
                      })}

                    </div>
                  </div>

                  {/* Reply Input Form */}
                  <form onSubmit={handleSendReply} className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Type your response or question to support team..."
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:border-teal-600 outline-none"
                      />
                      <button
                        type="submit"
                        disabled={sendingReply || !replyMessage.trim()}
                        className="btn-teal py-2.5 px-5 text-xs font-extrabold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {sendingReply ? 'Sending...' : 'Reply'}
                      </button>
                    </div>

                    {/* Optional attachment link in reply */}
                    <div className="flex items-center gap-2 text-xs">
                      <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="url"
                        value={replyAttachment}
                        onChange={(e) => setReplyAttachment(e.target.value)}
                        placeholder="Optional screenshot / image URL link (e.g. Google Drive, Imgur, Cloudinary)"
                        className="w-full sm:w-80 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal focus:outline-none focus:border-teal-600"
                      />
                    </div>
                  </form>

                </div>
              ) : (
                <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-slate-400 font-bold">
                  Select a support ticket thread on the left to view conversation.
                </div>
              )}
            </div>

          </div>
        )}

        {/* CREATE TICKET MODAL */}
        {showNewModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 border border-slate-200 my-8">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-teal-50 text-teal-700">
                    <Plus className="w-4 h-4 stroke-[3]" />
                  </span>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Create Support Ticket</h3>
                    <p className="text-xs text-slate-400 font-medium">Submit your issue for fast resolution</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleCreateTicket} className="space-y-4">
                
                {/* Category & Priority Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">
                      Ticket Category <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewCategory(val);
                        const cat = TICKET_CATEGORIES.find(c => c.value === val);
                        if (!cat?.requiresBooking) {
                          setSelectedBookingId('');
                        } else if (userBookings.length > 0 && !selectedBookingId) {
                          setSelectedBookingId(String(userBookings[0].id));
                        }
                      }}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-teal-600 cursor-pointer"
                    >
                      {TICKET_CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">
                      Priority Level <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-teal-600 cursor-pointer"
                    >
                      {TICKET_PRIORITIES.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Conditional Booking Selection Dropdown */}
                {requiresBooking && (
                  <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-black text-teal-900">
                        Select Relevant Booking <span className="text-rose-600">*</span>
                      </label>
                      {loadingBookings && (
                        <span className="text-[10px] text-teal-600 font-medium">Fetching your bookings...</span>
                      )}
                    </div>

                    {userBookings.length === 0 ? (
                      <div className="p-3 bg-white rounded-xl border border-teal-200 text-xs text-slate-600">
                        No previous bookings found on your account. You can still submit a general inquiry or provide details in description.
                      </div>
                    ) : (
                      <select
                        value={selectedBookingId}
                        onChange={(e) => setSelectedBookingId(e.target.value)}
                        required={requiresBooking}
                        className="w-full px-3 py-2.5 bg-white border border-teal-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-teal-600 cursor-pointer"
                      >
                        <option value="">-- Choose from your reservations --</option>
                        {userBookings.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.booking_id} – {b.hotel_details?.name || 'Hotel'} – Room {b.room_number || b.room_details?.room_number || b.room || 'N/A'}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Automatic Read-only Booking Details Card */}
                    {selectedBookingObj && (
                      <div className="p-3.5 bg-white rounded-xl border border-teal-200 shadow-2xs space-y-2">
                        <div className="text-[11px] font-black uppercase text-teal-800 tracking-wide flex items-center gap-1.5 border-b border-teal-100 pb-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                          <span>Verified Reservation Details (Read-Only)</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold uppercase">Booking ID</span>
                            <span className="font-mono font-bold text-slate-900">{selectedBookingObj.booking_id}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold uppercase">Hotel Name</span>
                            <span className="font-bold text-slate-900 truncate block" title={selectedBookingObj.hotel_details?.name}>
                              {selectedBookingObj.hotel_details?.name || 'Hotel'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold uppercase">Hotel ID</span>
                            <span className="font-mono font-bold text-slate-700">{selectedBookingObj.hotel || selectedBookingObj.hotel_details?.id || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold uppercase">Room Number</span>
                            <span className="font-bold text-slate-900">{selectedBookingObj.room_number || selectedBookingObj.room_details?.room_number || selectedBookingObj.room_details?.room_type || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold uppercase">Room ID</span>
                            <span className="font-mono font-bold text-slate-700">{selectedBookingObj.room || selectedBookingObj.room_details?.id || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold uppercase">Stay Dates</span>
                            <span className="font-bold text-teal-700">{selectedBookingObj.check_in} → {selectedBookingObj.check_out}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Subject */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Subject / Summary <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="Brief summary of your inquiry (e.g. AC not cooling in room 108)..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-teal-600"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Detailed Description <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Describe your issue or question in detail so support team and hotel management can assist you promptly..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium outline-none focus:border-teal-600"
                  />
                </div>

                {/* Attachment / Screenshot (Optional) */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Attachment / Screenshot URL <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-slate-400" />
                    <input
                      type="url"
                      value={newAttachmentUrl}
                      onChange={(e) => setNewAttachmentUrl(e.target.value)}
                      placeholder="Public image or document URL (e.g. https://...)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-normal outline-none focus:border-teal-600"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    You can paste an image link, receipt URL, or screenshot URL to help resolve your issue faster.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="btn-secondary px-4 py-2.5 rounded-full text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-teal py-2.5 px-6 text-xs font-extrabold disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Submitting Ticket...' : 'Submit Support Ticket'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SupportTickets;
