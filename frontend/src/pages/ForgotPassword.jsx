import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  KeyRound, Mail, User, Eye, EyeOff, ShieldCheck,
  CheckCircle2, ArrowRight, ArrowLeft, RefreshCw, Sparkles, Lock
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { showToast } = useAuth();

  const [step, setStep] = useState(1); // 1: Identifier | 2: OTP | 3: New Password | 4: Success
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [devHintOtp, setDevHintOtp] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Resend OTP countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Step 1: Request Password Reset OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      showToast('Please enter your username or registered email address.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/users/forgot-password/', { identifier: identifier.trim() });
      setEmail(res.data.email);
      setMaskedEmail(res.data.masked_email || res.data.email);
      if (res.data.dev_hint_otp) setDevHintOtp(res.data.dev_hint_otp);
      showToast(res.data.message || `OTP sent to ${res.data.masked_email}`, 'success');
      setStep(2);
      setCountdown(60);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Account not found. Please verify username or email.';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & Proceed to New Password
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      showToast('Please enter the valid 6-digit OTP code.', 'error');
      return;
    }

    setLoading(true);
    try {
      // Pre-verify OTP endpoint
      const res = await api.post('/users/verify-otp/', {
        email: email,
        otp: otp.trim()
      });
      showToast(res.data.message || 'OTP code verified successfully!', 'success');
      setStep(3);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Invalid or expired OTP code. Please try again.';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP Handler
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      const res = await api.post('/users/forgot-password/', { identifier: email || identifier });
      showToast(`A fresh verification code was sent to ${maskedEmail || email}.`, 'success');
      setCountdown(60);
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not resend OTP. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Submit New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      showToast('Please fill out both password fields.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters long.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match. Please verify.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/users/reset-password/', {
        email: email,
        otp: otp.trim(),
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      showToast(res.data.message || '🎉 Password reset successfully!', 'success');
      setStep(4); // Success screen
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to reset password. Please request a new OTP.';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-slate-100/70 text-slate-900 relative overflow-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden relative z-10 animate-fade-in p-6 sm:p-10 space-y-6">
        
        {/* Top Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-1.5 mb-2 group">
            <img
              src="/logo.png"
              alt="BMR Logo"
              className="h-10 w-auto object-contain rounded-xl group-hover:scale-105 transition-transform duration-300"
            />
            <div className="text-left">
              <span className="text-base font-black text-slate-900 tracking-tight block leading-none">
                Go<span className="text-rose-600">On</span>Stay
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">
                Security & Recovery
              </span>
            </div>
          </Link>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {step === 4 ? 'Password Updated!' : 'Reset Your Password'}
          </h2>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-sm mx-auto">
            {step === 1 && 'Enter your username or email address and we will send a 6-digit OTP verification code.'}
            {step === 2 && `Enter the 6-digit verification code sent to ${maskedEmail || email}.`}
            {step === 3 && 'Choose a strong new password for your GoOnStay account.'}
            {step === 4 && 'Your password has been changed successfully. You can now sign in with your new credentials.'}
          </p>
        </div>

        {/* Stepper Indicator */}
        {step < 4 && (
          <div className="flex items-center justify-center gap-3 pt-1">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <div
                  className={`w-7 h-7 rounded-full text-[11px] font-black flex items-center justify-center transition-all ${
                    step === s
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-200'
                      : step > s
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {step > s ? '✓' : s}
                </div>
                {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>}
              </div>
            ))}
          </div>
        )}

        {/* STEP 1: IDENTIFIER (Username or Email) */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                Username or Email Address <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter your username or registered email"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:border-rose-600 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-rose py-3.5 text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Looking up Account & Sending OTP...</span>
                </>
              ) : (
                <>
                  <span>Send 6-Digit OTP Code</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: ENTER 6-DIGIT OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fade-in">
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center gap-3 text-xs text-emerald-900 font-semibold">
              <Mail className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-black block">Verification Code Sent</span>
                <span className="text-[11px] text-emerald-700">Check inbox for: {maskedEmail || email}</span>
              </div>
            </div>

            {devHintOtp && (
              <div
                onClick={() => setOtp(devHintOtp)}
                className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-center cursor-pointer hover:bg-amber-100/70 transition-colors"
                title="Click to auto-fill verification code"
              >
                <span className="text-[11px] font-bold text-amber-900 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Demo Mode OTP: <strong className="font-mono text-xs">{devHintOtp}</strong> (Click to Auto-fill)</span>
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                Enter 6-Digit OTP Code <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="123456"
                  className="w-full py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-center text-xl font-black font-mono tracking-widest text-slate-900 placeholder-slate-300 focus:border-rose-600 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-bold pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Change Email
              </button>

              <button
                type="button"
                disabled={countdown > 0 || loading}
                onClick={handleResendOtp}
                className={`transition-colors cursor-pointer ${
                  countdown > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-rose-600 hover:underline'
                }`}
              >
                {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend OTP Code'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full btn-rose py-3.5 text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <span>Verify OTP & Continue</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 3: SET NEW PASSWORD & CONFIRM */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4 animate-fade-in">
            <div className="bg-sky-50 border border-sky-200 p-3 rounded-2xl flex items-center gap-2.5 text-xs text-sky-900 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Identity Verified. Please set your new password below.</span>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                New Password <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:border-rose-600 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-rose-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                Confirm New Password <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:border-rose-600 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-rose-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Validation Tips */}
            <div className="space-y-1 text-[11px] font-semibold text-slate-500 pt-1">
              <div className={`flex items-center gap-1.5 ${newPassword.length >= 8 ? 'text-emerald-600 font-bold' : ''}`}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Minimum 8 characters
              </div>
              <div className={`flex items-center gap-1.5 ${confirmPassword && newPassword === confirmPassword ? 'text-emerald-600 font-bold' : ''}`}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Both passwords match
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
              className="w-full btn-rose py-3.5 text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Reset Password & Finish</span>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 4: SUCCESS CONFIRMATION */}
        {step === 4 && (
          <div className="text-center space-y-5 animate-fade-in py-2">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-200 shadow-md">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">Your Password Has Been Reset!</h3>
              <p className="text-xs text-slate-500 font-semibold max-w-xs mx-auto">
                You can now log in securely with your new password on any device.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full btn-rose py-3.5 text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Back to Login Screen</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        )}

        {/* Bottom Back to Login Link */}
        {step < 4 && (
          <div className="text-center text-xs text-slate-500 font-semibold pt-2 border-t border-slate-100">
            Remembered your password?{' '}
            <Link to="/login" className="text-rose-600 font-black hover:underline">
              Sign In Here
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;
