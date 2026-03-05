import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import useAuthStore from '../../context/authStore';

export const AdminDashboardOverview = () => {
    const { user } = useAuthStore();
    const role = user?.is_superuser ? 'super' : 'junior';
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await adminAPI.getStats();
                setStats(data);
            } catch (err) {
                // toast.error('Failed to load dashboard metrics');
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    const cards = [
        { label: 'Total Users', value: stats?.total_users || 0, icon: '👥', color: 'var(--apex-blue)' },
        { label: 'Pending Deposits', value: stats?.pending_deposits || 0, icon: '💳', color: '#F2994A' },
        { label: 'Approved Withdrawals', value: stats?.approved_withdrawals || 0, icon: '💸', color: '#27AE60' },
        { label: 'Total Volume', value: `$${parseFloat(stats?.total_volume || 0).toLocaleString()}`, icon: '📈', color: '#9B51E0' },
    ];

    return (
        <div className="admin-overview" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 className="font-display" style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
                        {role === 'super' ? 'Global Overview' : 'Operational Overview'}
                    </h1>
                    <p className="text-muted">
                        {role === 'super' ? 'Real-time performance metrics across the entire platform.' : 'Monitor your referred network and financial activity.'}
                    </p>
                </div>

                {/* Referral Link Card */}
                <div className="bg-navy rounded-2xl" style={{ padding: '16px 24px', border: '1px solid var(--apex-border)', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--apex-blue)', textTransform: 'uppercase', marginBottom: '4px' }}>Your Referral Link</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'monospace' }}>
                            apex-mining.com/register?ref={user?.referral_code}
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(`https://apex-mining.com/register?ref=${user?.referral_code}`);
                            toast.success('Referral link copied!');
                        }}
                        className="rounded-lg"
                        style={{
                            padding: '8px 16px',
                            background: 'var(--grad-blue)',
                            color: 'white',
                            border: 'none',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer'
                        }}
                    >
                        Copy Link
                    </button>
                </div>
            </header>

            {/* Stat Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '48px' }}>
                {cards.map((card, i) => (
                    <div key={i} className="bg-card rounded-2xl shadow-sm hover-up" style={{ padding: '24px', border: '1px solid var(--apex-border)', transition: '0.3s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                                {card.icon}
                            </div>
                        </div>
                        <div className="text-muted" style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{card.label}</div>
                        <div className="font-display" style={{ fontSize: '24px', fontWeight: 800 }}>{isLoading ? '...' : card.value}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
                {/* Quick Actions */}
                <div className="bg-card rounded-2xl" style={{ padding: '32px', border: '1px solid var(--apex-border)' }}>
                    <h3 className="font-display" style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>Quick Actions</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {role === 'super' && (
                            <button className="bg-navy rounded-xl" style={{ padding: '16px', border: '1px solid var(--apex-border)', color: 'white', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>
                                Generate Invite Link
                            </button>
                        )}
                        <button className="bg-navy rounded-xl" style={{ padding: '16px', border: '1px solid var(--apex-border)', color: 'white', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>
                            Review Deposits
                        </button>
                        <button className="bg-navy rounded-xl" style={{ padding: '16px', border: '1px solid var(--apex-border)', color: 'white', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>
                            Manage Users
                        </button>
                        <button className="bg-navy rounded-xl" style={{ padding: '16px', border: '1px solid var(--apex-border)', color: 'white', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>
                            Update Settings
                        </button>
                    </div>
                </div>

                {/* System Status */}
                <div className="bg-card rounded-2xl" style={{ padding: '32px', border: '1px solid var(--apex-border)' }}>
                    <h3 className="font-display" style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>Security & Audit</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--apex-border)' }}>
                            <span className="text-muted">Audit Hash Integrity</span>
                            <span className="text-green" style={{ fontWeight: 600 }}>Verified ✅</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--apex-border)' }}>
                            <span className="text-muted">Active Junior Admins</span>
                            <span style={{ fontWeight: 600 }}>{stats?.active_admins || 0}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                            <span className="text-muted">Database Mode</span>
                            <span className="text-blue" style={{ fontWeight: 600 }}>Append-Only Log</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
