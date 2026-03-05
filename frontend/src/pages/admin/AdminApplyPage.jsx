import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import useAuthStore from '../../context/authStore';
import toast from 'react-hot-toast';

export const AdminApplyPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();
    const [token, setToken] = useState(searchParams.get('token') || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // If already an admin, redirect
    useEffect(() => {
        if (user?.is_admin || user?.is_superuser) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            toast.error('Please login first to apply.');
            navigate('/login', { state: { from: window.location.pathname + window.location.search } });
            return;
        }

        setIsSubmitting(true);
        try {
            await adminAPI.applyForAdmin(token);
            toast.success('Application submitted! Please wait for Super Admin approval.');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to submit application');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="page-content" style={{ maxWidth: '500px', margin: '0 auto', paddingTop: '80px', textAlign: 'center' }}>
            <div className="bg-card rounded-2xl shadow-lg" style={{ padding: '40px', border: '1px solid var(--apex-border)' }}>
                <div style={{ fontSize: '48px', marginBottom: '24px' }}>📩</div>
                <h1 className="font-display" style={{ fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>
                    Admin Application
                </h1>
                <p className="text-muted" style={{ marginBottom: '32px' }}>
                    You have been invited to join the Apex Mining operations team. Please enter your secret invite token to apply.
                </p>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '24px', textAlign: 'left' }}>
                        <label className="text-muted" style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>Secret Invite Token</label>
                        <input
                            type="text"
                            className="bg-navy rounded-lg shadow-sm"
                            style={{
                                width: '100%',
                                padding: '14px',
                                border: '1px solid var(--apex-border)',
                                color: 'var(--apex-text)',
                                textAlign: 'center',
                                fontFamily: 'monospace',
                                fontSize: '16px'
                            }}
                            placeholder="00000000-0000-0000-0000-000000000000"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || !token}
                        className="rounded-xl shadow-md"
                        style={{
                            width: '100%',
                            padding: '16px',
                            background: 'var(--grad-blue)',
                            color: 'white',
                            border: 'none',
                            fontWeight: 700,
                            fontSize: '16px',
                            cursor: (isSubmitting || !token) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isSubmitting ? 'Submitting...' : 'Apply for Admin Role'}
                    </button>
                </form>

                <p className="text-muted" style={{ marginTop: '24px', fontSize: '13px' }}>
                    Admin status requires manual review by the Super Admin after submission.
                </p>
            </div>
        </div>
    );
};
