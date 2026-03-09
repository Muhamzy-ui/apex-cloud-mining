/**
 * Apex Cloud Mining — Referral Earnings Withdrawal Page
 * Specialized for isolated referral balance (NO FEES)
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AppLayout } from '../../components/layout';
import useAuthStore from '../../context/authStore';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const ReferralWithdrawPage = () => {
    const navigate = useNavigate();
    const { user, refreshUser } = useAuthStore();

    const [method, setMethod] = useState('crypto');
    const [loading, setLoading] = useState(false);
    const [referralBalance, setReferralBalance] = useState(0);
    const [exchangeRate, setExchangeRate] = useState(1600);

    const [form, setForm] = useState({
        amount: '',
        wallet_address: user?.trc20_wallet || '',
        bank_name: '',
        account_number: '',
        account_name: '',
    });

    const [banks, setBanks] = useState([]);
    const [selectedBank, setSelectedBank] = useState(null);
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        // Fetch limits and balance
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const res = await axios.get(`${API_URL}/referrals/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setReferralBalance(parseFloat(res.data.referral_balance || 0));
            } catch (err) {
                console.error('Failed to fetch referral data:', err);
            }
        };

        const fetchBanks = async () => {
            try {
                const res = await axios.get(`${API_URL}/payments/banks/`);
                setBanks(res.data || []);
            } catch (err) {
                console.error('Failed to fetch banks:', err);
            }
        };

        const fetchRate = async () => {
            try {
                const res = await axios.get(`${API_URL}/payments/exchange-rate/`);
                setExchangeRate(parseFloat(res.data?.usd_to_ngn || 1600));
            } catch (err) { }
        };

        fetchData();
        fetchBanks();
        fetchRate();
    }, []);

    // Auto-verify account name (same as main withdraw page)
    useEffect(() => {
        const verifyAccount = async () => {
            if (selectedBank && form.account_number.length === 10) {
                setVerifying(true);
                try {
                    const token = localStorage.getItem('access_token');
                    const res = await axios.post(`${API_URL}/payments/verify-account/`, {
                        account_number: form.account_number,
                        bank_code: selectedBank.code,
                    }, { headers: { Authorization: `Bearer ${token}` } });
                    setForm(prev => ({ ...prev, account_name: res.data.account_name }));
                } catch (err) {
                    toast.error('Could not verify account.');
                } finally {
                    setVerifying(false);
                }
            }
        };
        const t = setTimeout(verifyAccount, 500);
        return () => clearTimeout(t);
    }, [selectedBank, form.account_number]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const amount = parseFloat(form.amount) || 0;

        if (amount < 5) {
            toast.error('Minimum withdrawal is $5 USDT');
            return;
        }

        if (amount > referralBalance) {
            toast.error('Insufficient referral balance');
            return;
        }

        if (method === 'crypto' && !form.wallet_address) {
            toast.error('Enter wallet address');
            return;
        }

        if (method === 'bank' && (!form.bank_name || !form.account_number || !form.account_name)) {
            toast.error('Complete bank details');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            await axios.post(`${API_URL}/payments/withdraw-referral/`, {
                amount_usdt: amount,
                method: method,
                wallet_address: method === 'crypto' ? form.wallet_address : '',
                bank_name: method === 'bank' ? form.bank_name : '',
                account_number: method === 'bank' ? form.account_number : '',
                account_name: method === 'bank' ? form.account_name : '',
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success('🎉 Referral withdrawal submitted successfully!');
            setTimeout(() => navigate('/referrals'), 2000);
            await refreshUser();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Withdrawal failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingTop: 16 }}>
                <button onClick={() => navigate('/referrals')} style={{ width: 40, height: 40, background: 'var(--apex-card)', border: '1px solid var(--apex-border)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>Referral Withdrawal</h1>
            </div>

            {/* Zero Fee Banner */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(0, 211, 149, 0.1), rgba(0, 211, 149, 0.05))',
                border: '1px solid rgba(0, 211, 149, 0.2)',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            }}>
                <span style={{ fontSize: '20px' }}>⚡</span>
                <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--apex-green)' }}>No Transfer Fee</div>
                    <div style={{ fontSize: '12px', color: 'var(--apex-muted)' }}>Referral earnings can be withdrawn for free!</div>
                </div>
            </div>

            <div style={{ background: 'var(--apex-card)', borderRadius: '20px', padding: '24px', border: '1px solid var(--apex-border)', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--apex-muted)', marginBottom: '8px', fontWeight: 600 }}>Available Referral Earnings</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'rgba(255, 215, 0, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>₮</div>
                    <input
                        type="number"
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                        placeholder="0.00"
                        style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--apex-gold)', fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-display)', outline: 'none' }}
                    />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--apex-muted)' }}>
                    Balance: <strong style={{ color: 'var(--apex-text)' }}>${referralBalance.toFixed(2)} USDT</strong>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ background: 'var(--apex-card)', borderRadius: '16px', padding: '4px', display: 'flex', gap: '4px', marginBottom: '16px', border: '1px solid var(--apex-border)' }}>
                {['crypto', 'bank'].map(m => (
                    <button key={m} onClick={() => setMethod(m)} style={{ flex: 1, padding: '12px', background: method === m ? 'var(--apex-blue)' : 'transparent', border: 'none', borderRadius: '12px', color: method === m ? '#fff' : 'var(--apex-muted)', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                        {m === 'crypto' ? 'Crypto' : 'Bank'}
                    </button>
                ))}
            </div>

            {/* Dynamic Form */}
            <div style={{ background: 'var(--apex-card)', borderRadius: '20px', padding: '24px', border: '1px solid var(--apex-border)', marginBottom: '20px' }}>
                {method === 'crypto' ? (
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--apex-muted)', display: 'block', marginBottom: '8px' }}>USDT TRC20 Wallet</label>
                        <input
                            type="text"
                            value={form.wallet_address}
                            onChange={(e) => setForm({ ...form, wallet_address: e.target.value })}
                            placeholder="Paste address..."
                            style={{ width: '100%', padding: '16px', background: 'var(--apex-navy)', border: '1px solid var(--apex-border)', borderRadius: '14px', color: 'var(--apex-text)', fontSize: '14px', outline: 'none' }}
                        />
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '16px' }}>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--apex-muted)', display: 'block', marginBottom: '8px' }}>Select Bank</label>
                            <select
                                onChange={(e) => {
                                    const b = banks.find(x => x.name === e.target.value);
                                    setSelectedBank(b);
                                    setForm({ ...form, bank_name: e.target.value });
                                }}
                                style={{ width: '100%', padding: '16px', background: 'var(--apex-navy)', border: '1px solid var(--apex-border)', borderRadius: '14px', color: 'var(--apex-text)', outline: 'none' }}
                            >
                                <option value="">Select Bank...</option>
                                {banks.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <input
                                type="text"
                                value={form.account_number}
                                onChange={(e) => setForm({ ...form, account_number: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                placeholder="Account Number"
                                style={{ width: '100%', padding: '16px', background: 'var(--apex-navy)', border: '1px solid var(--apex-border)', borderRadius: '14px', color: 'var(--apex-text)', outline: 'none' }}
                            />
                        </div>
                        <div>
                            <input
                                type="text"
                                value={form.account_name}
                                onChange={(e) => setForm({ ...form, account_name: e.target.value })}
                                placeholder={verifying ? 'Verifying...' : 'Account Name'}
                                style={{ width: '100%', padding: '16px', background: 'var(--apex-navy)', border: '1px solid var(--apex-border)', borderRadius: '14px', color: 'var(--apex-text)', outline: 'none' }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <button
                onClick={handleSubmit}
                disabled={loading || referralBalance < 5}
                style={{
                    width: '100%',
                    padding: '18px',
                    background: loading ? 'var(--apex-navy)' : 'linear-gradient(135deg, #1A6FFF, #0044DD)',
                    border: 'none',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: 800,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 8px 16px rgba(26, 111, 255, 0.2)'
                }}
            >
                {loading ? 'Processing...' : 'Confirm Withdrawal'}
            </button>
        </AppLayout>
    );
};
