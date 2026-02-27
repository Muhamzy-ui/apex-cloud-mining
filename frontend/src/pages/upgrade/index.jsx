/**
 * Apex Mining - Upgrade Plans Page (WITH AGENT SYSTEM)
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AppLayout } from '../../components/layout';
import useAuthStore from '../../context/authStore';
import useNotificationStore from '../../context/notificationStore';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

const PLANS = [
  { n: 1, name: 'Plan 1', price_usd: 0,      price_ngn: 0,      earn: 1.00,   duration: '100 Days', isFree: true },
  { n: 2, name: 'Plan 2', price_usd: 16,     price_ngn: 23235,  earn: 50.00,  duration: '14 Days',  isPopular: true },
  { n: 3, name: 'Plan 3', price_usd: 69.99,  price_ngn: 85000,  earn: 130.00, duration: '14 Days' },
  { n: 4, name: 'Plan 4', price_usd: 235.99, price_ngn: 321264, earn: 399.00, duration: '14 Days' },
  { n: 5, name: 'Plan 5', price_usd: 435.99, price_ngn: 818000, earn: 699.00, duration: '30 Days' },
];

/* ─── Payment Modal ─────────────────────────────────────── */
const PayModal = ({ plan, paymentInfo, agentName, onClose }) => {
  const [method, setMethod] = useState('crypto');
  const [proof, setProof] = useState(null);
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const { add } = useNotificationStore();
  const token = localStorage.getItem('access_token');
  
  const copy = (t) => {
    navigator.clipboard.writeText(t);
    toast.success('Copied!');
  };

  const submit = async () => {
    if (!proof) {
      toast.error('Upload payment proof/screenshot');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('tier_target', plan.n);
      formData.append('amount_usd', plan.price_usd);
      formData.append('amount_ngn', plan.price_ngn);
      formData.append('method', method);
      formData.append('proof_image', proof);
      
      if (txHash.trim()) {
        formData.append('tx_hash', txHash);
      }

      await axios.post(`${API_URL}/payments/deposit/`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('✅ Payment submitted! Awaiting admin approval.');
      add('⏳', 'Payment Submitted', `Your ${plan.name} upgrade payment has been submitted. Admin will review within 24 hours.`);
      
      onClose();
    } catch (err) {
      console.error('Deposit error:', err);
      const errorMsg = err.response?.data?.detail || err.response?.data?.error || 'Failed to submit payment';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const tab = (active) => ({
    flex: 1,
    padding: '13px',
    borderRadius: '12px',
    textAlign: 'center',
    cursor: 'pointer',
    background: active ? 'rgba(26,111,255,0.12)' : 'var(--apex-navy)',
    border: `2px solid ${active ? 'var(--apex-blue)' : 'var(--apex-border)'}`,
    transition: 'all 0.18s',
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        zIndex: 500,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        backdropFilter: 'blur(6px)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--apex-card)',
        borderRadius: '28px 28px 0 0',
        width: '100%',
        maxWidth: '540px',
        padding: '28px 24px 40px',
        border: '1px solid var(--apex-border)',
        borderBottom: 'none',
        maxHeight: '92vh',
        overflowY: 'auto',
        animation: 'fadeUp 0.3s ease',
      }}>
        <div style={{
          width: '40px',
          height: '4px',
          background: 'var(--apex-border)',
          borderRadius: '2px',
          margin: '0 auto 22px',
        }} />
        
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '20px',
          fontWeight: 800,
          marginBottom: agentName ? '4px' : '16px',
        }}>
          Upgrade to {plan.name}
        </h3>
        
        {agentName && (
          <p style={{
            fontSize: '13px',
            color: 'var(--apex-muted)',
            marginBottom: '16px',
          }}>
            💚 Paying to agent: <strong style={{ color: 'var(--apex-green)' }}>{agentName}</strong>
          </p>
        )}

        {/* Summary */}
        <div style={{
          background: 'var(--apex-navy)',
          borderRadius: '14px',
          padding: '14px',
          marginBottom: '18px',
        }}>
          {[
            ['Earn / day', `$${plan.earn.toFixed(2)} USDT`],
            ['Period', plan.duration],
            ['Price', plan.isFree ? 'FREE' : `$${plan.price_usd} USD / ₦${plan.price_ngn.toLocaleString()}`],
          ].map(([k, v]) => (
            <div key={k} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: '1px solid var(--apex-border)',
            }}>
              <span style={{ fontSize: '13px', color: 'var(--apex-muted)' }}>{k}</span>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Method tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
          <div style={tab(method === 'crypto')} onClick={() => setMethod('crypto')}>
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>₮</div>
            <div style={{
              fontSize: '12px',
              fontWeight: 600,
              color: method === 'crypto' ? 'var(--apex-blue)' : 'var(--apex-muted)',
            }}>
              USDT TRC20
            </div>
          </div>
          <div style={tab(method === 'bank')} onClick={() => setMethod('bank')}>
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>🏦</div>
            <div style={{
              fontSize: '12px',
              fontWeight: 600,
              color: method === 'bank' ? 'var(--apex-blue)' : 'var(--apex-muted)',
            }}>
              Bank Transfer
            </div>
          </div>
        </div>

        {/* Crypto payment */}
        {method === 'crypto' && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', color: 'var(--apex-muted)', marginBottom: '8px' }}>
              Send <strong style={{ color: 'var(--apex-text)' }}>${plan.price_usd} USDT (TRC20)</strong> to:
            </p>
            <div onClick={() => copy(paymentInfo.usdt_wallet)} style={{
              background: 'rgba(26,111,255,0.08)',
              border: '1px solid var(--apex-blue)',
              borderRadius: '12px',
              padding: '12px 14px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
            }}>
              <span style={{
                fontSize: '11px',
                color: 'var(--apex-blue)',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
              }}>
                {paymentInfo.usdt_wallet}
              </span>
              <span style={{
                background: 'var(--apex-blue)',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: '6px',
                flexShrink: 0,
              }}>
                Copy
              </span>
            </div>

            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--apex-muted)',
              marginBottom: '6px',
            }}>
              Transaction Hash (Optional)
            </label>
            <input
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="Enter TXID after sending"
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'var(--apex-navy)',
                border: '1px solid var(--apex-border)',
                borderRadius: '10px',
                color: 'var(--apex-text)',
                fontSize: '13px',
                fontFamily: 'monospace',
              }}
            />
          </div>
        )}

        {/* Bank payment */}
        {method === 'bank' && (
          <div style={{
            background: 'var(--apex-navy)',
            borderRadius: '14px',
            padding: '14px',
            marginBottom: '16px',
          }}>
            {[
              ['Bank', paymentInfo.bank_name],
              ['Account Name', paymentInfo.account_name],
              ['Account No', paymentInfo.account_number],
              ['Amount', `₦${plan.price_ngn.toLocaleString()}`],
            ].map(([k, v]) => (
              <div key={k} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '9px 0',
                borderBottom: '1px solid var(--apex-border)',
              }}>
                <span style={{ fontSize: '12px', color: 'var(--apex-muted)' }}>{k}</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: k === 'Amount' ? 'var(--apex-gold)' : 'var(--apex-text)',
                  }}>
                    {v}
                  </span>
                  {k === 'Account No' && (
                    <span onClick={() => copy(v)} style={{
                      fontSize: '10px',
                      color: 'var(--apex-blue)',
                      cursor: 'pointer',
                      background: 'rgba(26,111,255,0.1)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}>
                      Copy
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload proof */}
        <label style={{
          border: `2px dashed ${proof ? 'var(--apex-green)' : 'var(--apex-border)'}`,
          borderRadius: '14px',
          padding: '18px',
          display: 'block',
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: '16px',
          transition: 'border 0.2s',
        }}>
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => setProof(e.target.files[0])}
          />
          {proof ? (
            <p style={{ color: 'var(--apex-green)', fontSize: '13px', fontWeight: 600 }}>
              ✓ {proof.name}
            </p>
          ) : (
            <p style={{ color: 'var(--apex-muted)', fontSize: '13px' }}>
              📎 Upload payment screenshot
            </p>
          )}
        </label>

        {/* Submit button */}
        <button onClick={submit} disabled={loading} style={{
          width: '100%',
          background: loading ? 'var(--apex-card2)' : 'linear-gradient(135deg,var(--apex-blue),#0044DD)',
          border: 'none',
          borderRadius: '14px',
          padding: '16px',
          color: loading ? 'var(--apex-muted)' : '#fff',
          fontFamily: 'var(--font-display)',
          fontSize: '15px',
          fontWeight: 800,
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '10px',
          boxShadow: loading ? 'none' : '0 8px 24px rgba(26,111,255,0.3)',
          transition: 'all 0.2s',
        }}>
          {loading ? 'Submitting...' : 'I Have Made Payment ✓'}
        </button>
        
        <button onClick={onClose} style={{
          width: '100%',
          background: 'transparent',
          border: '1px solid var(--apex-border)',
          borderRadius: '14px',
          padding: '14px',
          color: 'var(--apex-muted)',
          fontFamily: 'var(--font-display)',
          fontSize: '14px',
          cursor: 'pointer',
        }}>
          Cancel
        </button>
      </div>
    </div>
  );
};

/* ─── Plan Card ────────────────────────────────────────── */
const PlanCard = ({ plan, currentPlan, onUpgrade }) => {
  const isCurrent = plan.n === currentPlan;
  const isPast = plan.n < currentPlan;
  const isNext = plan.n > currentPlan;

  return (
    <div style={{
      background: 'var(--apex-card)',
      border: `1px solid ${isCurrent ? 'rgba(26,111,255,0.45)' : 'var(--apex-border)'}`,
      borderRadius: '22px',
      padding: '22px 22px 18px',
      marginBottom: '14px',
      boxShadow: isCurrent ? '0 0 30px rgba(26,111,255,0.12)' : 'none',
      opacity: isPast ? 0.55 : 1,
      animation: 'fadeUp 0.3s ease both',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '18px',
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '22px',
          fontWeight: 800,
        }}>
          {plan.name}
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {isCurrent && (
            <span style={{
              background: 'var(--apex-green)',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 13px',
              borderRadius: '20px',
              fontFamily: 'var(--font-display)',
            }}>
              Current
            </span>
          )}
          {plan.isPopular && !isCurrent && !isPast && (
            <span style={{
              background: 'var(--apex-gold)',
              color: '#000',
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 13px',
              borderRadius: '20px',
              fontFamily: 'var(--font-display)',
            }}>
              Popular
            </span>
          )}
          {isPast && (
            <span style={{
              background: 'rgba(0,211,149,0.12)',
              color: 'var(--apex-green)',
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 13px',
              borderRadius: '20px',
              border: '1px solid rgba(0,211,149,0.25)',
            }}>
              ✓ Done
            </span>
          )}
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--apex-border)' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '13px 0',
          borderBottom: '1px solid var(--apex-border)',
        }}>
          <span style={{ fontSize: '14px', color: 'var(--apex-muted)' }}>Period</span>
          <span style={{ fontSize: '14px', fontWeight: 700 }}>{plan.duration}</span>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '13px 0',
          borderBottom: '1px solid var(--apex-border)',
        }}>
          <span style={{ fontSize: '14px', color: 'var(--apex-muted)' }}>Earn per 24hrs</span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '15px',
            fontWeight: 800,
            color: 'var(--apex-blue)',
          }}>
            ${plan.earn.toFixed(2)} USDT
          </span>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '13px 0',
        }}>
          <span style={{ fontSize: '14px', color: 'var(--apex-muted)' }}>Price</span>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '16px', fontWeight: 800 }}>
              ${plan.isFree ? '0.00' : plan.price_usd} USD
            </div>
            <div style={{ fontSize: '12px', color: 'var(--apex-muted)', marginTop: '2px' }}>
              ≈ ₦{plan.price_ngn.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '4px' }}>
        {isCurrent && (
          <div style={{
            background: 'var(--apex-card2)',
            borderRadius: '14px',
            padding: '15px',
            textAlign: 'center',
            color: 'var(--apex-muted)',
            fontSize: '14px',
            fontWeight: 600,
          }}>
            Current Plan
          </div>
        )}
        {isPast && (
          <div style={{
            background: 'var(--apex-card2)',
            borderRadius: '14px',
            padding: '15px',
            textAlign: 'center',
            color: 'var(--apex-muted)',
            fontSize: '14px',
            fontWeight: 600,
          }}>
            ✓ Completed
          </div>
        )}
        {isNext && (
          <button onClick={() => onUpgrade(plan)} style={{
            width: '100%',
            background: 'linear-gradient(135deg,var(--apex-blue),#0044DD)',
            border: 'none',
            borderRadius: '14px',
            padding: '15px',
            color: '#fff',
            fontFamily: 'var(--font-display)',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(26,111,255,0.3)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}>
            Upgrade to {plan.name}
          </button>
        )}
      </div>
    </div>
  );
};

