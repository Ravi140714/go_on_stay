/**
 * Staff Dashboard Dispatcher
 * 
 * Dynamically resolves the authenticated Staff member's assigned department
 * from the authoritative backend profile and renders ONLY their assigned workspace.
 * Prevents flashing or loading unauthorized modules.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStaffDepartment } from '../../context/StaffDepartmentContext';
import { STAFF_DEPARTMENTS, normalizeDepartment } from '../../config/staffDepartments';

// Department Portals
import ReservationPortal from './departments/ReservationPortal';
import CustomerSupportPortal from './departments/CustomerSupportPortal';
import RefundsClaimsPortal from './departments/RefundsClaimsPortal';
import PayoutsEscrowPortal from './departments/PayoutsEscrowPortal';
import HotelVerificationPortal from './departments/HotelVerificationPortal';

export const StaffDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { department, loading: deptLoading, error } = useStaffDepartment();

  // 1. Loading screen - strictly prevents any data leakage
  if (authLoading || deptLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white select-none">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold tracking-wide text-slate-300">Resolving Assigned Staff Portal...</p>
        <p className="text-xs text-slate-500 mt-1">Connecting to authenticated department workspace</p>
      </div>
    );
  }

  // 2. Not authenticated -> Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Admin / Super Admin Default to Reservation or Hotel Verification
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.is_superuser) {
    return <ReservationPortal />;
  }

  // 4. Resolve Canonical Department
  const canonicalDept = normalizeDepartment(department);

  switch (canonicalDept) {
    case STAFF_DEPARTMENTS.RESERVATION:
      return <ReservationPortal />;

    case STAFF_DEPARTMENTS.CUSTOMER_SUPPORT:
      return <CustomerSupportPortal />;

    case STAFF_DEPARTMENTS.REFUNDS_AND_CLAIMS:
      return <RefundsClaimsPortal />;

    case STAFF_DEPARTMENTS.PAYOUT_AND_ESCROW:
      return <PayoutsEscrowPortal />;

    case STAFF_DEPARTMENTS.HOTEL_VERIFICATION:
      return <HotelVerificationPortal />;

    default:
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto font-black text-xl">
              ⚠️
            </div>
            <h2 className="text-lg font-black text-slate-900">Pending Department Assignment</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your staff account is authenticated, but the Administrator has not yet assigned an operational department to your profile.
            </p>
            <div className="text-[11px] font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-700">
              Employee ID: {user.employee_id || 'Pending'} • Account: {user.username}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Check Again
            </button>
          </div>
        </div>
      );
  }
};

export default StaffDashboard;
