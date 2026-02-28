/**
 * Apex Cloud Mining — Layout System
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router';
import useThemeStore from '../../context/themeStore';

export const Sidebar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <aside style={{}}>
      {/* Logo */}
      <div style={{}}>
        <h1>Apex</h1>
      </div>

      {/* THEME TOGGLE */}
      <div
        onClick={toggleTheme}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          background: 'var(--apex-navy)',
          border: '1px solid var(--apex-border)',
          borderRadius: 14,
          cursor: 'pointer',
          marginBottom: 24,
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--apex-card)';
          e.currentTarget.style.borderColor = 'var(--apex-blue)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--apex-navy)';
          e.currentTarget.style.borderColor = 'var(--apex-border)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>
            {theme === 'dark' ? '🌙' : '☀️'}
          </span>
          <span style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--apex-text)'
          }}>
            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </span>
        </div>

        <div style={{
          width: 51,
          height: 31,
          background: theme === 'dark' ? '#1A6FFF' : '#CBD5E1',
          borderRadius: 16,
          position: 'relative',
          transition: 'background 0.3s ease',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
        }}>
          <div style={{
            position: 'absolute',
            width: 27,
            height: 27,
            background: '#FFFFFF',
            borderRadius: '50%',
            top: 2,
            left: theme === 'dark' ? 22 : 2,
            transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }} />
        </div>
      </div>
    </aside>
  );
};

// ============================================================
// Floating iOS Bottom Navigation
// ============================================================

const BOTTOM_ITEMS = [
  {
    path: '/dashboard',
    label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
      </svg>
    )
  },
  {
    path: '/upgrade',
    label: 'Upgrade',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    )
  },
  {
    path: '/withdraw',
    label: 'Withdraw',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" stroke="var(--apex-dark)" strokeWidth="2" />
      </svg>
    )
  },
  {
    path: '/profile',
    label: 'Profile',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    )
  }
];

export const BottomNav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav style={{
      // Works on ALL devices now
      position: 'fixed',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 32px)',
      maxWidth: 420, // Looks good on desktop too

      // Glassmorphism
      background: 'rgba(30, 41, 59, 0.72)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',

      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: 28,
      padding: '6px',

      boxShadow: `
        0 8px 32px rgba(0, 0, 0, 0.37),
        inset 0 1px 0 rgba(255, 255, 255, 0.08)
      `,

      display: 'flex',
      gap: 4,
      zIndex: 100,

      animation: 'slideUpFade 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    }}>
      {BOTTOM_ITEMS.map((item) => {
        const isActive = pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: '12px 8px',
              background: isActive ? 'rgba(26, 111, 255, 0.15)' : 'transparent',
              border: 'none',
              borderRadius: 20,
              cursor: 'pointer',
              color: isActive ? '#1A6FFF' : 'rgba(255, 255, 255, 0.55)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isActive ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            {item.icon}
            <span style={{
              fontSize: 11,
              fontWeight: isActive ? 600 : 500,
              letterSpacing: '-0.3px',
            }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

// ============================================================
// Main App Layout
// ============================================================

export const AppLayout = ({ children }) => (
  <div style={{ minHeight: '100vh', paddingBottom: '100px' }}>
    {children}
    <BottomNav />
  </div>
);

// ============================================================
// Auth Layout
// ============================================================

export const AuthLayout = ({ children }) => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  }}>
    <div style={{ width: '100%', maxWidth: 420 }}>
      {children}
    </div>
  </div>
);

// ============================================================
// ApexLogo
// ============================================================

export const ApexLogo = ({ size = 'md' }) => {
  const sizeMap = { sm: 64, md: 96, lg: 120 };
  const s = sizeMap[size] || 96;

  return (
    <div style={{ textAlign: 'center', marginBottom: 36 }}>
      <img
        src="/logo.png"
        alt="Apex Mining"
        style={{
          width: s,
          height: s,
          borderRadius: '50%',
          objectFit: 'cover',
          margin: '0 auto 16px',
          display: 'block',
          boxShadow: '0 8px 32px rgba(245, 166, 35, 0.3)',
        }}
      />
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 28,
        fontWeight: 800,
        marginBottom: 4,
        background: 'linear-gradient(135deg, #1A6FFF, #F5A623)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        Apex Mining
      </h1>
      <p style={{ fontSize: 13, color: 'var(--apex-muted)' }}>
        Mine. Earn. Grow.
      </p>
    </div>
  );
};
