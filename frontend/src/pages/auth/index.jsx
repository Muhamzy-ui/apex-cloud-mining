/**
 * APEX MINING - AUTH PAGES (WITH EMAIL VERIFICATION & PASSWORD RESET)
 */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { AuthLayout, ApexLogo } from '../../components/layout';
import { Button, Select } from '../../components/ui';
import useAuthStore from '../../context/authStore';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

const cardStyle = {
  background: 'var(--apex-card)',
  border: '1px solid var(--apex-border)',
  borderRadius: '24px',
  padding: '36px 32px',
  boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
};

const footerStyle = {
  textAlign: 'center',
  marginTop: '20px',
  fontSize: '13px',
  color: 'var(--apex-muted)',
};

const linkStyle = {
  color: 'var(--apex-blue)',
  fontWeight: 600,
  textDecoration: 'none',
};

const divider = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  margin: '18px 0',
  color: 'var(--apex-muted)',
  fontSize: '12px',
};

const divLine = {
  flex: 1,
  height: '1px',
  background: 'var(--apex-border)',
};

// Input with Password Toggle
const InputWithToggle = ({ label, type, placeholder, value, onChange, required }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block',
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--apex-text)',
        marginBottom: '8px',
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          style={{
            width: '100%',
            padding: '14px 16px',
            paddingRight: isPassword ? '48px' : '16px',
            background: 'var(--apex-navy)',
            border: '1px solid var(--apex-border)',
            borderRadius: '12px',
            color: 'var(--apex-text)',
            fontSize: '14px',
            outline: 'none',
            transition: 'border 0.2s',
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--apex-blue)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--apex-border)'}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--apex-muted)',
            }}
          >
            {showPassword ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// Regular Input
const Input = ({ label, type = 'text', placeholder, value, onChange, required }) => {
  if (type === 'password') {
    return <InputWithToggle label={label} type={type} placeholder={placeholder} value={value} onChange={onChange} required={required} />;
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block',
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--apex-text)',
        marginBottom: '8px',
      }}>
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        style={{
          width: '100%',
          padding: '14px 16px',
          background: 'var(--apex-navy)',
          border: '1px solid var(--apex-border)',
          borderRadius: '12px',
          color: 'var(--apex-text)',
          fontSize: '14px',
          outline: 'none',
        }}
        onFocus={(e) => e.target.style.borderColor = 'var(--apex-blue)'}
        onBlur={(e) => e.target.style.borderColor = 'var(--apex-border)'}
      />
    </div>
  );
};

/* ============================================================
   OTP CODE INPUT (6 digit)
   ============================================================ */
