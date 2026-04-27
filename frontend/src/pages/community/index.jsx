import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'react-hot-toast';
import { paymentsAPI } from '../../services/api';
import { AppLayout } from '../../components/layout';

const CommunityPage = () => {
  const navigate = useNavigate();
  const [telegramUrl, setTelegramUrl] = useState('https://t.me/apexcloudmining');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await paymentsAPI.getPaymentSettings();
        if (response.data && response.data.telegram_community_url) {
          setTelegramUrl(response.data.telegram_community_url);
        }
      } catch (error) {
        console.error('Failed to load community settings', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  const handleJoinClick = () => {
    if (telegramUrl) {
      window.open(telegramUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast.error('Telegram link is currently unavailable.');
    }
  };

  return (
    <AppLayout>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 24px',
        textAlign: 'center',
        color: 'var(--apex-text)',
      }}>
        
        {/* Telegram Icon */}
        <div style={{
          width: '100px',
          height: '100px',
          background: 'linear-gradient(135deg, #2AABEE, #229ED9)',
          borderRadius: '30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '32px',
          boxShadow: '0 12px 32px rgba(42, 171, 238, 0.3)'
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.5 2.5L2.5 10.5L9.5 13.5L18.5 5.5L11.5 14.5L11.5 20.5L15.5 16.5L21.5 2.5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '32px',
          fontWeight: '800',
          marginBottom: '16px',
          letterSpacing: '-0.5px'
        }}>
          Join Our Community! 📢
        </h1>

        {/* Subtitle */}
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#2AABEE',
          marginBottom: '24px'
        }}>
          Stay updated with bonuses & rewards
        </h3>

        {/* Description */}
        <p style={{
          fontSize: '16px',
          lineHeight: '1.6',
          color: 'var(--apex-muted)',
          maxWidth: '400px',
          marginBottom: '40px'
        }}>
          Join our official Telegram channel for exclusive updates on bonuses, withdrawals, and special rewards! 💰
        </p>

        {/* Button */}
        <button 
          onClick={handleJoinClick}
          disabled={loading}
          style={{
            width: '100%',
            maxWidth: '350px',
            background: '#2AABEE',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            padding: '18px 24px',
            fontSize: '18px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.3s ease',
            boxShadow: '0 8px 24px rgba(42, 171, 238, 0.25)'
          }}
          onMouseEnter={(e) => {
            if(!loading) e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            if(!loading) e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.5 2.5L2.5 10.5L9.5 13.5L18.5 5.5L11.5 14.5L11.5 20.5L15.5 16.5L21.5 2.5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {loading ? 'Loading...' : 'Join Telegram Channel'}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginLeft: '4px'}}>
            <path d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 3H21V9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 14L21 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

      </div>
    </AppLayout>
  );
};

export default CommunityPage;
