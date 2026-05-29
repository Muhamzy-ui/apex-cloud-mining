import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout, ApexLogo } from '../../components/layout';
import { Button } from '../../components/ui';
import useAuthStore from '../../context/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';

const cardStyle = {
  background: 'var(--apex-card)',
  border: '1px solid var(--apex-border)',
  borderRadius: '24px',
  padding: '36px 32px',
  boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
  textAlign: 'center',
};

export const TelegramGatePage = () => {
  const { user, refreshUser } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [telegramUrl, setTelegramUrl] = useState('https://t.me/apexcloudmining');
  const [countdown, setCountdown] = useState(5);
  const [popupBlocked, setPopupBlocked] = useState(false);

  // Load telegram URL from admin settings and attempt to auto-open
  useEffect(() => {
    api.get('/payments/settings/').then(res => {
      const url = res.data?.telegram_gate_url || res.data?.telegram_community_url;
      const targetUrl = url || telegramUrl;
      if (url) setTelegramUrl(url);
      
      // Auto-open telegram group
      try {
        const popup = window.open(targetUrl, '_blank');
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          setPopupBlocked(true);
        }
      } catch (e) {
        setPopupBlocked(true);
      }
    }).catch(() => {
      // Fallback auto-open with default URL
      try {
        const popup = window.open(telegramUrl, '_blank');
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          setPopupBlocked(true);
        }
      } catch (e) {
        setPopupBlocked(true);
      }
    });
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleJoin = async () => {
    // Open Telegram in a new tab
    window.open(telegramUrl, '_blank');
    
    setLoading(true);
    try {
      await api.post('/auth/mark-telegram-joined/');
      await refreshUser(); 
      toast.success('Thank you for joining our community!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to verify. Please try again.');
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      await api.post('/auth/mark-telegram-joined/');
      await refreshUser();
      toast.success('Redirecting to dashboard...');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to skip. Please try again.');
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <ApexLogo />
      <div style={cardStyle} className="animate-fade-up">
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '64px', height: '64px', background: 'rgba(26,111,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" fill="var(--apex-blue)" width="32" height="32">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.18-.08-.04-.19-.02-.27 0-.12.03-1.99 1.26-5.61 3.71-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.05-.49-.83-.27-1.49-.41-1.43-.87.03-.24.36-.48.99-.74 3.88-1.69 6.46-2.8 7.74-3.34 3.68-1.55 4.45-1.81 4.95-1.82.11 0 .35.03.48.14.11.09.14.22.15.31.02.1-.01.21-.02.31z"/>
            </svg>
          </div>
        </div>
        
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
          Join Our Community
        </h2>
        
        <p style={{ fontSize: '13px', color: 'var(--apex-muted)', marginBottom: '28px', lineHeight: 1.6 }}>
          To access your dashboard and start earning, you must join our official Telegram channel for updates, support, and announcements.
        </p>

        {popupBlocked && (
          <div style={{
            background: 'rgba(255, 77, 106, 0.1)',
            border: '1px solid rgba(255, 77, 106, 0.2)',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '12px',
            color: '#FF4D6A',
            marginBottom: '20px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span>⚠️</span>
            <span>Popup blocked. Please click the button below to open Telegram manually.</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            onClick={handleJoin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, var(--apex-blue), #0044DD)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Processing...' : 'Join Telegram Channel'}
          </button>

          <button 
            onClick={handleSkip}
            disabled={countdown > 0 || loading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: countdown > 0 ? 'var(--apex-muted)' : '#fff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: (countdown > 0 || loading) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: (countdown > 0 || loading) ? 0.5 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            {countdown > 0 ? `Skip in ${countdown}s...` : 'Skip'}
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};
