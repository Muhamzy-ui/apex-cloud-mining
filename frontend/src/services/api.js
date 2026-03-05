/**
 * APEX MINING - API SERVICE (PRODUCTION READY)
 */
import axios from 'axios';

// Get API URL from environment variable, fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle 401 and token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = response.data.access;
        localStorage.setItem('access_token', newAccessToken);

        apiClient.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ==========================
// AUTH API
// ==========================
export const authAPI = {
  // Login - returns tokens
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login/', credentials);

    // Save tokens
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
    }

    return response;
  },

  // Register - returns tokens
  register: (data) => apiClient.post('/auth/register/', data),

  // Get current user
  me: () => apiClient.get('/auth/me/'),

  // Dashboard data
  dashboard: () => apiClient.get('/auth/dashboard/'),

  // Mine
  mine: () => apiClient.post('/mining/mine/'),

  // Bind wallet
  bindWallet: (wallet) =>
    apiClient.post('/auth/bind-wallet/', { trc20_wallet: wallet }),

  // Update profile
  updateProfile: (data) => {
    const config =
      data instanceof FormData
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};
    return apiClient.patch('/auth/me/', data, config);
  },

  // Change password
  changePassword: (data) => apiClient.post('/auth/change-password/', data),

  // Forgot password (request reset code)
  requestPasswordReset: (email) =>
    apiClient.post('/auth/request-password-reset/', { email }),

  // Confirm password reset with code
  confirmPasswordReset: (data) =>
    apiClient.post('/auth/confirm-password-reset/', data),

  // Verify email with 6-digit code
  verifyEmail: (data) => apiClient.post('/auth/verify-email/', data),

  // Resend verification code
  resendVerification: (email) =>
    apiClient.post('/auth/resend-verification/', { email }),

  // Legacy (kept for backward compat)
  forgotPassword: (email) =>
    apiClient.post('/auth/request-password-reset/', { email }),
};

// ==========================
// PAYMENTS API
// ==========================
export const paymentsAPI = {
  createDeposit: (formData) =>
    apiClient.post('/payments/deposit/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getDeposits: () => apiClient.get('/payments/deposits/'),

  createWithdrawal: (data) => apiClient.post('/payments/withdraw/', data),

  getWithdrawals: () => apiClient.get('/payments/withdrawals/'),

  transactions: (type = 'all') =>
    apiClient.get(`/payments/transactions/?type=${type}`),

  payWithdrawalFee: (formData) =>
    apiClient.post('/payments/pay-withdrawal-fee/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getPaymentSettings: () => apiClient.get('/payments/settings/'),
};

// ==========================
// MINING API
// ==========================
export const miningAPI = {
  getTiers: () => apiClient.get('/mining/tiers/'),
  getEarnings: () => apiClient.get('/mining/earnings/'),
  getStatus: () => apiClient.get('/mining/status/'),
};

// ==========================
// REFERRALS API
// ==========================
export const referralsAPI = {
  dashboard: () => apiClient.get('/referrals/'),
};

// ==========================
// ADMIN API (Super & Junior)
// ==========================
export const adminAPI = {
  // Global stats (Super sees all, Junior sees downline)
  getStats: () => apiClient.get('/admin/stats/'),

  // User management
  getUsers: (params) => apiClient.get('/admin/users/', { params }),
  getUser: (id) => apiClient.get(`/admin/users/${id}/`),
  toggleUser: (id) => apiClient.post(`/admin/users/${id}/toggle/`),

  // Deposit/Withdrawal management
  getDeposits: () => apiClient.get('/admin/deposits/'),
  approveDeposit: (id) => apiClient.post(`/admin/deposits/${id}/approve/`),
  rejectDeposit: (id, reason) => apiClient.post(`/admin/deposits/${id}/reject/`, { reason }),

  getWithdrawals: () => apiClient.get('/admin/withdrawals/'),
  approveWithdrawal: (id, txHash) => apiClient.post(`/admin/withdrawals/${id}/approve/`, { tx_hash: txHash }),
  rejectWithdrawal: (id, reason) => apiClient.post(`/admin/withdrawals/${id}/reject/`, { reason }),

  // Super Admin only: Admin Approval
  getPendingAdmins: () => apiClient.get('/admin/pending-admins/'),
  approveAdmin: (id) => apiClient.post(`/admin/approve-admin/${id}/`),
  rejectAdmin: (id) => apiClient.post(`/admin/reject-admin/${id}/`),
  deleteAdmin: (id) => apiClient.delete(`/admin/delete-admin/${id}/`),

  // Super Admin only: Invitations
  createInvite: (data) => apiClient.post('/users/admin/invites/create/', data),
  getInvites: () => apiClient.get('/users/admin/invites/'),

  // Super Admin only: Global Commissions & Audit
  getGlobalCommissions: () => apiClient.get('/admin/commissions/'),
  getAuditLogs: (params) => apiClient.get('/admin/audit-log/', { params }),

  // Misc
  getTiers: () => apiClient.get('/admin/tiers/'),
  updateTier: (id, data) => apiClient.put(`/admin/tiers/${id}/`, data),
  getExchangeRate: () => apiClient.get('/admin/exchange-rate/'),
  updateExchangeRate: (data) => apiClient.put('/admin/exchange-rate/', data),

  // Application (Uses token)
  applyForAdmin: (token) => apiClient.post('/users/admin/apply/', { invite_token: token }),
};

export default apiClient;