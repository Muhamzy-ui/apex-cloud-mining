import React, { useState, useEffect } from 'react';
import { authAPI, paymentsAPI } from '../../services/api';
import useAuthStore from '../../context/authStore';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://apex-cloud-mining-1.onrender.com/api/v1';

const inputStyle = {
    width: '100%',
    padding: '14px 20px',
    border: '1px solid var(--apex-border)',
    borderRadius: '12px',
    background: 'var(--apex-navy)',
    color: 'var(--apex-text)',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
};

const labelStyle = {
    fontSize: '13px',
    display: 'block',
    marginBottom: '8px',
    fontWeight: 600,
    color: 'var(--apex-muted)',
};

export const AdminPaymentSettings = () => {
    const { user, refreshUser } = useAuthStore();
    const isSuperAdmin = user?.is_superuser || user?.is_super_admin;

    const [agentLoading, setAgentLoading] = useState(false);
    const [sysLoading, setSysLoading] = useState(false);

    // Agent-level settings (visible to all admins)
    const [agentForm, setAgentForm] = useState({
        agent_wallet_usdt: '',
        agent_bank_name: '',
        agent_account_name: '',
        agent_account_number: '',
        agent_telegram_link: '',
    });

    // System-level settings (super admin only)
    const [sysForm, setSysForm] = useState({
        telegram_community_url: '',
        telegram_gate_url: '',
        referral_bonus_usdt: '',
        usdt_wallet: '',
        bank_name: '',
        account_name: '',
        account_number: '',
    });

    useEffect(() => {
        if (user) {
            setAgentForm({
                agent_wallet_usdt: user.agent_wallet_usdt || '',
                agent_bank_name: user.agent_bank_name || '',
                agent_account_name: user.agent_account_name || '',
                agent_account_number: user.agent_account_number || '',
                agent_telegram_link: user.agent_telegram_link || '',
            });
        }
    }, [user]);

    useEffect(() => {
        if (isSuperAdmin) {
            paymentsAPI.getPaymentSettings().then(res => {
                const d = res.data;
                setSysForm({
                    telegram_community_url: d.telegram_community_url || '',
                    telegram_gate_url: d.telegram_gate_url || '',
                    referral_bonus_usdt: d.referral_bonus_usdt ?? 3,
                    usdt_wallet: d.usdt_wallet || '',
                    bank_name: d.bank_name || '',
                    account_name: d.account_name || '',
                    account_number: d.account_number || '',
                });
            }).catch(() => {});
        }
    }, [isSuperAdmin]);

    const handleAgentSubmit = async (e) => {
        e.preventDefault();
        setAgentLoading(true);
        try {
            await authAPI.updateProfile(agentForm);
            toast.success('Agent settings updated!');
            await refreshUser();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to update agent settings');
        } finally {
            setAgentLoading(false);
        }
    };

    const handleSysSubmit = async (e) => {
        e.preventDefault();
        setSysLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            await axios.post(`${API_URL}/payments/settings/update/`, sysForm, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success('System settings updated successfully!');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to update system settings');
        } finally {
            setSysLoading(false);
        }
    };

    const cardStyle = {
        background: 'var(--apex-card)',
        borderRadius: '20px',
        padding: window.innerWidth < 768 ? '20px' : '28px',
        border: '1px solid var(--apex-border)',
        marginBottom: '28px',
    };

    const sectionStyle = (color) => ({
        background: `rgba(${color},0.06)`,
        border: `1px solid rgba(${color},0.15)`,
        borderRadius: '14px',
        padding: '20px',
        marginBottom: '16px',
    });

    return (
        <div className="page-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <header style={{ marginBottom: '32px', paddingTop: window.innerWidth < 768 ? '0px' : '40px' }}>
                <h1 className="font-display" style={{ fontSize: window.innerWidth < 768 ? '24px' : '32px', fontWeight: 700, marginBottom: '8px' }}>
                    Settings
                </h1>
                <p className="text-muted">Manage Telegram links, referral bonus, payment info and more.</p>
            </header>

            {/* ── SYSTEM SETTINGS (super admin only) ── */}
            {isSuperAdmin && (
                <div style={cardStyle}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
                        🌐 System Settings
                    </h2>
                    <p style={{ fontSize: '13px', color: 'var(--apex-muted)', marginBottom: '24px' }}>
                        These settings apply globally to every user on the platform.
                    </p>

                    <form onSubmit={handleSysSubmit} style={{ display: 'grid', gap: '16px' }}>

                        {/* Telegram */}
                        <div style={sectionStyle('42,171,238')}>
                            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '16px', color: '#2AABEE' }}>
                                📢 Telegram Channels
                            </div>
                            <div style={{ display: 'grid', gap: '14px' }}>
                                <div>
                                    <label style={labelStyle}>Community Channel URL <span style={{ color: 'var(--apex-muted)', fontWeight: 400 }}>(shown on Community page)</span></label>
                                    <input
                                        type="url"
                                        style={inputStyle}
                                        placeholder="https://t.me/your-community-channel"
                                        value={sysForm.telegram_community_url}
                                        onChange={e => setSysForm(p => ({ ...p, telegram_community_url: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Join Gate Channel URL <span style={{ color: 'var(--apex-muted)', fontWeight: 400 }}>(shown after registration)</span></label>
                                    <input
                                        type="url"
                                        style={inputStyle}
                                        placeholder="https://t.me/your-gate-channel"
                                        value={sysForm.telegram_gate_url}
                                        onChange={e => setSysForm(p => ({ ...p, telegram_gate_url: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Referral Bonus */}
                        <div style={sectionStyle('0,211,149')}>
                            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '16px', color: 'var(--apex-green)' }}>
                                🎁 Referral Bonus
                            </div>
                            <label style={labelStyle}>Amount earned per successful referral sign-up (USDT)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                style={{ ...inputStyle, maxWidth: '220px' }}
                                placeholder="3.00"
                                value={sysForm.referral_bonus_usdt}
                                onChange={e => setSysForm(p => ({ ...p, referral_bonus_usdt: e.target.value }))}
                            />
                        </div>

                        {/* Default Payment Details */}
                        <div style={sectionStyle('26,111,255')}>
                            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '16px', color: 'var(--apex-blue)' }}>
                                💳 Default Payment Details
                            </div>
                            <div style={{ display: 'grid', gap: '14px' }}>
                                <div>
                                    <label style={labelStyle}>USDT Wallet Address (TRC20)</label>
                                    <input type="text" style={{ ...inputStyle, fontFamily: 'monospace' }} placeholder="TRC20 wallet address" value={sysForm.usdt_wallet} onChange={e => setSysForm(p => ({ ...p, usdt_wallet: e.target.value }))} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 640 ? '1fr' : '1fr 1fr', gap: '14px' }}>
                                    <div>
                                        <label style={labelStyle}>Bank Name</label>
                                        <input type="text" style={inputStyle} placeholder="e.g. Opay" value={sysForm.bank_name} onChange={e => setSysForm(p => ({ ...p, bank_name: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Account Number</label>
                                        <input type="text" style={inputStyle} placeholder="0000000000" value={sysForm.account_number} onChange={e => setSysForm(p => ({ ...p, account_number: e.target.value }))} />
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>Account Holder Name</label>
                                    <input type="text" style={inputStyle} placeholder="Full name as on bank account" value={sysForm.account_name} onChange={e => setSysForm(p => ({ ...p, account_name: e.target.value }))} />
                                </div>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={sysLoading}
                                style={{
                                    padding: '16px 36px',
                                    background: sysLoading ? 'var(--apex-navy)' : 'linear-gradient(135deg, #1A6FFF, #0044DD)',
                                    border: 'none',
                                    borderRadius: '14px',
                                    color: sysLoading ? 'var(--apex-muted)' : '#fff',
                                    fontWeight: 700,
                                    fontSize: '15px',
                                    cursor: sysLoading ? 'not-allowed' : 'pointer',
                                    boxShadow: sysLoading ? 'none' : '0 8px 24px rgba(26,111,255,0.3)',
                                }}
                            >
                                {sysLoading ? 'Saving...' : '💾 Save System Settings'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── AGENT SETTINGS (all admins) ── */}
            <div style={cardStyle}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
                    👤 My Agent Details
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--apex-muted)', marginBottom: '24px' }}>
                    Users who sign up via your referral link will see these details when making payments or joining your Telegram.
                </p>

                <form onSubmit={handleAgentSubmit} style={{ display: 'grid', gap: '18px' }}>
                    <div>
                        <label style={labelStyle}>Agent USDT Wallet (TRC20)</label>
                        <input type="text" style={{ ...inputStyle, fontFamily: 'monospace' }} placeholder="Your TRC20 wallet address" value={agentForm.agent_wallet_usdt} onChange={e => setAgentForm(p => ({ ...p, agent_wallet_usdt: e.target.value }))} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 640 ? '1fr' : '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>Bank Name</label>
                            <input type="text" style={inputStyle} placeholder="e.g. Zenith Bank" value={agentForm.agent_bank_name} onChange={e => setAgentForm(p => ({ ...p, agent_bank_name: e.target.value }))} />
                        </div>
                        <div>
                            <label style={labelStyle}>Account Number</label>
                            <input type="text" style={inputStyle} placeholder="0000000000" value={agentForm.agent_account_number} onChange={e => setAgentForm(p => ({ ...p, agent_account_number: e.target.value }))} />
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>Account Holder Name</label>
                        <input type="text" style={inputStyle} placeholder="Full name as on bank account" value={agentForm.agent_account_name} onChange={e => setAgentForm(p => ({ ...p, agent_account_name: e.target.value }))} />
                    </div>
                    <div>
                        <label style={labelStyle}>Your Telegram Channel / Group Link</label>
                        <input type="url" style={inputStyle} placeholder="https://t.me/your-community" value={agentForm.agent_telegram_link} onChange={e => setAgentForm(p => ({ ...p, agent_telegram_link: e.target.value }))} />
                    </div>
                    <div>
                        <button
                            type="submit"
                            disabled={agentLoading}
                            style={{
                                padding: '16px 36px',
                                background: agentLoading ? 'var(--apex-navy)' : 'linear-gradient(135deg, #00C2A8, #1A6FFF)',
                                border: 'none',
                                borderRadius: '14px',
                                color: agentLoading ? 'var(--apex-muted)' : '#fff',
                                fontWeight: 700,
                                fontSize: '15px',
                                cursor: agentLoading ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {agentLoading ? 'Saving...' : '💾 Save Agent Settings'}
                        </button>
                    </div>
                </form>

                <div style={{ marginTop: '24px', padding: '16px 20px', background: 'rgba(26,111,255,0.05)', borderRadius: '14px', border: '1px solid rgba(26,111,255,0.1)' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '18px' }}>ℹ️</span>
                        <p style={{ fontSize: '13px', color: 'var(--apex-muted)', lineHeight: 1.5 }}>
                            When users register via your referral link, they will see <strong>your</strong> bank account, USDT wallet, and Telegram link instead of the system defaults — so you can manage payments within your own network.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