const OtpInput = ({ value, onChange }) => {
  const digits = (value + '      ').slice(0, 6).split('');
  const inputRef = React.useRef();

  return (
    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', margin: '24px 0' }}>
      {digits.map((d, i) => (
        <div key={i} style={{
          width: '48px', height: '56px',
          background: 'var(--apex-navy)',
          border: `2px solid ${value.length === i ? 'var(--apex-blue)' : 'var(--apex-border)'}`,
          borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px', fontWeight: 700, color: 'var(--apex-text)',
          transition: 'border 0.2s',
          cursor: 'text',
        }} onClick={() => inputRef.current?.focus()}>
          {d.trim()}
        </div>
      ))}
      <input
        ref={inputRef}
        type="tel"
        maxLength={6}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        style={{
          position: 'absolute',
          opacity: 0,
          width: 0,
          height: 0,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

/* ============================================================
   EMAIL VERIFICATION PANEL
   ============================================================ */
const EmailVerificationPanel = ({ email, onVerified, onBack }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { setAuth } = useAuthStore();

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length < 6) { toast.error('Enter all 6 digits'); return; }

    setLoading(true);
    try {
      const { data } = await authAPI.verifyEmail({ email, code });
      // Save tokens and user
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      if (setAuth) setAuth(data.user, data.access, data.refresh);
      toast.success('Email verified! Welcome to Apex Mining 🎉');
      onVerified();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authAPI.resendVerification(email);
      toast.success('New code sent to your email!');
      setCode('');
    } catch (err) {
      toast.error('Could not resend code. Try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={cardStyle} className="animate-fade-up">
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📬</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>
          Check Your Email
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--apex-muted)' }}>
          We sent a 6-digit code to
        </p>
        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--apex-blue)', marginTop: '4px' }}>
          {email}
        </p>
      </div>

      <form onSubmit={handleVerify}>
        <OtpInput value={code} onChange={setCode} />

        <Button type="submit" fullWidth loading={loading} disabled={code.length < 6}>
          Verify Email
        </Button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--apex-muted)' }}>
        Didn't receive it?{' '}
        <button
          onClick={handleResend}
          disabled={resending}
          style={{ background: 'none', border: 'none', color: 'var(--apex-blue)', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
        >
          {resending ? 'Sending...' : 'Resend Code'}
        </button>
      </div>

      {onBack && (
        <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--apex-muted)', cursor: 'pointer', fontSize: '13px' }}>
            ← Back
          </button>
        </div>
      )}
    </div>
  );
};

/* ============================================================
   LOGIN PAGE
   ============================================================ */
export const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [verifyEmail, setVerifyEmail] = useState(null); // Stores email when unverified
  const { login, isLoading, setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill all fields');
      return;
    }

    const result = await login(form);
    if (result.success) {
      navigate('/dashboard');
    } else if (result.unverified) {
      // Account not verified — go to verification panel
      setVerifyEmail(result.email || form.email);
    }
  };

  if (verifyEmail) {
    return (
      <AuthLayout>
        <ApexLogo />
        <EmailVerificationPanel
          email={verifyEmail}
          onVerified={() => navigate('/dashboard')}
          onBack={() => setVerifyEmail(null)}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <ApexLogo />
      <div style={cardStyle} className="animate-fade-up">
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '22px',
          fontWeight: 700,
          marginBottom: '6px',
        }}>
          Welcome Back
        </h2>
        <p style={{
          fontSize: '13px',
          color: 'var(--apex-muted)',
          marginBottom: '28px',
        }}>
          Sign in to your mining account
        </p>

        <form onSubmit={handleSubmit}>
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          <Button type="submit" fullWidth loading={isLoading}>
            Sign In
          </Button>
        </form>

        <div style={footerStyle}>
          <Link to="/forgot-password" style={linkStyle}>
            Forgot Password?
          </Link>
        </div>

        <div style={divider}>
          <div style={divLine} />
          <span>or</span>
          <div style={divLine} />
        </div>

        <div style={footerStyle}>
          Don't have an account?{' '}
          <Link to="/register" style={linkStyle}>
            Create Account
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

/* ============================================================
   REGISTER PAGE
   ============================================================ */
export const RegisterPage = () => {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    country: 'NG',
    password: '',
    confirm_password: '',
    referral_code: '',
  });
  const [verifyEmail, setVerifyEmail] = useState(null);
  const { isLoading, setLoading } = useAuthStore();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      if (setLoading) setLoading(true);
      const { data } = await authAPI.register(form);
      if (data.requires_verification) {
        toast.success('Account created! Please verify your email.');
        setVerifyEmail(data.email || form.email);
      } else {
        // Fallback if verification not required (shouldn't happen)
        navigate('/dashboard');
      }
    } catch (err) {
      const errors = err.response?.data;
      if (errors) {
        if (typeof errors === 'object') {
          const msgs = Object.values(errors).flat();
          toast.error(msgs[0] || 'Registration failed');
        } else {
          toast.error('Registration failed');
        }
      }
    } finally {
      if (setLoading) setLoading(false);
    }
  };

  const countryOpts = [
    { value: 'NG', label: 'Nigeria' },
    { value: 'GH', label: 'Ghana' },
    { value: 'KE', label: 'Kenya' },
    { value: 'ZA', label: 'South Africa' },
    { value: 'OT', label: 'Other' },
  ];

  if (verifyEmail) {
    return (
      <AuthLayout>
        <ApexLogo />
        <EmailVerificationPanel
          email={verifyEmail}
          onVerified={() => navigate('/dashboard')}
          onBack={() => setVerifyEmail(null)}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <ApexLogo />
      <div style={cardStyle} className="animate-fade-up">
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '22px',
          fontWeight: 700,
          marginBottom: '6px',
        }}>
          Create Account
        </h2>
        <p style={{
          fontSize: '13px',
          color: 'var(--apex-muted)',
          marginBottom: '28px',
        }}>
          Join thousands of miners earning daily
        </p>

        <form onSubmit={handleSubmit}>
          <Input
            label="Full Name"
            type="text"
            placeholder="John Doe"
            value={form.full_name}
            onChange={set('full_name')}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set('email')}
            required
          />

          <Input
            label="Phone Number"
            type="tel"
            placeholder="+234 800 000 0000"
            value={form.phone}
            onChange={set('phone')}
            required
          />

          <Select
            label="Country"
            options={countryOpts}
            value={form.country}
            onChange={set('country')}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={set('password')}
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Repeat password"
            value={form.confirm_password}
            onChange={set('confirm_password')}
            required
          />

          <Input
            label="Referral Code (Optional)"
            type="text"
            placeholder="e.g. APEX7X3K"
            value={form.referral_code}
            onChange={set('referral_code')}
          />

          <Button type="submit" fullWidth loading={isLoading}>
            Create Account
          </Button>
        </form>

        <div style={footerStyle}>
          Already have an account?{' '}
          <Link to="/login" style={linkStyle}>
            Sign In
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

