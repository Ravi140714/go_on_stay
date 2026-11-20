/**
 * Centralized Staff Departments & Navigation Configuration
 * 
 * Defines the 5 strict staff departments, their authoritative codes,
 * route paths, portal titles, and navigation items.
 */

import {
  CalendarCheck,
  MessageSquare,
  RotateCcw,
  Landmark,
  Building2,
  Users,
  FileCheck,
  CreditCard,
  LifeBuoy
} from 'lucide-react';

export const STAFF_DEPARTMENTS = {
  RESERVATION: 'RESERVATION',
  CUSTOMER_SUPPORT: 'CUSTOMER_SUPPORT',
  REFUNDS_AND_CLAIMS: 'REFUNDS_AND_CLAIMS',
  PAYOUT_AND_ESCROW: 'PAYOUT_AND_ESCROW',
  HOTEL_VERIFICATION: 'HOTEL_VERIFICATION',
};

// Map backend alias codes to canonical department enum
export const DEPARTMENT_ALIASES = {
  RESERVATION: STAFF_DEPARTMENTS.RESERVATION,
  CUSTOMER_SUPPORT: STAFF_DEPARTMENTS.CUSTOMER_SUPPORT,
  REFUND: STAFF_DEPARTMENTS.REFUNDS_AND_CLAIMS,
  REFUNDS_AND_CLAIMS: STAFF_DEPARTMENTS.REFUNDS_AND_CLAIMS,
  PAYOUT: STAFF_DEPARTMENTS.PAYOUT_AND_ESCROW,
  PAYOUT_AND_ESCROW: STAFF_DEPARTMENTS.PAYOUT_AND_ESCROW,
  HOTEL_VERIFICATION: STAFF_DEPARTMENTS.HOTEL_VERIFICATION,
};

export const normalizeDepartment = (dept) => {
  if (!dept) return null;
  const upper = String(dept).toUpperCase().trim();
  return DEPARTMENT_ALIASES[upper] || upper;
};

export const DEPARTMENT_CONFIGS = {
  [STAFF_DEPARTMENTS.RESERVATION]: {
    code: STAFF_DEPARTMENTS.RESERVATION,
    name: 'Reservation',
    portalName: 'Reservation Portal',
    portalPath: '/staff/reservation',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    accentColor: '#0284c7', // Sky-600
    icon: CalendarCheck,
    description: 'Guest bookings, stay reservations, check-in & check-out coordination.',
    allowedRoles: ['STAFF', 'HOTEL_STAFF', 'ADMIN', 'SUPER_ADMIN'],
    navItems: [
      { id: 'overview', label: 'Reservation Overview', icon: CalendarCheck },
      { id: 'bookings', label: 'All Reservations', icon: FileCheck },
      { id: 'arrivals', label: 'Today\'s Check-ins', filter: 'CHECK_IN' },
      { id: 'departures', label: 'Today\'s Check-outs', filter: 'CHECK_OUT' },
    ],
  },

  [STAFF_DEPARTMENTS.CUSTOMER_SUPPORT]: {
    code: STAFF_DEPARTMENTS.CUSTOMER_SUPPORT,
    name: 'Customer Support',
    portalName: 'Customer Support Portal',
    portalPath: '/staff/support',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    accentColor: '#9333ea', // Purple-600
    icon: MessageSquare,
    description: 'Guest tickets, complaints, inquiries resolution, and internal coordination.',
    allowedRoles: ['STAFF', 'HOTEL_STAFF', 'ADMIN', 'SUPER_ADMIN'],
    navItems: [
      { id: 'overview', label: 'Support Overview', icon: MessageSquare },
      { id: 'open_tickets', label: 'Open Tickets', filter: 'OPEN' },
      { id: 'in_progress', label: 'In Progress', filter: 'IN_PROGRESS' },
      { id: 'resolved', label: 'Resolved Tickets', filter: 'RESOLVED' },
    ],
  },

  [STAFF_DEPARTMENTS.REFUNDS_AND_CLAIMS]: {
    code: STAFF_DEPARTMENTS.REFUNDS_AND_CLAIMS,
    name: 'Refunds & Claims',
    portalName: 'Refunds & Claims Portal',
    portalPath: '/staff/refunds',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    accentColor: '#e11d48', // Rose-600
    icon: RotateCcw,
    description: 'Guest cancellation refunds audit and Razorpay disbursement execution.',
    allowedRoles: ['STAFF', 'HOTEL_STAFF', 'ADMIN', 'SUPER_ADMIN'],
    navItems: [
      { id: 'overview', label: 'Refunds Overview', icon: RotateCcw },
      { id: 'pending', label: 'Pending Refunds', filter: 'PENDING' },
      { id: 'history', label: 'Refund History', filter: 'HISTORY' },
    ],
  },

  [STAFF_DEPARTMENTS.PAYOUT_AND_ESCROW]: {
    code: STAFF_DEPARTMENTS.PAYOUT_AND_ESCROW,
    name: 'Payout & Escrow',
    portalName: 'Payout & Escrow Portal',
    portalPath: '/staff/payouts',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    accentColor: '#059669', // Emerald-600
    icon: Landmark,
    description: 'Host escrow disbursements, mature holding rules, and NEFT/bank settlement payouts.',
    allowedRoles: ['STAFF', 'HOTEL_STAFF', 'ADMIN', 'SUPER_ADMIN'],
    navItems: [
      { id: 'overview', label: 'Escrow Overview', icon: Landmark },
      { id: 'pending', label: 'Pending Disbursements', filter: 'PENDING' },
      { id: 'history', label: 'Disbursement History', filter: 'HISTORY' },
    ],
  },

  [STAFF_DEPARTMENTS.HOTEL_VERIFICATION]: {
    code: STAFF_DEPARTMENTS.HOTEL_VERIFICATION,
    name: 'Hotel Verification',
    portalName: 'Hotel Verification Portal',
    portalPath: '/staff/verification',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    accentColor: '#d97706', // Amber-600
    icon: Building2,
    description: 'Property compliance documents, trade licenses audit, and onboarding approvals.',
    allowedRoles: ['STAFF', 'HOTEL_STAFF', 'ADMIN', 'SUPER_ADMIN'],
    navItems: [
      { id: 'overview', label: 'Compliance Overview', icon: Building2 },
      { id: 'submitted', label: 'Pending Audits', filter: 'SUBMITTED' },
      { id: 'approved', label: 'Approved Properties', filter: 'APPROVED' },
      { id: 'rejected', label: 'Rejected Properties', filter: 'REJECTED' },
    ],
  },
};

export const getDepartmentConfig = (dept) => {
  const normalized = normalizeDepartment(dept);
  return DEPARTMENT_CONFIGS[normalized] || null;
};
