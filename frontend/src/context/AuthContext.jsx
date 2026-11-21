import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { authService, profileService, staffAuthService } from '../services';
import { parseApiError } from '../utils/errorHandler';
import { parseRegistrationErrors } from '../utils/registrationErrors';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [accessToken, setAccessToken] = useState(() => {
    return localStorage.getItem('accessToken') || null;
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // 1. Initial Profile Verification on boot
  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      if (accessToken) {
        try {
          const profileData = await profileService.getProfile();
          if (isMounted) {
            let finalUser = profileData;
            if (profileData?.role === 'STAFF' || profileData?.is_staff) {
              try {
                const staffMe = await staffAuthService.getMe();
                finalUser = {
                  ...profileData,
                  isStaff: true,
                  department: staffMe.department || staffMe.staff_profile?.department_code,
                  department_name: staffMe.department_name || staffMe.staff_profile?.department_name,
                  department_code: staffMe.department || staffMe.staff_profile?.department_code,
                  portal: staffMe.portal,
                  portal_url: staffMe.portal_url,
                  portal_name: staffMe.portal_name,
                  portal_info: staffMe.portal_info,
                  employee_id: staffMe.staff_profile?.employee_id,
                  login_id: staffMe.staff_profile?.login_id,
                  permissions: staffMe.staff_profile?.permissions || [],
                  must_change_password: staffMe.must_change_password,
                };
              } catch (sErr) {
                console.warn('Staff me lookup error in boot:', sErr);
              }
            }
            setUser(finalUser);
            localStorage.setItem('user', JSON.stringify(finalUser));
          }
        } catch (err) {
          console.warn('Profile fetch check:', err);
          if (isMounted && err?.response?.status === 401) {
            setUser(null);
            setAccessToken(null);
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            sessionStorage.clear();
          }
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    };
    fetchProfile();
    return () => { isMounted = false; };
  }, [accessToken]);

  // 2. Listen for Server Disconnection events triggered by Axios interceptor
  useEffect(() => {
    const handleServerDisconnected = () => {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      sessionStorage.clear();
      showToast('Backend server disconnected. Please log in again once server is running.', 'warning');
    };

    window.addEventListener('auth:server-disconnected', handleServerDisconnected);
    return () => window.removeEventListener('auth:server-disconnected', handleServerDisconnected);
  }, []);


  const login = async (username, password) => {
    let mainErr = null;
    try {
      const data = await authService.login({ username, password });
      const { user: userData, access, refresh, message } = data;
      
      setUser(userData);
      setAccessToken(access);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      sessionStorage.setItem('session_active', 'true');
      
      showToast(message || 'Welcome back!');
      return { success: true, user: userData };
    } catch (err) {
      mainErr = err;
    }

    // Seamless Staff Login fallback (/api/staff/login/)
    try {
      const staffRes = await staffAuthService.login({ identifier: username, password });
      const access = staffRes.access || staffRes.access_token || staffRes.token;
      const refresh = staffRes.refresh || staffRes.refresh_token;
      const rawProfile = staffRes.staff_profile || staffRes.user || staffRes.staff || staffRes.data || staffRes;

      const normalizedStaff = {
        ...rawProfile,
        isStaff: true,
        role: rawProfile.role || 'STAFF',
        employee_id: rawProfile.employee_id || rawProfile.employeeId,
        login_id: rawProfile.login_id || rawProfile.loginId || username,
        department_name: rawProfile.department_name,
        department_code: rawProfile.department_code,
        departments: rawProfile.departments || (rawProfile.department_code ? [rawProfile.department_code] : []),
        permissions: rawProfile.permissions || [],
        must_change_password: !!(staffRes.must_change_password || rawProfile.must_change_password || staffRes.is_temporary_password),
      };

      setUser(normalizedStaff);
      setAccessToken(access);
      localStorage.setItem('user', JSON.stringify(normalizedStaff));
      if (access) localStorage.setItem('accessToken', access);
      if (refresh) localStorage.setItem('refreshToken', refresh);
      sessionStorage.setItem('session_active', 'true');

      showToast(staffRes.message || `Welcome Staff, ${normalizedStaff.full_name || normalizedStaff.username || ''}!`);
      return { success: true, user: normalizedStaff, role: 'STAFF', isStaff: true };
    } catch (staffErr) {
      const parsed = parseApiError(mainErr?.response?.data ? mainErr : staffErr, 'Login failed. Please check credentials.');
      showToast(parsed.message, 'error');
      return {
        success: false,
        error: parsed.message,
        fieldErrors: parsed.fieldErrors,
        isNetworkError: parsed.isNetworkError,
      };
    }
  };

  const register = async (formData) => {
    try {
      const data = await authService.register(formData);
      const { user: userData, access, refresh, message } = data;
      
      setUser(userData);
      setAccessToken(access);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      sessionStorage.setItem('session_active', 'true');
      
      showToast(message || 'Account created successfully!');
      return { success: true, user: userData };
    } catch (err) {
      const parsed = parseRegistrationErrors(err.response?.data || err.message);
      showToast(parsed.primaryMessage, 'error');
      return {
        success: false,
        error: parsed.primaryMessage,
        fieldErrors: parsed.fieldErrors,
        isDuplicateUser: parsed.isDuplicateUser,
        isDuplicateEmail: parsed.isDuplicateEmail,
        isDuplicatePhone: parsed.isDuplicatePhone,
        isDuplicateUsername: parsed.isDuplicateUsername,
        rawErrors: err.response?.data,
      };
    }
  };

  const becomeHost = async (hostPayload) => {
    try {
      let res;
      try {
        // 1. Try dedicated host onboarding endpoint
        res = await api.post('/users/become-host/', hostPayload);
      } catch (err404) {
        if (err404.response?.status === 404) {
          // Fallback to standard registration with HOTEL_OWNER role
          const registerPayload = {
            username: hostPayload.username,
            email: hostPayload.email,
            password: hostPayload.password,
            password_confirm: hostPayload.password,
            first_name: hostPayload.first_name,
            last_name: hostPayload.last_name,
            phone_number: hostPayload.phone_number,
            role: 'HOTEL_OWNER',
          };
          res = await api.post('/users/register/', registerPayload);
        } else {
          throw err404;
        }
      }

      const { user: userData, access, refresh, message } = res.data;

      setUser(userData);
      setAccessToken(access);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      sessionStorage.setItem('session_active', 'true');

      // Attempt to save payout destination if user provided payout info
      if (hostPayload.payout_method) {
        try {
          await api.post('/payments/payout-account/', {
            payout_method: hostPayload.payout_method,
            bank_name: hostPayload.bank_name,
            account_number: hostPayload.account_number,
            ifsc_code: hostPayload.ifsc_code,
            upi_id: hostPayload.upi_id,
            account_holder_name: hostPayload.account_holder_name,
          });
        } catch (payoutErr) {
          console.warn('Payout destination post-registration setup fallback:', payoutErr);
        }
      }

      showToast(message || 'Host account registered successfully!', 'success');
      return { success: true, user: userData, data: res.data };
    } catch (err) {
      const parsed = parseRegistrationErrors(err.response?.data || err.message);
      showToast(parsed.primaryMessage, 'error');
      return {
        success: false,
        error: parsed.primaryMessage,
        fieldErrors: parsed.fieldErrors,
        isDuplicateUser: parsed.isDuplicateUser,
        isDuplicateEmail: parsed.isDuplicateEmail,
        isDuplicatePhone: parsed.isDuplicatePhone,
        isDuplicateUsername: parsed.isDuplicateUsername,
        rawErrors: err.response?.data,
      };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    sessionStorage.clear();
    showToast('Logged out successfully.', 'info');
  };

  const updateProfile = async (data) => {
    try {
      const storedUser = user || JSON.parse(localStorage.getItem('user') || '{}');
      const currentUserEmail = storedUser?.email;

      let payload = data;
      // Only attach fallback email for JSON object submissions if missing
      if (payload && !(payload instanceof FormData) && typeof payload === 'object') {
        if (!payload.email && currentUserEmail) {
          payload = { ...payload, email: currentUserEmail };
        }
      }

      const updatedUser = await profileService.updateProfile(payload);

      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      showToast('Profile updated successfully!');
      return { success: true, user: updatedUser };
    } catch (err) {
      const errorParsed = parseApiError(err, 'Failed to update profile.');
      showToast(errorParsed.message, 'error');
      return {
        success: false,
        error: err,
        fieldErrors: errorParsed.fieldErrors,
        message: errorParsed.message,
      };
    }
  };

  const roleUpper = (user?.role || '').toUpperCase();
  const isCustomer = roleUpper === 'CUSTOMER';
  const isHotelOwner = roleUpper === 'HOTEL_OWNER' || roleUpper === 'HOST' || roleUpper === 'OWNER';
  const isHotelStaff = roleUpper === 'HOTEL_STAFF' || roleUpper === 'STAFF';
  const isAdmin = roleUpper === 'ADMIN' || user?.is_superuser;
  const isSuperAdmin = roleUpper === 'SUPER_ADMIN' || user?.is_superuser;
  const isSupportAgent = roleUpper === 'SUPPORT_AGENT';

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        toast,
        showToast,
        login,
        register,
        becomeHost,
        logout,
        updateProfile,
        isCustomer,
        isHotelOwner,
        isHotelStaff,
        isAdmin,
        isSuperAdmin,
        isSupportAgent,
        staffAuthService,
        changeStaffPassword: staffAuthService.changePassword,
        forgotStaffPassword: staffAuthService.forgotPassword,
        resetStaffPassword: staffAuthService.resetPassword,
        getStaffMe: staffAuthService.getMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
