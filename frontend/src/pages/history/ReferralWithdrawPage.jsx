/**
 * Apex Cloud Mining — Referral Earnings Transfer Page
 * Transfer referral balance to main account (no fees, instant)
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AppLayout } from '../../components/layout';
import useAuthStore from '../../context/authStore';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://apex-cloud-mining-1.onrender.com/api/v1';

export const ReferralWithdrawPage = () => {
    const navigate = useNavigate();
    const { user, refreshUser } = useAuthStore();

    const [loading, setLoading] = useState(false);
    const [referralBalance, setReferralBalance] = useState(parseFloat(user?.referral_balance_usdt || 0));
    const [mainBalance, setMainBalance] = useState(parseFloat(user?.balance_usdt || 0));
    const [transferAmount, setTransferAmount] = useState('');

    useEffect(() => {
        // Update balances from user object
        if (user) {
            setReferralBalance(parseFloat(user.referral_balance_usdt || 0));
            setMainBalance(parseFloat(user.balance_usdt || 0));
        }
    }, [user]);

    const handleMaxAmount = () => {
        setTransferAmount(referralBalance.toFixed(2));
    };

    const handleTransfer = async (e) => {
        e.preventDefault();
        const amount = parseFloat(transferAmount) || 0;

        if (amount < 10) {
            toast.error('Minimum transfer is $10 USDT');
            return;
        }

        if (amount > referralBalance) {
            toast.error('Insufficient referral balance');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const res = await axios.post(
                `${API_URL}/payments/transfer-referral-to-main/`,
                { amount_usdt: amount },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('🎉 Transfer successful! Amount added to main account.');
            
            // Update UI with new balances
            setReferralBalance(parseFloat(res.data.referral_balance_remaining || 0));
            setMainBalance(parseFloat(res.data.main_balance || 0));
            setTransferAmount('');
            
            // Refresh user data
            await refreshUser();
            
            // Redirect after 2 seconds
            setTimeout(() => navigate('/referrals'), 2000);
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Transfer failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingTop: 16 }}>
                <button 
                    onClick={() => navigate('/referrals')} 
                    style={{ width: 40, height: 40, background: 'var(--apex-card)', border: '1px solid var(--apex-border)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>Transfer Referral Earnings</h1>
            </div>

            {/* Info Banner */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(26, 111, 255, 0.1), rgba(26, 111, 255, 0.05))',
                border: '1px solid rgba(26, 111, 255, 0.2)',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            }}>
                <span style={{ fontSize: '20px' }}>ℹ️</span>
                <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--apex-blue)' }}>Transfer to Main Account</div>
                    <div style={{ fontSize: '12px', color: 'var(--apex-muted)' }}>Move your referral earnings to your main account. Then withdraw via your preferred method.</div>
                </div>
            </div>

            {/* Balances Display */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                {/* Referral Balance */}
                <div style={{ background: 'var(--apex-card)', borderRadius: '16px', padding: '20px', border: '1px solid var(--apex-border)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--apex-muted)', marginBottom: '8px', fontWeight: 600 }}>Referral Balance</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--apex-gold)', marginBottom: '4px' }}>
                        ${referralBalance.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--apex-muted)' }}>USDT</div>
                </div>

                {/* Arrow */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24" style={{ color: 'var(--apex-blue)' }}>
                        <polyline points="5 12 19 12" />
                        <polyline points="12 5 19 12 12 19" />
                    </svg>
                </div>

                {/* Main Balance */}
                <div style={{ background: 'var(--apex-card)', borderRadius: '16px', padding: '20px', border: '1px solid var(--apex-border)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--apex-muted)', marginBottom: '8px', fontWeight: 600 }}>Main Account Balance</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--apex-green)', marginBottom: '4px' }}>
                        ${mainBalance.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--apex-muted)' }}>USDT</div>
                </div>
            </div>

            {/* Transfer Form */}
            <div style={{ background: 'var(--apex-card)', borderRadius: '20px', padding: '24px', border: '1px solid var(--apex-border)', marginBottom: '20px' }}>
                <form onSubmit={handleTransfer}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--apex-muted)', display: 'block', marginBottom: '8px' }}>Transfer Amount</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--apex-navy)', border: '1px solid var(--apex-border)', borderRadius: '14px', padding: '16px' }}>
                            <div style={{ width: '40px', height: '40px', background: 'rgba(26, 111, 255, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 800 }}>$</div>
                            <input
                                type="number"
                                value={transferAmount}
                                onChange={(e) => setTransferAmount(e.target.value)}
                                placeholder="0.00"
                                step="0.01"
                                min="10"
                                max={referralBalance}
                                style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--apex-text)', fontSize: '18px', fontWeight: 800, outline: 'none' }}
                            />
                            <button
                                type="button"
                                onClick={handleMaxAmount}
                                style={{ padding: '8px 14px', background: 'rgba(26, 111, 255, 0.1)', border: '1px solid rgba(26, 111, 255, 0.3)', borderRadius: '8px', color: 'var(--apex-blue)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                            >
                                MAX
                            </button>
                        </div>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--apex-muted)', marginBottom: '20px', padding: '12px', background: 'rgba(26, 111, 255, 0.05)', borderRadius: '8px', borderLeft: '3px solid var(--apex-blue)' }}>
                        💡 <strong>Minimum transfer:</strong> $10 USDT | <strong>No fees:</strong> 100% goes to your main account
                    </div>

                    <button
                        type="submit"
                        disabled={loading || referralBalance < 10}
                        style={{
                            width: '100%',
                            padding: '18px',
                            background: loading ? 'var(--apex-navy)' : referralBalance < 10 ? 'var(--apex-navy)' : 'linear-gradient(135deg, #1A6FFF, #0044DD)',
                            border: 'none',
                            borderRadius: '16px',
                            color: referralBalance < 10 ? 'var(--apex-muted)' : '#fff',
                            fontSize: '16px',
                            fontWeight: 800,
                            cursor: loading || referralBalance < 10 ? 'not-allowed' : 'pointer',
                            boxShadow: '0 8px 16px rgba(26, 111, 255, 0.2)'
                        }}
                    >
                        {loading ? 'Processing...' : 'Transfer to Main Account'}
                    </button>

                    {referralBalance < 10 && (
                        <div style={{ fontSize: '12px', color: 'var(--apex-muted)', marginTop: '12px', textAlign: 'center' }}>
                            Minimum balance of $10 USDT required to transfer
                        </div>
                    )}
                </form>
            </div>

            {/* Info Section */}
            <div style={{ background: 'var(--apex-card)', borderRadius: '16px', padding: '20px', border: '1px solid var(--apex-border)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '12px', color: 'var(--apex-text)' }}>Next Steps</h3>
                <ol style={{ fontSize: '13px', color: 'var(--apex-muted)', lineHeight: 1.8, paddingLeft: '20px' }}>
                    <li style={{ marginBottom: '8px' }}>Transfer your referral balance to your main account above</li>
                    <li style={{ marginBottom: '8px' }}>Visit the <strong>Withdraw</strong> page to withdraw to your bank or crypto wallet</li>
                    <li>Enjoy fee-free referral earnings! 🎉</li>
                </ol>
            </div>
        </AppLayout>
    );
};

