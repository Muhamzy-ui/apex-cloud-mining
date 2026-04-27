import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export const AdminAdminsPage = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchAdmins = async () => {
        setIsLoading(true);
        try {
            const { data } = await adminAPI.getUsers({ search, is_admin_only: 'true' });
            // Handle both paginated (results) and non-paginated responses
            setUsers(Array.isArray(data) ? data : data.results || []);
        } catch (err) {
            toast.error('Failed to load admins');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(fetchAdmins, 500);
        return () => clearTimeout(timeout);
    }, [search]);

    const handleToggle = async (userId, currentState) => {
        const confirmMsg = currentState 
            ? 'Are you sure you want to deactivate this admin? They will lose access to their account.' 
            : 'Are you sure you want to reactivate this admin?';
            
        if (!window.confirm(confirmMsg)) return;

        try {
            await adminAPI.toggleUser(userId);
            toast.success(currentState ? 'Admin deactivated' : 'Admin activated');
            fetchAdmins();
        } catch (err) {
            toast.error('Failed to toggle status');
        }
    };

    return (
        <div className="page-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{
                marginBottom: '32px',
                display: 'flex',
                flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: window.innerWidth < 768 ? 'flex-start' : 'flex-end',
                gap: '20px'
            }}>
                <div>
                    <h1 className="font-display" style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
                        Junior Admins
                    </h1>
                    <p className="text-muted">Manage the Junior Admins under your network.</p>
                </div>
                <div style={{ width: window.innerWidth < 768 ? '100%' : '300px' }}>
                    <input
                        type="text"
                        className="bg-card rounded-xl shadow-sm"
                        style={{
                            width: '100%',
                            padding: '12px 20px',
                            border: '1px solid var(--apex-border)',
                            color: 'var(--apex-text)',
                            fontSize: '14px'
                        }}
                        placeholder="Search name, email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </header>

            <div className="bg-card rounded-2xl shadow-md" style={{ padding: '24px', border: '1px solid var(--apex-border)' }}>
                {isLoading ? (
                    <div className="text-center" style={{ padding: '40px' }}>Searching...</div>
                ) : users.length === 0 ? (
                    <div className="text-center text-muted" style={{ padding: '40px' }}>No admins found.</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr className="text-muted" style={{ fontSize: '12px', borderBottom: '1px solid var(--apex-border)' }}>
                                    <th style={{ textAlign: 'left', padding: '12px' }}>Admin</th>
                                    <th style={{ textAlign: 'left', padding: '12px' }}>Role</th>
                                    <th style={{ textAlign: 'left', padding: '12px' }}>Status</th>
                                    <th style={{ textAlign: 'left', padding: '12px' }}>Balance</th>
                                    <th style={{ textAlign: 'right', padding: '12px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid var(--apex-border)', transition: '0.2s' }}>
                                        <td style={{ padding: '16px 12px' }}>
                                            <div style={{ fontWeight: 600 }}>{u.full_name || 'Admin'}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--apex-muted)' }}>{u.email}</div>
                                        </td>
                                        <td style={{ padding: '16px 12px' }}>
                                            <span style={{
                                                fontSize: '11px',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                background: 'rgba(255,140,0,0.1)',
                                                color: 'var(--apex-gold)',
                                                fontWeight: 600,
                                                textTransform: 'uppercase'
                                            }}>
                                                Admin
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 12px' }}>
                                            <span style={{
                                                fontSize: '12px',
                                                color: u.is_active ? 'var(--apex-green)' : 'var(--apex-red)'
                                            }}>
                                                {u.is_active ? '● Active' : '○ Deactivated'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 12px', fontWeight: 700, color: 'var(--apex-blue)' }}>
                                            ${parseFloat(u.balance_usdt).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleToggle(u.id, u.is_active)}
                                                style={{
                                                    background: u.is_active ? 'var(--apex-red)' : 'var(--apex-green)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    padding: '6px 12px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    fontWeight: 600
                                                }}
                                            >
                                                {u.is_active ? 'Deactivate' : 'Activate'}
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
