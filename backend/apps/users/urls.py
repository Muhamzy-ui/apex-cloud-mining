"""
Apex Mining - User URLs (COMPLETE)
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Authentication
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('verify-email/', views.verify_email, name='verify-email'),
    path('resend-verification/', views.resend_verification, name='resend-verification'),
    path('request-password-reset/', views.request_password_reset, name='request-password-reset'),
    path('confirm-password-reset/', views.confirm_password_reset, name='confirm-password-reset'),
    
    # User Management
    path('me/', views.me, name='me'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('bind-wallet/', views.bind_wallet, name='bind-wallet'),
    path('change-password/', views.change_password, name='change-password'),
    
    # Notifications
    path('notifications/', views.get_notifications, name='get-notifications'),
    path('notifications/<uuid:notification_id>/read/', views.mark_notification_read, name='mark-notification-read'),
    
    # Agent System
    path('agent-payment-info/', views.agent_payment_info, name='agent-payment-info'),
]