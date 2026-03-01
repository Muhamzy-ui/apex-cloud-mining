/**
 * Apex Cloud Mining — Complete Withdrawal Page (FULLY FIXED)
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AppLayout } from '../../components/layout';
import useAuthStore from '../../context/authStore';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/* ============================================================
   WITHDRAWAL SUCCESS MODAL
   ============================================================ */
const WithdrawalSuccessModal = ({ transaction, onClose }) => {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.85)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        background: 'var(--apex-card)',
        borderRadius: '28px',
        width: '100%',
        maxWidth: '440px',
        padding: '40px 28px',
        textAlign: 'center',
        animation: 'scaleIn 0.3s ease',
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          background: 'linear-gradient(135deg, #00D395, #00BF88)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 8px 32px rgba(0, 211, 149, 0.3)',
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" width="50" height="50">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '24px',
          fontWeight: 800,
          marginBottom: '12px',
        }}>
          Withdrawal Successful
        </h2>

        <p style={{
          fontSize: '14px',
          color: 'var(--apex-muted)',
          marginBottom: '32px',
          lineHeight: 1.6,
        }}>
          Your withdrawal has been processed successfully. Funds will arrive shortly.
        </p>

        <div style={{
          background: 'var(--apex-navy)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
          textAlign: 'left',
        }}>
          {[
            { icon: '💰', label: 'Withdrawal Amount', value: `$${transaction.amount_usdt.toFixed(2)} USDT`, bgColor: 'rgba(0, 211, 149, 0.1)' },
            { icon: '🔖', label: 'Transaction ID', value: transaction.transaction_id, bgColor: 'rgba(26, 111, 255, 0.1)', mono: true },
            { icon: '📅', label: 'Date & Time', value: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }), bgColor: 'rgba(245, 166, 35, 0.1)' },
            { icon: transaction.method === 'crypto' ? '₮' : '🏦', label: 'Destination', value: transaction.destination, bgColor: 'rgba(26, 111, 255, 0.1)', mono: true },
          ].map((item, i, arr) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: i < arr.length - 1 ? '16px' : 0,
              paddingBottom: i < arr.length - 1 ? '16px' : 0,
              borderBottom: i < arr.length - 1 ? '1px solid var(--apex-border)' : 'none',
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: item.bgColor,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ fontSize: '20px' }}>{item.icon}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: 'var(--apex-muted)', marginBottom: '2px' }}>
                  {item.label}
                </div>
                <div style={{
                  fontSize: item.mono ? '13px' : '14px',
                  fontWeight: 700,
                  fontFamily: item.mono ? 'monospace' : 'inherit',
                }}>
                  {item.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          background: 'rgba(0, 211, 149, 0.08)',
          border: '1px solid rgba(0, 211, 149, 0.2)',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span style={{ fontSize: '18px' }}>⏱️</span>
          <div style={{ textAlign: 'left', flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--apex-green)' }}>
              Processing Time
            </div>
            <div style={{ fontSize: '12px', color: 'var(--apex-muted)', marginTop: '2px' }}>
              1-2 business days
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            onClose();
            window.location.href = '/dashboard';
          }}
          style={{
            width: '100%',
            padding: '16px',
            background: 'linear-gradient(135deg, #1A6FFF, #0044DD)',
            border: 'none',
            borderRadius: '14px',
            color: '#fff',
            fontFamily: 'var(--font-display)',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: '12px',
            boxShadow: '0 8px 24px rgba(26, 111, 255, 0.3)',
          }}
        >
          🏠 Back to Dashboard
        </button>

        <button
          onClick={() => window.location.href = '/history'}
          style={{
            width: '100%',
            padding: '14px',
            background: 'transparent',
            border: '1px solid var(--apex-border)',
            borderRadius: '14px',
            color: 'var(--apex-text)',
            fontFamily: 'var(--font-display)',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          🕐 View All Transactions
        </button>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

/* ============================================================
   MAIN WITHDRAWAL PAGE
   ============================================================ */
export const WithdrawPage = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuthStore();

  // Page state
  const [method, setMethod] = useState('crypto');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transaction, setTransaction] = useState(null);
  const [limits, setLimits] = useState({ min: 10, max: 10000 });
  const [banks, setBanks] = useState([]);
  const [bankSearch, setBankSearch] = useState('');
  const [selectedBank, setSelectedBank] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verifiedName, setVerifiedName] = useState('');
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [planTransferFeeUsdt, setPlanTransferFeeUsdt] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(1600);

  // Form state
  const [form, setForm] = useState({
    amount: '',
    wallet_address: user?.trc20_wallet || '',
    bank_name: '',
    account_number: '',
    account_name: '',
  });

  const canWithdraw = user?.can_withdraw || false;
  const withdrawalFeePaid = user?.withdrawal_fee_paid || false;
  const balance = parseFloat(user?.balance_usdt || 0);
  const amount = parseFloat(form.amount) || 0;
  const userPlan = Number(user?.tier) || 1;

  // Plan 5 users are exempt from transfer fee
  const isExemptFromFee = userPlan >= 5;
  const effectiveFeePaid = isExemptFromFee ? true : withdrawalFeePaid;

  // Transfer fee for Transaction Summary
  const feeNgn = (planTransferFeeUsdt * exchangeRate);

  // Safe access to limits
  const minLimit = limits?.min || 10;
  const maxLimit = limits?.max || 10000;

  // Eligibility flags
  const isTier1 = userPlan === 1;
  const hasMinedTo100 = balance >= 100;
  const isUpgraded = userPlan > 1;

  // Show the tier-lock message when the user is Plan 1, hasn't mined to 100,
  // hasn't upgraded and hasn't already paid the transfer fee.
  const showTierLockMessage = !effectiveFeePaid && isTier1 && !hasMinedTo100 && !isUpgraded;

  // Fetch list of Nigerian banks on mount
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await axios.get(`${API_URL}/payments/banks/`);
        setBanks(response.data || []);
      } catch (err) {
        console.error('Failed to fetch banks:', err);
        setBanks([]);
      }
    };
    fetchBanks();
  }, []);

  // Fetch user's plan transfer fee and exchange rate
  useEffect(() => {
    const fetchPlanFee = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get(`${API_URL}/mining/tiers/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const tiers = response.data?.tiers || response.data || [];
        const userTierObj = tiers.find(t => t.tier_number === userPlan);
        if (userTierObj) setPlanTransferFeeUsdt(parseFloat(userTierObj.withdrawal_fee_usd || 0));
      } catch (err) {
        console.error('Failed to fetch plan fee:', err);
      }
    };
    const fetchRate = async () => {
      try {
        const response = await axios.get(`${API_URL}/payments/exchange-rate/`);
        setExchangeRate(parseFloat(response.data?.usd_to_ngn || 1600));
      } catch (err) {
        setExchangeRate(1600);
      }
    };
    fetchPlanFee();
    fetchRate();
  }, [userPlan]);

  // Fetch withdrawal limits
  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get(`${API_URL}/payments/withdrawal-limits/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setLimits(response.data || { min: 10, max: 10000 });
      } catch (err) {
        console.error('Failed to fetch limits:', err);
        setLimits({ min: 10, max: 10000 });
      }
    };
    fetchLimits();
  }, []);

  // Auto-verify account name when account number is complete (10 digits)
  // This mimics Opay's behavior of real-time account verification
  useEffect(() => {
    const verifyAccount = async () => {
      if (selectedBank && form.account_number.length === 10) {
        setVerifying(true);
        try {
          const token = localStorage.getItem('access_token');
          const response = await axios.post(
            `${API_URL}/payments/verify-account/`,
            {
              account_number: form.account_number,
              bank_code: selectedBank.code,
            },
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );
          setVerifiedName(response.data.account_name);
          setForm(prev => ({ ...prev, account_name: response.data.account_name }));
        } catch (err) {
          console.error('Verification failed:', err);
          setVerifiedName('');
          toast.error('Could not verify account. Please check and try again.');
        } finally {
          setVerifying(false);
        }
      } else {
        setVerifiedName('');
      }
    };

    const timer = setTimeout(verifyAccount, 500);
    return () => clearTimeout(timer);
  }, [selectedBank, form.account_number]);

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const setPercentage = (percent) => {
    const newAmount = (balance * percent / 100).toFixed(2);
    setForm(prev => ({ ...prev, amount: newAmount }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!effectiveFeePaid) {
      toast.error('⚠️ Please pay transfer fee first!');
      setTimeout(() => navigate('/withdraw-fee'), 1500);
      return;
    }

    if (amount < minLimit) {
      toast.error(`Minimum withdrawal is $${minLimit} USDT`);
      return;
    }

    if (amount > maxLimit) {
      toast.error(`Maximum withdrawal is $${maxLimit} USDT`);
      return;
    }

    if (amount > balance) {
      toast.error('Insufficient balance');
      return;
    }

    if (method === 'crypto' && !form.wallet_address) {
      toast.error('Please enter your TRC20 wallet address');
      return;
    }

    if (method === 'bank' && (!form.bank_name || !form.account_number || !form.account_name)) {
      toast.error('❌ Please complete bank details and provide the account name');
      return;
    }
    // We no longer require automatic verification; users may enter the name manually
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `${API_URL}/payments/withdraw/`,
        {
          amount_usdt: amount,
          method: method,
          wallet_address: method === 'crypto' ? form.wallet_address : '',
          bank_name: method === 'bank' ? form.bank_name : '',
          account_number: method === 'bank' ? form.account_number : '',
          account_name: method === 'bank' ? form.account_name : '',
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setTransaction({
        transaction_id: response.data.transaction_id,
        amount_usdt: amount,
        method: method,
        destination: method === 'crypto' ? form.wallet_address : form.account_number,
      });
      setShowSuccess(true);

      await refreshUser();
      setForm(prev => ({ ...prev, amount: '' }));
    } catch (err) {
      console.error('Withdrawal error:', err);
      const msg = err.response?.data?.detail || 'Withdrawal failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const filteredBanks = banks.filter(bank =>
    bank.name.toLowerCase().includes(bankSearch.toLowerCase())
  );

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
          onClick={() => navigate('/dashboard')}
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
          color: 'var(--apex-text)',
        }}>
          Withdrawal
        </h1>
      </div>

      {showTierLockMessage && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(245,252,255,0.98))',
          border: '1px solid rgba(220,230,235,0.6)',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '20px',
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            background: 'rgba(255,235,238,0.6)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--apex-red)" strokeWidth="2" width="28" height="28">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '20px',
            fontWeight: 800,
            color: 'var(--apex-red)',
            marginBottom: '12px',
          }}>
            Withdrawal Not Available for Plan 1
          </h3>

          <p style={{
            fontSize: '14px',
            color: 'var(--apex-muted)',
            marginBottom: '16px',
            lineHeight: 1.7,
          }}>
            To start withdrawing your earnings, you have two options:
          </p>

          <ol style={{ marginLeft: '18px', marginBottom: '18px', color: 'var(--apex-muted)', lineHeight: 1.8 }}>
            <li><strong style={{ color: 'var(--apex-blue)' }}>Accumulate 100 USDT</strong> in your balance and maintain Plan 1 status</li>
            <li><strong style={{ color: 'var(--apex-blue)' }}>Upgrade to a higher plan</strong> for instant withdrawal</li>
          </ol>

          <button
            onClick={() => navigate('/upgrade')}
            style={{
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #00C2A8, #1A6FFF)',
              border: 'none',
              borderRadius: '14px',
              color: '#fff',
              fontFamily: 'var(--font-display)',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ➜ Upgrade Account Now
          </button>
        </div>
      )}



      {withdrawalFeePaid && !canWithdraw && user?.tier === 1 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,77,106,0.08), rgba(255,77,106,0.04))',
          border: '1px solid rgba(255,77,106,0.2)',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '20px',
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            background: 'rgba(255,77,106,0.15)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--apex-red)" strokeWidth="2" width="28" height="28">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '18px',
            fontWeight: 800,
            color: 'var(--apex-red)',
            marginBottom: '10px',
          }}>
            Minimum Balance Required
          </h3>

          <p style={{
            fontSize: '14px',
            color: 'var(--apex-muted)',
            marginBottom: '20px',
            lineHeight: 1.7,
          }}>
            Plan 1 requires <strong style={{ color: 'var(--apex-blue)' }}>100 USDT</strong> minimum balance.
            <br />
            Current: <strong>${balance.toFixed(2)} USDT</strong>
          </p>

          <button
            onClick={() => navigate('/upgrade')}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #1A6FFF, #0044DD)',
              border: 'none',
              borderRadius: '14px',
              color: '#fff',
              fontFamily: 'var(--font-display)',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 8px 24px rgba(26, 111, 255, 0.3)',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            Upgrade to Remove Limit
          </button>
        </div>
      )}

      <div style={{
        opacity: canWithdraw || !showTierLockMessage ? 1 : 0.4,
        pointerEvents: canWithdraw || !showTierLockMessage ? 'auto' : 'none',
        overflow: 'hidden', // Prevent horizontal bleed on mobile
      }}>
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
              {m === 'crypto' ? 'Crypto Withdrawal' : 'Bank Transfer'}
            </button>
          ))}
        </div>

        <div style={{
          background: 'var(--apex-card)',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '16px',
          border: '1px solid var(--apex-border)',
        }}>
          <div style={{
            fontSize: '13px',
            color: 'var(--apex-muted)',
            marginBottom: '8px',
            fontWeight: 600,
          }}>
            Withdrawal Amount
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'rgba(26, 111, 255, 0.1)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: '24px' }}>₮</span>
            </div>
            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={set('amount')}
              placeholder="0.00"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: 'var(--apex-text)',
                fontSize: '32px',
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                outline: 'none',
              }}
            />
            <div style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--apex-blue)',
            }}>
              USDT
            </div>
          </div>

          <div style={{
            fontSize: '13px',
            color: 'var(--apex-muted)',
            marginBottom: '16px',
          }}>
            Available: <strong style={{ color: 'var(--apex-green)' }}>{balance.toFixed(2)} USDT</strong>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {[25, 50, 75].map(percent => (
              <button
                key={percent}
                onClick={() => setPercentage(percent)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--apex-navy)',
                  border: '1px solid var(--apex-border)',
                  borderRadius: '12px',
                  color: 'var(--apex-text)',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {percent}%
              </button>
            ))}
            <button
              onClick={() => setPercentage(100)}
              style={{
                flex: 1,
                padding: '12px',
                background: 'linear-gradient(135deg, #1A6FFF, #0044DD)',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(26, 111, 255, 0.3)',
              }}
            >
              MAX
            </button>
          </div>
        </div>

        {method === 'crypto' && (
          <div style={{
            background: 'var(--apex-card)',
            borderRadius: '20px',
            padding: '24px',
            marginBottom: '16px',
            border: '1px solid var(--apex-border)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--apex-muted)',
              }}>
                TRC20 Wallet Address
              </div>
              {form.wallet_address && (
                <div style={{
                  padding: '4px 12px',
                  background: 'rgba(0, 211, 149, 0.1)',
                  border: '1px solid rgba(0, 211, 149, 0.2)',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--apex-green)',
                }}>
                  Bound
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              background: 'var(--apex-navy)',
              borderRadius: '14px',
              border: '1px solid var(--apex-border)',
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                background: 'rgba(26, 111, 255, 0.1)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--apex-blue)" strokeWidth="2" width="18" height="18">
                  <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9m-9 9a9 9 0 0 1 9-9" />
                </svg>
              </div>
              <input
                type="text"
                value={form.wallet_address}
                onChange={set('wallet_address')}
                placeholder="Enter TRC20 wallet address..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--apex-text)',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        )}

        {method === 'bank' && (
          <div style={{
            background: 'var(--apex-card)',
            borderRadius: '20px',
            padding: '24px',
            marginBottom: '16px',
            border: '1px solid var(--apex-border)',
          }}>

            {/* Voluntary Donation Remark */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(26,111,255,0.08), rgba(0,68,221,0.05))',
              border: '1px solid rgba(26,111,255,0.2)',
              borderRadius: '14px',
              padding: '16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: 'rgba(26,111,255,0.1)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '18px',
              }}>
                🤝
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--apex-text)', fontWeight: 700 }}>
                  Support the Community
                </h4>
                <p style={{ margin: '0 0 10px 0', fontSize: '13px', lineHeight: 1.5, color: 'var(--apex-muted)' }}>
                  Enjoying Apex Cloud Mining? Consider making a voluntary donation to support our platform and community initiatives.
                </p>
                <div
                  onClick={() => navigate('/donations')}
                  style={{
                    display: 'inline-block',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--apex-blue)',
                    cursor: 'pointer',
                  }}
                >
                  Make a Donation →
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '16px', position: 'relative' }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--apex-muted)',
                marginBottom: '8px',
              }}>
                🏦 Select Bank
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={bankSearch}
                  onChange={(e) => {
                    setBankSearch(e.target.value);
                    setShowBankDropdown(true);
                  }}
                  onFocus={() => setShowBankDropdown(true)}
                  placeholder="Search bank name or code..."
                  style={{
                    width: '100%',
                    padding: '16px',
                    paddingRight: selectedBank ? '48px' : '16px',
                    background: 'var(--apex-navy)',
                    border: '1px solid var(--apex-border)',
                    borderRadius: '14px',
                    color: 'var(--apex-text)',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                />
                {selectedBank && (
                  <button
                    onClick={() => {
                      setSelectedBank(null);
                      setBankSearch('');
                      setVerifiedName('');
                      setForm(prev => ({ ...prev, bank_name: '', account_name: '', account_number: '' }));
                    }}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--apex-muted)',
                      cursor: 'pointer',
                      fontSize: '20px',
                      padding: '4px',
                    }}
                    title="Clear selection"
                  >
                    ✕
                  </button>
                )}
              </div>

              {showBankDropdown && filteredBanks.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '8px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  background: 'var(--apex-card)',
                  border: '1px solid var(--apex-border)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  zIndex: 10,
                }}>
                  {filteredBanks.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--apex-muted)', fontSize: '13px' }}>
                      No banks found
                    </div>
                  ) : (
                    filteredBanks.map(bank => (
                      <div
                        key={bank.code}
                        onClick={() => {
                          setSelectedBank(bank);
                          setBankSearch(bank.name);
                          setForm(prev => ({ ...prev, bank_name: bank.name }));
                          setShowBankDropdown(false);
                        }}
                        style={{
                          padding: '14px 16px',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--apex-border)',
                          fontSize: '14px',
                          fontWeight: 500,
                          transition: 'background 0.2s',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(26,111,255,0.08)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <span>{bank.name}</span>
                        <span style={{ fontSize: '12px', color: 'var(--apex-muted)' }}>{bank.code}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 600,
                color: selectedBank ? 'var(--apex-muted)' : 'var(--apex-red)',
                marginBottom: '8px',
              }}>
                💳 Account Number
                {!selectedBank && <span style={{ marginLeft: '6px', fontSize: '11px' }}>(Select bank first)</span>}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                background: selectedBank ? 'var(--apex-navy)' : 'rgba(26, 111, 255, 0.05)',
                borderRadius: '14px',
                border: `1px solid ${selectedBank ? 'var(--apex-border)' : 'rgba(255, 77, 106, 0.3)'}`,
                opacity: selectedBank ? 1 : 0.6,
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  background: 'rgba(26, 111, 255, 0.1)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--apex-blue)" strokeWidth="2" width="18" height="18">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </div>
                <input
                  type="text"
                  disabled={!selectedBank}
                  value={form.account_number}
                  onChange={(e) => {
                    if (!selectedBank) return;
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setForm(prev => ({ ...prev, account_number: value }));
                    if (value.length !== 10) {
                      setVerifiedName('');
                    }
                  }}
                  placeholder={selectedBank ? "Enter 10-digit account number" : "Select a bank first"}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--apex-text)',
                    fontSize: '15px',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: selectedBank ? 'text' : 'not-allowed',
                  }}
                />
              </div>

              {verifying && (
                <div style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  color: 'var(--apex-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    border: '2px solid var(--apex-blue)',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  Verifying account...
                </div>
              )}

              {/* show verification success banner but allow editing */}
              {verifiedName && (
                <div style={{
                  marginTop: '8px',
                  padding: '12px',
                  background: 'rgba(0, 211, 149, 0.1)',
                  border: '1px solid rgba(0, 211, 149, 0.2)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    background: 'var(--apex-green)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" width="14" height="14">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', color: 'var(--apex-muted)' }}>Auto‑detected account name (you may edit)</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--apex-green)' }}>
                      {verifiedName}
                    </div>
                  </div>
                </div>
              )}
              {/* if automatic lookup didn't yield a name, show hint */}
              {selectedBank && form.account_number.length === 10 && !verifying && !verifiedName && (
                <div style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  color: 'var(--apex-red)',
                }}>
                  Couldn’t verify automatically? Enter the account holder’s name below.
                </div>
              )}
              {/* always allow user to provide or adjust account name */}
              <div style={{ marginTop: '12px' }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--apex-muted)',
                  marginBottom: '6px',
                }}>
                  👤 Account Name
                </div>
                <input
                  type="text"
                  value={form.account_name}
                  onChange={(e) => {
                    setForm(prev => ({ ...prev, account_name: e.target.value }));
                    setVerifiedName(''); // clear auto name when user edits
                  }}
                  placeholder="Enter account holder name"
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: 'var(--apex-navy)',
                    border: '1px solid var(--apex-border)',
                    borderRadius: '14px',
                    color: 'var(--apex-text)',
                    fontSize: '14px',
                    outline: 'none',
                    fontWeight: 600,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {amount > 0 && (
          <div style={{
            background: 'var(--apex-card)',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '16px',
            border: '1px solid var(--apex-border)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '16px',
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: 'rgba(26, 111, 255, 0.1)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--apex-blue)" strokeWidth="2" width="16" height="16">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--apex-text)',
              }}>
                Transaction Summary
              </div>
            </div>

            {[
              ['Amount:', `${amount.toFixed(2)} USD = ${(amount * exchangeRate).toLocaleString('en-NG', { maximumFractionDigits: 0 })} NGN`],
              isExemptFromFee
                ? ['Transfer Fee:', 'FREE (Plan 5)', 'var(--apex-green)']
                : ['Transfer Fee:', `${planTransferFeeUsdt.toFixed(2)} USDT = ${feeNgn.toLocaleString('en-NG', { maximumFractionDigits: 0 })} NGN`, planTransferFeeUsdt > 0 ? 'var(--apex-gold)' : 'var(--apex-green)'],
            ].map(([label, value, color], i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}>
                <span style={{ fontSize: '13px', color: 'var(--apex-muted)' }}>{label}</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: color || 'var(--apex-text)' }}>
                  {value}
                </span>
              </div>
            ))}

            <div style={{
              height: '1px',
              background: 'var(--apex-border)',
              margin: '12px 0',
            }} />

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '14px', fontWeight: 700 }}>Total Deduction:</span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--apex-blue)' }}>
                {(amount * 1600).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} NGN
              </span>
            </div>
          </div>
        )}

        <div style={{
          background: 'rgba(26, 111, 255, 0.05)',
          border: '1px solid rgba(26, 111, 255, 0.2)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '20px',
        }}>
          <div style={{
            display: 'flex',
            gap: '12px',
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              background: 'var(--apex-blue)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '14px', color: 'white', fontWeight: 800 }}>!</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--apex-blue)',
                marginBottom: '6px',
              }}>
                Important Notice
              </div>
              <ul style={{
                fontSize: '12px',
                color: 'var(--apex-muted)',
                lineHeight: 1.7,
                paddingLeft: '20px',
                margin: 0,
              }}>
                <li>Minimum withdrawal: ${minLimit} USD</li>
                <li>Maximum per transaction: ${maxLimit.toLocaleString()} USD</li>
                <li>Verify account details before confirming</li>
                <li>Transfers processed within 1-2 business days</li>
              </ul>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !amount || amount < minLimit}
          style={{
            width: '100%',
            padding: '18px',
            background: loading || !amount ? 'var(--apex-navy)' : 'linear-gradient(135deg, #00D395, #00BF88)',
            border: 'none',
            borderRadius: '16px',
            color: loading || !amount ? 'var(--apex-muted)' : '#fff',
            fontFamily: 'var(--font-display)',
            fontSize: '16px',
            fontWeight: 800,
            cursor: loading || !amount ? 'not-allowed' : 'pointer',
            boxShadow: loading || !amount ? 'none' : '0 8px 24px rgba(0, 211, 149, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: '18px',
                height: '18px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              Processing...
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              {method === 'crypto' ? 'Withdraw to Wallet' : 'Withdraw to Bank'}
            </>
          )}
        </button>
      </div>

      {showSuccess && transaction && (
        <WithdrawalSuccessModal
          transaction={transaction}
          onClose={() => setShowSuccess(false)}
        />
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AppLayout>
  );
};