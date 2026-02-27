/**
 * APEX MINING - COMPLETE DASHBOARD
 * Features: Mining cooldown, tier expiry countdown, how-to guide
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AppLayout } from '../../components/layout';
import { Card, SectionTitle } from '../../components/ui';
import { authAPI } from '../../services/api';
import useAuthStore from '../../context/authStore';
import useNotificationStore from '../../context/notificationStore';
import toast from 'react-hot-toast';

const EARN_DAY = { 1: 1.00, 2: 50.00, 3: 130.00, 4: 399.00, 5: 1200.00 };

// Notification sound
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [1318.51, 1174.66, 1046.50];
    
    notes.forEach((freq, i) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.frequency.value = freq;
      osc.type = 'sine';
      
      const startTime = audioContext.currentTime + i * 0.15;
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
      
      osc.start(startTime);
      osc.stop(startTime + 0.15);
    });
  } catch (err) {
    console.log('Audio not supported');
  }
};

/* Countdown Ring */
const Ring = ({ seconds }) => {
  const r = 30;
  const circumference = 2 * Math.PI * r;
  const progress = seconds / 86400;
  
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  
  return (
    <div style={{ position: 'relative', width: 72, height: 72 }}>
      <svg viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
        <circle
          cx="36" cy="36" r={r} fill="none" stroke="var(--apex-gold)" strokeWidth="4"
          strokeLinecap="round" strokeDasharray={circumference}
          strokeDashoffset={circumference - circumference * progress}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, color: '#fff',
        textAlign: 'center', lineHeight: 1.2,
      }}>
        {h}:{m}:{s}
      </div>
    </div>
  );
};

