/**
 * Apex Cloud Mining — Core UI Components
 */
import React from 'react';

// ============================================================
// Button
// ============================================================
export const Button = ({
  children, variant = 'primary', size = 'md',
  loading = false, disabled = false, fullWidth = false,
  onClick, type = 'button', className = '', icon, ...props
}) => {
  const base = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '8px', borderRadius: '14px', fontFamily: 'var(--font-display)',
    fontWeight: 700, cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s', border: 'none', width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.6 : 1,
  };

  const sizes = {
    sm: { padding: '10px 16px', fontSize: '13px' },
    md: { padding: '15px 24px', fontSize: '15px' },
    lg: { padding: '18px 32px', fontSize: '16px' },
  };

  const variants = {
    primary: {
      background: 'linear-gradient(135deg, var(--apex-blue), #0044DD)',
      color: '#fff',
      boxShadow: '0 8px 24px rgba(26,111,255,0.3)',
    },
    secondary: {
      background: 'transparent',
      color: 'var(--apex-blue)',
      border: '1px solid var(--apex-border)',
    },
    danger: {
      background: 'linear-gradient(135deg, #CC2244, var(--apex-red))',
      color: '#fff',
      boxShadow: '0 8px 24px rgba(255,77,106,0.3)',
    },
    ghost: {
      background: 'rgba(26,111,255,0.08)',
      color: 'var(--apex-blue)',
    },
    success: {
      background: 'linear-gradient(135deg, #00A876, var(--apex-green))',
      color: '#fff',
      boxShadow: '0 8px 24px rgba(0,211,149,0.25)',
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{ ...base, ...sizes[size], ...variants[variant] }}
      {...props}
    >
      {loading
        ? <span className="spinner" />
        : <>
            {icon && icon}
            {children}
          </>
      }
    </button>
  );
};

// ============================================================
// Input
// ============================================================
export const Input = ({
  label, error, hint, type = 'text',
  value, onChange, placeholder, disabled = false,
  icon, rightElement, ...props
}) => (
  <div style={{ marginBottom: '18px' }}>
    {label && (
      <label style={{
        display: 'block', fontSize: '12px', fontWeight: 600,
        color: 'var(--apex-muted)', textTransform: 'uppercase',
        letterSpacing: '1px', marginBottom: '8px',
      }}>
        {label}
      </label>
    )}
    <div style={{ position: 'relative' }}>
      {icon && (
        <span style={{
          position: 'absolute', left: '14px', top: '50%',
          transform: 'translateY(-50%)', color: 'var(--apex-muted)',
          display: 'flex', alignItems: 'center',
        }}>
          {icon}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%',
          background: 'var(--apex-navy)',
          border: `1px solid ${error ? 'var(--apex-red)' : 'var(--apex-border)'}`,
          borderRadius: '12px',
          padding: icon ? '14px 16px 14px 42px' : '14px 16px',
          paddingRight: rightElement ? '48px' : '16px',
          color: 'var(--apex-text)',
          fontSize: '14px',
          outline: 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          opacity: disabled ? 0.6 : 1,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--apex-blue)';
          e.target.style.boxShadow  = '0 0 0 3px rgba(26,111,255,0.1)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? 'var(--apex-red)' : 'var(--apex-border)';
          e.target.style.boxShadow  = 'none';
        }}
        {...props}
      />
      {rightElement && (
        <span style={{
          position: 'absolute', right: '14px', top: '50%',
          transform: 'translateY(-50%)',
        }}>
          {rightElement}
        </span>
      )}
    </div>
    {error && <p style={{ fontSize: '12px', color: 'var(--apex-red)', marginTop: '6px' }}>{error}</p>}
    {hint && !error && <p style={{ fontSize: '12px', color: 'var(--apex-muted)', marginTop: '6px' }}>{hint}</p>}
  </div>
);

