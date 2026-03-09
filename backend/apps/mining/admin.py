"""
Apex Mining - Mining Admin (FIXED)
"""
from django.contrib import admin
from .models import MiningTier, UserMiningSession, MiningEarning


@admin.register(MiningTier)
class MiningTierAdmin(admin.ModelAdmin):
    list_display = ['tier_number', 'name', 'price_display', 'earn_display', 'withdrawal_fee_display', 'referral_reward_display', 'duration_days']
    ordering = ['tier_number']
    
    fieldsets = (
        ('Plan Info', {
            'fields': ('tier_number', 'name', 'duration_days')
        }),
        ('Pricing & Rewards', {
            'fields': ('price_usd', 'earn_per_24h_usd', 'withdrawal_fee_usd', 'referral_reward')
        }),
    )
    
    def price_display(self, obj):
        return f'${float(obj.price_usd):.2f}'
    price_display.short_description = 'Price'
    
    def earn_display(self, obj):
        return f'${float(obj.earn_per_24h_usd):.2f}/day'
    earn_display.short_description = 'Earnings'
    
    def withdrawal_fee_display(self, obj):
        return f'${float(obj.withdrawal_fee_usd):.2f}'
    withdrawal_fee_display.short_description = 'Withdrawal Fee'

    def referral_reward_display(self, obj):
        return f'${float(obj.referral_reward):.2f}'
    referral_reward_display.short_description = 'Ref Reward'


@admin.register(UserMiningSession)
class UserMiningSessionAdmin(admin.ModelAdmin):
    list_display = ['user_email', 'tier', 'is_active', 'started_at', 'expires_at']
    list_filter = ['tier', 'is_active']
    search_fields = ['user__email']
    readonly_fields = ['user', 'tier', 'started_at', 'expires_at']
    ordering = ['-started_at']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser or request.user.is_admin:
            return qs
        if request.user.is_agent:
            return qs.filter(user__referred_by=request.user)
        return qs.none()
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User'


@admin.register(MiningEarning)
class MiningEarningAdmin(admin.ModelAdmin):
    list_display = ['user_email', 'tier', 'amount_display', 'mined_at']
    list_filter = ['tier', 'mined_at']
    search_fields = ['user__email']
    readonly_fields = ['user', 'tier', 'amount_usdt', 'amount_ngn', 'mined_at']
    ordering = ['-mined_at']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser or request.user.is_admin:
            return qs
        if request.user.is_agent:
            return qs.filter(user__referred_by=request.user)
        return qs.none()
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User'
    
    def amount_display(self, obj):
        from django.utils.html import format_html
        usd = f'${float(obj.amount_usdt):.2f}'
        if obj.amount_ngn:
            ngn = f'{float(obj.amount_ngn):,.0f}'
            return format_html('<strong>{}</strong><br><small>≈ ₦{}</small>', usd, ngn)
        return format_html('<strong>{}</strong>', usd)
    amount_display.short_description = 'Amount'