/**
 * Apex Cloud Mining — Transfer Fee Payment Page
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AppLayout } from '../../components/layout';
import useAuthStore from '../../context/authStore';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const WithdrawFeePage = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState('crypto');
  const [feeAmount, setFeeAmount] = useState(0);
  const [paymentInfo, setPaymentInfo] = useState(null);

  const [form, setForm] = useState({
    proof_image: null,
    tx_hash: '',
  });

  useEffect(() => {
    // Fetch tier's withdrawal fee
    const fetchFee = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get(`${API_URL}/mining/tiers/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const userTier = response.data.tiers.find(t => t.tier_number === user?.tier);
        if (userTier) {
          setFeeAmount(parseFloat(userTier.withdrawal_fee_usd || 10));
        }
      } catch (err) {
        console.error('Failed to fetch fee:', err);
        setFeeAmount(10); // Default
      }
    };

    // Fetch payment info
    const fetchPaymentInfo = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get(`${API_URL}/auth/agent-payment-info/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setPaymentInfo(response.data);
      } catch (err) {
        console.error('Failed to fetch payment info:', err);
      }
    };

    fetchFee();
    fetchPaymentInfo();
  }, [user]);

  // Plan 5 users don't pay transfer fee - redirect them straight back
  if (Number(user?.tier) >= 5) {
    toast.success('✨ Plan 5 members have no transfer fee!');
    setTimeout(() => navigate('/withdraw'), 800);
    return null;
  }

  // Redirect if already paid
  if (user?.withdrawal_fee_paid) {
    toast.success('✅ Transfer fee already paid!');
    setTimeout(() => navigate('/withdraw'), 1000);
    return null;
  }

  // Block if can't pay yet (Plan 1 < 100 USDT)
  const canPayFee = user?.tier === 1 ? parseFloat(user?.balance_usdt || 0) >= 100 : true;

  const handleFileChange = (e) => {
    setForm({ ...form, proof_image: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canPayFee) {
      toast.error('❌ Mine to 100 USDT first (Plan 1 requirement)');
      return;
    }

    if (!form.proof_image && method === 'bank') {
      toast.error('❌ Please upload payment proof');
      return;
    }

    if (!form.tx_hash && method === 'crypto') {
      toast.error('❌ Please enter transaction hash');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('method', method);
      formData.append('tx_hash', form.tx_hash);
      if (form.proof_image) {
        formData.append('proof_image', form.proof_image);
      }

      await axios.post(`${API_URL}/payments/pay-withdrawal-fee/`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('✅ Transfer fee payment submitted! Awaiting admin approval.');
      setTimeout(() => navigate('/withdraw'), 2000);
    } catch (err) {
      console.error('Fee payment error:', err);
      toast.error(err.response?.data?.detail || 'Payment failed');
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
        marginBottom: 20,
        paddingTop: 16,
      }}>
        <button
          onClick={() => navigate('/withdraw')}
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
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontWeight: 800,
        }}>
          Pay Transfer Fee
        </h1>
      </div>

      {!canPayFee && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,77,106,0.12), rgba(255,77,106,0.08))',
          border: '1px solid rgba(255,77,106,0.3)',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '20px',
        }}>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '18px',
            fontWeight: 800,
            color: 'var(--apex-red)',
            marginBottom: '10px',
          }}>
            ⚠️ Cannot Pay Fee Yet
          </h3>
          <p style={{
            fontSize: '14px',
            color: 'var(--apex-muted)',
            lineHeight: 1.7,
          }}>
            Plan 1 users must mine to <strong>100 USDT</strong> before paying transfer fee.
            <br />
            Current balance: <strong>${parseFloat(user?.balance_usdt || 0).toFixed(2)} USDT</strong>
          </p>
        </div>
      )}

      <div style={{
        opacity: canPayFee ? 1 : 0.4,
        pointerEvents: canPayFee ? 'auto' : 'none',
      }}>
        {/* Fee Amount Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(245,166,35,0.12), rgba(245,166,35,0.08))',
          border: '1px solid rgba(245,166,35,0.3)',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '20px',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '14px',
            color: 'var(--apex-muted)',
            marginBottom: '8px',
            fontWeight: 600,
          }}>
            One-Time Transfer Fee
          </div>
          <div style={{
            fontSize: '48px',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            color: 'var(--apex-gold)',
            marginBottom: '12px',
          }}>
            ${feeAmount.toFixed(2)}
          </div>
          <div style={{
            fontSize: '13px',
            color: 'var(--apex-muted)',
          }}>
            ≈ ₦{(feeAmount * 1600).toLocaleString()} NGN
          </div>
        </div>

        {/* Payment Method Tabs */}
        <div style={{
          background: 'var(--apex-card)',
          borderRadius: '20px',
          padding: '6px',
          display: 'flex',
          gap: '6px',
          marginBottom: '16px',
          border: '1px solid var(--apex-border)',
        }}>
          {['crypto', 'bank'].map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              style={{
                flex: 1,
                padding: '14px',
                background: method === m ? 'linear-gradient(135deg, #1A6FFF, #0044DD)' : 'transparent',
                border: 'none',
                borderRadius: '16px',
                color: method === m ? '#fff' : 'var(--apex-muted)',
                fontFamily: 'var(--font-display)',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: method === m ? '0 4px 12px rgba(26, 111, 255, 0.3)' : 'none',
              }}
            >
              {m === 'crypto' ? '₮ Crypto Payment' : '🏦 Bank Transfer'}
            </button>
          ))}
        </div>

        {/* Payment Info */}
        {paymentInfo && (
          <div style={{
            background: 'var(--apex-card)',
            borderRadius: '20px',
            padding: '24px',
            marginBottom: '16px',
            border: '1px solid var(--apex-border)',
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 700,
              marginBottom: '16px',
              color: 'var(--apex-text)',
            }}>
              {method === 'crypto' ? '₮ Payment Address' : '🏦 Bank Details'}
            </div>

            {method === 'bank' && (
              <div style={{
                background: 'rgba(255, 77, 106, 0.08)',
                border: '1px solid rgba(255, 77, 106, 0.4)',
                borderRadius: '14px',
                padding: '14px 16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}>
                <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>⚠️</span>
                <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: '#FF4D6A', fontWeight: 500 }}>
                  Make your transfer using any other bank as transfers from <strong>"OPay"</strong> may not be accepted for now due to network issues.
                </p>
              </div>
            )}

            {method === 'crypto' ? (
              <div style={{
                padding: '16px',
                background: 'var(--apex-navy)',
                borderRadius: '14px',
                fontFamily: 'monospace',
                fontSize: '13px',
                wordBreak: 'break-all',
                border: '1px solid var(--apex-border)',
              }}>
                {paymentInfo.usdt_wallet}
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {[
                  ['Bank Name', paymentInfo.bank_name],
                  ['Account Name', paymentInfo.account_name],
                  ['Account Number', paymentInfo.account_number],
                ].map(([label, value]) => (
                  <div key={label} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px',
                    background: 'var(--apex-navy)',
                    borderRadius: '12px',
                    border: '1px solid var(--apex-border)',
                  }}>
                    <span style={{ fontSize: '13px', color: 'var(--apex-muted)' }}>{label}</span>
                    <span style={{ fontSize: '14px', fontWeight: 700 }}>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upload Proof */}
        <div style={{
          background: 'var(--apex-card)',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '16px',
          border: '1px solid var(--apex-border)',
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 700,
            marginBottom: '16px',
          }}>
            Upload Payment Proof
          </div>

          {method === 'crypto' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                fontSize: '13px',
                color: 'var(--apex-muted)',
                marginBottom: '8px',
                display: 'block',
              }}>
                Transaction Hash
              </label>
              <input
                type="text"
                value={form.tx_hash}
                onChange={(e) => setForm({ ...form, tx_hash: e.target.value })}
                placeholder="Enter transaction hash..."
                style={{
                  width: '100%',
                  padding: '16px',
                  background: 'var(--apex-navy)',
                  border: '1px solid var(--apex-border)',
                  borderRadius: '14px',
                  color: 'var(--apex-text)',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  outline: 'none',
                }}
              />
            </div>
          )}

          <label style={{
            display: 'block',
            width: '100%',
            padding: '40px',
            background: 'var(--apex-navy)',
            border: '2px dashed var(--apex-border)',
            borderRadius: '14px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--apex-blue)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--apex-border)'}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📤</div>
            <div style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--apex-text)',
              marginBottom: '4px',
            }}>
              {form.proof_image ? form.proof_image.name : 'Upload Screenshot'}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'var(--apex-muted)',
            }}>
              Click to select image
            </div>
          </label>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || !form.proof_image || (method === 'crypto' && !form.tx_hash)}
          style={{
            width: '100%',
            padding: '18px',
            background: loading ? 'var(--apex-navy)' : 'linear-gradient(135deg, var(--apex-gold), #CC8800)',
            border: 'none',
            borderRadius: '16px',
            color: loading ? 'var(--apex-muted)' : '#000',
            fontFamily: 'var(--font-display)',
            fontSize: '16px',
            fontWeight: 800,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 8px 24px rgba(245, 166, 35, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
          }}
        >
          {loading ? 'Submitting...' : '💳 Submit Payment'}
        </button>
      </div>
    </AppLayout>
  );
};