/* ============================================================
   FORGOT PASSWORD PAGE — 3 Steps:
   1) Enter email → get 6-digit code
   2) Enter code + new password → reset
   3) Success
   ============================================================ */
export const ForgotPasswordPage = () => {
  const [step, setStep] = useState('request'); // 'request' | 'reset' | 'done'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Step 1: Request reset code
  const handleRequest = async (e) => {
    e.preventDefault();
    if (!email) { toast.error('Enter your email'); return; }
    setLoading(true);
    try {
      await authAPI.requestPasswordReset(email);
      toast.success('Reset code sent to your email!');
      setStep('reset');
    } catch (err) {
      // Always show success to prevent email enumeration
      toast.success('If this email exists, a code has been sent.');
      setStep('reset');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Confirm reset
  const handleReset = async (e) => {
    e.preventDefault();
    if (code.length < 6) { toast.error('Enter all 6 digits'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }

    setLoading(true);
    try {
      await authAPI.confirmPasswordReset({ email, code, new_password: newPassword });
      toast.success('Password reset successfully!');
      setStep('done');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <ApexLogo />
      <div style={cardStyle} className="animate-fade-up">

        {/* ── Step 1: Enter email ── */}
        {step === 'request' && (
          <>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>
              Reset Password
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--apex-muted)', marginBottom: '28px' }}>
              Enter your email — we'll send a 6-digit code
            </p>
            <form onSubmit={handleRequest}>
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" fullWidth loading={loading}>
                Send Reset Code
              </Button>
            </form>
          </>
        )}

        {/* ── Step 2: Enter code + new password ── */}
        {step === 'reset' && (
          <>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>
              Enter Reset Code
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--apex-muted)', marginBottom: '4px' }}>
              Code sent to <strong style={{ color: 'var(--apex-blue)' }}>{email}</strong>
            </p>
            <form onSubmit={handleReset}>
              <OtpInput value={code} onChange={setCode} />

              <Input
                label="New Password"
                type="password"
                placeholder="Min. 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button type="submit" fullWidth loading={loading} disabled={code.length < 6}>
                Reset Password
              </Button>
            </form>
            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--apex-muted)' }}>
              Wrong email?{' '}
              <button onClick={() => { setStep('request'); setCode(''); }} style={{ background: 'none', border: 'none', color: 'var(--apex-blue)', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                Go Back
              </button>
            </div>
          </>
        )}

        {/* ── Step 3: Done ── */}
        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
              Password Reset!
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--apex-muted)', marginBottom: '24px' }}>
              Your password has been changed successfully. You can now sign in.
            </p>
            <Button fullWidth onClick={() => navigate('/login')}>
              Sign In
            </Button>
          </div>
        )}

        <div style={footerStyle}>
          <Link to="/login" style={linkStyle}>
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};