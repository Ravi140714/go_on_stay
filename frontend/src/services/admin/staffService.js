/**
 * Admin Staff Management Service
 * 
 * Connected to GoOnStay Backend Staff Management APIs:
 * 1. POST  /api/users/login/
 * 2. POST  /api/staff/create/
 * 3. GET   /api/staff/?department=...&status=...&search=...
 * 4. GET   /api/staff/{id}/
 * 5. PATCH /api/staff/{id}/update/
 * 6. PATCH /api/staff/{id}/status/
 * 7. GET   /api/staff/departments/
 * 8. GET   /api/staff/{id}/permissions/
 * 9. PUT   /api/staff/{id}/permissions/update/
 * 10. POST /api/staff/{id}/reset-password/
 * 11. GET  /api/staff/activities/?employee_id=...&action=...
 */

import apiClient from '../apiClient';

export const adminStaffService = {
  adminLogin: async ({ email, username, password }) => {
    const payload = {
      email: email || username,
      username: username || email,
      password,
    };
    const response = await apiClient.post('/users/login/', payload);
    return response.data;
  },

  createStaff: async (staffData) => {
    const payload = {
      first_name: staffData.first_name,
      last_name: staffData.last_name,
      email: staffData.email,
      phone_number: staffData.phone_number || staffData.phone,
      department: staffData.department || (staffData.departments && staffData.departments[0]) || 'RESERVATION',
      designation: staffData.designation || 'Staff Officer',
      permissions: staffData.permissions || ['VIEW_BOOKINGS'],
    };
    const response = await apiClient.post('/staff/create/', payload);
    return response.data;
  },

  getStaffList: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.department && params.department !== 'ALL') {
      query.append('department', params.department);
    }
    if (params.status && params.status !== 'ALL') {
      query.append('status', params.status);
    }
    if (params.search && params.search.trim()) {
      query.append('search', params.search.trim());
    }
    if (params.page) {
      query.append('page', params.page);
    }

    const queryString = query.toString();
    const url = queryString ? `/staff/?${queryString}` : '/staff/';
    const response = await apiClient.get(url);
    return response.data;
  },

  getStaffDetail: async (staffId) => {
    const response = await apiClient.get(`/staff/${staffId}/`);
    return response.data;
  },

  updateStaff: async (staffId, updateData) => {
    const response = await apiClient.patch(`/staff/${staffId}/update/`, updateData);
    return response.data;
  },

  updateStaffStatus: async (staffId, { status, reason = '' }) => {
    const response = await apiClient.patch(`/staff/${staffId}/status/`, {
      status,
      reason: reason || `Status updated to ${status} by admin`,
    });
    return response.data;
  },

  getDepartments: async () => {
    const response = await apiClient.get('/staff/departments/');
    return response.data;
  },

  getStaffPermissions: async (staffId) => {
    const response = await apiClient.get(`/staff/${staffId}/permissions/`);
    return response.data;
  },

  updateStaffPermissions: async (staffId, permissions) => {
    const payload = Array.isArray(permissions) ? { permissions } : permissions;
    const response = await apiClient.put(`/staff/${staffId}/permissions/update/`, payload);
    return response.data;
  },

  resetStaffPassword: async (staffId) => {
    const response = await apiClient.post(`/staff/${staffId}/reset-password/`);
    return response.data;
  },

  getStaffActivities: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.employee_id) query.append('employee_id', params.employee_id);
    if (params.action) query.append('action', params.action);
    if (params.page) query.append('page', params.page);

    const queryString = query.toString();
    const url = queryString ? `/staff/activities/?${queryString}` : '/staff/activities/';
    const response = await apiClient.get(url);
    return response.data;
  },

  deleteStaff: async (staffId, userId) => {
    const targetUserId = userId || staffId;
    try {
      const response = await apiClient.delete(`/users/${targetUserId}/delete/`);
      return response.data;
    } catch (err) {
      if (err.response?.status === 404 && staffId) {
        const res2 = await apiClient.delete(`/staff/${staffId}/`);
        return res2.data;
      }
      throw err;
    }
  },
};

export default adminStaffService;
