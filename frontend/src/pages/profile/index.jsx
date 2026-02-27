/**
 * APEX MINING - COMPLETE PROFILE SYSTEM
 * - View profile
 * - Edit profile (name, phone, avatar)
 * - Change password
 * - Notification panel
 * - Theme toggle
 * - Logout
 */
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { AppLayout } from '../../components/layout';
import { Card, SectionTitle } from '../../components/ui';
import useAuthStore from '../../context/authStore';
import useThemeStore from '../../context/themeStore';
import useNotificationStore from '../../context/notificationStore';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

/* ============================================================
   NOTIFICATION PANEL
   ============================================================ */
const NotifPanel = ({ onClose }) => {
  const { notifications, markRead, markAllRead, remove, clearAll, unreadCount } = useNotificationStore();
  const count = unreadCount();

  const formatTime = (iso) => {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 400,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        position: 'absolute',
        top: 70,
        right: 16,
        width: 340,
        maxWidth: 'calc(100vw - 32px)',
        background: 'var(--apex-card)',
        border: '1px solid var(--apex-border)',
        borderRadius: 20,
        boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
        overflow: 'hidden',
        animation: 'fadeUp 0.2s ease',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 18px',
          borderBottom: '1px solid var(--apex-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800 }}>
              Notifications
            </span>
            {count > 0 && (
              <span style={{
                background: 'var(--apex-blue)',
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 20,
              }}>
                {count}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {count > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  fontSize: 11,
                  color: 'var(--apex-blue)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                style={{
                  fontSize: 11,
                  color: 'var(--apex-red)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div style={{ maxHeight: 380, overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🔔</div>
              <div style={{ fontSize: 14, color: 'var(--apex-muted)' }}>
                No notifications yet
              </div>
              <div style={{ fontSize: 12, color: 'var(--apex-dim)', marginTop: 4 }}>
                Activity will appear here
              </div>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '14px 18px',
                  borderBottom: '1px solid rgba(26,111,255,0.06)',
                  background: n.read ? 'transparent' : 'rgba(26,111,255,0.04)',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(26,111,255,0.06)'}
                onMouseLeave={(e) => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(26,111,255,0.04)'}
              >
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: 'rgba(26,111,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  flexShrink: 0,
                }}>
                  {n.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 2,
                    color: n.read ? 'var(--apex-muted)' : 'var(--apex-text)',
                  }}>
                    {n.title}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: 'var(--apex-muted)',
                    lineHeight: 1.5,
                  }}>
                    {n.message}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: 'var(--apex-dim)',
                    marginTop: 4,
                  }}>
                    {formatTime(n.time)}
                  </div>
                </div>
                {!n.read && (
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--apex-blue)',
                    flexShrink: 0,
                    marginTop: 6,
                  }} />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(n.id);
                  }}
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 12,
                    background: 'none',
                    border: 'none',
                    color: 'var(--apex-dim)',
                    cursor: 'pointer',
                    fontSize: 16,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   PROFILE PAGE
   ============================================================ */