/* ─── Main Page ────────────────────────────────────────── */
export const UpgradePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [withdrawalFees, setWithdrawalFees] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const currentPlan = Number(user?.tier) || 1;
  const currentPlanObj = PLANS.find((t) => t.n === currentPlan) || PLANS[0];

  // Fetch agent payment info and withdrawal fees on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        
        // Fetch payment info
        const paymentResponse = await axios.get(`${API_URL}/auth/agent-payment-info/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setPaymentInfo(paymentResponse.data);
        
        // Fetch withdrawal fees (admin-configured)
        const feesResponse = await axios.get(`${API_URL}/payments/withdrawal-fees/`);
        if (feesResponse.data && feesResponse.data.fees) {
          setWithdrawalFees(feesResponse.data.fees);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        toast.error('Failed to load information');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
            <div style={{ color: 'var(--apex-muted)' }}>Loading plans...</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingTop: 16 }}>
        <button onClick={() => navigate('/dashboard')} style={{
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
          Upgrade Plan
        </h1>
      </div>

      {/* Active plan banner */}
      <div style={{
        background: 'rgba(26,111,255,0.08)',
        border: '1px solid rgba(26,111,255,0.18)',
        borderRadius: '16px',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
      }}>
        <div>
          <div style={{
            fontSize: '11px',
            color: 'var(--apex-muted)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '2px',
          }}>
            Active Plan
          </div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '16px',
            fontWeight: 800,
            color: 'var(--apex-blue)',
          }}>
            {currentPlanObj.name}
          </div>
        </div>
        <div style={{
          background: 'rgba(0,211,149,0.12)',
          border: '1px solid rgba(0,211,149,0.25)',
          borderRadius: '10px',
          padding: '7px 13px',
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--apex-green)',
        }}>
          ${currentPlanObj.earn.toFixed(2)}/day
        </div>
      </div>

      {/* Plan cards */}
      {PLANS.map((plan) => (
        <PlanCard
          key={plan.n}
          plan={plan}
          currentPlan={currentPlan}
          onUpgrade={setSelected}
        />
      ))}

      {/* Payment Modal */}
      {selected && paymentInfo && (
        <PayModal
          plan={selected}
          paymentInfo={paymentInfo}
          agentName={paymentInfo.has_agent ? paymentInfo.agent_name : null}
          onClose={() => setSelected(null)}
        />
      )}
    </AppLayout>
  );
};