import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../context/authStore';

export const AdminLayout = () => {
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const role = user?.is_superuser ? 'super' : 'junior';
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = role === 'super' ? [
        { label: 'Overview', icon: '📊', path: '/admin/overview' },
        { label: 'Invitations', icon: '📩', path: '/admin/invites' },
        { label: 'Admin Approval', icon: '✅', path: '/admin/approvals' },
        { label: 'Audit Log', icon: '📋', path: '/admin/audit' },
        { label: 'User List', icon: '👥', path: '/admin/users' },
        { label: 'Payment Settings', icon: '⚙️', path: '/admin/settings' },
    ] : [
        { label: 'Overview', icon: '📊', path: '/admin/overview' },
        { label: 'My Referrals', icon: '👥', path: '/admin/users' },
        { label: 'Payment Settings', icon: '⚙️', path: '/admin/settings' },
        { label: 'Deposits', icon: '💳', path: '/admin/deposits' },
        { label: 'Withdrawals', icon: '💸', path: '/admin/withdrawals' },
    ];

    const sidebarStyle = {
        width: '260px',
        background: 'var(--apex-card)',
        borderRight: '1px solid var(--apex-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        position: 'fixed',
        height: '100vh',
        zIndex: 100,
        transition: '0.3s ease-in-out',
    };

    return (
        <div className="admin-layout" style={{ minHeight: '100vh', background: 'var(--apex-dark)', color: 'white' }}>
            {/* Mobile Header */}
            <header style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                background: 'var(--apex-card)',
                borderBottom: '1px solid var(--apex-border)',
                position: 'sticky',
                top: 0,
                zIndex: 90,
                visibility: window.innerWidth > 992 ? 'hidden' : 'visible',
                height: window.innerWidth > 992 ? 0 : 'auto',
                opacity: window.innerWidth > 992 ? 0 : 1
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', padding: 0 }}
                    >
                        {isMobileMenuOpen ? '✕' : '☰'}
                    </button>
                    <div className="font-display" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--apex-blue)' }}>APEX</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{user?.full_name?.split(' ')[0]}</div>
                    <div style={{ fontSize: '11px', color: 'var(--apex-muted)' }}>{role.toUpperCase()}</div>
                </div>
            </header>

            {/* Sidebar / Drawer overlay for mobile */}
            {isMobileMenuOpen && (
                <div
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 95
                    }}
                />
            )}

            {/* Sidebar */}
            <aside style={{
                ...sidebarStyle,
                left: window.innerWidth > 992 ? 0 : (isMobileMenuOpen ? 0 : '-260px'),
                boxShadow: isMobileMenuOpen ? '20px 0 50px rgba(0,0,0,0.5)' : 'none'
            }}>
                <div style={{ padding: '0 24px', marginBottom: '40px' }}>
                    <div className="font-display" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--apex-blue)' }}>APEX ADMIN</div>
                    <div style={{ fontSize: '11px', color: 'var(--apex-muted)', marginTop: '4px' }}>
                        {role === 'super' ? 'SUPER ADMIN PORTAL' : 'JUNIOR ADMIN PORTAL'}
                    </div>
                </div>

                <nav style={{ flex: 1, overflowY: 'auto' }}>
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

                <div style={{ padding: '24px' }}>
                    <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--apex-border)' }}>
                        <div style={{ fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.full_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--apex-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                    </div>
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
            <main style={{
                flex: 1,
                marginLeft: window.innerWidth > 992 ? '260px' : 0,
                padding: window.innerWidth > 992 ? '40px' : '24px',
                transition: '0.3s'
            }}>
                <header style={{
                    display: window.innerWidth > 992 ? 'flex' : 'none',
                    justifyContent: 'flex-end',
                    marginBottom: '40px'
                }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600 }}>{user?.full_name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--apex-muted)' }}>{user?.email}</div>
                    </div>
                </header>

                <div className="admin-content-container">
                    <Outlet />
                </div>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media (max-width: 992px) {
                    .admin-layout aside {
                        top: 0;
                    }
                }
            ` }} />
        </div>
    );
};
