/**
 * Hotel Owner Route Guard
 * 
 * Ensures the user has HOTEL_OWNER role or superuser/admin access.
 */

import React from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import { ROLES } from '../config/roleConfig';

export const OwnerRoute = ({ children }) => {
  return (
    <ProtectedRoute allowedRoles={[ROLES.HOTEL_OWNER, ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
      {children}
    </ProtectedRoute>
  );
};

export default OwnerRoute;
