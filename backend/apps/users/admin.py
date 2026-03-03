"""
Apex Mining - User Admin (FIXED)
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.db import models
from .models import User, Notification


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'full_name', 'tier', 'balance_usdt', 'is_admin', 'date_joined']
    list_filter = ['tier', 'is_admin', 'is_verified', 'country']
    search_fields = ['email', 'full_name', 'phone', 'referral_code']
    ordering = ['-date_joined']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('full_name', 'phone', 'country', 'avatar')}),
        ('Mining', {'fields': ('tier', 'tier_expiry', 'balance_usdt', 'balance_ngn', 'total_earned', 'trc20_wallet')}),
        ('Referral', {'fields': ('referral_code', 'referred_by')}),
        ('Agent Info', {'fields': ('is_agent', 'agent_wallet_usdt', 'agent_bank_name', 'agent_account_name', 'agent_account_number', 'agent_commission_percent')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_admin', 'is_verified')}),
    )
    
    add_fieldsets = (
        (None, {'fields': ('email', 'password1', 'password2')}),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser or request.user.is_admin:
            return qs
        if request.user.is_agent:
            # Agents that are not admins/superusers can only see themselves and their referrals
            return qs.filter(models.Q(id=request.user.id) | models.Q(referred_by=request.user))
        return qs.none()

    def get_readonly_fields(self, request, obj=None):
        readonly = list(super().get_readonly_fields(request, obj) or [])
        if not request.user.is_superuser:
            # Prevent non-superusers from elevating privileges
            readonly.extend(['is_staff', 'is_superuser', 'is_admin', 'is_agent'])
            # If viewing someone else, make everything read-only except what an agent should modify? 
            # Actually, agents probably shouldn't edit their referrals' details much, but 
            # for now we'll just protect the core permission fields.
            if obj and obj.id != request.user.id:
                readonly.extend(['balance_usdt', 'balance_ngn', 'total_earned'])
        return readonly


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user_email', 'type', 'title', 'is_read', 'created_at']
    list_filter = ['type', 'is_read', 'created_at']
    search_fields = ['user__email', 'title', 'message']
    readonly_fields = ['user', 'type', 'title', 'message', 'icon', 'created_at']
    ordering = ['-created_at']
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User'