// ============================================================
// Card
// ============================================================
export const Card = ({ children, style = {}, onClick, className = '' }) => (
  <div
    onClick={onClick}
    style={{
      background: 'var(--apex-card)',
      border: '1px solid var(--apex-border)',
      borderRadius: '20px',
      padding: '20px',
      cursor: onClick ? 'pointer' : 'default',
      transition: onClick ? 'all 0.2s' : 'none',
      ...style,
    }}
    onMouseEnter={onClick ? (e) => {
      e.currentTarget.style.borderColor = 'rgba(26,111,255,0.35)';
      e.currentTarget.style.transform   = 'translateY(-1px)';
    } : undefined}
    onMouseLeave={onClick ? (e) => {
      e.currentTarget.style.borderColor = 'var(--apex-border)';
      e.currentTarget.style.transform   = 'translateY(0)';
    } : undefined}
  >
    {children}
  </div>
);

// ============================================================
// Badge
// ============================================================
export const Badge = ({ children, color = 'blue' }) => {
  const colors = {
    blue:   { bg: 'rgba(26,111,255,0.15)',  text: 'var(--apex-blue)',  border: 'rgba(26,111,255,0.3)'  },
    green:  { bg: 'rgba(0,211,149,0.15)',   text: 'var(--apex-green)', border: 'rgba(0,211,149,0.3)'   },
    gold:   { bg: 'rgba(245,166,35,0.15)',  text: 'var(--apex-gold)',  border: 'rgba(245,166,35,0.3)'  },
    red:    { bg: 'rgba(255,77,106,0.15)',  text: 'var(--apex-red)',   border: 'rgba(255,77,106,0.3)'  },
  };
  const c = colors[color] || colors.blue;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '4px 12px', borderRadius: '20px',
      fontSize: '12px', fontWeight: 700,
      background: c.bg, color: c.text,
      border: `1px solid ${c.border}`,
      fontFamily: 'var(--font-display)',
    }}>
      {children}
    </span>
  );
};

// ============================================================
// Select
// ============================================================
export const Select = ({ label, options = [], value, onChange, error }) => (
  <div style={{ marginBottom: '18px' }}>
    {label && (
      <label style={{
        display: 'block', fontSize: '12px', fontWeight: 600,
        color: 'var(--apex-muted)', textTransform: 'uppercase',
        letterSpacing: '1px', marginBottom: '8px',
      }}>
        {label}
      </label>
    )}
    <select
      value={value}
      onChange={onChange}
      style={{
        width: '100%', background: 'var(--apex-navy)',
        border: '1px solid var(--apex-border)', borderRadius: '12px',
        padding: '14px 16px', color: 'var(--apex-text)',
        fontSize: '14px', outline: 'none', appearance: 'none',
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} style={{ background: 'var(--apex-navy)' }}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <p style={{ fontSize: '12px', color: 'var(--apex-red)', marginTop: '6px' }}>{error}</p>}
  </div>
);

// ============================================================
// SectionTitle
// ============================================================
export const SectionTitle = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
    <div style={{
      width: '10px', height: '10px', borderRadius: '50%',
      background: 'var(--apex-blue)',
      boxShadow: '0 0 8px var(--apex-blue)',
    }} />
    <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700 }}>
      {children}
    </span>
  </div>
);

// ============================================================
// PageHeader (with back button)
// ============================================================
export const PageHeader = ({ title, onBack, right }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '14px',
    padding: '24px var(--page-pad) 0', marginBottom: '20px',
  }}>
    {onBack && (
      <button
        onClick={onBack}
        style={{
          width: '40px', height: '40px',
          background: 'var(--apex-card)', border: '1px solid var(--apex-border)',
          borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, cursor: 'pointer',
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
    )}
    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, flex: 1 }}>
      {title}
    </h2>
    {right && right}
  </div>
);

// ============================================================
// EmptyState
// ============================================================
export const EmptyState = ({ icon = '📭', title, message }) => (
  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
    <div style={{ fontSize: '40px', marginBottom: '12px' }}>{icon}</div>
    <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: '6px' }}>{title}</h4>
    <p style={{ fontSize: '13px', color: 'var(--apex-muted)', lineHeight: 1.6 }}>{message}</p>
  </div>
);