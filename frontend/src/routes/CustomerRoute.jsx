/**
 * Customer Route Guard
 * 
 * Ensures the authenticated user has CUSTOMER role (or admin bypass).
 */

import React from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import { ROLES } from '../config/roleConfig';

export const CustomerRoute = ({ children }) => {
  return (
    <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
      {children}
    </ProtectedRoute>
  );
};

export default CustomerRoute;