/* Quick Action Card */
const QCard = ({ label, color, icon, onClick }) => (
  <div onClick={onClick} style={{
    background: 'var(--apex-card)', border: '1px solid var(--apex-border)', borderRadius: 20,
    padding: '18px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 10, cursor: 'pointer', transition: 'all 0.2s', flex: 1,
  }}>
    <div style={{
      width: 52, height: 52, borderRadius: 16, background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {icon}
    </div>
    <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
  </div>
);

/* Stat Card */
const Stat = ({ label, value, color }) => (
  <div style={{ background: 'var(--apex-navy)', borderRadius: 14, padding: 14, textAlign: 'center' }}>
    <div style={{
      fontSize: 11, color: 'var(--apex-muted)', textTransform: 'uppercase',
      letterSpacing: '1px', marginBottom: 6,
    }}>
      {label}
    </div>
    <div style={{
      fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800,
      color: color || 'var(--apex-text)',
    }}>
      {value}
    </div>
  </div>
);

/* Notification Panel */
const NotifPanel = ({ onClose }) => {
  const { notifications, markRead, markAllRead, remove, clearAll, unreadCount } = useNotificationStore();
  const count = unreadCount();

  useEffect(() => {
    if (count > 0) playNotificationSound();
  }, [count]);

  const formatTime = (iso) => {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        position: 'absolute', top: 70, right: 16, width: 340, maxWidth: 'calc(100vw - 32px)',
        background: 'var(--apex-card)', border: '1px solid var(--apex-border)', borderRadius: 20,
        boxShadow: '0 16px 48px rgba(0,0,0,0.4)', overflow: 'hidden', animation: 'fadeUp 0.2s ease',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 18px', borderBottom: '1px solid var(--apex-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800 }}>
              Notifications
            </span>
            {count > 0 && (
              <span style={{
                background: 'var(--apex-blue)', color: '#fff', fontSize: 11, fontWeight: 700,
                padding: '2px 8px', borderRadius: 20,
              }}>
                {count}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {count > 0 && (
              <button onClick={markAllRead} style={{
                fontSize: 11, color: 'var(--apex-blue)', background: 'none',
                border: 'none', cursor: 'pointer', fontWeight: 600,
              }}>
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button onClick={clearAll} style={{
                fontSize: 11, color: 'var(--apex-red)', background: 'none',
                border: 'none', cursor: 'pointer', fontWeight: 600,
              }}>
                Clear all
              </button>
            )}
          </div>
        </div>

        <div style={{ maxHeight: 380, overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🔔</div>
              <div style={{ fontSize: 14, color: 'var(--apex-muted)' }}>No notifications yet</div>
              <div style={{ fontSize: 12, color: 'var(--apex-dim)', marginTop: 4 }}>
                Activity will appear here
              </div>
            </div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} onClick={() => markRead(n.id)} style={{
                display: 'flex', gap: 12, padding: '14px 18px',
                borderBottom: '1px solid rgba(26,111,255,0.06)',
                background: n.read ? 'transparent' : 'rgba(26,111,255,0.04)',
                cursor: 'pointer', transition: 'background 0.2s', position: 'relative',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 12, background: 'rgba(26,111,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0,
                }}>
                  {n.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 700, marginBottom: 2,
                    color: n.read ? 'var(--apex-muted)' : 'var(--apex-text)',
                  }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--apex-muted)', lineHeight: 1.5 }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--apex-dim)', marginTop: 4 }}>
                    {formatTime(n.time)}
                  </div>
                </div>
                {!n.read && (
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', background: 'var(--apex-blue)',
                    flexShrink: 0, marginTop: 6,
                  }} />
                )}
                <button onClick={(e) => { e.stopPropagation(); remove(n.id); }} style={{
                  position: 'absolute', top: 10, right: 12, background: 'none', border: 'none',
                  color: 'var(--apex-dim)', cursor: 'pointer', fontSize: 16, lineHeight: 1,
                }}>
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

/* HOW TO USE GUIDE */
const HowToUseGuide = () => (
  <Card style={{ marginTop: 20 }}>
    <SectionTitle>📚 How to Use Apex Cloud Mining</SectionTitle>
    
    <div style={{
      background: 'var(--apex-navy)',
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 16,
      }}>
        <div style={{
          minWidth: 32,
          height: 32,
          background: 'linear-gradient(135deg, #FF8C00, var(--apex-gold))',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          fontWeight: 800,
          color: '#fff',
          flexShrink: 0,
        }}>
          1
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
            Choose Your Mining Plan
          </div>
          <div style={{ fontSize: 13, color: 'var(--apex-muted)', lineHeight: 1.6 }}>
            Click "Upgrade" to browse plans. Higher plans earn more USDT per day. Select a plan, make payment via crypto or bank transfer, and upload proof.
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 16,
      }}>
        <div style={{
          minWidth: 32,
          height: 32,
          background: 'linear-gradient(135deg, #00A876, var(--apex-green))',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          fontWeight: 800,
          color: '#fff',
          flexShrink: 0,
        }}>
          2
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
            Click MINE Button Every 24 Hours
          </div>
          <div style={{ fontSize: 13, color: 'var(--apex-muted)', lineHeight: 1.6 }}>
            Once approved, click the white "MINE" button on your balance card once every 24 hours to earn your daily USDT. A countdown timer shows when you can mine again.
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 16,
      }}>
        <div style={{
          minWidth: 32,
          height: 32,
          background: 'linear-gradient(135deg, #1A6FFF, #0044DD)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          fontWeight: 800,
          color: '#fff',
          flexShrink: 0,
        }}>
          3
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
            Pay Withdrawal Fee (One-Time)
          </div>
          <div style={{ fontSize: 13, color: 'var(--apex-muted)', lineHeight: 1.6 }}>
            Before your first withdrawal, pay a one-time withdrawal fee for your plan. Plan 1 is FREE, higher plans have fees. After approval, you can withdraw anytime.
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}>
        <div style={{
          minWidth: 32,
          height: 32,
          background: 'linear-gradient(135deg, #7B2FFF, #A855F7)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          fontWeight: 800,
          color: '#fff',
          flexShrink: 0,
        }}>
          4
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
            Withdraw Your Earnings
          </div>
          <div style={{ fontSize: 13, color: 'var(--apex-muted)', lineHeight: 1.6 }}>
            Click "Withdraw" to request a payout to your crypto wallet or bank account. Minimum withdrawal is $10. Funds arrive within 1-2 business days.
          </div>
        </div>
      </div>
    </div>

    <div style={{
      background: 'rgba(26, 111, 255, 0.08)',
      border: '1px solid rgba(26, 111, 255, 0.2)',
      borderRadius: 12,
      padding: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}>
      <span style={{ fontSize: 20 }}>💡</span>
      <div style={{ flex: 1, fontSize: 12, color: 'var(--apex-muted)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--apex-blue)' }}>Pro Tip:</strong> Set a daily reminder to mine! Consistent mining maximizes your earnings. Check "History" to track all your mining activity.
      </div>
    </div>
  </Card>
);

