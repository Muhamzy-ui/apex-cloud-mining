"""
Apex Mining - User Admin (FIXED)
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
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
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_admin', 'is_verified')}),
    )
    
    add_fieldsets = (
        (None, {'fields': ('email', 'password1', 'password2')}),
    )


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