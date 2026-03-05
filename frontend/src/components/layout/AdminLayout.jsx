import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuthStore from '../../context/authStore';

export const AdminLayout = ({ role }) => {
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = role === 'super' ? [
        { label: 'Overview', icon: '📊', path: '/admin/super' },
        { label: 'Invitations', icon: '📩', path: '/admin/invites' },
        { label: 'Admin Approval', icon: '✅', path: '/admin/approvals' },
        { label: 'Audit Log', icon: '📋', path: '/admin/audit' },
        { label: 'User List', icon: '👥', path: '/admin/users' },
    ] : [
        { label: 'Overview', icon: '📊', path: '/admin/junior' },
        { label: 'My Referrals', icon: '👥', path: '/admin/users' },
        { label: 'Deposits', icon: '💳', path: '/admin/deposits' },
        { label: 'Withdrawals', icon: '💸', path: '/admin/withdrawals' },
    ];

    return (
        <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh', background: 'var(--apex-dark)' }}>
            {/* Sidebar */}
            <aside style={{
                width: '260px',
                background: 'var(--apex-card)',
                borderRight: '1px solid var(--apex-border)',
                display: 'flex',
                flexDirection: 'column',
                padding: '24px 0',
                position: 'fixed',
                height: '100vh',
                zIndex: 50
            }}>
                <div style={{ padding: '0 24px', marginBottom: '40px' }}>
                    <div className="font-display" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--apex-blue)' }}>APEX ADMIN</div>
                    <div style={{ fontSize: '11px', color: 'var(--apex-muted)', marginTop: '4px' }}>
                        {role === 'super' ? 'SUPER ADMIN PORTAL' : 'JUNIOR ADMIN PORTAL'}
                    </div>
                </div>

                <nav style={{ flex: 1 }}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                padding: '14px 24px',
                                color: isActive ? 'white' : 'var(--apex-muted)',
                                background: isActive ? 'var(--grad-blue)' : 'transparent',
                                textDecoration: 'none',
                                gap: '12px',
                                fontSize: '14px',
                                fontWeight: 600,
                                transition: '0.2s'
                            })}
                        >
                            <span style={{ fontSize: '18px' }}>{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div style={{ padding: '0 24px' }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: 'rgba(255,77,106,0.1)',
                            color: 'var(--apex-red)',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: 700,
                            cursor: 'pointer'
                        }}
                    >
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, marginLeft: '260px', padding: '40px' }}>
                <header style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600 }}>{user?.full_name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--apex-muted)' }}>{user?.email}</div>
                    </div>
                </header>

                <Outlet />
            </main>
        </div>
    );
};
