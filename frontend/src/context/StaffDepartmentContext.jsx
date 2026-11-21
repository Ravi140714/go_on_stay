/**
 * Staff Department Authorization Context
 * 
 * Strict single-source-of-truth authorization context for staff department portals.
 * - Always fetches and validates the current authenticated Staff profile directly from /api/staff/me/
 * - Prevents reliance on localStorage or URL tampering
 * - Provides department-based authorization checks and route protection
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { staffAuthService } from '../services';
import { normalizeDepartment, getDepartmentConfig, STAFF_DEPARTMENTS } from '../config/staffDepartments';

const StaffDepartmentContext = createContext(null);

export const StaffDepartmentProvider = ({ children }) => {
  const { user, accessToken, logout } = useAuth();
  const navigate = useNavigate();

  const [departmentProfile, setDepartmentProfile] = useState(null);
  const [department, setDepartment] = useState(null);
  const [departmentConfig, setDepartmentConfig] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStaffProfile = useCallback(async () => {
    // If not authenticated, do nothing
    if (!accessToken || !user) {
      setLoading(false);
      return;
    }

    // If user is Admin or Super Admin, they have universal access to all portals
    if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.is_superuser) {
      setLoading(false);
      return;
    }

    // STRICT CHECK: Only genuine staff members should ever call /api/staff/me/
    // Customers, Guests, and Hotel Owners must NEVER call /api/staff/me/
    const isStaff = user?.role === 'STAFF' || user?.is_staff || user?.isStaff;
    if (!isStaff) {
      setLoading(false);
      setDepartmentProfile(null);
      setDepartment(null);
      setPermissions([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await staffAuthService.getMe();
      if (response && (response.department || response.staff_profile)) {
        const rawDept = response.department || response.staff_profile?.department_code;
        const canonicalDept = normalizeDepartment(rawDept);
        const config = getDepartmentConfig(canonicalDept);

        setDepartment(canonicalDept);
        setDepartmentConfig(config);
        setDepartmentProfile(response.staff_profile || response);
        setPermissions(response.staff_profile?.permissions || []);
      } else {
        throw new Error('No department assigned to this staff account.');
      }
    } catch (err) {
      console.warn('Failed to validate staff profile from /api/staff/me/:', err?.response?.data || err?.message);
      setError(err.response?.data?.message || err.message || 'Unauthorized staff access.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, user]);

  useEffect(() => {
    fetchStaffProfile();
  }, [fetchStaffProfile]);

  /**
   * Check if current user is authorized for a given department
   * Admin has universal access; staff is restricted strictly to their assigned department.
   */
  const isAuthorizedForDepartment = useCallback((targetDept) => {
    if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.is_superuser) {
      return true;
    }
    const normalizedTarget = normalizeDepartment(targetDept);
    return department && department === normalizedTarget;
  }, [user, department]);

  /**
   * Check if staff has specific permission code
   */
  const hasPermission = useCallback((permCode) => {
    if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.is_superuser) {
      return true;
    }
    if (!permissions || permissions.length === 0) return false;
    return permissions.some(p => (p.code || p) === permCode);
  }, [user, permissions]);

  const value = {
    department,
    departmentConfig,
    departmentProfile,
    permissions,
    loading,
    error,
    isAuthorizedForDepartment,
    hasPermission,
    refreshProfile: fetchStaffProfile,
  };

  return (
    <StaffDepartmentContext.Provider value={value}>
      {children}
    </StaffDepartmentContext.Provider>
  );
};

export const useStaffDepartment = () => {
  const context = useContext(StaffDepartmentContext);
  if (!context) {
    throw new Error('useStaffDepartment must be used within a StaffDepartmentProvider');
  }
  return context;
};

export default StaffDepartmentContext;
