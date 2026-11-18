/**
 * Support Ticket & Chat Service
 * 
 * Handles support tickets, conversational thread messages, and customer-owner booking chat.
 */

import apiClient from '../apiClient';
import { ENDPOINTS } from '../../config/apiEndpoints';

export const supportService = {
  getTickets: async (config = {}) => {
    const response = await apiClient.get(ENDPOINTS.SUPPORT.TICKETS, config);
    return response.data;
  },

  getTicketDetail: async (ticketId, config = {}) => {
    const response = await apiClient.get(ENDPOINTS.SUPPORT.TICKET_DETAIL(ticketId), config);
    return response.data;
  },

  createTicket: async (ticketData) => {
    const response = await apiClient.post(ENDPOINTS.SUPPORT.TICKETS, ticketData);
    return response.data;
  },

  sendMessage: async (ticketId, messagePayload) => {
    const response = await apiClient.post(
      ENDPOINTS.SUPPORT.TICKET_MESSAGES(ticketId),
      messagePayload
    );
    return response.data;
  },

  updateTicketStatus: async (ticketId, fields) => {
    const response = await apiClient.patch(
      ENDPOINTS.SUPPORT.TICKET_DETAIL(ticketId),
      fields
    );
    return response.data;
  },

  getBookingChat: async (bookingId, config = {}) => {
    const response = await apiClient.get(ENDPOINTS.SUPPORT.CHAT(bookingId), config);
    return response.data;
  },
};

export default supportService;
