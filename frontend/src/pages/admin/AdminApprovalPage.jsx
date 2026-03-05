import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export const AdminApprovalPage = () => {
    const [pendingAdmins, setPendingAdmins] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPending = async () => {
        try {
            const { data } = await adminAPI.getPendingAdmins();
            setPendingAdmins(Array.isArray(data) ? data : data.results || []);
        } catch (err) {
            toast.error('Failed to load pending applications');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleAction = async (id, action) => {
        try {
            if (action === 'approve') {
                await adminAPI.approveAdmin(id);
                toast.success('Admin approved!');
            } else {
                await adminAPI.rejectAdmin(id);
                toast.success('Admin rejected.');
            }
            fetchPending();
        } catch (err) {
            toast.error('Action failed');
        }
    };

    return (
        <div className="page-content" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{
                marginBottom: '32px',
                paddingTop: window.innerWidth < 768 ? '0px' : '40px'
            }}>
                <h1 className="font-display" style={{ fontSize: window.innerWidth < 768 ? '24px' : '32px', fontWeight: 700, marginBottom: '8px' }}>
                    Admin Approvals
                </h1>
                <p className="text-muted">Review and manage pending applications for Junior Admin roles.</p>
            </header>

            <div className="bg-card rounded-2xl shadow-md" style={{ padding: '24px', border: '1px solid var(--apex-border)' }}>
                {isLoading ? (
                    <div className="text-center" style={{ padding: '40px' }}>Loading...</div>
                ) : pendingAdmins.length === 0 ? (
                    <div className="text-center text-muted" style={{ padding: '40px' }}>No pending applications.</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr className="text-muted" style={{ fontSize: '13px', borderBottom: '1px solid var(--apex-border)' }}>
                                    <th style={{ textAlign: 'left', padding: '12px' }}>User Details</th>
                                    <th style={{ textAlign: 'left', padding: '12px' }}>Joined Date</th>
                                    <th style={{ textAlign: 'right', padding: '12px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingAdmins.map((user) => (
                                    <tr key={user.id} style={{ borderBottom: '1px solid var(--apex-border)' }}>
                                        <td style={{ padding: '16px 12px' }}>
                                            <div style={{ fontWeight: 600 }}>{user.full_name}</div>
                                            <div style={{ fontSize: '13px', color: 'var(--apex-muted)' }}>{user.email}</div>
                                        </td>
                                        <td className="text-muted" style={{ padding: '16px 12px', fontSize: '13px' }}>
                                            {new Date(user.date_joined).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleAction(user.id, 'approve')}
                                                className="rounded-lg"
                                                style={{
                                                    padding: '8px 16px',
                                                    background: 'rgba(0,211,149,0.1)',
                                                    color: 'var(--apex-green)',
                                                    border: 'none',
                                                    fontWeight: 600,
                                                    marginRight: '8px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleAction(user.id, 'reject')}
                                                className="rounded-lg"
                                                style={{
                                                    padding: '8px 16px',
                                                    background: 'rgba(255,77,106,0.1)',
                                                    color: 'var(--apex-red)',
                                                    border: 'none',
                                                    fontWeight: 600,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Reject
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