export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { unreadCount } = useNotificationStore();
  
  const [uploading, setUploading] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const fileInputRef = useRef(null);
  
  const avatarUrl = user?.avatar 
    ? `http://localhost:8000${user.avatar}` 
    : null;
  
  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'User';
  
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Max 5MB');
      return;
    }
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      await authAPI.updateProfile(formData);
      toast.success('Photo updated!');
      await refreshUser();
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppLayout>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        paddingTop: 16,
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 800,
          }}>
            My Profile
          </h1>
          <p style={{
            fontSize: 13,
            color: 'var(--apex-muted)',
            marginTop: 4,
          }}>
            Manage your account & settings
          </p>
        </div>

        {/* Notification Bell - FIXED */}
        <button
          onClick={() => setShowNotif(true)}
          style={{
            position: 'relative',
            width: 44,
            height: 44,
            background: 'var(--apex-card)',
            border: '1px solid var(--apex-border)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          
          {unreadCount() > 0 && (
            <div style={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 20,
              height: 20,
              background: 'var(--apex-red)',
              border: '2px solid var(--apex-dark)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              color: '#fff',
            }}>
              {unreadCount() > 9 ? '9+' : unreadCount()}
            </div>
          )}
        </button>
      </div>

      {/* Profile Card */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '20px 0',
        }}>
          {/* Avatar */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <div style={{
              width: 100,
              height: 100,
              borderRadius: 20,
              border: '3px solid var(--apex-border)',
              overflow: 'hidden',
              background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #1A6FFF, #00C6FF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={firstName}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <span style={{
                  fontSize: 40,
                  fontWeight: 800,
                  color: '#fff',
                }}>
                  {firstName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            
            {/* Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                position: 'absolute',
                bottom: -8,
                right: -8,
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--apex-blue)',
                border: '3px solid var(--apex-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: uploading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(26, 111, 255, 0.3)',
              }}
            >
              {uploading ? (
                <div style={{ width: 16, height: 16, border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              ) : (
                <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              )}
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
          </div>
          
          {/* User info */}
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            fontWeight: 800,
            marginBottom: 4,
          }}>
            {user?.full_name}
          </h2>
          <p style={{
            fontSize: 14,
            color: 'var(--apex-muted)',
            marginBottom: 8,
          }}>
            {user?.email}
          </p>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(26, 111, 255, 0.1)',
            border: '1px solid rgba(26, 111, 255, 0.2)',
            borderRadius: 20,
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--apex-blue)',
          }}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            Plan {user?.tier || 1}
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle>Account Statistics</SectionTitle>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
        }}>
          <div style={{
            background: 'var(--apex-navy)',
            borderRadius: 12,
            padding: 16,
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: 11,
              color: 'var(--apex-muted)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: 6,
            }}>
              Total Earned
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 20,
              fontWeight: 800,
              color: 'var(--apex-green)',
            }}>
              ${parseFloat(user?.total_earned || 0).toFixed(2)}
            </div>
          </div>

          <div style={{
            background: 'var(--apex-navy)',
            borderRadius: 12,
            padding: 16,
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: 11,
              color: 'var(--apex-muted)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: 6,
            }}>
              Balance
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 20,
              fontWeight: 800,
              color: 'var(--apex-blue)',
            }}>
              ${parseFloat(user?.balance_usdt || 0).toFixed(2)}
            </div>
          </div>

          <div style={{
            background: 'var(--apex-navy)',
            borderRadius: 12,
            padding: 16,
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: 11,
              color: 'var(--apex-muted)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: 6,
            }}>
              Status
            </div>
            <div style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--apex-green)',
            }}>
              ● Active
            </div>
          </div>

          <div style={{
            background: 'var(--apex-navy)',
            borderRadius: 12,
            padding: 16,
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: 11,
              color: 'var(--apex-muted)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: 6,
            }}>
              Joined
            </div>
            <div style={{
              fontSize: 14,
              fontWeight: 700,
            }}>
              {user?.date_joined 
                ? new Date(user.date_joined).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                : 'Feb 2026'}
            </div>
          </div>
        </div>
      </Card>

      {/* Settings Menu */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle>Settings</SectionTitle>
        
        {/* Edit Profile */}
        <div
          onClick={() => navigate('/edit-profile')}
          style={{
            padding: '16px 0',
            borderBottom: '1px solid var(--apex-border)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              background: 'rgba(26, 111, 255, 0.1)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--apex-blue)" strokeWidth="2" width="20" height="20">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Edit Profile</div>
              <div style={{ fontSize: 12, color: 'var(--apex-muted)' }}>Update name, phone, photo</div>
            </div>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--apex-muted)" strokeWidth="2" width="18" height="18">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>

        {/* Change Password */}
        <div
          onClick={() => navigate('/change-password')}
          style={{
            padding: '16px 0',
            borderBottom: '1px solid var(--apex-border)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              background: 'rgba(26, 111, 255, 0.1)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--apex-blue)" strokeWidth="2" width="20" height="20">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Change Password</div>
              <div style={{ fontSize: 12, color: 'var(--apex-muted)' }}>Update your password</div>
            </div>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--apex-muted)" strokeWidth="2" width="18" height="18">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>

        {/* History */}
        <div
          onClick={() => navigate('/history')}
          style={{
            padding: '16px 0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              background: 'rgba(26, 111, 255, 0.1)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--apex-blue)" strokeWidth="2" width="20" height="20">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Transaction History</div>
              <div style={{ fontSize: 12, color: 'var(--apex-muted)' }}>View all transactions</div>
            </div>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--apex-muted)" strokeWidth="2" width="18" height="18">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </Card>

      {/* Referral (Admin Only) */}
      {user?.is_admin && (
        <Card style={{ marginBottom: 20 }}>
          <SectionTitle>Referral Link (Admin)</SectionTitle>
          <div style={{
            background: 'var(--apex-navy)',
            border: '1px solid var(--apex-border)',
            borderRadius: 12,
            padding: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <input
              type="text"
              value={`https://apexmining.com/ref/${user.referral_code}`}
              readOnly
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: 'var(--apex-blue)',
                fontSize: 13,
                fontFamily: 'monospace',
                outline: 'none',
              }}
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(`https://apexmining.com/ref/${user.referral_code}`);
                toast.success('Link copied!');
              }}
              style={{
                background: 'var(--apex-blue)',
                border: 'none',
                borderRadius: 8,
                padding: '8px 14px',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Copy
            </button>
          </div>
        </Card>
      )}

      {/* Theme */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle>Appearance</SectionTitle>
        
        <div
          onClick={toggleTheme}
          style={{
            background: 'var(--apex-navy)',
            border: '1px solid var(--apex-border)',
            borderRadius: 14,
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44,
              height: 44,
              background: theme === 'dark' ? 'rgba(26, 111, 255, 0.1)' : 'rgba(245, 166, 35, 0.1)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}>
              {theme === 'dark' ? '🌙' : '☀️'}
            </div>
            
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--apex-muted)' }}>
                {theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
              </div>
            </div>
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
      </Card>

      {/* Logout */}
      <button
        onClick={() => {
          logout();
          navigate('/login');
        }}
        style={{
          width: '100%',
          padding: '16px',
          background: 'rgba(255, 77, 106, 0.1)',
          border: '1px solid rgba(255, 77, 106, 0.2)',
          borderRadius: 14,
          color: 'var(--apex-red)',
          fontFamily: 'var(--font-display)',
          fontSize: 15,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Logout
      </button>

      {/* Notification Panel */}
      {showNotif && <NotifPanel onClose={() => setShowNotif(false)} />}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </AppLayout>
  );
};

/* ============================================================
   EDIT PROFILE PAGE
   ============================================================ */
export const EditProfilePage = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await authAPI.updateProfile({
        full_name: fullName,
        phone: phone,
      });
      
      toast.success('Profile updated!');
      await refreshUser();
      navigate('/profile');
    } catch (err) {
      toast.error('Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        marginBottom: 24,
        paddingTop: 16,
      }}>
        <button
          onClick={() => navigate('/profile')}
          style={{
            width: 40,
            height: 40,
            background: 'var(--apex-card)',
            border: '1px solid var(--apex-border)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontWeight: 800,
        }}>
          Edit Profile
        </h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--apex-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: 8,
            }}>
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'var(--apex-navy)',
                border: '1px solid var(--apex-border)',
                borderRadius: 12,
                color: 'var(--apex-text)',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--apex-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: 8,
            }}>
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'var(--apex-navy)',
                border: '1px solid var(--apex-border)',
                borderRadius: 12,
                color: 'var(--apex-text)',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: loading ? 'var(--apex-card2)' : 'linear-gradient(135deg, #1A6FFF, #0044DD)',
              border: 'none',
              borderRadius: 14,
              color: loading ? 'var(--apex-muted)' : '#fff',
              fontFamily: 'var(--font-display)',
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 8px 24px rgba(26, 111, 255, 0.3)',
            }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </Card>
    </AppLayout>
  );
};

