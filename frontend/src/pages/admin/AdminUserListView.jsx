import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export const AdminUserListView = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const { data } = await adminAPI.getUsers({ search });
            // Handle both paginated (results) and non-paginated responses
            setUsers(Array.isArray(data) ? data : data.results || []);
        } catch (err) {
            toast.error('Failed to load users');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(fetchUsers, 500);
        return () => clearTimeout(timeout);
    }, [search]);

    const handleToggle = async (userId) => {
        try {
            await adminAPI.toggleUser(userId);
            toast.success('User status updated');
            fetchUsers();
        } catch (err) {
            toast.error('Failed to toggle status');
        }
    };

    return (
        <div className="page-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 className="font-display" style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
                        User Management
                    </h1>
                    <p className="text-muted">View and manage accounts in your network.</p>
                </div>
                <div style={{ width: '300px' }}>
                    <input
                        id="user_search"
                        name="user_search"
                        type="text"
                        className="bg-card rounded-xl shadow-sm"
                        style={{
                            width: '100%',
                            padding: '12px 20px',
                            border: '1px solid var(--apex-border)',
                            color: 'var(--apex-text)',
                            fontSize: '14px'
                        }}
                        placeholder="Search name, email or phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </header>

            <div className="bg-card rounded-2xl shadow-md" style={{ padding: '24px', border: '1px solid var(--apex-border)' }}>
                {isLoading ? (
                    <div className="text-center" style={{ padding: '40px' }}>Searching...</div>
                ) : users.length === 0 ? (
                    <div className="text-center text-muted" style={{ padding: '40px' }}>No users found.</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr className="text-muted" style={{ fontSize: '12px', borderBottom: '1px solid var(--apex-border)' }}>
                                    <th style={{ textAlign: 'left', padding: '12px' }}>User</th>
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
                                            <div style={{ fontWeight: 600 }}>{u.full_name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--apex-muted)' }}>{u.email}</div>
                                        </td>
                                        <td style={{ padding: '16px 12px' }}>
                                            <span style={{
                                                fontSize: '11px',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                background: u.is_superuser ? 'rgba(26,111,255,0.1)' : 'rgba(255,255,255,0.05)',
                                                color: u.is_superuser ? 'var(--apex-blue)' : 'var(--apex-text)',
                                                fontWeight: 600,
                                                textTransform: 'uppercase'
                                            }}>
                                                {u.is_superuser ? 'Super' : u.is_admin ? 'Junior' : 'User'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 12px' }}>
                                            <span style={{
                                                fontSize: '12px',
                                                color: u.is_active ? 'var(--apex-green)' : 'var(--apex-red)'
                                            }}>
                                                {u.is_active ? '● Active' : '○ Suspended'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 12px', fontWeight: 700, color: 'var(--apex-blue)' }}>
                                            ${parseFloat(u.balance_usdt).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleToggle(u.id)}
                                                className="text-muted hover-text-white"
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                                            >
                                                {u.is_active ? 'Suspend' : 'Activate'}
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
