/**
 * APEX MINING - APP ROUTER (PRODUCTION READY)
 */
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import useAuthStore from './context/authStore';
import useThemeStore from './context/themeStore';

// Auth pages
import { LoginPage, RegisterPage, ForgotPasswordPage } from './pages/auth';

// App pages
import { DashboardPage } from './pages/dashboard';
import { UpgradePage } from './pages/upgrade';
import { WithdrawPage } from './pages/withdraw';
import { ProfilePage, EditProfilePage, ChangePasswordPage } from './pages/profile';
import { HistoryPage, ReferralPage } from './pages/history';
import { ReferralWithdrawPage } from './pages/history/ReferralWithdrawPage';
import { WithdrawFeePage } from './pages/withdraw-fee';

// Admin Pages
import { AdminInvitesPage } from './pages/admin/AdminInvitesPage';
import { AdminApplyPage } from './pages/admin/AdminApplyPage';
import { AdminApprovalPage } from './pages/admin/AdminApprovalPage';
import { AdminUserListView } from './pages/admin/AdminUserListView';
import { AdminDashboardOverview } from './pages/admin/AdminDashboardOverview';
import { AdminPaymentSettings } from './pages/admin/AdminPaymentSettings';
import { AdminReferralManagement } from './pages/admin/AdminReferralManagement';
import { AdminLayout } from './components/layout/AdminLayout';

// Components
import { SupportWidget } from './components/SupportWidget';

// Guards
import { SuperAdminGuard, JuniorAdminGuard, AdminRedirect } from './components/guards/AdminGuards';

import './styles/global.css';

// Protected Route
const Protected = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const token = localStorage.getItem('access_token');

  if (!token && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AdminRedirect>{children}</AdminRedirect>;
};

// Guest Route (redirect if logged in)
const Guest = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Referral Redirect Component
const ReferralRedirect = () => {
  const { code } = useParams();
  return <Navigate to={`/register?ref=${code}`} replace />;
};

export default function App() {
  const { theme } = useThemeStore();
  const { init } = useAuthStore();

  // Initialize auth on app load
  useEffect(() => {
    init();
  }, [init]);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#0D1E35',
            color: '#E8F0FF',
            border: '1px solid rgba(26,111,255,0.2)',
            borderRadius: '14px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#00D395', secondary: '#0D1E35' },
          },
          error: {
            iconTheme: { primary: '#FF4D6A', secondary: '#0D1E35' },
          },
        }}
      />

      {/* Floating Support Widget (visible on all pages) */}
      <SupportWidget />

      <Routes>
        {/* Auth Routes */}
        <Route
          path="/login"
          element={
            <Guest>
              <LoginPage />
            </Guest>
          }
        />
        <Route
          path="/register"
          element={
            <Guest>
              <RegisterPage />
            </Guest>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <Guest>
              <ForgotPasswordPage />
            </Guest>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <Protected>
              <DashboardPage />
            </Protected>
          }
        />
        <Route
          path="/upgrade"
          element={
            <Protected>
              <UpgradePage />
            </Protected>
          }
        />
        <Route
          path="/withdraw"
          element={
            <Protected>
              <WithdrawPage />
            </Protected>
          }
        />
        <Route
          path="/profile"
          element={
            <Protected>
              <ProfilePage />
            </Protected>
          }
        />
        <Route
          path="/edit-profile"
          element={
            <Protected>
              <EditProfilePage />
            </Protected>
          }
        />
        <Route
          path="/change-password"
          element={
            <Protected>
              <ChangePasswordPage />
            </Protected>
          }
        />
        <Route
          path="/history"
          element={
            <Protected>
              <HistoryPage />
            </Protected>
          }
        />
        <Route
          path="/referral"
          element={
            <Protected>
              <ReferralPage />
            </Protected>
          }
        />
        <Route
          path="/referral-withdraw"
          element={
            <Protected>
              <ReferralWithdrawPage />
            </Protected>
          }
        />
        <Route
          path="/withdraw-fee"
          element={
            <Protected>
              <WithdrawFeePage />
            </Protected>
          }
        />

        {/* Admin Routes (Unified) */}
        <Route path="/admin/apply" element={<AdminApplyPage />} />

        <Route path="/admin" element={<JuniorAdminGuard><AdminLayout /></JuniorAdminGuard>}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<AdminDashboardOverview />} />
          <Route path="invites" element={<SuperAdminGuard><AdminInvitesPage /></SuperAdminGuard>} />
          <Route path="approvals" element={<SuperAdminGuard><AdminApprovalPage /></SuperAdminGuard>} />
          <Route path="audit" element={<SuperAdminGuard><div>Audit Log (Coming Soon)</div></SuperAdminGuard>} />
          <Route path="users" element={<AdminUserListView />} />
          <Route path="referrals" element={<AdminReferralManagement />} />
          <Route path="settings" element={<AdminPaymentSettings />} />
          <Route path="deposits" element={<div>Deposits (Coming Soon)</div>} />
          <Route path="withdrawals" element={<div>Withdrawals (Coming Soon)</div>} />
        </Route>


        {/* Referral signup */}
        <Route path="/ref/:code" element={<ReferralRedirect />} />

        {/* Default routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}