/**
 * GoOnStay Centralized Services Barrel
 */

export { default as apiClient, normalizeError } from './apiClient';

// Common Services
export { authService } from './common/authService';
export { profileService } from './common/profileService';
export { notificationService } from './common/notificationService';
export { supportService } from './common/supportService';

// Customer Services
export { hotelService } from './customer/hotelService';
export { roomService } from './customer/roomService';
export { bookingService } from './customer/bookingService';
export { paymentService } from './customer/paymentService';
export { couponService } from './customer/couponService';
export { reviewService } from './customer/reviewService';
export { wishlistService } from './customer/wishlistService';

// Hotel Owner Services
export { ownerDashboardService } from './hotelOwner/ownerDashboardService';
export { ownerHotelService } from './hotelOwner/ownerHotelService';
export { ownerRoomService } from './hotelOwner/ownerRoomService';
export { ownerBookingService } from './hotelOwner/ownerBookingService';
export { ownerEarningService } from './hotelOwner/ownerEarningService';
export { ownerPayoutService } from './hotelOwner/ownerPayoutService';

// Admin Services
export { adminDashboardService } from './admin/adminDashboardService';
export { adminUserService } from './admin/adminUserService';
export { adminHotelService } from './admin/adminHotelService';
export { adminBookingService } from './admin/adminBookingService';
export { adminPaymentService } from './admin/adminPaymentService';
export { adminRefundService } from './admin/adminRefundService';
export { adminCouponService } from './admin/adminCouponService';
export { adminReviewService } from './admin/adminReviewService';
