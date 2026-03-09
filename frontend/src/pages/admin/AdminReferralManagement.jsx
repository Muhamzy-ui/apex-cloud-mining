import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export const AdminReferralManagement = () => {
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState(null);

    const fetchActivity = async () => {
        setIsLoading(true);
        try {
            const { data } = await adminAPI.getReferralActivity();
            setActivities(data.results || []);
        } catch (err) {
            toast.error('Failed to load referral activity');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const { data } = await adminAPI.getGlobalCommissions();
            setStats(data);
        } catch (err) {
            console.error('Failed to load global commission stats');
        }
    };

    useEffect(() => {
        fetchActivity();
        fetchStats();
    }, []);

    const handleAction = async (id, action) => {
        const confirmMsg = action === 'reject'
            ? 'Are you sure you want to reverse this commission? The USDT will be deducted from the referrer balance.'
            : 'Are you sure you want to manually credit this commission?';

        if (!window.confirm(confirmMsg)) return;

        try {
            await adminAPI.referralAction({ id, action });
            toast.success(`Commission ${action === 'reject' ? 'reversed' : 'credited'} successfully`);
            fetchActivity();
            fetchStats();
        } catch (err) {
            toast.error('Action failed');
        }
    };

    return (
        <div className="page-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '32px' }}>
                <h1 className="font-display" style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
                    Referral Management
                </h1>
                <p className="text-muted">Monitor and audit plan-based referral commissions.</p>
            </header>

            {/* Stats Overview */}
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                    <div className="bg-card rounded-2xl p-6" style={{ border: '1px solid var(--apex-border)' }}>
                        <div style={{ fontSize: '12px', color: 'var(--apex-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Platform Total Commissions</div>
                        <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--apex-blue)' }}>${parseFloat(stats.platform_total_commissions).toFixed(2)} USDT</div>
                    </div>
                    <div className="bg-card rounded-2xl p-6" style={{ border: '1px solid var(--apex-border)' }}>
                        <div style={{ fontSize: '12px', color: 'var(--apex-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Referrers</div>
                        <div style={{ fontSize: '28px', fontWeight: 700 }}>{stats.admin_count}</div>
                    </div>
                </div>
            )}

            <div className="bg-card rounded-2xl shadow-md" style={{ padding: '24px', border: '1px solid var(--apex-border)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Recent Activity</h3>
                {isLoading ? (
                    <div className="text-center" style={{ padding: '40px' }}>Loading activity...</div>
                ) : activities.length === 0 ? (
                    <div className="text-center text-muted" style={{ padding: '40px' }}>No referral activity recorded yet.</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr className="text-muted" style={{ fontSize: '11px', borderBottom: '1px solid var(--apex-border)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <th style={{ textAlign: 'left', padding: '12px' }}>Referrer</th>
                                    <th style={{ textAlign: 'left', padding: '12px' }}>Referee</th>
                                    <th style={{ textAlign: 'left', padding: '12px' }}>Plan</th>
                                    <th style={{ textAlign: 'left', padding: '12px' }}>Reward</th>
                                    <th style={{ textAlign: 'left', padding: '12px' }}>Status</th>
                                    <th style={{ textAlign: 'right', padding: '12px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activities.map((a) => (
                                    <tr key={a.id} style={{ borderBottom: '1px solid var(--apex-border)', transition: '0.2s' }}>
                                        <td style={{ padding: '16px 12px' }}>
                                            <div style={{ fontWeight: 600, fontSize: '14px' }}>{a.referrer_email}</div>
                                        </td>
                                        <td style={{ padding: '16px 12px' }}>
                                            <div style={{ fontWeight: 500, fontSize: '14px' }}>{a.referee_name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--apex-muted)' }}>{a.referee_email}</div>
                                        </td>
                                        <td style={{ padding: '16px 12px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--apex-blue)' }}>Plan {a.tier}</span>
                                        </td>
                                        <td style={{ padding: '16px 12px' }}>
                                            <div style={{ fontWeight: 700, color: 'var(--apex-green)' }}>+${parseFloat(a.amount_usdt).toFixed(2)}</div>
                                        </td>
                                        <td style={{ padding: '16px 12px' }}>
                                            <span style={{
                                                fontSize: '11px',
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                fontWeight: 600,
                                                background: a.status === 'credited' ? 'rgba(0,211,149,0.1)' : 'rgba(255,107,107,0.1)',
                                                color: a.status === 'credited' ? 'var(--apex-green)' : 'var(--apex-red)'
                                            }}>
                                                {a.status === 'credited' ? 'Credited' : 'Reversed'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                                            {a.status === 'credited' ? (
                                                <button
                                                    onClick={() => handleAction(a.id, 'reject')}
                                                    style={{ background: 'transparent', border: '1px solid var(--apex-red)', color: 'var(--apex-red)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
                                                >
                                                    Decline & Reverse
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleAction(a.id, 'approve')}
                                                    style={{ background: 'transparent', border: '1px solid var(--apex-green)', color: 'var(--apex-green)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
                                                >
                                                    Re-Approve
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
