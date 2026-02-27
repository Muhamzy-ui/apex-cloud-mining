/**
 * APEX MINING - AUTH PAGES (COMPLETE WITH PASSWORD TOGGLE)
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
              // Eye Open
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            ) : (
              // Eye Closed
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
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
   LOGIN PAGE
   ============================================================ */
export const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const { login, isLoading } = useAuthStore();
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
    }
  };

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
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    const result = await register(form);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  const countryOpts = [
    { value: 'NG', label: 'Nigeria' },
    { value: 'GH', label: 'Ghana' },
    { value: 'KE', label: 'Kenya' },
    { value: 'ZA', label: 'South Africa' },
    { value: 'OT', label: 'Other' },
  ];

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
            placeholder="Min. 6 characters"
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
   FORGOT PASSWORD PAGE
   ============================================================ */
export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authAPI.forgotPassword(email);
      setSent(true);
      toast.success('Reset link sent!');
    } catch (err) {
      toast.success('If email exists, reset link sent');
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

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
          Reset Password
        </h2>
        <p style={{
          fontSize: '13px',
          color: 'var(--apex-muted)',
          marginBottom: '28px',
        }}>
          {sent ? 'Check your email for reset link' : 'Enter your email'}
        </p>

        {!sent ? (
          <form onSubmit={handleSubmit}>
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" fullWidth loading={loading}>
              Send Reset Link
            </Button>
          </form>
        ) : (
          <Button fullWidth onClick={() => navigate('/login')}>
            Back to Sign In
          </Button>
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