/* MAIN DASHBOARD */
export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuthStore();
  const { add, unreadCount } = useNotificationStore();

  const [stats, setStats] = useState(null);
  const [seconds, setSeconds] = useState(86400);
  const [tierSeconds, setTierSeconds] = useState(null);
  const [wallet, setWallet] = useState('');
  const [editWallet, setEditWallet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mining, setMining] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [canMine, setCanMine] = useState(true);
  const [loading, setLoading] = useState(true);

  // Load dashboard
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const { data } = await authAPI.dashboard();
        setStats(data);
        setWallet(data.trc20_wallet || '');

        // Mining cooldown
        if (data.last_mined_at) {
          const lastMine = new Date(data.last_mined_at).getTime();
          const now = Date.now();
          const diff = now - lastMine;

          if (diff < 86400000) {
            setCanMine(false);
            setSeconds(Math.floor((86400000 - diff) / 1000));
          } else {
            setCanMine(true);
            setSeconds(86400);
          }
        }

        // Tier expiry countdown
        if (data.tier_expiry && user?.tier > 1) {
          const expiry = new Date(data.tier_expiry).getTime();
          const now = Date.now();
          const diff = expiry - now;

          if (diff > 0) {
            setTierSeconds(Math.floor(diff / 1000));
          }
        }
      } catch (err) {
        if (err.response?.status === 401) {
          toast.error('Session expired. Please login.');
          navigate('/login');
        } else {
          toast.error('Failed to load dashboard');
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate, user?.tier]);

  // Mining countdown
  useEffect(() => {
    if (!canMine && seconds > 0) {
      const timer = setTimeout(() => {
        setSeconds((s) => {
          if (s <= 1) {
            setCanMine(true);
            return 86400;
          }
          return s - 1;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [canMine, seconds]);

  // Tier expiry countdown
  useEffect(() => {
    if (tierSeconds !== null && tierSeconds > 0) {
      const timer = setTimeout(() => {
        setTierSeconds((s) => (s <= 1 ? 0 : s - 1));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [tierSeconds]);

  const tier = Number(user?.tier) || 1;
  const earnPerDay = EARN_DAY[tier] || 1.0;
  const balance = parseFloat(stats?.balance_usdt ?? user?.balance_usdt ?? 0);
  const balNGN = parseFloat(stats?.balance_ngn ?? user?.balance_ngn ?? 0);
  const totalEarned = parseFloat(stats?.total_earned ?? user?.total_earned ?? 0);
  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'User';

  const handleMine = async () => {
    if (!canMine) {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      toast.error(`⏱️ Wait ${hrs}h ${mins}m`);
      return;
    }

    setMining(true);

    try {
      await authAPI.mine();

      playNotificationSound();
      toast.success(`⛏️ Mined $${earnPerDay.toFixed(2)}!`);
      add('⛏️', 'Mining Complete', `You mined $${earnPerDay.toFixed(2)} USDT. Next mine in 24h.`);

      const { data } = await authAPI.dashboard();
      setStats(data);
      await refreshUser();

      setSeconds(86400);
      setCanMine(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Mining failed');
    } finally {
      setMining(false);
    }
  };

  const saveWallet = async () => {
    if (!wallet.trim()) {
      toast.error('Enter wallet address');
      return;
    }

    setSaving(true);

    try {
      await authAPI.bindWallet(wallet);
      toast.success('Wallet saved!');
      add('✅', 'Wallet Bound', 'Your TRC20 wallet has been saved.');
      playNotificationSound();
      setEditWallet(false);
      await refreshUser();
    } catch (err) {
      toast.error('Invalid address');
    } finally {
      setSaving(false);
    }
  };

  // Format tier expiry
  const formatTierExpiry = () => {
    if (!tierSeconds || tierSeconds <= 0) return 'Expired';
    
    const days = Math.floor(tierSeconds / 86400);
    const hours = Math.floor((tierSeconds % 86400) / 3600);
    const minutes = Math.floor((tierSeconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p>Loading dashboard...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20,
        padding: '12px 16px', background: 'var(--apex-card)', border: '1px solid var(--apex-border)',
        borderRadius: 16,
      }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--apex-muted)', fontWeight: 500, marginBottom: 2 }}>
            Welcome back 👋
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, lineHeight: 1 }}>
            {firstName}
          </h1>
        </div>

        <button onClick={() => setShowNotif((v) => !v)} style={{
          position: 'relative', width: 40, height: 40, background: 'var(--apex-navy)',
          border: '1px solid var(--apex-border)', borderRadius: 12, display: 'flex',
          alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>

          {unreadCount() > 0 && (
            <div style={{
              position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18,
              background: 'var(--apex-red)', border: '2px solid var(--apex-card)', borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: '#fff', padding: '0 5px',
            }}>
              {unreadCount() > 9 ? '9+' : unreadCount()}
            </div>
          )}
        </button>
      </div>

      {/* Tier Expiry Banner */}
      {tier > 1 && tierSeconds !== null && tierSeconds > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 140, 0, 0.12), rgba(245, 166, 35, 0.08))',
          border: '1px solid rgba(245, 166, 35, 0.3)',
          borderRadius: 16,
          padding: '12px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              background: 'rgba(245, 166, 35, 0.15)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--apex-gold)" strokeWidth="2" width="18" height="18">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--apex-muted)', marginBottom: 2 }}>
                Plan {tier} expires in
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 15,
                fontWeight: 800,
                color: 'var(--apex-gold)',
              }}>
                {formatTierExpiry()}
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/upgrade')}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #FF8C00, var(--apex-gold))',
              border: 'none',
              borderRadius: 10,
              color: '#000',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(245, 166, 35, 0.3)',
            }}
          >
            Renew
          </button>
        </div>
      )}

      {/* Balance Card */}
      <div style={{
        background: 'linear-gradient(135deg, #0A1E50, #1A3A8F)', borderRadius: 24, padding: 24,
        marginBottom: 16, position: 'relative', overflow: 'hidden', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', minHeight: 150,
        boxShadow: '0 16px 48px rgba(26,111,255,0.3)',
      }}>
        <div style={{
          position: 'absolute', top: -40, right: 90, width: 180, height: 180,
          background: 'rgba(255,255,255,0.06)', borderRadius: '50%', pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            fontSize: 12, fontWeight: 600, opacity: 0.85, textTransform: 'uppercase',
            letterSpacing: '1.5px', marginBottom: 10,
          }}>
            Available Balance
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 800,
              color: '#fff', lineHeight: 1,
            }}>
              {balance.toFixed(2)}
            </span>
            <span style={{ fontSize: 15, fontWeight: 600, opacity: 0.9 }}>USDT</span>
          </div>
          <div style={{
            display: 'inline-flex', background: 'rgba(255,255,255,0.18)', borderRadius: 20,
            padding: '5px 13px', fontSize: 13, fontWeight: 600,
          }}>
            ≈ ₦{balNGN.toLocaleString()}
          </div>
        </div>

        {/* Mine Button with Ring */}
        <div style={{
          position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 10,
        }}>
          {!canMine && <Ring seconds={seconds} />}

          <button onClick={handleMine} disabled={!canMine || mining} style={{
            width: 68, height: 68, borderRadius: '50%',
            background: canMine && !mining ? '#fff' : 'rgba(255,255,255,0.5)',
            border: 'none', cursor: canMine && !mining ? 'pointer' : 'not-allowed',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            transform: mining ? 'scale(0.92)' : 'scale(1)',
            transition: 'all 0.18s', opacity: canMine && !mining ? 1 : 0.6,
          }}>
            <svg viewBox="0 0 24 24" fill="var(--apex-blue)" width="24" height="24">
              <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
            </svg>
            <span style={{
              fontSize: 9, fontWeight: 800, color: 'var(--apex-blue)',
              fontFamily: 'var(--font-display)', letterSpacing: '0.5px',
            }}>
              {mining ? 'WAIT' : canMine ? 'MINE' : 'WAIT'}
            </span>
          </button>
        </div>
      </div>

      {/* Mining Strip */}
      <div style={{
        background: 'rgba(0,211,149,0.08)', border: '1px solid rgba(0,211,149,0.2)',
        borderRadius: 14, padding: '11px 16px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', background: 'var(--apex-green)',
            animation: 'pulse 2s ease infinite',
          }} />
          <span style={{ fontSize: 13, fontWeight: 500 }}>Mining active — Plan {tier}</span>
        </div>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800,
          color: 'var(--apex-green)',
        }}>
          +${earnPerDay.toFixed(2)}/day
        </span>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <QCard label="Upgrade" onClick={() => navigate('/upgrade')}
          color="linear-gradient(135deg,#FF8C00,var(--apex-gold))"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" width="24" height="24">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          }
        />
        <QCard label="History" onClick={() => navigate('/history')}
          color="linear-gradient(135deg,#7B2FFF,#A855F7)"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" width="24" height="24">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <QCard label="Withdraw" onClick={() => navigate('/withdraw')}
          color="linear-gradient(135deg,#00A876,var(--apex-green))"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" width="24" height="24">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          }
        />
      </div>

      {/* Stats */}
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>Mining Stats</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Stat label="Earn / Day" value={`$${earnPerDay.toFixed(2)}`} color="var(--apex-green)" />
          <Stat label="Current Plan" value={`Plan ${tier}`} color="var(--apex-gold)" />
          <Stat label="Total Earned" value={`$${totalEarned.toFixed(2)}`} color="var(--apex-blue)" />
          <Stat label="Status" value="● Active" color="var(--apex-green)" />
        </div>
      </Card>

      {/* Bind Wallet */}
      <Card>
        <SectionTitle>Bind Wallet Address</SectionTitle>
        <div style={{
          background: 'var(--apex-navy)', border: '1px solid var(--apex-border)',
          borderRadius: 12, padding: '14px 16px', marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--apex-blue)" strokeWidth="2" width="18" height="18">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <input value={wallet} disabled={!editWallet} onChange={(e) => setWallet(e.target.value)}
            placeholder="Enter TRC20 wallet address" style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: editWallet ? 'var(--apex-text)' : 'var(--apex-muted)', fontSize: 13,
            }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
          <button onClick={() => setEditWallet(true)} style={{
            background: 'rgba(26,111,255,0.08)', border: '1px solid var(--apex-border)',
            borderRadius: 12, padding: 13, color: 'var(--apex-blue)',
            fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            Edit
          </button>
          <button onClick={saveWallet} disabled={saving || !editWallet} style={{
            background: saving || !editWallet ? 'var(--apex-card2)' : 'linear-gradient(135deg,var(--apex-blue),#0044DD)',
            border: 'none', borderRadius: 12, padding: 13,
            color: saving || !editWallet ? 'var(--apex-muted)' : '#fff',
            fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
            cursor: saving || !editWallet ? 'not-allowed' : 'pointer',
            boxShadow: saving || !editWallet ? 'none' : '0 6px 20px rgba(26,111,255,0.3)',
          }}>
            {saving ? 'Saving...' : 'Save Address'}
          </button>
        </div>
      </Card>

      {/* How to Use Guide */}
      <HowToUseGuide />

      {showNotif && <NotifPanel onClose={() => setShowNotif(false)} />}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </AppLayout>
  );
};