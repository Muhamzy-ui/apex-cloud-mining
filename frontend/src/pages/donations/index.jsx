/**
 * Apex Mining - Voluntary Donations Page
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AppLayout } from '../../components/layout';
import useAuthStore from '../../context/authStore';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const DonationsPage = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [paymentInfo, setPaymentInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch generic payment info
    useEffect(() => {
        const fetchPaymentInfo = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const response = await axios.get(`${API_URL}/auth/agent-payment-info/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setPaymentInfo(response.data);
            } catch (err) {
                console.error('Failed to fetch payment info:', err);
                toast.error('Could not load donation details');
            } finally {
                setLoading(false);
            }
        };

        fetchPaymentInfo();
    }, []);

    const copy = (t) => {
        navigator.clipboard.writeText(t);
        toast.success('Copied to clipboard!');
    };

    return (
        <AppLayout>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingTop: 16 }}>
                <button onClick={() => navigate(-1)} style={{
                    width: 40,
                    height: 40,
                    background: 'var(--apex-card)',
                    border: '1px solid var(--apex-border)',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>
                    Voluntary Donations
                </h1>
            </div>

            <div style={{
                background: 'linear-gradient(135deg, rgba(26,111,255,0.08), rgba(0,68,221,0.05))',
                border: '1px solid rgba(26,111,255,0.2)',
                borderRadius: '20px',
                padding: '24px',
                marginBottom: '24px',
                textAlign: 'center',
                animation: 'fadeUp 0.4s ease',
            }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤝</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: 'var(--apex-text)' }}>
                    Support Apex Cloud Mining
                </h2>
                <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--apex-muted)', marginBottom: 0 }}>
                    Your generous contributions help us maintain the platform, improve infrastructure, and expand our services. Donations of any size are deeply appreciated by the entire team and community.
                </p>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                    <div style={{ color: 'var(--apex-muted)', fontSize: '14px' }}>Loading payment details...</div>
                </div>
            ) : paymentInfo ? (
                <div style={{ animation: 'fadeUp 0.5s ease' }}>

                    {/* Crypto Donation Card */}
                    <div style={{
                        background: 'var(--apex-card)',
                        borderRadius: '20px',
                        padding: '24px',
                        marginBottom: '16px',
                        border: '1px solid var(--apex-border)',
                    }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>₮</span> Donate via Crypto (USDT TRC20)
                        </h3>

                        <p style={{ fontSize: '13px', color: 'var(--apex-muted)', marginBottom: '12px' }}>
                            Send any amount of USDT on the TRC20 network to this address:
                        </p>

                        <div onClick={() => copy(paymentInfo.usdt_wallet)} style={{
                            background: 'rgba(26,111,255,0.08)',
                            border: '1px solid var(--apex-blue)',
                            borderRadius: '12px',
                            padding: '14px 16px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '12px',
                        }}>
                            <span style={{
                                fontSize: '13px',
                                color: 'var(--apex-blue)',
                                fontFamily: 'monospace',
                                wordBreak: 'break-all',
                            }}>
                                {paymentInfo.usdt_wallet}
                            </span>
                            <span style={{
                                background: 'var(--apex-blue)',
                                color: '#fff',
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '6px 10px',
                                borderRadius: '8px',
                                flexShrink: 0,
                            }}>
                                Copy
                            </span>
                        </div>
                    </div>

                    {/* Bank Donation Card */}
                    <div style={{
                        background: 'var(--apex-card)',
                        borderRadius: '20px',
                        padding: '24px',
                        marginBottom: '24px',
                        border: '1px solid var(--apex-border)',
                    }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>🏦</span> Donate via Local Bank Transfer
                        </h3>

                        <div style={{
                            background: 'var(--apex-navy)',
                            borderRadius: '14px',
                            padding: '16px',
                        }}>
                            {[
                                ['Bank Name', paymentInfo.bank_name],
                                ['Account Name', paymentInfo.account_name],
                                ['Account Number', paymentInfo.account_number],
                            ].map(([label, value]) => (
                                <div key={label} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '10px 0',
                                    borderBottom: '1px solid var(--apex-border)',
                                }}>
                                    <span style={{ fontSize: '13px', color: 'var(--apex-muted)' }}>{label}</span>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 700 }}>{value}</span>
                                        {label === 'Account Number' && (
                                            <span onClick={() => copy(value)} style={{
                                                fontSize: '11px',
                                                color: 'var(--apex-blue)',
                                                cursor: 'pointer',
                                                background: 'rgba(26,111,255,0.1)',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                fontWeight: 600,
                                            }}>
                                                Copy
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '13px', color: 'var(--apex-muted)' }}>
                            Thank you for your generosity! 💚 <br />
                            Donations are processed automatically.
                        </p>
                    </div>
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--apex-red)' }}>
                    Failed to load payment gateways. Please try again later.
                </div>
            )}
        </AppLayout>
    );
};
