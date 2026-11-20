/**
 * GoOnStay Centralized API Endpoints Map
 * 
 * Maps every backend endpoint by domain.
 * Strictly reflects the Django REST Framework backend routing contract.
 */

export const ENDPOINTS = {
  // Authentication & User Profile
  AUTH: {
    LOGIN: '/users/login/',
    REGISTER: '/users/register/',
    REFRESH_TOKEN: '/users/token/refresh/',
    PROFILE: '/users/profile/',
    CHANGE_PASSWORD: '/users/change-password/',
    FORGOT_PASSWORD: '/users/forgot-password/',
    VERIFY_OTP: '/users/verify-otp/',
    RESET_PASSWORD: '/users/reset-password/',
    SEND_OTP: '/users/send-otp/',
    CHECK_EMAIL: '/users/check-email/',
    CHECK_PHONE: '/users/check-phone/', // Backend missing, handled gracefully
    BECOME_HOST: '/users/become-host/', // Fallbacks to register with role HOTEL_OWNER
    ALL_USERS: '/users/all/',
    TOGGLE_BLOCK: (userId) => `/users/${userId}/toggle-block/`,
    CHANGE_ROLE: (userId) => `/users/${userId}/change-role/`,
    DELETE_USER: (userId) => `/users/${userId}/delete/`,
  },

  // Hotels & Amenities
  HOTELS: {
    LIST: '/hotels/',
    CITIES: '/hotels/cities/',
    SEARCH: '/hotels/search/',
    AMENITIES: '/hotels/amenities/',
    OWNER_HOTELS: '/hotels/owner-hotels/',
    DETAIL: (id) => `/hotels/${id}/`,
    SUBMIT_APPROVAL: (id) => `/hotels/${id}/submit/`,
    APPROVAL: (id) => `/hotels/${id}/approval/`,
    DOCUMENTS: (id) => `/hotels/${id}/documents/`,
    UPLOAD_IMAGE: (id) => `/hotels/${id}/upload-image/`,
  },

  // Rooms & Availability
  ROOMS: {
    LIST: '/rooms/',
    CHECK_AVAILABILITY: '/rooms/check-availability/',
    DETAIL: (id) => `/rooms/${id}/`,
    BY_HOTEL: (hotelId) => `/rooms/by-hotel/${hotelId}/`,
    CALENDAR: (id) => `/rooms/${id}/calendar/`,
    UPLOAD_IMAGE: (id) => `/rooms/${id}/upload-image/`,
  },

  // Bookings
  BOOKINGS: {
    LIST_CREATE: '/bookings/',
    MY_BOOKINGS: '/bookings/?page_size=1000',
    DETAIL: (id) => `/bookings/${id}/`,
    CANCEL: (id) => `/bookings/${id}/cancel/`,
    CHECK_IN: (id) => `/bookings/${id}/check-in/`,
    CHECK_OUT: (id) => `/bookings/${id}/check-out/`,
    NO_SHOW: (id) => `/bookings/${id}/no-show/`,
    OWNER_APPROVAL: (id) => `/bookings/${id}/owner-approval/`,
    RESEND_EMAIL: (bookingId) => `/bookings/${bookingId}/resend-email/`,
  },

  // Payments, Refunds & Settlements
  PAYMENTS: {
    CREATE_ORDER: '/payments/create-order/',
    VERIFY: '/payments/verify/',
    RETRY: '/payments/retry/',
    REFUND: '/payments/refund/',
    CREATE_HOST_SUBSCRIPTION_ORDER: '/payments/create-host-subscription-order/',
    VERIFY_HOST_SUBSCRIPTION: '/payments/verify-host-subscription/',
    PAYOUTS: '/payments/payouts/',
    PAYOUT_ACCOUNT: '/payments/payout-account/',
    SETTINGS: '/payments/settings/',
    SETTLEMENTS: '/payments/settlements/',
    SETTLEMENT_STATEMENT: '/payments/settlement-statement/',
    ADMIN_ALL: '/payments/admin/all/',
    ADMIN_REFUNDS: '/payments/admin/refunds/',
    ADMIN_AUDIT_LOGS: '/payments/admin/audit-logs/',
    ADMIN_PROVIDER_STATUS: '/payments/admin/provider-setup-status/',
    ADMIN_INITIATE_PAYOUT: '/payments/admin/payouts/initiate/',
    ADMIN_TOGGLE_DISPUTE: '/payments/admin/earnings/toggle-dispute/',
    REFUND_STATUS: (bId) => `/payments/refunds/${bId}/status/?sync=true`,
    REFUND_LOOKUP: (bId) => `/payments/refunds/${bId}/`,
    REFUND_RETRY: (bId) => `/payments/refunds/${bId}/retry/`,
    CUSTOMER_PAYOUT: (bId) => `/payments/payouts/customer/${encodeURIComponent(bId)}/?sync=true`,
  },

  // Coupons
  COUPONS: {
    LIST_CREATE: '/coupons/',
    AVAILABLE: '/coupons/available/',
    APPLY: '/coupons/apply/',
    VALIDATE: '/coupons/validate/',
    DETAIL: (id) => `/coupons/${id}/`,
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications/',
    UNREAD_COUNT: '/notifications/unread-count/',
    READ_ALL: '/notifications/read-all/',
    MARK_READ: (id) => `/notifications/${id}/read/`,
    SEND_TEST: '/notifications/send-test/',
    SIMULATE_PAYOUT_DUE: '/notifications/simulate-payout-due/',
  },

  // Reviews
  REVIEWS: {
    LIST_CREATE: '/reviews/',
    DETAIL: (id) => `/reviews/${id}/`,
    RESPOND: (reviewId) => `/reviews/${reviewId}/respond/`,
  },

  // Wishlist
  WISHLIST: {
    LIST: '/wishlist/',
    TOGGLE: (hotelId) => `/wishlist/toggle/${hotelId}/`,
  },

  // Support Tickets & Customer Chat
  SUPPORT: {
    TICKETS: '/payments/support-tickets/',
    TICKET_DETAIL: (id) => `/payments/support-tickets/${id}/`,
    TICKET_MESSAGES: (id) => `/payments/support-tickets/${id}/messages/`,
    CHAT: (bookingId) => `/payments/chat/${bookingId}/`,
  },

  // Staff Authentication & Profile Management
  STAFF: {
    LOGIN: '/staff/login/',
    ME: '/staff/me/',
    CHANGE_PASSWORD: '/staff/change-password/',
    FORGOT_PASSWORD: '/staff/forgot-password/',
    RESET_PASSWORD: '/staff/reset-password/',
    LOGOUT: '/staff/logout/',
  },

  // Staff Department Operations
  STAFF_OPS: {
    DASHBOARD: '/staff/dashboard/',
    BOOKINGS: '/staff/bookings/',
    BOOKING_DETAIL: (id) => `/staff/bookings/${id}/`,
    REFUNDS: '/staff/refunds/',
    REFUND_DETAIL: (id) => `/staff/refunds/${id}/`,
    PROCESS_REFUND: (id) => `/staff/refunds/${id}/process/`,
    REFUNDS_HISTORY: '/staff/refunds/history/',
    PAYOUTS: '/staff/payouts/',
    PAYOUT_DETAIL: (id) => `/staff/payouts/${id}/`,
    PROCESS_PAYOUT: (id) => `/staff/payouts/${id}/process/`,
    PAYOUTS_HISTORY: '/staff/payouts/history/',
    SUPPORT: '/staff/support/',
    SUPPORT_DETAIL: (id) => `/staff/support/${id}/`,
    UPDATE_SUPPORT: (id) => `/staff/support/${id}/update/`,
    ADD_SUPPORT_NOTE: (id) => `/staff/support/${id}/notes/`,
    VERIFICATIONS: '/staff/verifications/',
    VERIFICATION_DETAIL: (id) => `/staff/verifications/${id}/`,
    APPROVE_VERIFICATION: (id) => `/staff/verifications/${id}/approve/`,
    REJECT_VERIFICATION: (id) => `/staff/verifications/${id}/reject/`,
    NOTIFICATIONS: '/staff/notifications/',
    MARK_NOTIFICATION_READ: (id) => `/staff/notifications/${id}/read/`,
    MARK_ALL_NOTIFICATIONS_READ: '/staff/notifications/read-all/',
  },
};
