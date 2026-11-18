/**
 * GoOnStay Role Configuration & Access Control
 * 
 * Standardizes user roles, permissions checking, and default redirects.
 */

export const ROLES = {
  CUSTOMER: 'CUSTOMER',
  HOTEL_OWNER: 'HOTEL_OWNER',
  HOTEL_STAFF: 'HOTEL_STAFF',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  SUPPORT_AGENT: 'SUPPORT_AGENT',
};

// Aliases accepted by backend / legacy code
const OWNER_ROLES = ['HOTEL_OWNER', 'OWNER', 'HOST'];
const STAFF_ROLES = ['HOTEL_STAFF', 'STAFF'];
const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];

export const hasRole = (user, allowedRoles = []) => {
  if (!user) return false;
  if (user.is_superuser) return true; // Superuser has all access
  const userRole = (user.role || '').toUpperCase();
  return allowedRoles.some((role) => {
    const r = role.toUpperCase();
    if (r === 'HOTEL_OWNER') return OWNER_ROLES.includes(userRole);
    if (r === 'HOTEL_STAFF') return STAFF_ROLES.includes(userRole);
    if (r === 'ADMIN') return ADMIN_ROLES.includes(userRole);
    return userRole === r;
  });
};

export const getDefaultDashboardRoute = (user) => {
  if (!user) return '/login';
  const role = (user.role || '').toUpperCase();
  if (user.is_superuser || ADMIN_ROLES.includes(role)) {
    return '/admin/dashboard';
  }
  if (OWNER_ROLES.includes(role)) {
    return '/owner/dashboard';
  }
  if (STAFF_ROLES.includes(role)) {
    return '/staff/dashboard';
  }
  return '/';
};
