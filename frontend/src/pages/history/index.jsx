/**
 * Apex Cloud Mining — History & Referral Pages
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AppLayout } from '../../components/layout';
import { PageHeader, Card, SectionTitle, EmptyState } from '../../components/ui';
import { paymentsAPI, referralsAPI } from '../../services/api';
import useAuthStore from '../../context/authStore';
import toast from 'react-hot-toast';

// ============================================================
// History Page
// ============================================================
const TX_TYPES = ['all', 'earnings', 'deposits', 'withdrawals'];

const TxIcon = ({ type }) => {
  const icons = {
    earning:    { bg: 'rgba(0,211,149,0.12)',  color: 'var(--apex-green)', path: 'M23 6 13.5 15.5 8.5 10.5 1 18' },
    deposit:    { bg: 'rgba(26,111,255,0.12)', color: 'var(--apex-blue)',  path: 'M12 19 12 5 M5 12 12 5 19 12' },
    withdrawal: { bg: 'rgba(255,77,106,0.12)', color: 'var(--apex-red)',   path: 'M12 5 12 19 M5 12 12 19 19 12' },
  };
  const cfg = icons[type] || icons.earning;
  return (
    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2" width="20" height="20">
        <polyline points={cfg.path}/>
      </svg>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    credited:  { bg: 'rgba(0,211,149,0.12)',  color: 'var(--apex-green)' },
    approved:  { bg: 'rgba(0,211,149,0.12)',  color: 'var(--apex-green)' },
    pending:   { bg: 'rgba(245,166,35,0.12)', color: 'var(--apex-gold)'  },
    rejected:  { bg: 'rgba(255,77,106,0.12)', color: 'var(--apex-red)'   },
    processing:{ bg: 'rgba(26,111,255,0.12)', color: 'var(--apex-blue)'  },
  };
  const c = map[status] || map.pending;
  return (
    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: c.bg, color: c.color, display: 'inline-block', marginTop: '3px', textTransform: 'capitalize' }}>
      {status}
    </span>
  );
};

export const HistoryPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [txs, setTxs]             = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    paymentsAPI.transactions(activeTab).then(({ data }) => {
      setTxs(data.results || []);
      setLoading(false);
    });
  }, [activeTab]);

  return (
    <div className="page-layout" style={{ position: 'relative', zIndex: 1 }}>
      <div className="bg-ambient"/>
      <PageHeader title="Transaction History" onBack={() => navigate('/dashboard')} />
      <div className="page-content">
        {/* Tabs */}
        <div style={{ display: 'flex', background: 'var(--apex-card)', borderRadius: '14px', padding: '4px', marginBottom: '20px' }}>
          {TX_TYPES.map((type) => (
            <div
              key={type}
              onClick={() => setActiveTab(type)}
              style={{
                flex: 1, padding: '10px', textAlign: 'center',
                fontSize: '12px', fontWeight: 600, borderRadius: '10px',
                cursor: 'pointer', transition: 'all 0.2s',
                background: activeTab === type ? 'var(--apex-blue)' : 'transparent',
                color: activeTab === type ? '#fff' : 'var(--apex-muted)',
                textTransform: 'capitalize',
              }}
            >
              {type}
            </div>
          ))}
        </div>

        {/* List */}
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '72px', marginBottom: '10px', borderRadius: '16px' }} />
            ))
          : txs.length === 0
            ? <EmptyState icon="📭" title="No transactions yet" message="Your transaction history will appear here." />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {txs.map((tx) => (
                  <div key={tx.id} style={{
                    background: 'var(--apex-card)', border: '1px solid var(--apex-border)',
                    borderRadius: '16px', padding: '16px 18px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <TxIcon type={tx.type} />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '3px' }}>{tx.label}</div>
                        <div style={{ fontSize: '12px', color: 'var(--apex-muted)' }}>
                          {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700,
                        color: tx.amount > 0 ? 'var(--apex-green)' : 'var(--apex-red)',
                      }}>
                        {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                      </div>
                      <StatusBadge status={tx.status} />
                    </div>
                  </div>
                ))}
              </div>
        }
      </div>
    </div>
  );
};

// ============================================================
// Referral Page
// ============================================================
export const ReferralPage = () => {
  const navigate  = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    referralsAPI.dashboard().then(({ data }) => { setData(data); setLoading(false); });
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(data?.referral_link || '');
    toast.success('Referral link copied!');
  };

  return (
    <div className="page-layout" style={{ position: 'relative', zIndex: 1 }}>
      <div className="bg-ambient"/>
      <PageHeader title="Referral System" onBack={() => navigate('/profile')} />
      <div className="page-content">
        {/* Banner */}
        <div style={{
          background: 'linear-gradient(135deg,#0D1E35,#1150CC)',
          borderRadius: '24px', padding: '24px', marginBottom: '20px',
          textAlign: 'center', border: '1px solid var(--apex-border)',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>💎</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>
            Invite Friends, Earn More
          </h3>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: '16px' }}>
            Earn <strong>10% commission</strong> on every deposit made by users you refer.
          </p>

          {/* Referral link */}
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '14px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--apex-blue)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {data?.referral_link || '...'}
            </span>
            <button onClick={copyLink} style={{ background: 'var(--apex-blue)', border: 'none', borderRadius: '10px', padding: '8px 14px', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
              Copy
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Total Referrals', value: data?.total_referrals || 0, color: 'var(--apex-blue)' },
            { label: 'Commission Earned', value: `$${parseFloat(data?.total_commission || 0).toFixed(2)}`, color: 'var(--apex-gold)' },
          ].map((stat) => (
            <div key={stat.label} style={{ background: 'var(--apex-card)', border: '1px solid var(--apex-border)', borderRadius: '18px', padding: '18px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: stat.color, marginBottom: '4px' }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--apex-muted)' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <Card style={{ marginBottom: '16px' }}>
          <SectionTitle>How Referrals Work</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              'Share your unique referral link with friends and family',
              'They register using your link and upgrade their account',
              'You instantly receive 10% commission credited to your balance',
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ minWidth: '32px', height: '32px', background: 'rgba(26,111,255,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: 'var(--apex-blue)' }}>
                  {i + 1}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--apex-muted)', lineHeight: 1.6 }}>{step}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Referred users */}
        <Card>
          <SectionTitle>Referred Users</SectionTitle>
          {!data?.referred_users?.length
            ? <EmptyState icon="👥" title="No referrals yet" message="Share your link to start earning commission!" />
            : data.referred_users.map((u) => (
                <div key={u.email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--apex-border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{u.full_name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--apex-muted)' }}>{u.email}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: 'var(--apex-blue)', fontWeight: 600 }}>{u.tier_label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--apex-muted)' }}>
                      {new Date(u.date_joined).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
          }
        </Card>
      </div>
    </div>
  );
};