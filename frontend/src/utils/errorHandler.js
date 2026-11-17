/**
 * GoOnStay Comprehensive Error Handling & Validation Utility
 *
 * Normalizes all backend API errors (HTTP 400, 401, 403, 404, 409, 422, 429, 500)
 * and network failures into user-friendly copy and field-level error mappings.
 */

import { useState, useCallback } from 'react';

// Extract clean string from any nested error structure
const extractString = (val) => {
  if (!val && val !== 0) return '';
  if (Array.isArray(val)) {
    return val
      .map((item) => (typeof item === 'object' ? extractString(item) : String(item)))
      .filter(Boolean)
      .join(' ');
  }
  if (typeof val === 'object' && val !== null) {
    if (val.message) return extractString(val.message);
    if (val.error) return extractString(val.error);
    if (val.detail) return extractString(val.detail);
    const keys = Object.keys(val);
    if (keys.length > 0) return extractString(val[keys[0]]);
    return JSON.stringify(val);
  }
  return String(val);
};

// Remove raw technical tags and HTML error pages
const sanitizeMessage = (msg) => {
  if (!msg || typeof msg !== 'string') return '';
  if (msg.includes('<html') || msg.includes('<!DOCTYPE') || msg.includes('<body')) {
    return 'Our server experienced an internal error. Please try again later.';
  }
  // Remove technical python/django prefixes like "ValidationError: ", "['...']"
  return msg.replace(/^ValidationError:\s*/i, '').replace(/^\[['"]|['"]\]$/g, '').trim();
};

/**
 * Universal API Error Parser
 * @param {any} err - Axios error, native Error, or response data
 * @param {string} fallbackMsg - Optional default message
 * @returns {object} { message, fieldErrors, status, isNetworkError, isAuthError, isDuplicate, raw }
 */
export const parseApiError = (err, fallbackMsg = 'An unexpected error occurred. Please try again.') => {
  if (!err) {
    return {
      message: fallbackMsg,
      fieldErrors: {},
      status: 0,
      isNetworkError: false,
      isAuthError: false,
      isDuplicate: false,
      raw: null,
    };
  }

  // 1. Detect Network Error / Server unreachable
  const isNetwork =
    err.code === 'ERR_NETWORK' ||
    err.code === 'ECONNABORTED' ||
    err.message?.includes('Network Error') ||
    err.message?.includes('Failed to fetch') ||
    (!err.response && !!err.request);

  if (isNetwork) {
    return {
      message: 'Unable to connect to the server. Please check your internet connection.',
      fieldErrors: {},
      status: 0,
      isNetworkError: true,
      isAuthError: false,
      isDuplicate: false,
      raw: err,
    };
  }

  const response = err.response;
  const status = response?.status || 0;
  const data = response ? response.data : (typeof err === 'object' && !err.message ? err : null);

  // 2. HTTP 401 Unauthorized / Authentication expired
  if (status === 401) {
    const rawDetail = extractString(data?.detail || data?.error || data);
    let authMsg = 'Session expired or invalid credentials. Please log in again.';
    if (/no\s*active\s*account|invalid\s*credentials|incorrect\s*password|credentials\s*do\s*not\s*match/i.test(rawDetail)) {
      authMsg = 'Incorrect username or password. Please try again.';
    }
    return {
      message: authMsg,
      fieldErrors: {
        username: authMsg,
        password: authMsg,
      },
      status,
      isNetworkError: false,
      isAuthError: true,
      isDuplicate: false,
      raw: data,
    };
  }

  // 3. HTTP 403 Forbidden
  if (status === 403) {
    const permDetail = extractString(data?.detail || data?.error || 'You are not authorized to access this page.');
    return {
      message: permDetail || 'You are not authorized to access this page.',
      fieldErrors: {},
      status,
      isNetworkError: false,
      isAuthError: true,
      isDuplicate: false,
      raw: data,
    };
  }

  // 4. HTTP 404 Not Found
  if (status === 404) {
    const notFoundMsg = extractString(data?.detail || data?.error || 'The requested resource was not found.');
    return {
      message: notFoundMsg || 'The requested resource was not found.',
      fieldErrors: {},
      status,
      isNetworkError: false,
      isAuthError: false,
      isDuplicate: false,
      raw: data,
    };
  }

  // 5. HTTP 429 Rate limit
  if (status === 429) {
    return {
      message: 'Too many requests. Please wait a moment and try again.',
      fieldErrors: {},
      status,
      isNetworkError: false,
      isAuthError: false,
      isDuplicate: false,
      raw: data,
    };
  }

  // 6. HTTP 500+ Internal Server Error
  if (status >= 500) {
    const serverErrStr = extractString(data?.error || data?.detail || '');
    // Check for specific backend errors like OTP sending failed
    let serverMsg = 'Our servers are experiencing technical issues. Please try again in a few moments.';
    if (/otp|email.*delivery|smtp/i.test(serverErrStr)) {
      serverMsg = 'Failed to deliver OTP email to your inbox. Please check your internet connection or email address and try again.';
    }
    return {
      message: serverMsg,
      fieldErrors: {},
      status,
      isNetworkError: false,
      isAuthError: false,
      isDuplicate: false,
      raw: data,
    };
  }

  // 7. Parse Data Container (Handles 400 Bad Request, 409 Conflict, 422 Unprocessable Entity)
  let rawErrors = {};
  if (data && typeof data === 'object') {
    if (data.error && typeof data.error === 'object' && data.error.details) {
      rawErrors = data.error.details;
    } else if (data.details && typeof data.details === 'object') {
      rawErrors = data.details;
    } else if (data.error && typeof data.error === 'object') {
      rawErrors = data.error;
    } else {
      rawErrors = data;
    }
  } else if (typeof data === 'string') {
    rawErrors = { general: sanitizeMessage(data) };
  } else if (err.message) {
    rawErrors = { general: sanitizeMessage(err.message) };
  }

  const fieldErrors = {};
  let isDuplicate = false;

  // Process all keys into fieldErrors
  Object.keys(rawErrors).forEach((key) => {
    const rawVal = rawErrors[key];
    const cleanMsg = sanitizeMessage(extractString(rawVal));
    if (!cleanMsg) return;

    const lowerKey = key.toLowerCase();
    const lowerVal = cleanMsg.toLowerCase();

    // Duplicate email
    if (lowerKey === 'email' || (lowerVal.includes('email') && (lowerVal.includes('already exists') || lowerVal.includes('already registered')))) {
      fieldErrors.email = 'This email is already registered.';
      isDuplicate = true;
      return;
    }

    // Duplicate username
    if (lowerKey === 'username' || (lowerVal.includes('username') && (lowerVal.includes('already exists') || lowerVal.includes('already taken')))) {
      fieldErrors.username = 'This username is already taken.';
      isDuplicate = true;
      return;
    }

    // Duplicate phone number
    if (lowerKey === 'phone_number' || lowerKey === 'phone' || lowerKey === 'mobile' || (lowerVal.includes('mobile') && lowerVal.includes('already registered'))) {
      fieldErrors.phone_number = 'This mobile number is already registered.';
      fieldErrors.phone = 'This mobile number is already registered.';
      isDuplicate = true;
      return;
    }

    // Invalid UPI ID
    if (lowerKey.includes('upi') || lowerVal.includes('upi')) {
      if (lowerVal.includes('invalid') || lowerVal.includes('format') || lowerVal.includes('enter a valid')) {
        fieldErrors.upi_id = 'Invalid UPI ID. Please enter a valid UPI ID.';
        fieldErrors[key] = 'Invalid UPI ID. Please enter a valid UPI ID.';
        return;
      }
    }

    // Password validation errors
    if (lowerKey === 'password' || lowerKey === 'new_password') {
      if (lowerVal.includes('incorrect') || lowerVal.includes('wrong') || lowerVal.includes('does not match old')) {
        fieldErrors[key] = 'Incorrect password. Please try again.';
      } else {
        // Weak password / policy message from backend
        fieldErrors[key] = cleanMsg;
      }
      return;
    }

    // OTP validation errors
    if (lowerKey.includes('otp') || lowerVal.includes('otp')) {
      if (lowerVal.includes('expired')) {
        fieldErrors.otp = 'OTP has expired. Please request a new OTP.';
        fieldErrors[key] = 'OTP has expired. Please request a new OTP.';
      } else {
        fieldErrors.otp = 'Invalid OTP. Please enter the correct code.';
        fieldErrors[key] = 'Invalid OTP. Please enter the correct code.';
      }
      return;
    }

    // Room Availability & Capacity
    if (lowerKey.includes('room') || lowerKey.includes('availability') || lowerVal.includes('availability') || lowerVal.includes('already booked')) {
      fieldErrors.room = 'This room is no longer available for the selected dates.';
      fieldErrors[key] = 'This room is no longer available for the selected dates.';
      return;
    }

    // Date Validation
    if (lowerKey.includes('date') || lowerKey === 'check_in' || lowerKey === 'check_out') {
      if (lowerVal.includes('after') || lowerVal.includes('greater') || lowerVal.includes('check_out')) {
        fieldErrors.check_out = 'Check-out date must be after check-in date.';
      } else if (lowerVal.includes('past') || lowerVal.includes('before today')) {
        fieldErrors.check_in = 'Check-in date cannot be in the past.';
      } else {
        fieldErrors[key] = cleanMsg;
      }
      return;
    }

    // Payment failure
    if (lowerKey.includes('payment') || lowerKey.includes('razorpay') || lowerVal.includes('payment')) {
      fieldErrors[key] = cleanMsg || 'Payment could not be processed. Please try again.';
      return;
    }

    // Default field error mapping
    fieldErrors[key] = cleanMsg;
  });

  // Determine top priority message for Toast notification
  let primaryMessage = '';
  if (fieldErrors.email && isDuplicate) {
    primaryMessage = fieldErrors.email;
  } else if (fieldErrors.username && isDuplicate) {
    primaryMessage = fieldErrors.username;
  } else if (fieldErrors.phone_number && isDuplicate) {
    primaryMessage = fieldErrors.phone_number;
  } else if (fieldErrors.upi_id) {
    primaryMessage = fieldErrors.upi_id;
  } else if (fieldErrors.otp) {
    primaryMessage = fieldErrors.otp;
  } else if (fieldErrors.room) {
    primaryMessage = fieldErrors.room;
  } else if (fieldErrors.check_out) {
    primaryMessage = fieldErrors.check_out;
  } else if (fieldErrors.password) {
    primaryMessage = fieldErrors.password;
  } else if (data?.error && typeof data.error === 'string') {
    primaryMessage = sanitizeMessage(data.error);
  } else if (data?.detail && typeof data.detail === 'string') {
    primaryMessage = sanitizeMessage(data.detail);
  } else if (data?.message && typeof data.message === 'string') {
    primaryMessage = sanitizeMessage(data.message);
  } else if (Object.keys(fieldErrors).length > 0) {
    primaryMessage = Object.values(fieldErrors)[0];
  } else {
    primaryMessage = fallbackMsg;
  }

  return {
    message: primaryMessage,
    fieldErrors,
    status,
    isNetworkError: false,
    isAuthError: false,
    isDuplicate,
    raw: data,
  };
};

/**
 * Client-Side Input Validator Helper
 */
export const validateClientField = (name, value, rules = {}) => {
  const strVal = String(value || '').trim();

  // 1. Required check
  if (rules.required && !strVal) {
    return `${rules.label || name} is required.`;
  }

  if (!strVal) return ''; // Empty optional field is valid

  // 2. Email format
  if (rules.email || name === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(strVal)) {
      return 'Please enter a valid email address.';
    }
  }

  // 3. Mobile / Phone number
  if (rules.phone || name === 'phone' || name === 'phone_number') {
    const cleanDigits = strVal.replace(/\D/g, '');
    const requiredLength = rules.digits || 10;
    if (cleanDigits.length !== requiredLength) {
      return `Please enter a valid ${requiredLength}-digit mobile number.`;
    }
  }

  // 4. UPI ID validation
  if (rules.upi || name === 'upi_id' || name.includes('upi')) {
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    if (!upiRegex.test(strVal)) {
      return 'Invalid UPI ID. Please enter a valid UPI ID (e.g. name@okhdfcbank or 9876543210@upi).';
    }
  }

  // 5. IFSC Code validation
  if (rules.ifsc || name === 'ifsc_code') {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(strVal.toUpperCase())) {
      return 'Invalid IFSC Code. Must be 11 characters (e.g. SBIN0001234).';
    }
  }

  // 6. Minimum Length
  if (rules.minLength && strVal.length < rules.minLength) {
    return `${rules.label || name} must be at least ${rules.minLength} characters.`;
  }

  // 7. Numeric & Positive check
  if (rules.positiveNumber) {
    const num = parseFloat(strVal);
    if (isNaN(num) || num <= 0) {
      return `${rules.label || name} must be a positive number greater than 0.`;
    }
  }

  return '';
};

/**
 * Reusable Form Validation Hook
 */
export const useFormValidation = (initialErrors = {}) => {
  const [errors, setErrors] = useState(initialErrors);

  const getError = useCallback((field) => errors[field] || '', [errors]);
  const hasError = useCallback((field) => !!errors[field], [errors]);

  const setFieldError = useCallback((field, errorMsg) => {
    setErrors((prev) => ({ ...prev, [field]: errorMsg }));
  }, []);

  const clearFieldError = useCallback((field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const handleApiError = useCallback((err, showToastFn = null) => {
    const parsed = parseApiError(err);
    setErrors(parsed.fieldErrors);
    if (showToastFn && parsed.message) {
      showToastFn(parsed.message, 'error');
    }
    return parsed;
  }, []);

  const getInputClass = useCallback((field, baseClass = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900') => {
    if (errors[field]) {
      return `${baseClass} border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/10 focus:border-rose-600`;
    }
    return `${baseClass} border-slate-300 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20`;
  }, [errors]);

  return {
    errors,
    setErrors,
    getError,
    hasError,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    handleApiError,
    getInputClass,
  };
};

export default parseApiError;
