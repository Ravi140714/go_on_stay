/**
 * Staff Route Guard
 * 
 * Ensures the user has HOTEL_STAFF, HOTEL_OWNER, or ADMIN privileges.
 */

import React from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import { ROLES } from '../config/roleConfig';

export const StaffRoute = ({ children }) => {
  return (
    <ProtectedRoute allowedRoles={[ROLES.HOTEL_STAFF, 'STAFF', ROLES.HOTEL_OWNER, ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
      {children}
    </ProtectedRoute>
  );
};

export default StaffRoute;
