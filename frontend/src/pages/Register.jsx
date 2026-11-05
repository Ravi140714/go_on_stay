import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Lock, Eye, EyeOff, Hotel, Star, CheckCircle2,
  ArrowRight, ShieldCheck, KeyRound, Check, Sparkles, Search, ChevronDown, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { COUNTRY_PHONE_CONFIGS } from './BecomeHost';

const formatPhoneWithSpace = (rawVal, maxDigits = 10) => {
  const clean = String(rawVal || '').replace(/\D/g, '').slice(0, maxDigits);
  if (clean.length > 5) {
    return `${clean.slice(0, 5)} ${clean.slice(5)}`;
  }
  return clean;
};

const Register = () => {
  const { register, showToast } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    password: '',
    password_confirm: '',
    role: 'CUSTOMER',
  });

  // OTP Verification States
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');

  // Country & Phone State with space formatting, search and validation
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_PHONE_CONFIGS[0]); // India (+91)
  const [phoneDigits, setPhoneDigits] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const countryDropdownRef = useRef(null);
  const phoneInputRef = useRef(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setIsCountryDropdownOpen(false);
      }
    };
    if (isCountryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCountryDropdownOpen]);

  // Select a country from the searchable list and focus phone input
  const handleSelectCountry = (country) => {
    setSelectedCountry(country);
    setIsCountryDropdownOpen(false);
    setCountrySearch('');
    setHighlightedIndex(0);

    const clean = phoneDigits.slice(0, country.digits);
    const formatted = formatPhoneWithSpace(clean, country.digits);
    setPhoneDigits(clean);
    setFormattedPhone(formatted);

    const finalNumber = country.code === 'IN' ? clean : `${country.dialCode}${clean}`;
    setFormData((prev) => ({ ...prev, phone_number: finalNumber }));

    if (phoneTouched) {
      if (!clean || clean.length < country.digits) {
        setPhoneError('Invalid number');
      } else {
        setPhoneError('');
      }
    }

    setTimeout(() => {
      phoneInputRef.current?.focus();
    }, 50);
  };

  // Filtered country list based on search query (supports '91', '+91', 'india', 'us', etc.)
  const filteredCountries = COUNTRY_PHONE_CONFIGS.filter((c) => {
    const query = countrySearch.trim().toLowerCase().replace('+', '');
    if (!query) return true;
    const dial = c.dialCode.replace('+', '').toLowerCase();
    const name = c.name.toLowerCase();
    const code = c.code.toLowerCase();
    return dial.includes(query) || name.includes(query) || code.includes(query);
  });

  const handleCountrySearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (filteredCountries.length ? (prev + 1) % filteredCountries.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (filteredCountries.length ? (prev - 1 + filteredCountries.length) % filteredCountries.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (filteredCountries.length > 0) {
        const target = filteredCountries[highlightedIndex] || filteredCountries[0];
        handleSelectCountry(target);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsCountryDropdownOpen(false);
    }
  };

  const handlePhoneChange = (e) => {
    const inputVal = e.target.value;
    const clean = inputVal.replace(/\D/g, '').slice(0, selectedCountry.digits);
    const formatted = formatPhoneWithSpace(clean, selectedCountry.digits);

    setPhoneDigits(clean);
    setFormattedPhone(formatted);

    const finalNumber = selectedCountry.code === 'IN' ? clean : `${selectedCountry.dialCode}${clean}`;
    setFormData((prev) => ({ ...prev, phone_number: finalNumber }));

    // Do not show error while typing
    if (phoneError) {
      setPhoneError('');
    }
  };

  const handlePhoneBlur = async () => {
    // Only check uniqueness if all digits are entered; do not show "invalid number" while typing
    if (phoneDigits && phoneDigits.length === selectedCountry.digits) {
      try {
        const phoneToCheck = phoneDigits.trim();
        const phoneCheck = await api.get(`/users/check-phone/?phone=${encodeURIComponent(phoneToCheck)}`);
        if (phoneCheck.data && phoneCheck.data.exists) {
          setPhoneError('This mobile number is already registered.');
        } else if (phoneError === 'This mobile number is already registered.') {
          setPhoneError('');
        }
      } catch (err) {
        console.warn('Check phone onBlur fallback:', err);
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (passwordError && (e.target.name === 'password' || e.target.name === 'password_confirm')) {
      setPasswordError('');
    }
    if (emailError && e.target.name === 'email') {
      setEmailError('');
    }
  };

  const handleSendOtp = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      showToast('Please enter a valid email address first.', 'error');
      return;
    }

    setEmailError('');
    setSendingOtp(true);
    try {
      // 1. Verify email uniqueness before sending OTP
      const emailCheck = await api.get(`/users/check-email/?email=${encodeURIComponent(formData.email.trim())}`);
      if (emailCheck.data && emailCheck.data.exists) {
        const msg = emailCheck.data.message || 'This email address is already registered.';
        setEmailError(msg);
        showToast(msg, 'error');
        setSendingOtp(false);
        return;
      }

      // 2. Verify phone uniqueness before sending OTP
      const phoneVal = phoneDigits || formData.phone_number;
      if (phoneVal) {
        const phoneCheck = await api.get(`/users/check-phone/?phone=${encodeURIComponent(phoneVal.trim())}`);
        if (phoneCheck.data && phoneCheck.data.exists) {
          const msg = phoneCheck.data.message || 'This mobile number is already registered.';
          setPhoneError(msg);
          showToast(msg, 'error');
          setSendingOtp(false);
          return;
        }
      }

      const res = await api.post('/users/send-otp/', { email: formData.email.trim() });
      setOtpSent(true);
      showToast(`Verification OTP sent to ${formData.email}! Check your inbox. ✉️`);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to send OTP email.';
      showToast(errMsg, 'error');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim().length !== 6) {
      showToast('Please enter the 6-digit OTP code sent to your email.', 'error');
      return;
    }
    setVerifyingOtp(true);
    try {
      const res = await api.post('/users/verify-otp/', { email: formData.email, otp: otpCode.trim() });
      if (res.data.is_verified) {
        setIsOtpVerified(true);
        showToast('Email verified successfully! ✅');
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Invalid or expired OTP code.';
      showToast(errMsg, 'error');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPhoneTouched(true);

    if (!formData.first_name || !formData.last_name || !formData.username || !formData.email || !formData.password || !formData.password_confirm) {
      showToast('All fields are mandatory (*). Please fill out all fields.', 'error');
      return;
    }

    if (!phoneDigits || phoneDigits.length < selectedCountry.digits) {
      setPhoneError('Invalid number');
      showToast(`Invalid number. Exactly ${selectedCountry.digits} digits are required for ${selectedCountry.name} (${selectedCountry.dialCode}).`, 'error');
      return;
    }
    setPhoneError('');

    if (formData.password !== formData.password_confirm) {
      setPasswordError('Password no match');
      showToast('Password no match. Please ensure both passwords match.', 'error');
      return;
    }
    setPasswordError('');

    if (!isOtpVerified) {
      showToast('Please verify your email address using the 6-digit OTP before registering.', 'error');
      return;
    }

    setLoading(true);
    try {
      // 1. Check Phone Uniqueness
      const phoneToCheck = phoneDigits.trim();
      const phoneRes = await api.get(`/users/check-phone/?phone=${encodeURIComponent(phoneToCheck)}`);
      if (phoneRes.data && phoneRes.data.exists) {
        setPhoneError('This mobile number is already registered.');
        showToast('This mobile number is already registered. Please use another mobile number.', 'error');
        setLoading(false);
        return;
      }

      // 2. Check Email Uniqueness
      const emailRes = await api.get(`/users/check-email/?email=${encodeURIComponent(formData.email.trim())}`);
      if (emailRes.data && emailRes.data.exists) {
        setEmailError('This email address is already registered.');
        showToast('This email address is already registered. Please sign in instead.', 'error');
        setLoading(false);
        return;
      }

      // 3. Register user
      const result = await register(formData);
      if (result && result.success) {
        navigate('/');
      }
    } catch (err) {
      console.error('Registration error:', err);
      const errMsg = err.response?.data?.error || err.response?.data?.phone_number || err.response?.data?.email || 'An unexpected error occurred during registration.';
      showToast(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 bg-slate-100/70 text-slate-900 relative overflow-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Two-Column Split Auth Box */}
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10 animate-fade-in my-auto">
        
        {/* LEFT COLUMN: Registration Form (lg:col-span-7) */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-11 flex flex-col justify-between space-y-6">
          
          <div>
            {/* Logo Badge */}
            <Link to="/" className="flex items-center gap-1.5 mb-5 group">
              <img
                src="/logo.png"
                alt="BMR Logo"
                className="h-10 w-auto object-contain rounded-xl group-hover:scale-105 transition-transform duration-300"
              />
              <div>
                <span className="text-base font-black text-slate-900 tracking-tight block leading-none">Go<span className="text-rose-600">On</span>Stay</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">Join GoOnStay Platform</span>
              </div>
            </Link>

            {/* Header */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Create an Account</h2>
              <p className="mt-1 text-xs text-slate-500 font-semibold leading-relaxed">
                Join GoOnStay to book rooms and manage your stay reservations
              </p>
            </div>
          </div>

          {/* Registration Form */}
          <form className="space-y-3.5" onSubmit={handleSubmit}>
            
            {/* First Name & Last Name Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                  First Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="First Name"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:border-rose-600 focus:bg-white outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                  Last Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Last Name"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:border-rose-600 focus:bg-white outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            {/* Username & Phone Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                  Username <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter username"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:border-rose-600 focus:bg-white outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                  Phone Number <span className="text-rose-600">*</span>
                </label>

                <div
                  className={`flex rounded-xl border transition-all shadow-xs relative ${
                    phoneError
                      ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-500/20'
                      : 'border-slate-300 bg-slate-50 focus-within:border-rose-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-rose-500/20'
                  }`}
                >
                  {/* Compact Country Selector with Searchable Dropdown */}
                  <div className="relative flex items-stretch shrink-0" ref={countryDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCountryDropdownOpen((prev) => !prev);
                        setCountrySearch('');
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-2.5 bg-slate-100 hover:bg-slate-200/80 transition-colors border-r border-slate-300 text-xs font-black text-slate-800 shrink-0 select-none cursor-pointer rounded-l-[11px]"
                      title={`${selectedCountry.name} (${selectedCountry.dialCode}) - Click to search/change country`}
                    >
                      <span className="text-sm leading-none">{selectedCountry.flag}</span>
                      <span className="text-xs font-black tracking-tight">{selectedCountry.dialCode}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Searchable Dropdown Popover */}
                    {isCountryDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1.5 w-72 max-h-72 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden flex flex-col animate-fade-in">
                        {/* Search Header */}
                        <div className="p-2 border-b border-slate-100 bg-slate-50">
                          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-500/20">
                            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <input
                              type="text"
                              autoFocus
                              value={countrySearch}
                              onChange={(e) => {
                                setCountrySearch(e.target.value);
                                setHighlightedIndex(0);
                              }}
                              onKeyDown={handleCountrySearchKeyDown}
                              placeholder="Search '91', 'India', etc... (Enter to select)"
                              className="w-full text-xs font-bold bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
                            />
                            {countrySearch && (
                              <button
                                type="button"
                                onClick={() => setCountrySearch('')}
                                className="text-slate-400 hover:text-slate-700 text-xs font-black"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Filtered Country Items List */}
                        <div className="overflow-y-auto max-h-56 divide-y divide-slate-100 p-1">
                          {filteredCountries.length > 0 ? (
                            filteredCountries.map((c, idx) => {
                              const isSelected = c.code === selectedCountry.code;
                              const isHighlighted = idx === highlightedIndex;
                              return (
                                <button
                                  key={c.code}
                                  type="button"
                                  onMouseEnter={() => setHighlightedIndex(idx)}
                                  onClick={() => handleSelectCountry(c)}
                                  className={`w-full px-3 py-2 text-left flex items-center justify-between rounded-lg transition-colors text-xs ${
                                    isSelected
                                      ? 'bg-rose-50 text-rose-900 font-black'
                                      : isHighlighted
                                      ? 'bg-slate-100 text-slate-900 font-extrabold ring-1 ring-slate-300'
                                      : 'hover:bg-slate-50 text-slate-700 font-semibold'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <span className="text-base">{c.flag}</span>
                                    <span className="truncate">{c.name}</span>
                                    {isHighlighted && (
                                      <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded ml-1">
                                        Press Enter ↵
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                    <span className="font-mono text-xs font-bold text-slate-500">{c.dialCode}</span>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-rose-600" />}
                                  </div>
                                </button>
                              );
                            })
                          ) : (
                            <div className="p-4 text-center text-xs text-slate-400 font-semibold">
                              No country found for "{countrySearch}"
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Phone Digits Input with Auto-formatting space after 5 digits */}
                  <input
                    ref={phoneInputRef}
                    type="tel"
                    required
                    name="phone_number_display"
                    value={formattedPhone}
                    onChange={handlePhoneChange}
                    onBlur={handlePhoneBlur}
                    placeholder={selectedCountry.placeholder || '98522 26252'}
                    className="w-full px-3.5 py-2.5 bg-transparent text-xs font-bold text-slate-900 outline-none placeholder:text-slate-400 rounded-r-[11px]"
                  />
                </div>

                {/* Validation Error */}
                {phoneError && (
                  <div className="mt-1 flex items-center gap-1.5 text-rose-600 text-[11px] font-bold animate-fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{phoneError}</span>
                  </div>
                )}
              </div>
            </div>

            {/* EMAIL & OTP VERIFICATION SECTION */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  Email Address <span className="text-rose-600">*</span>
                </label>
                {isOtpVerified && (
                  <span className="text-[11px] font-black text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Email Verified
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  disabled={isOtpVerified}
                  name="email"
                  value={formData.email}
                  onChange={(e) => {
                    handleChange(e);
                    if (emailError) setEmailError('');
                  }}
                  placeholder="name@example.com"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:bg-white outline-none disabled:bg-slate-100 ${
                    emailError
                      ? 'border-rose-500 ring-2 ring-rose-500/20'
                      : 'border-slate-300 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
                  }`}
                />

                {!isOtpVerified && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={sendingOtp || !formData.email}
                    className="btn-rose py-2 px-4 text-xs font-extrabold shrink-0 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {sendingOtp ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Mail className="w-3.5 h-3.5" />
                    )}
                    <span>{otpSent ? 'Resend OTP' : 'Send OTP'}</span>
                  </button>
                )}
              </div>

              {emailError && (
                <div className="mt-1 flex items-center gap-1.5 text-rose-600 text-[11px] font-bold animate-fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{emailError}</span>
                </div>
              )}

              {/* OTP CODE INPUT (Appears after OTP is sent) */}
              {otpSent && !isOtpVerified && (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2.5 animate-fadeIn mt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-amber-600" /> Enter 6-Digit OTP Code
                    </span>
                    <span className="text-[10px] text-amber-700">Sent to {formData.email}</span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-sm font-mono font-black tracking-widest text-slate-900 outline-none focus:border-amber-600"
                    />

                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={verifyingOtp || otpCode.length !== 6}
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shrink-0 cursor-pointer shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      {verifyingOtp ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Check className="w-4 h-4 stroke-[3]" />
                      )}
                      <span>Verify OTP</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Password & Confirm Password Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                  Password <span className="text-rose-600">*</span>
                </label>
                <input
                  type="password"
                  required
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:border-rose-600 focus:bg-white outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                  Confirm Password <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  name="password_confirm"
                  value={formData.password_confirm}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 outline-none focus:bg-white transition-all ${
                    passwordError
                      ? 'border-rose-500 ring-2 ring-rose-500/20'
                      : 'border-slate-300 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
                  }`}
                />
                {passwordError && (
                  <p className="text-[11px] text-rose-600 font-bold mt-1 animate-fade-in">{passwordError}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isOtpVerified}
              className={`btn-rose w-full py-3.5 text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer mt-2 ${
                !isOtpVerified ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Complete Account Registration</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </div>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="text-center pt-2">
            <p className="text-xs font-bold text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="text-rose-600 hover:text-rose-700 font-black hover:underline ml-1">
                Sign In Instead
              </Link>
            </p>
          </div>

        </div>

        {/* RIGHT COLUMN: Promotional Hospitality Branding (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-rose-950 to-red-950 p-8 sm:p-11 text-white flex flex-col justify-between relative overflow-hidden border-t lg:border-t-0 lg:border-l border-slate-800">
          
          <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> GoOnStay Guarantee
            </div>

            <h3 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight">
              Seamless Stay Reservations & Host Earnings
            </h3>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">Instant Confirmation</h4>
                  <p className="text-[11px] text-slate-300 font-medium">Real-time room availability checked with automated Razorpay keys.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">Direct Host Settlement</h4>
                  <p className="text-[11px] text-slate-300 font-medium">Hotel Owners receive booking payments directly into their Razorpay account.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                  <Star className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">100% Price Lock Guarantee</h4>
                  <p className="text-[11px] text-slate-300 font-medium">No hidden fees or unexpected surge charges at hotel check-in.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 relative z-10">
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
              By creating an account, you agree to GoOnStay's Terms of Service, Privacy Policy, and Email Verification rules.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Register;
