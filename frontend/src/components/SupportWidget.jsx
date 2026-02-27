/**
 * Floating Support Widget
 * Appears on all pages with configurable support links
 */
import React, { useState, useEffect } from 'react';
import { paymentsAPI } from '../services/api';

export const SupportWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [supportLinks, setSupportLinks] = useState({
    support_url: '',
    support_alt_url: '',
  });
  const [loading, setLoading] = useState(true);

  // Fetch support links from admin settings
  useEffect(() => {
    const fetchSupportLinks = async () => {
      try {
        const response = await paymentsAPI.getPaymentSettings();
        setSupportLinks({
          support_url: response.data.support_url || '',
          support_alt_url: response.data.support_alt_url || '',
        });
      } catch (error) {
        console.error('Failed to fetch support links:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSupportLinks();
  }, []);

  // Always show widget, with a hint if links aren't configured
  const hasLinks = supportLinks.support_url || supportLinks.support_alt_url;

  return (
    <>
      {/* Floating Chat Button - Always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1A6FFF 0%, #0066FF 100%)',
          border: 'none',
          boxShadow: '0 4px 16px rgba(26, 111, 255, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isOpen ? 'scale(1.1)' : 'scale(1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.15)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(26, 111, 255, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = isOpen ? 'scale(1.1)' : 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(26, 111, 255, 0.4)';
        }}
        title="Contact Support"
      >
        {/* Chat/Message Icon */}
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          width="28"
          height="28"
          style={{ color: '#FFFFFF' }}
        >
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
      </button>

      {/* Support Menu Popup */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 90,
            right: 20,
            background: 'rgba(13, 30, 53, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(26, 111, 255, 0.2)',
            borderRadius: 16,
            padding: '16px',
            minWidth: 280,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            zIndex: 998,
            animation: 'slideUpFade 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Header */}
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#E8F0FF',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>💬 Need Help?</span>
          </div>

          {/* Support Message */}
          <p
            style={{
              fontSize: 13,
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: 16,
              lineHeight: 1.5,
            }}
          >
            Our support team is available 24/7 to assist you with any questions or issues.
          </p>

          {/* Support Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {hasLinks ? (
              <> 
                {/* Primary Support Link */}
                {supportLinks.support_url && (
                  <a
                    href={supportLinks.support_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsOpen(false)}
                    style={{
                      padding: '10px 14px',
                      background: 'rgba(26, 111, 255, 0.15)',
                      border: '1px solid rgba(26, 111, 255, 0.3)',
                      borderRadius: 12,
                      color: '#1A6FFF',
                      textDecoration: 'none',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'center',
                      display: 'block',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(26, 111, 255, 0.25)';
                      e.currentTarget.style.borderColor = '#1A6FFF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(26, 111, 255, 0.15)';
                      e.currentTarget.style.borderColor = 'rgba(26, 111, 255, 0.3)';
                    }}
                  >
                    💬 Contact Support
                  </a>
                )}

                {/* Secondary Support Link */}
                {supportLinks.support_alt_url && (
                  <a
                    href={supportLinks.support_alt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsOpen(false)}
                    style={{
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 12,
                      color: 'rgba(255, 255, 255, 0.8)',
                      textDecoration: 'none',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'center',
                      display: 'block',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                  >
                    🔗 Visit Help Center
                  </a>
                )}
              </>
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                No support links configured. Please ask admin to set them in the
                payment settings.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Backdrop - close on click */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 997,
          }}
        />
      )}

      {/* Keyframe animation */}
      <style>{`
        @keyframes slideUpFade {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default SupportWidget;
