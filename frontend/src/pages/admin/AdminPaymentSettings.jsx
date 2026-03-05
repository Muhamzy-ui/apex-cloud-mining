import React, { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';
import useAuthStore from '../../context/authStore';
import toast from 'react-hot-toast';

export const AdminPaymentSettings = () => {
    const { user, refreshUser } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        agent_wallet_usdt: '',
        agent_bank_name: '',
        agent_account_name: '',
        agent_account_number: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                agent_wallet_usdt: user.agent_wallet_usdt || '',
                agent_bank_name: user.agent_bank_name || '',
                agent_account_name: user.agent_account_name || '',
                agent_account_number: user.agent_account_number || '',
            });
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authAPI.updateProfile(formData);
            toast.success('Payment settings updated successfully!');
            await refreshUser();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <header style={{ marginBottom: '32px' }}>
                <h1 className="font-display" style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
                    Payment Settings
                </h1>
                <p className="text-muted">
                    Set your personal payment details. These will be displayed to users who register using your referral link.
                </p>
            </header>

            <div className="bg-card rounded-2xl shadow-md" style={{ padding: '32px', border: '1px solid var(--apex-border)' }}>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '24px' }}>
                    {/* USDT Wallet */}
                    <div>
                        <label className="text-muted" style={{ fontSize: '13px', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                            Agent USDT Wallet (TRC20)
                        </label>
                        <input
                            type="text"
                            className="bg-navy rounded-xl"
                            style={{
                                width: '100%',
                                padding: '14px 20px',
                                border: '1px solid var(--apex-border)',
                                color: 'var(--apex-text)',
                                fontSize: '14px',
                                fontFamily: 'monospace'
                            }}
                            placeholder="Enter your USDT TRC20 address"
                            value={formData.agent_wallet_usdt}
                            onChange={(e) => setFormData({ ...formData, agent_wallet_usdt: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {/* Bank Name */}
                        <div>
                            <label className="text-muted" style={{ fontSize: '13px', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                                Bank Name
                            </label>
                            <input
                                type="text"
                                className="bg-navy rounded-xl"
                                style={{
                                    width: '100%',
                                    padding: '14px 20px',
                                    border: '1px solid var(--apex-border)',
                                    color: 'var(--apex-text)',
                                    fontSize: '14px'
                                }}
                                placeholder="e.g. Zenith Bank"
                                value={formData.agent_bank_name}
                                onChange={(e) => setFormData({ ...formData, agent_bank_name: e.target.value })}
                            />
                        </div>

                        {/* Account Number */}
                        <div>
                            <label className="text-muted" style={{ fontSize: '13px', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                                Account Number
                            </label>
                            <input
                                type="text"
                                className="bg-navy rounded-xl"
                                style={{
                                    width: '100%',
                                    padding: '14px 20px',
                                    border: '1px solid var(--apex-border)',
                                    color: 'var(--apex-text)',
                                    fontSize: '14px'
                                }}
                                placeholder="0000000000"
                                value={formData.agent_account_number}
                                onChange={(e) => setFormData({ ...formData, agent_account_number: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Account Name */}
                    <div>
                        <label className="text-muted" style={{ fontSize: '13px', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                            Account Holder Name
                        </label>
                        <input
                            type="text"
                            className="bg-navy rounded-xl"
                            style={{
                                width: '100%',
                                padding: '14px 20px',
                                border: '1px solid var(--apex-border)',
                                color: 'var(--apex-text)',
                                fontSize: '14px'
                            }}
                            placeholder="Enter full name as seen on bank account"
                            value={formData.agent_account_name}
                            onChange={(e) => setFormData({ ...formData, agent_account_name: e.target.value })}
                        />
                    </div>

                    <div style={{ marginTop: '12px' }}>
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-xl shadow-md hover-up"
                            style={{
                                padding: '16px 40px',
                                background: 'var(--grad-blue)',
                                color: 'white',
                                border: 'none',
                                fontWeight: 700,
                                fontSize: '15px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: '0.3s'
                            }}
                        >
                            {loading ? 'Saving Changes...' : 'Save Payment Settings'}
                        </button>
                    </div>
                </form>

                <div style={{ marginTop: '32px', padding: '20px', background: 'rgba(26,111,255,0.05)', borderRadius: '14px', border: '1px solid rgba(26,111,255,0.1)' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '20px' }}>ℹ️</span>
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--apex-blue)', marginBottom: '4px' }}>How this works</div>
                            <p style={{ fontSize: '13px', color: 'var(--apex-muted)', lineHeight: 1.5 }}>
                                When users register using your referral link and attempt to deposit or pay fees, they will see <strong>your</strong> payment details instead of the system defaults. This allows you to manage payments directly within your network.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