/* ============================================================
   CHANGE PASSWORD PAGE
   ============================================================ */
export const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      await authAPI.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      
      toast.success('Password changed!');
      navigate('/profile');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const PasswordInput = ({ label, value, onChange, show, toggleShow }) => (
    <div style={{ marginBottom: 20 }}>
      <label style={{
        display: 'block',
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--apex-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: 8,
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder="••••••••"
          style={{
            width: '100%',
            padding: '14px 16px',
            paddingRight: '48px',
            background: 'var(--apex-navy)',
            border: '1px solid var(--apex-border)',
            borderRadius: 12,
            color: 'var(--apex-text)',
            fontSize: 14,
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={toggleShow}
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            color: 'var(--apex-muted)',
          }}
        >
          {show ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        marginBottom: 24,
        paddingTop: 16,
      }}>
        <button
          onClick={() => navigate('/profile')}
          style={{
            width: 40,
            height: 40,
            background: 'var(--apex-card)',
            border: '1px solid var(--apex-border)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontWeight: 800,
        }}>
          Change Password
        </h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <PasswordInput
            label="Current Password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            show={showOld}
            toggleShow={() => setShowOld(!showOld)}
          />

          <PasswordInput
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            show={showNew}
            toggleShow={() => setShowNew(!showNew)}
          />

          <PasswordInput
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            show={showConfirm}
            toggleShow={() => setShowConfirm(!showConfirm)}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: loading ? 'var(--apex-card2)' : 'linear-gradient(135deg, #1A6FFF, #0044DD)',
              border: 'none',
              borderRadius: 14,
              color: loading ? 'var(--apex-muted)' : '#fff',
              fontFamily: 'var(--font-display)',
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 8px 24px rgba(26, 111, 255, 0.3)',
            }}
          >
            {loading ? 'Changing...' : 'Update Password'}
          </button>
        </form>
      </Card>
    </AppLayout>
  );
};