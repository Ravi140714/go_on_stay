/**
 * User-Friendly Registration Error Parser for GoOnStay
 *
 * Normalizes HTTP 400 validation responses from Django REST Framework,
 * handling structures like:
 *  - response.data.error.details
 *  - response.data.details
 *  - response.data.error
 *  - response.data.username
 *  - response.data.email
 *  - response.data.phone_number
 *  - response.data.password
 *
 * Converts duplicate error messages into friendly customer-centric copy:
 *  - Username duplicate: "This username is already registered. Please choose another username."
 *  - Email duplicate:    "An account with this email address already exists. Please login or use another email."
 *  - Mobile duplicate:   "An account with this mobile number already exists. Please use another number."
 *  - Password errors:    Extracts actual backend validation message to display under the password field.
 */

export const parseRegistrationErrors = (data) => {
  if (!data) {
    return {
      fieldErrors: {},
      primaryMessage: 'Registration failed. Please check the form and try again.',
      isDuplicateUser: false,
      isDuplicateEmail: false,
      isDuplicatePhone: false,
      isDuplicateUsername: false,
      rawErrors: null,
    };
  }

  let rawErrors = {};

  if (typeof data === 'string') {
    if (data.includes('<html') || data.includes('<!DOCTYPE')) {
      return {
        fieldErrors: {},
        primaryMessage: 'Backend server error. Please try again later.',
        isDuplicateUser: false,
        isDuplicateEmail: false,
        isDuplicatePhone: false,
        isDuplicateUsername: false,
        rawErrors: data,
      };
    }

    const isDupEmail = /email.*(already\s*exists|already\s*registered|taken|unique|multiple\s*roles)/i.test(data);
    const isDupUser = /username.*(already\s*exists|already\s*registered|taken|unique)/i.test(data);
    const isDupPhone = /(phone|mobile).*(already\s*exists|already\s*registered|taken|unique|multiple\s*roles)/i.test(data);

    let msg = data;
    if (isDupEmail) {
      msg = 'An account with this email address already exists. Please login or use another email.';
    } else if (isDupUser) {
      msg = 'This username is already registered. Please choose another username.';
    } else if (isDupPhone) {
      msg = 'An account with this mobile number already exists. Please use another number.';
    }

    return {
      fieldErrors: {
        ...(isDupEmail ? { email: msg } : {}),
        ...(isDupUser ? { username: msg } : {}),
        ...(isDupPhone ? { phone_number: msg } : {}),
      },
      primaryMessage: msg,
      isDuplicateUser: isDupEmail || isDupUser || isDupPhone,
      isDuplicateEmail: isDupEmail,
      isDuplicatePhone: isDupPhone,
      isDuplicateUsername: isDupUser,
      rawErrors: data,
    };
  }

  // Handle nested error structures:
  // 1. response.data.error.details
  // 2. response.data.details
  // 3. response.data.error (if object)
  // 4. response.data directly
  if (typeof data === 'object' && data !== null) {
    if (data.error && typeof data.error === 'object' && data.error.details && typeof data.error.details === 'object') {
      rawErrors = data.error.details;
    } else if (data.details && typeof data.details === 'object') {
      rawErrors = data.details;
    } else if (data.error && typeof data.error === 'object') {
      rawErrors = data.error;
    } else {
      rawErrors = data;
    }
  }

  const fieldErrors = {};
  let isDuplicateEmail = false;
  let isDuplicatePhone = false;
  let isDuplicateUsername = false;

  const extractMessageString = (val) => {
    if (!val) return '';
    if (Array.isArray(val)) {
      return val
        .map((v) => (typeof v === 'object' ? extractMessageString(v) : String(v)))
        .filter(Boolean)
        .join(' ');
    }
    if (typeof val === 'object' && val !== null) {
      if (val.message) return String(val.message);
      if (val.error) return String(val.error);
      if (val.detail) return String(val.detail);
      const keys = Object.keys(val);
      if (keys.length > 0) return extractMessageString(val[keys[0]]);
      return JSON.stringify(val);
    }
    return String(val);
  };

  const isDuplicatePattern = (text) => {
    if (!text || typeof text !== 'string') return false;
    return /already\s*(exists|registered)|already\s*in\s*use|already\s*taken|unique|multiple\s*roles/i.test(text);
  };

  // 1. Username field
  const rawUserVal = rawErrors.username || rawErrors.user_name;
  if (rawUserVal) {
    const rawMsg = extractMessageString(rawUserVal);
    if (isDuplicatePattern(rawMsg)) {
      fieldErrors.username = 'This username is already registered. Please choose another username.';
      isDuplicateUsername = true;
    } else {
      fieldErrors.username = rawMsg;
    }
  }

  // 2. Email field
  const rawEmailVal = rawErrors.email;
  if (rawEmailVal) {
    const rawMsg = extractMessageString(rawEmailVal);
    if (isDuplicatePattern(rawMsg)) {
      fieldErrors.email = 'An account with this email address already exists. Please login or use another email.';
      isDuplicateEmail = true;
    } else {
      fieldErrors.email = rawMsg;
    }
  }

  // 3. Mobile / Phone number field
  const rawPhoneVal = rawErrors.phone_number || rawErrors.phone || rawErrors.mobile;
  if (rawPhoneVal) {
    const rawMsg = extractMessageString(rawPhoneVal);
    if (isDuplicatePattern(rawMsg)) {
      fieldErrors.phone_number = 'An account with this mobile number already exists. Please use another number.';
      isDuplicatePhone = true;
    } else {
      fieldErrors.phone_number = rawMsg;
    }
  }

  // 4. Password validation error (Requirements 4 & 5: display actual backend message)
  const rawPassVal = rawErrors.password;
  if (rawPassVal) {
    fieldErrors.password = extractMessageString(rawPassVal);
  }

  // 5. Password confirmation
  const rawPassConfVal = rawErrors.password_confirm;
  if (rawPassConfVal) {
    fieldErrors.password_confirm = extractMessageString(rawPassConfVal);
  }

  // 6. Any other fields (e.g. first_name, last_name, non_field_errors, detail, error)
  Object.keys(rawErrors).forEach((k) => {
    if (!['username', 'user_name', 'email', 'phone_number', 'phone', 'mobile', 'password', 'password_confirm'].includes(k)) {
      const msg = extractMessageString(rawErrors[k]);
      if (msg && !fieldErrors[k]) {
        fieldErrors[k] = msg;
      }
    }
  });

  const isDuplicateUser = isDuplicateEmail || isDuplicatePhone || isDuplicateUsername;

  // Determine top priority message for Toast notification
  let primaryMessage = '';
  if (isDuplicateEmail && fieldErrors.email) {
    primaryMessage = fieldErrors.email;
  } else if (isDuplicateUsername && fieldErrors.username) {
    primaryMessage = fieldErrors.username;
  } else if (isDuplicatePhone && fieldErrors.phone_number) {
    primaryMessage = fieldErrors.phone_number;
  } else if (fieldErrors.email) {
    primaryMessage = fieldErrors.email;
  } else if (fieldErrors.username) {
    primaryMessage = fieldErrors.username;
  } else if (fieldErrors.phone_number) {
    primaryMessage = fieldErrors.phone_number;
  } else if (fieldErrors.password) {
    primaryMessage = fieldErrors.password;
  } else if (fieldErrors.password_confirm) {
    primaryMessage = fieldErrors.password_confirm;
  } else if (fieldErrors.non_field_errors) {
    primaryMessage = fieldErrors.non_field_errors;
  } else if (typeof data.error === 'string') {
    primaryMessage = data.error;
  } else if (typeof data.detail === 'string') {
    primaryMessage = data.detail;
  } else if (Object.keys(fieldErrors).length > 0) {
    primaryMessage = Object.values(fieldErrors)[0];
  } else {
    primaryMessage = 'Registration failed. Please check the provided information and try again.';
  }

  return {
    fieldErrors,
    primaryMessage,
    isDuplicateUser,
    isDuplicateEmail,
    isDuplicatePhone,
    isDuplicateUsername,
    rawErrors,
  };
};

export default parseRegistrationErrors;
