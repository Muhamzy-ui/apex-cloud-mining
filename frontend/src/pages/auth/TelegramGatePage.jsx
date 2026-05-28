import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../context/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const TelegramGatePage = () => {
  const { user, checkAuth } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // We should pull this from payment settings, but for now we can hardcode or use a fallback
  const telegramUrl = 'https://t.me/apexcloudmining';

  const handleJoin = () => {
    window.open(telegramUrl, '_blank');
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await api.post('/users/mark-telegram-joined/');
      await checkAuth(); // Refresh user data
      toast.success('Thank you for joining our community!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to verify. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg text-app-text flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-card-bg rounded-2xl p-8 border border-white/5 shadow-2xl text-center space-y-6">
        <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.18-.08-.04-.19-.02-.27 0-.12.03-1.99 1.26-5.61 3.71-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.05-.49-.83-.27-1.49-.41-1.43-.87.03-.24.36-.48.99-.74 3.88-1.69 6.46-2.8 7.74-3.34 3.68-1.55 4.45-1.81 4.95-1.82.11 0 .35.03.48.14.11.09.14.22.15.31.02.1-.01.21-.02.31z"/>
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-white">Join Our Telegram Community</h2>
        <p className="text-gray-400">
          To access your dashboard and start mining, you must join our official Telegram channel for updates, support, and announcements.
        </p>

        <div className="space-y-4 pt-4">
          <button
            onClick={handleJoin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.18-.08-.04-.19-.02-.27 0-.12.03-1.99 1.26-5.61 3.71-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.05-.49-.83-.27-1.49-.41-1.43-.87.03-.24.36-.48.99-.74 3.88-1.69 6.46-2.8 7.74-3.34 3.68-1.55 4.45-1.81 4.95-1.82.11 0 .35.03.48.14.11.09.14.22.15.31.02.1-.01.21-.02.31z"/>
            </svg>
            Step 1: Join Telegram Channel
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full bg-brand-primary/20 hover:bg-brand-primary/30 text-brand-primary font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Step 2: I Have Joined'}
          </button>
        </div>
      </div>
    </div>
  );
};
