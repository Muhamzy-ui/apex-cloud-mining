/**
 * Apex Cloud Mining — Notification Store
 * Tracks in-app notifications: deposits approved, withdrawals,
 * tier upgrades, admin approval, referral commissions, mining milestones
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Notification types
export const NOTIF_TYPES = {
  DEPOSIT_APPROVED:  'deposit_approved',
  DEPOSIT_REJECTED:  'deposit_rejected',
  WITHDRAWAL_DONE:   'withdrawal_done',
  TIER_UPGRADED:     'tier_upgraded',
  ADMIN_APPROVED:    'admin_approved',
  REFERRAL_EARNED:   'referral_earned',
  MINING_MILESTONE:  'mining_milestone',
  GENERAL:           'general',
};

const ICONS = {
  deposit_approved:  '✅',
  deposit_rejected:  '❌',
  withdrawal_done:   '💸',
  tier_upgraded:     '⭐',
  admin_approved:    '👑',
  referral_earned:   '🤝',
  mining_milestone:  '⛏️',
  general:           '🔔',
};

const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],

      // Add a new notification
      add: (type, title, message) => {
        const notif = {
          id:        Date.now(),
          type,
          icon:      ICONS[type] || '🔔',
          title,
          message,
          read:      false,
          createdAt: new Date().toISOString(),
        };
        set(state => ({ notifications: [notif, ...state.notifications].slice(0, 50) }));
      },

      // Mark one as read
      markRead: (id) => {
        set(state => ({
          notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
        }));
      },

      // Mark all as read
      markAllRead: () => {
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
        }));
      },

      // Delete one
      remove: (id) => {
        set(state => ({ notifications: state.notifications.filter(n => n.id !== id) }));
      },

      // Clear all
      clearAll: () => set({ notifications: [] }),

      // Unread count
      unreadCount: () => get().notifications.filter(n => !n.read).length,
    }),
    {
      name: 'apex-notifications',
      partialize: (state) => ({ notifications: state.notifications }),
    }
  )
);

export default useNotificationStore;
