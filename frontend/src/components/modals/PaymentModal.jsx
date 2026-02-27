/**
 * Apex Cloud Mining — Payment Modal Component
 * Handles both USDT TRC20 crypto and Nigerian Bank Transfer payments
 */
import React, { useState, useEffect } from 'react';
import { Button } from '../ui';
import { paymentsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';

export const PaymentModal = ({ tier, onClose }) => {
  const [method, setMethod]       = useState('crypto');
  const [settings, setSettings]  = useState(null);
  const [proof, setProof]         = useState(null);
  const [loading, setLoading]     = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    paymentsAPI.settings().then(({ data }) => setSettings(data));
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('tier_target', tier.tier_number);
      fd.append('amount_usd',  tier.price_usd);
      fd.append('amount_ngn',  tier.price_ngn);
      fd.append('method',      method);
      if (proof) fd.append('proof_image', proof);

      await paymentsAPI.deposit(fd);
      toast.success('Payment submitted! Awaiting admin confirmation.');
      onClose();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Submission failed.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Copied!'));
  };

  if (!tier) return null;

  const overlay = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    backdropFilter: 'blur(4px)',
  };

  const sheet = {
    background: 'var(--apex-card)',
    borderRadius: '28px 28px 0 0',
    padding: '28px 24px 40px',
    width: '100%', maxWidth: '480px',
    border: '1px solid var(--apex-border)',
    borderBottom: 'none',
    maxHeight: '90vh',
    overflowY: 'auto',
    animation: 'fadeUp 0.3s ease',
  };

  const payOptStyle = (active) => ({
    background: active ? 'rgba(26,111,255,0.08)' : 'var(--apex-navy)',
    border: `2px solid ${active ? 'var(--apex-blue)' : 'var(--apex-border)'}`,
    borderRadius: '16px', padding: '16px 12px', textAlign: 'center',
    cursor: 'pointer', transition: 'all 0.2s', flex: 1,
  });

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={sheet}>
        <div style={{ width: '40px', height: '4px', background: 'var(--apex-border)', borderRadius: '2px', margin: '0 auto 20px' }}/>

        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, marginBottom: '4px' }}>
          Upgrade to {tier.name}
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--apex-muted)', marginBottom: '22px' }}>
          Choose your payment method to proceed
        </p>

        {/* Method selector */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <div style={payOptStyle(method === 'crypto')} onClick={() => setMethod('crypto')}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>₮</div>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>USDT TRC20</div>
            <div style={{ fontSize: '11px', color: 'var(--apex-muted)', marginTop: '3px' }}>Crypto payment</div>
          </div>
          <div style={payOptStyle(method === 'bank')} onClick={() => setMethod('bank')}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏦</div>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>Bank Transfer</div>
            <div style={{ fontSize: '11px', color: 'var(--apex-muted)', marginTop: '3px' }}>Naira payment</div>
          </div>
        </div>

        {/* Summary row */}
        <div style={{
          background: 'var(--apex-navy)', border: '1px solid var(--apex-border)',
          borderRadius: '16px', padding: '16px', marginBottom: '16px',
        }}>
          {[
            ['Plan',    tier.name],
            ['Amount',  `$${tier.price_usd} USD`],
            ['In NGN',  `≈ ₦${parseFloat(tier.price_ngn).toLocaleString()}`],
            ['In GHS',  `≈ GHS ${tier.price_ghs}`],
            ['Earn/day',`$${tier.earn_per_24h_usd} USDT`],
            ['Period',  `${tier.duration_days} Days`],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--apex-border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--apex-muted)' }}>{label}</span>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Crypto details */}
        {method === 'crypto' && settings && (
          <div>
            <p style={{ fontSize: '12px', color: 'var(--apex-muted)', marginBottom: '8px' }}>
              Send exact amount to this TRC20 wallet:
            </p>
            <div
              onClick={() => copyText(settings.usdt_wallet)}
              style={{
                background: 'rgba(26,111,255,0.08)', border: '1px solid var(--apex-blue)',
                borderRadius: '12px', padding: '12px 14px', fontSize: '12px',
                color: 'var(--apex-blue)', fontFamily: 'monospace', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '8px', wordBreak: 'break-all', marginBottom: '16px',
              }}
            >
              <span>{settings.usdt_wallet}</span>
              <span style={{ fontSize: '11px', flexShrink: 0, background: 'var(--apex-blue)', color: '#fff', padding: '4px 8px', borderRadius: '6px' }}>
                Copy
              </span>
            </div>

            <label style={{ fontSize: '12px', color: 'var(--apex-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
              Upload Payment Proof
            </label>
            <label style={{
              border: '2px dashed var(--apex-border)', borderRadius: '14px',
              padding: '20px', textAlign: 'center', cursor: 'pointer',
              display: 'block', marginBottom: '16px',
            }}>
              <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={(e) => setProof(e.target.files[0])} />
              {proof
                ? <p style={{ fontSize: '13px', color: 'var(--apex-green)' }}>✓ {proof.name}</p>
                : <>
                    <p style={{ fontSize: '13px', color: 'var(--apex-muted)' }}>Tap to upload screenshot</p>
                    <p style={{ fontSize: '11px', color: 'var(--apex-blue)', marginTop: '4px' }}>JPG, PNG or PDF</p>
                  </>
              }
            </label>
          </div>
        )}

        {/* Bank details */}
        {method === 'bank' && settings && (
          <div>
            <div style={{ background: 'var(--apex-navy)', border: '1px solid var(--apex-border)', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
              {[
                ['Bank Name',       settings.bank_name],
                ['Account Name',    settings.bank_account_name],
                ['Account Number',  settings.bank_account_number],
                ['Amount (NGN)',    `₦${parseFloat(tier.price_ngn).toLocaleString()}`],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--apex-border)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--apex-muted)' }}>{label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: label === 'Amount (NGN)' ? 'var(--apex-gold)' : 'inherit' }}>{value}</span>
                    {(label === 'Account Number' || label === 'Account Name') && (
                      <span onClick={() => copyText(value)} style={{ fontSize: '11px', color: 'var(--apex-blue)', cursor: 'pointer', flexShrink: 0 }}>Copy</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <label style={{ fontSize: '12px', color: 'var(--apex-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
              Upload Bank Receipt
            </label>
            <label style={{ border: '2px dashed var(--apex-border)', borderRadius: '14px', padding: '20px', textAlign: 'center', cursor: 'pointer', display: 'block', marginBottom: '16px' }}>
              <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={(e) => setProof(e.target.files[0])} />
              {proof
                ? <p style={{ fontSize: '13px', color: 'var(--apex-green)' }}>✓ {proof.name}</p>
                : <>
                    <p style={{ fontSize: '13px', color: 'var(--apex-muted)' }}>Tap to upload receipt</p>
                    <p style={{ fontSize: '11px', color: 'var(--apex-blue)', marginTop: '4px' }}>JPG, PNG or PDF</p>
                  </>
              }
            </label>
          </div>
        )}

        <Button fullWidth loading={loading} onClick={handleSubmit}>
          I Have Made Payment
        </Button>
        <Button fullWidth variant="secondary" style={{ marginTop: '10px' }} onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
};