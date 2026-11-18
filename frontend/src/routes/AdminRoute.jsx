/**
 * Admin Route Guard
 * 
 * Ensures the user has ADMIN or SUPER_ADMIN privileges.
 */

import React from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import { ROLES } from '../config/roleConfig';

export const AdminRoute = ({ children }) => {
  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
      {children}
    </ProtectedRoute>
  );
};

export default AdminRoute;
