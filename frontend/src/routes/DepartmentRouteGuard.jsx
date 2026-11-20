/**
 * Department-Specific Route Guard
 * 
 * Enforces strict department-level isolation:
 * 1. Validates authenticated user role (STAFF, HOTEL_STAFF, ADMIN).
 * 2. Compares the user's authoritative backend department against target department.
 * 3. If an unauthorized department route is accessed, halts rendering immediately and
 *    redirects to the user's assigned portal URL.
 * 4. Never displays another department's UI even transiently during loading states.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStaffDepartment } from '../context/StaffDepartmentContext';
import { normalizeDepartment, getDepartmentConfig } from '../config/staffDepartments';

export const DepartmentRouteGuard = ({ targetDepartment, children }) => {
  const { user, loading: authLoading } = useAuth();
  const {
    department,
    departmentConfig,
    loading: deptLoading,
    isAuthorizedForDepartment,
  } = useStaffDepartment();
  const location = useLocation();

  // 1. Transient loading check - prevent any leakage
  if (authLoading || deptLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white select-none">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold tracking-wide text-slate-300">Verifying Department Credentials...</p>
        <p className="text-xs text-slate-500 mt-1">Securing operational workstation</p>
      </div>
    );
  }

  // 2. Not logged in -> redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Admin / Super Admin bypass (Admin maintains global unrestricted view)
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.is_superuser) {
    return children;
  }

  // 4. Strict Department Authorization Check
  const normalizedTarget = normalizeDepartment(targetDepartment);
  const isAuthorized = isAuthorizedForDepartment(normalizedTarget);

  if (!isAuthorized) {
    // Determine the staff member's legitimate portal destination
    const userPortalPath = departmentConfig?.portalPath || '/staff/dashboard';

    console.warn(
      `[SECURITY] Unauthorized cross-department access attempt blocked. User Department: "${department}", Target: "${normalizedTarget}". Redirecting to "${userPortalPath}".`
    );

    // Hard redirect to the staff member's own authorized dashboard
    return <Navigate to={userPortalPath} replace />;
  }

  // 5. Authorized -> Render the department portal
  return children;
};

export default DepartmentRouteGuard;
