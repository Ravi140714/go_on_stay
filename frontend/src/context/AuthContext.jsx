import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken') || null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (accessToken) {
        try {
          const res = await api.get('/users/profile/');
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        } catch (err) {
          console.error('Failed to load user profile:', err);
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [accessToken]);

  const login = async (username, password) => {
    try {
      const res = await api.post('/users/login/', { username, password });
      const { user: userData, access, refresh, message } = res.data;
      
      setUser(userData);
      setAccessToken(access);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      
      showToast(message || 'Welcome back!');
      return { success: true, user: userData };
    } catch (err) {
      const errMsg = err.response?.data?.error || (err.response ? 'Login failed. Please check credentials.' : 'Cannot connect to backend server. Make sure Django is running.');
      showToast(errMsg, 'error');
      return { success: false, error: errMsg };
    }
  };

  const register = async (formData) => {
    try {
      const res = await api.post('/users/register/', formData);
      const { user: userData, access, refresh, message } = res.data;
      
      setUser(userData);
      setAccessToken(access);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      
      showToast(message || 'Account created successfully!');
      return { success: true, user: userData };
    } catch (err) {
      let errMsg = 'Registration failed.';
      if (err.response?.data) {
        const errors = err.response.data;
        if (typeof errors === 'string') {
          errMsg = errors;
        } else if (typeof errors === 'object' && errors !== null) {
          const keys = Object.keys(errors);
          if (keys.length > 0) {
            const val = errors[keys[0]];
            if (Array.isArray(val)) {
              const firstVal = val[0];
              errMsg = `${keys[0]}: ${typeof firstVal === 'object' ? JSON.stringify(firstVal) : firstVal}`;
            } else if (typeof val === 'object' && val !== null) {
              errMsg = `${keys[0]}: ${JSON.stringify(val)}`;
            } else {
              errMsg = `${keys[0]}: ${val}`;
            }
          }
        }
      }
      showToast(errMsg, 'error');
      return { success: false, error: errMsg };
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
      let errMsg = 'Failed to register as host.';
      if (err.response?.data) {
        const errors = err.response.data;
        if (typeof errors === 'string') {
          if (errors.includes('<html') || errors.includes('<!DOCTYPE')) {
            errMsg = `Backend endpoint error (${err.response?.status || 500}): Route not found in Django URLs.`;
          } else {
            errMsg = errors;
          }
        } else if (errors.error) {
          errMsg = errors.error;
        } else if (errors.detail) {
          errMsg = errors.detail;
        } else if (typeof errors === 'object' && errors !== null) {
          const keys = Object.keys(errors);
          if (keys.length > 0) {
            const val = errors[keys[0]];
            if (Array.isArray(val)) {
              errMsg = `${keys[0]}: ${typeof val[0] === 'object' ? JSON.stringify(val[0]) : val[0]}`;
            } else if (typeof val === 'object' && val !== null) {
              errMsg = `${keys[0]}: ${JSON.stringify(val)}`;
            } else {
              errMsg = `${keys[0]}: ${val}`;
            }
          }
        }
      }
      showToast(errMsg, 'error');
      return { success: false, error: errMsg };
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    showToast('Logged out successfully.', 'info');
  };

  const updateProfile = async (data) => {
    try {
      const res = await api.put('/users/profile/', data, {
        headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
      });
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      showToast('Profile updated successfully!');
      return { success: true, user: res.data };
    } catch (err) {
      showToast('Failed to update profile.', 'error');
      return { success: false, error: err };
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
