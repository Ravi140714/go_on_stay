import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2, User, Mail, Phone, Lock, CheckCircle2, ShieldCheck,
  Star, Sparkles, ArrowRight, ArrowLeft, CreditCard, QrCode, Landmark,
  Zap, Award, Check, RefreshCw, ChevronDown, AlertCircle, Search
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const COUNTRY_PHONE_CONFIGS = [
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', digits: 10, placeholder: '98522 26252' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', digits: 10, placeholder: '55512 34567' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', digits: 10, placeholder: '79111 23456' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪', digits: 9, placeholder: '50123 4567' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', digits: 9, placeholder: '50123 4567' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', digits: 10, placeholder: '41612 34567' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', digits: 9, placeholder: '41234 5678' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬', digits: 8, placeholder: '8123 4567' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', digits: 10, placeholder: '15123 45678' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', digits: 9, placeholder: '61234 5678' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿', digits: 9, placeholder: '21123 4567' },
  { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦', digits: 8, placeholder: '3312 3456' },
  { code: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼', digits: 8, placeholder: '5123 4567' },
  { code: 'OM', name: 'Oman', dialCode: '+968', flag: '🇴🇲', digits: 8, placeholder: '9123 4567' },
  { code: 'BH', name: 'Bahrain', dialCode: '+973', flag: '🇧🇭', digits: 8, placeholder: '3912 3456' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾', digits: 10, placeholder: '12345 67890' },
  { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭', digits: 9, placeholder: '81234 5678' },
  { code: 'NP', name: 'Nepal', dialCode: '+977', flag: '🇳🇵', digits: 10, placeholder: '98412 34567' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩', digits: 10, placeholder: '17123 45678' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰', digits: 9, placeholder: '77123 4567' },
];

const formatPhoneWithSpace = (rawVal, maxDigits = 10) => {
  const clean = String(rawVal || '').replace(/\D/g, '').slice(0, maxDigits);
  if (clean.length > 5) {
    return `${clean.slice(0, 5)} ${clean.slice(5)}`;
  }
  return clean;
};

const SUBSCRIPTION_PLANS = [
  {
    id: 'silver',
    name: 'Silver Starter Plan',
    price: 1999,
    period: 'month',
    badge: 'Starter',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    description: 'Perfect for boutique stays & single luxury villas',
    features: [
      '1 Hotel Property Listing',
      'Standard Search Indexing & Filters',
      'Direct Guest Booking Management',
      '10% Platform Commission',
      'Standard Email Support',
    ],
  },
  {
    id: 'gold',
    name: 'Gold Business Plan',
    price: 3999,
    period: 'month',
    badge: 'Most Popular',
    badgeColor: 'bg-rose-600 text-white shadow-md shadow-rose-600/30',
    isPopular: true,
    description: 'Ideal for established hotels & luxury resorts',
    features: [
      'Up to 3 Hotel Property Listings',
      'Featured Top Spot on Search & Home Page',
      'Reduced 5% Platform Commission',
      'Real-Time Booking & Occupancy Analytics',
      'Priority 24/7 Host Desk Support',
      'Custom Room Package & Meal Plan Upgrades',
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum VIP Enterprise',
    price: 7999,
    period: 'month',
    badge: 'VIP Enterprise',
    badgeColor: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md',
    description: 'For hotel chains, heritage palaces & luxury brands',
    features: [
      'Unlimited Hotel Property Listings',
      '0% Platform Commission (Keep 100% Tariffs)',
      'Top Banner Boost across all cities',
      'Dedicated Hospitality Account Manager',
      'Instant Payouts & Automated GST Billing',
      '24/7 VIP Concierge & Guest Desk',
    ],
  },
];

const BecomeHost = () => {
  const navigate = useNavigate();
  const { register, becomeHost, showToast } = useAuth();

  const [step, setStep] = useState(1);

  // Step 1: Owner & Property Details
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    property_type: 'HOTEL',
    hotel_name: '',
    city: 'Udaipur',
    address: '',
    username: '',
    password: '',
    password_confirm: '',
    // Payout & Settlement Destination
    payout_method: 'BANK_ACCOUNT', // 'BANK_ACCOUNT' | 'UPI'
    account_holder_name: '',
    bank_name: '',
    account_number: '',
    confirm_account_number: '',
    ifsc_code: '',
    upi_id: '',
  });

  // Step 2: Subscription & Payment
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' | 'CARD' | 'NETBANKING'
  const [paymentPaid, setPaymentPaid] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Step 3: Registration Submission
  const [submitting, setSubmitting] = useState(false);

  // Email Validation State
  const [emailError, setEmailError] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);

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

    if (phoneError) {
      setPhoneError('');
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

  const handlePhoneBlur = () => {
    // Validation occurs at submit time (handleNextToStep2)
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Step 1 -> Step 2
  const handleNextToStep2 = async (e) => {
    e.preventDefault();
    setPhoneTouched(true);

    if (!formData.first_name || !formData.last_name || !formData.email || !formData.hotel_name || !formData.address) {
      showToast('Please fill out all required personal & hotel property details.', 'error');
      return;
    }

    if (!phoneDigits || phoneDigits.length < selectedCountry.digits) {
      setPhoneError('Invalid number');
      showToast(`Invalid number. Exactly ${selectedCountry.digits} digits are required for ${selectedCountry.name} (${selectedCountry.dialCode}).`, 'error');
      return;
    }

    setEmailError('');
    setPhoneError('');
    setCheckingEmail(true);

    try {
      const res = await api.get(`/users/check-email/?email=${encodeURIComponent(formData.email.trim())}`);
      if (res.data.exists) {
        const msg = 'This email address is already registered (as Admin, Hotel Owner, or Guest). The same email cannot be used for multiple roles.';
        setEmailError(msg);
        showToast(msg, 'error');
        setCheckingEmail(false);
        return; // DO NOT PROCEED TO STEP 2
      }

      const phoneRes = await api.get(`/users/check-phone/?phone=${encodeURIComponent(formData.phone_number.trim())}`);
      if (phoneRes.data.exists) {
        const msg = 'This mobile number is already registered (as Admin, Hotel Owner, or Guest). The same mobile number cannot be used for multiple roles.';
        setPhoneError('This mobile number is already registered.');
        showToast(msg, 'error');
        setCheckingEmail(false);
        return; // DO NOT PROCEED TO STEP 2
      }
    } catch (err) {
      console.warn('Check email error fallback:', err);
    } finally {
      setCheckingEmail(false);
    }

    // Auto-generate suggested username from email if not filled
    if (!formData.username) {
      const suggestedUser = formData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_') + '_host';
      setFormData((prev) => ({ ...prev, username: suggestedUser }));
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper to dynamically load Razorpay checkout script if needed
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(true));
        existingScript.addEventListener('error', () => resolve(false));
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Initiate Real Razorpay Gateway Checkout for Host Subscription (Step 2)
  const handleInitiateRazorpayPayment = async (planToPay = null) => {
    const targetPlan = planToPay || selectedPlan;
    if (!targetPlan) {
      showToast('Please select a membership plan first.', 'error');
      return;
    }

    setPaymentProcessing(true);
    try {
      // 1. Ensure Razorpay SDK is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        setPaymentProcessing(false);
        showToast('Razorpay Checkout SDK could not be loaded. Please check your internet connection.', 'error');
        return;
      }

      // 2. Create order on backend with key_id & secret configured in .env
      const orderRes = await api.post('/payments/create-host-subscription-order/', {
        plan_id: targetPlan.id,
        amount: targetPlan.price
      });

      const { order_id, amount, currency, key_id } = orderRes.data;

      const options = {
        key: key_id,
        amount: amount,
        currency: currency || 'INR',
        name: 'Book My Room',
        description: `Host Subscription: ${targetPlan.name}`,
        image: '/logo.png',
        order_id: order_id,
        prefill: {
          name: `${formData.first_name} ${formData.last_name}`.trim(),
          email: formData.email,
          contact: formData.phone_number,
        },
        notes: {
          plan_id: targetPlan.id,
          plan_name: targetPlan.name,
          hotel_name: formData.hotel_name,
        },
        theme: {
          color: '#e11d48',
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: "UPI / QR / UPI ID",
                instruments: [
                  {
                    method: "upi",
                    flows: ["collect", "intent", "qr"]
                  }
                ]
              }
            },
            sequence: ["block.upi"],
            preferences: {
              show_default_blocks: true
            }
          }
        },
        handler: async function (response) {
          // Verify Payment Signature on server-side
          try {
            setPaymentProcessing(true);
            const verifyRes = await api.post('/payments/verify-host-subscription/', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            const txnId = verifyRes.data.transaction_id || response.razorpay_payment_id;
            setTransactionId(txnId);
            setPaymentPaid(true);
            setShowPaymentModal(false);
            showToast(`🎉 Payment of ₹${targetPlan.price.toLocaleString()} Successful! Ref: ${txnId}`, 'success');
            setStep(3);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } catch (verifyErr) {
            console.error('Host payment verification error:', verifyErr);
            const errDetail = verifyErr.response?.data?.error || 'Payment signature verification failed. Please contact support.';
            showToast(errDetail, 'error');
          } finally {
            setPaymentProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setPaymentProcessing(false);
            showToast('Payment window closed. Please complete payment to proceed to Step 3.', 'info');
          }
        }
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on('payment.failed', function (failRes) {
        console.error('Razorpay payment failed:', failRes);
        setPaymentProcessing(false);
        const reason = failRes.error?.description || 'Payment was declined or failed.';
        showToast(`Payment failed: ${reason}. Please try again.`, 'error');
      });

      razorpayInstance.open();
    } catch (err) {
      console.error('Failed to create Razorpay order:', err);
      const errMsg = err.response?.data?.error || 'Failed to initiate Razorpay checkout. Please verify connection.';
      showToast(errMsg, 'error');
      setPaymentProcessing(false);
    }
  };

  // Step 3 -> Complete Registration & Create Hotel
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!paymentPaid) {
      showToast('Please complete your host subscription plan payment in Step 2 first.', 'error');
      setStep(2);
      return;
    }
    if (!formData.username || !formData.password || !formData.password_confirm) {
      showToast('Please set your account username and password.', 'error');
      return;
    }
    if (formData.password !== formData.password_confirm) {
      showToast('Passwords do not match. Please verify.', 'error');
      return;
    }

    // Payout details validation: either Bank Account OR UPI is mandatory
    if (formData.payout_method === 'BANK_ACCOUNT') {
      if (!formData.bank_name || !formData.account_number || !formData.ifsc_code) {
        showToast('Please provide Bank Name, Account Number, and IFSC Code.', 'error');
        return;
      }
      if (formData.confirm_account_number && formData.account_number !== formData.confirm_account_number) {
        showToast('Bank Account numbers do not match. Please verify.', 'error');
        return;
      }
    } else if (formData.payout_method === 'UPI') {
      if (!formData.upi_id || !formData.upi_id.trim()) {
        showToast('Please enter your valid UPI ID (e.g. name@okhdfcbank).', 'error');
        return;
      }
      if (!formData.upi_id.includes('@')) {
        showToast('Invalid UPI ID format. It must contain @ (e.g. name@upi).', 'error');
        return;
      }
    } else {
      showToast('Please select either Bank Account or UPI for settlements.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Call the dedicated Backend API: POST /api/users/become-host/
      const hostPayload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone_number: formData.phone_number.trim(),
        payout_method: formData.payout_method,
        account_holder_name: (formData.account_holder_name || `${formData.first_name} ${formData.last_name}`).trim(),
      };

      if (formData.payout_method === 'BANK_ACCOUNT') {
        hostPayload.bank_name = formData.bank_name.trim();
        hostPayload.account_number = formData.account_number.trim();
        hostPayload.ifsc_code = formData.ifsc_code.trim().toUpperCase();
      } else {
        hostPayload.upi_id = formData.upi_id.trim();
      }

      const regResult = await becomeHost(hostPayload);

      if (!regResult.success) {
        setSubmitting(false);
        return;
      }

      // 2. Automatically Create First Hotel Property for New Host (Pending Super Admin Approval)
      if (formData.hotel_name) {
        try {
          await api.post('/hotels/', {
            name: formData.hotel_name,
            property_type: formData.property_type || 'HOTEL',
            city: formData.city || 'Udaipur',
            state: formData.state || 'Rajasthan',
            address: formData.address || `${formData.city || 'Udaipur'}, India`,
            description: `Luxury property hosted by ${formData.first_name} ${formData.last_name}. Active Subscription: ${selectedPlan?.name || 'Gold'}.`,
            star_rating: 4,
            status: 'SUBMITTED',
            is_approved: false,
            check_in_time: '12:00 PM',
            check_out_time: '11:00 AM',
            rules: 'Valid Government ID required at check-in.',
            cancellation_policy: 'Free cancellation up to 24 hours before check-in date.',
          });
        } catch (hotelErr) {
          console.warn('Initial hotel creation fallback:', hotelErr);
        }
      }

      showToast(`🎉 Host Account Created! Welcome to GoOnStay Host Portal.`, 'success');
      navigate('/owner/dashboard/properties');
    } catch (err) {
      console.error('Become Host Error:', err);
      showToast(err.response?.data?.error || 'Registration failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Top Header & Progress Stepper */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-rose-600" /> Become a Host Onboarding
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
            List Your Hotel & Start Hosting Guests
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold max-w-xl mx-auto">
            Join thousands of luxury hotel owners on GoOnStay. Complete 3 quick steps to activate your host profile and list your property.
          </p>

          {/* Stepper Progress Bar */}
          <div className="pt-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0"></div>
              <div
                className="absolute top-1/2 left-0 h-1 bg-rose-600 -translate-y-1/2 z-0 transition-all duration-500"
                style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
              ></div>

              {/* Step 1 Pill */}
              <div className="relative z-10 flex flex-col items-center gap-1.5">
                <div
                  className={`w-10 h-10 rounded-full font-black text-xs flex items-center justify-center transition-all ${
                    step >= 1
                      ? 'bg-rose-600 text-white ring-4 ring-rose-100 shadow-md'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {step > 1 ? <Check className="w-5 h-5 stroke-[3]" /> : '1'}
                </div>
                <span className={`text-[11px] font-black uppercase tracking-wider ${step === 1 ? 'text-rose-600' : 'text-slate-500'}`}>
                  Hotel Details
                </span>
              </div>

              {/* Step 2 Pill */}
              <div className="relative z-10 flex flex-col items-center gap-1.5">
                <div
                  className={`w-10 h-10 rounded-full font-black text-xs flex items-center justify-center transition-all ${
                    step >= 2
                      ? 'bg-rose-600 text-white ring-4 ring-rose-100 shadow-md'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {step > 2 ? <Check className="w-5 h-5 stroke-[3]" /> : '2'}
                </div>
                <span className={`text-[11px] font-black uppercase tracking-wider ${step === 2 ? 'text-rose-600' : 'text-slate-500'}`}>
                  Plan & Payment
                </span>
              </div>

              {/* Step 3 Pill */}
              <div className="relative z-10 flex flex-col items-center gap-1.5">
                <div
                  className={`w-10 h-10 rounded-full font-black text-xs flex items-center justify-center transition-all ${
                    step === 3
                      ? 'bg-rose-600 text-white ring-4 ring-rose-100 shadow-md'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  3
                </div>
                <span className={`text-[11px] font-black uppercase tracking-wider ${step === 3 ? 'text-rose-600' : 'text-slate-500'}`}>
                  Security & Password
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 1: HOTEL & OWNER INFORMATION */}
        {step === 1 && (
          <div className="card-white p-6 sm:p-8 space-y-6 border border-slate-200 shadow-lg rounded-3xl animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-rose-600" /> Step 1: Owner Personal & Hotel Property Info
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Enter your contact information and basic hotel property details to initiate hosting.
              </p>
            </div>

            <form onSubmit={handleNextToStep2} className="space-y-5">
              
              {/* Owner Name Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                    First Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="Rajesh"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-rose-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                    Last Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Sharma"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-rose-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Email & Phone Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                    Email Address <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    name="email"
                    value={formData.email}
                    onChange={(e) => {
                      handleInputChange(e);
                      if (emailError) setEmailError('');
                    }}
                    placeholder="rajesh.sharma@example.com"
                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none focus:bg-white ${
                      emailError ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-300 focus:border-rose-600'
                    }`}
                  />
                  {emailError && (
                    <div className="mt-1.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold space-y-1">
                      <p>⚠️ {emailError}</p>
                      <p className="text-slate-600">
                        Already have an account?{' '}
                        <Link to="/login" className="text-rose-600 underline font-black">
                          Sign In Here
                        </Link>
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                    Phone Number <span className="text-rose-600">*</span>
                  </label>

                  <div
                    className={`flex rounded-xl border transition-all shadow-sm relative ${
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
                    <div className="mt-1.5 flex items-center gap-1.5 text-rose-600 text-[11px] font-bold animate-fade-in">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{phoneError}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Property Category / Type, Name & Destination City */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-3 border-t border-slate-100">
                <div className="sm:col-span-4">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5 flex items-center justify-between">
                    <span>Property Type <span className="text-rose-600">*</span></span>
                  </label>
                  <select
                    name="property_type"
                    value={formData.property_type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-rose-50/50 border border-rose-300 rounded-xl text-xs font-bold outline-none focus:border-rose-600 focus:bg-white cursor-pointer"
                  >
                    <option value="HOTEL">🏨 Hotel</option>
                    <option value="VILLA">🏡 Private Villa (Luxury / Pool)</option>
                    <option value="HOMESTAY">🏠 Homestay (Heritage / Cozy)</option>
                    <option value="RESORT">🏖️ Resort & Spa</option>
                    <option value="APARTMENT">🏢 Apartment / Vacation Home</option>
                    <option value="GUEST_HOUSE">🏡 Guest House / B&B</option>
                    <option value="BOUTIQUE_HOTEL">🌟 Boutique Hotel</option>
                  </select>
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                    {formData.property_type === 'VILLA'
                      ? 'Villa Name'
                      : formData.property_type === 'HOMESTAY'
                      ? 'Homestay Name'
                      : formData.property_type === 'RESORT'
                      ? 'Resort Name'
                      : 'Hotel Name'} <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    name="hotel_name"
                    value={formData.hotel_name}
                    onChange={handleInputChange}
                    placeholder={
                      formData.property_type === 'VILLA'
                        ? 'The Palm Serenity Private Pool Villa'
                        : formData.property_type === 'HOMESTAY'
                        ? 'Lakeview Heritage Homestay'
                        : 'Royal Heritage Palace & Resort'
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-rose-600 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                    Destination City <span className="text-rose-600">*</span>
                  </label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-rose-600 focus:bg-white"
                  >
                    <option value="Udaipur">Udaipur, Rajasthan</option>
                    <option value="Goa">Goa</option>
                    <option value="Ahmedabad">Ahmedabad, Gujarat</option>
                    <option value="Mumbai">Mumbai, Maharashtra</option>
                    <option value="Jaipur">Jaipur, Rajasthan</option>
                    <option value="Delhi NCR">Delhi NCR</option>
                    <option value="Bengaluru">Bengaluru, Karnataka</option>
                    <option value="Varanasi">Varanasi, UP</option>
                  </select>
                </div>
              </div>

              {/* Property Address */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                  Full Property Address <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Plot 45, Pichola Lake Road, Udaipur"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-rose-600 focus:bg-white"
                />
              </div>

              {/* Submit Step 1 Button */}
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={checkingEmail}
                  className="btn-rose py-3 px-8 text-xs uppercase tracking-wider font-extrabold rounded-xl shadow-md shadow-rose-600/25 flex items-center gap-2 cursor-pointer"
                >
                  {checkingEmail ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Email Availability...</span>
                    </>
                  ) : (
                    <>
                      <span>Proceed to Select Subscription Plan</span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        )}

        {/* STEP 2: SUBSCRIPTION PLAN & PAYMENT */}
        {step === 2 && (
          <div className="space-y-8 animate-fade-in">
            
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-slate-900">Step 2: Choose Your Host Subscription Plan</h2>
              <p className="text-xs text-slate-500 font-semibold max-w-lg mx-auto">
                Select a membership plan tailored for your hotel business. Unlock premium search rankings and lower booking commission.
              </p>
            </div>

            {/* 3 Subscription Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {SUBSCRIPTION_PLANS.map((plan) => {
                const isSelected = selectedPlan?.id === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`card-white p-6 rounded-3xl cursor-pointer border-2 transition-all flex flex-col justify-between space-y-6 relative overflow-hidden ${
                      isSelected
                        ? 'border-rose-600 ring-4 ring-rose-600/15 shadow-xl scale-[1.02]'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    {plan.isPopular && (
                      <div className="absolute top-0 right-0 bg-rose-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl shadow-sm">
                        ★ Recommended
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${plan.badgeColor}`}>
                          {plan.badge}
                        </span>
                        <h3 className="text-lg font-black text-slate-900 pt-2">{plan.name}</h3>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                          {plan.description}
                        </p>
                      </div>

                      <div className="py-2 border-y border-slate-100 flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900">₹{plan.price.toLocaleString()}</span>
                        <span className="text-xs text-slate-500 font-bold">/ {plan.period}</span>
                      </div>

                      <ul className="space-y-2.5 text-xs text-slate-700 font-semibold">
                        {plan.features.map((feat, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      className={`w-full py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                          : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected ? '✓ Plan Selected' : 'Select Plan'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Direct Payment Action Box */}
            {selectedPlan ? (
              <div className="card-white p-6 border border-slate-200 shadow-xl rounded-3xl space-y-5 animate-fade-in">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Chosen Membership Plan</span>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-rose-600" /> {selectedPlan.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      Instant host account activation with 100% money-back guarantee.
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Payable Now</span>
                    <span className="text-2xl font-black text-rose-600">₹{selectedPlan.price.toLocaleString()}</span>
                    <span className="text-xs text-slate-500 font-bold"> / {selectedPlan.period}</span>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-extrabold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-4 py-2.5 rounded-xl hover:bg-slate-100 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Step 1
                  </button>

                  <button
                    type="button"
                    disabled={paymentProcessing}
                    onClick={() => handleInitiateRazorpayPayment(selectedPlan)}
                    className="btn-rose py-3 px-8 text-xs uppercase tracking-wider font-black rounded-xl shadow-lg shadow-rose-600/30 flex items-center gap-2 cursor-pointer"
                  >
                    {paymentProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Opening Razorpay Gateway...</span>
                      </>
                    ) : (
                      <>
                        <span>Make Payment (₹{selectedPlan.price.toLocaleString()})</span>
                        <ArrowRight className="w-4 h-4 stroke-[3]" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-extrabold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-4 py-2.5 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Step 1
                </button>
                <p className="text-xs text-slate-500 font-bold">
                  👆 Please choose any plan above to proceed with payment.
                </p>
              </div>
            )}

          </div>
        )}

        {/* STEP 3: SECURITY & PASSWORD SETUP */}
        {step === 3 && (
          !paymentPaid ? (
            <div className="card-white p-8 border border-amber-200 bg-amber-50/60 rounded-3xl text-center space-y-4 animate-fade-in">
              <div className="w-14 h-14 bg-amber-100 border border-amber-200 rounded-full flex items-center justify-center mx-auto text-amber-700">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Host Subscription Payment Required</h2>
              <p className="text-xs text-slate-600 font-semibold max-w-md mx-auto">
                Step 3 is locked until your host subscription plan payment is completed and verified via Razorpay.
              </p>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-rose py-3 px-8 text-xs uppercase tracking-wider font-extrabold rounded-xl shadow-md cursor-pointer inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Step 2 & Complete Payment</span>
              </button>
            </div>
          ) : (
          <div className="card-white p-6 sm:p-8 space-y-6 border border-slate-200 shadow-lg rounded-3xl animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-rose-600" /> Step 3: Setup Account Credentials & Security
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Your plan payment is confirmed. Now set a password to create your Hotel Owner profile and launch your portal.
              </p>
            </div>

            {/* Payment Verified Banner */}
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold text-emerald-900">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <span className="font-black text-sm text-emerald-950 block">Payment Verified & Plan Activated!</span>
                <span className="text-[11px] text-emerald-700">
                  Active Plan: {selectedPlan.name} (₹{selectedPlan.price.toLocaleString()}/mo) • Ref: {transactionId || 'TXN_HOST_8849201'}
                </span>
              </div>
            </div>

            <form onSubmit={handleFinalSubmit} className="space-y-5">
              
              {/* Username Input */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                  Host Account Username <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="rajesh_host"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-rose-600 focus:bg-white font-mono"
                />
              </div>

              {/* Password & Confirm Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                    Account Password <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••••••"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-rose-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                    Confirm Password <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    name="password_confirm"
                    value={formData.password_confirm}
                    onChange={handleInputChange}
                    placeholder="Re-enter password"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-rose-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Hotel Owner Settlement & Payout Destination Setup */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-rose-600 shrink-0" />
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        Settlement & Payout Destination
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Your hotel payouts are settled here after the 7-day post check-out holding period.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Platform Protected
                  </span>
                </div>

                {/* Method Selector Tabs */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/60 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, payout_method: 'BANK_ACCOUNT' }))}
                    className={`py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 ${
                      formData.payout_method === 'BANK_ACCOUNT'
                        ? 'bg-white text-rose-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Landmark className="w-3.5 h-3.5" />
                    <span>Bank Account (NEFT/IMPS)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, payout_method: 'UPI' }))}
                    className={`py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 ${
                      formData.payout_method === 'UPI'
                        ? 'bg-white text-rose-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>UPI Instant Settlement</span>
                  </button>
                </div>

                {formData.payout_method === 'BANK_ACCOUNT' ? (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                          Account Holder Name <span className="text-rose-600 font-black">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          name="account_holder_name"
                          value={formData.account_holder_name}
                          onChange={handleInputChange}
                          placeholder={formData.first_name ? `${formData.first_name} ${formData.last_name}` : "Rajesh Sharma"}
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-rose-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                          Bank Name <span className="text-rose-600 font-black">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          name="bank_name"
                          value={formData.bank_name}
                          onChange={handleInputChange}
                          placeholder="HDFC Bank / State Bank of India"
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-rose-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-1">
                        <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                          Bank Account Number <span className="text-rose-600 font-black">*</span>
                        </label>
                        <input
                          type="password"
                          required
                          name="account_number"
                          value={formData.account_number}
                          onChange={handleInputChange}
                          placeholder="9 to 18 digits"
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold outline-none focus:border-rose-600"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                          Confirm Account Number <span className="text-rose-600 font-black">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          name="confirm_account_number"
                          value={formData.confirm_account_number}
                          onChange={handleInputChange}
                          placeholder="Re-enter account number"
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold outline-none focus:border-rose-600"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                          IFSC Code <span className="text-rose-600 font-black">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          name="ifsc_code"
                          value={formData.ifsc_code}
                          onChange={(e) => setFormData(prev => ({ ...prev, ifsc_code: e.target.value.toUpperCase() }))}
                          placeholder="HDFC0001234"
                          maxLength={11}
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold uppercase outline-none focus:border-rose-600"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                          Registered UPI ID (VPA) <span className="text-rose-600 font-black">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          name="upi_id"
                          value={formData.upi_id}
                          onChange={handleInputChange}
                          placeholder="yourhotel@okhdfcbank"
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold outline-none focus:border-rose-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                          UPI Account Holder Name <span className="text-rose-600 font-black">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          name="account_holder_name"
                          value={formData.account_holder_name}
                          onChange={handleInputChange}
                          placeholder={formData.first_name ? `${formData.first_name} ${formData.last_name}` : "Rajesh Sharma"}
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-rose-600"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-[11px] text-slate-500 font-medium leading-relaxed bg-white p-3 rounded-xl border border-slate-200/80 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Security Notice:</strong> All guest payments are collected through Book My Room’s approved payment arrangement. Your bank account details are encrypted and masked for your security. Net payouts are disbursed after the 7-day holding period.
                  </span>
                </div>
              </div>

              {/* Profile Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Profile Summary</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-bold text-slate-800">
                  <div><span className="text-slate-500 font-semibold block text-[10px]">Host Name</span> {formData.first_name} {formData.last_name}</div>
                  <div><span className="text-slate-500 font-semibold block text-[10px]">Hotel Name</span> {formData.hotel_name}</div>
                  <div><span className="text-slate-500 font-semibold block text-[10px]">Location</span> {formData.city}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-extrabold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-4 py-2 rounded-xl hover:bg-slate-100"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Plans
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-rose py-3.5 px-8 text-xs uppercase tracking-wider font-extrabold rounded-xl shadow-lg shadow-rose-600/30 flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Creating Profile & Hotel...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Profile & Launch Portal</span>
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
          )
        )}

      </div>

      {/* SIMULATED PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-white max-w-md w-full p-6 space-y-6 rounded-3xl shadow-2xl border border-slate-200 animate-scale-up">
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Secure Payment Checkout</h3>
              <p className="text-xs text-slate-500 font-semibold">
                Simulating Gateway Payment for {selectedPlan.name}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between font-bold">
                <span className="text-slate-500">Selected Plan:</span>
                <span className="text-slate-900">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-500">Method:</span>
                <span className="text-slate-900">{paymentMethod}</span>
              </div>
              <div className="flex justify-between font-black text-sm pt-2 border-t border-slate-200 text-rose-600">
                <span>Amount:</span>
                <span>₹{selectedPlan.price.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                disabled={paymentProcessing}
                onClick={handleSimulatePayment}
                className="btn-rose w-full py-3 text-xs uppercase tracking-wider font-extrabold rounded-xl shadow-md justify-center flex items-center gap-2 cursor-pointer"
              >
                {paymentProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Pay ₹{selectedPlan.price.toLocaleString()}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={paymentProcessing}
                onClick={() => setShowPaymentModal(false)}
                className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Cancel Checkout
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default BecomeHost;
