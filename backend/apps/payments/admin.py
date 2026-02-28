"""
Apex Mining - Payment Admin (COMPLETE & FIXED)
"""
from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html
from django.contrib import messages
from datetime import timedelta
from decimal import Decimal
from .models import Deposit, Withdrawal, ExchangeRate, PaymentSettings, WithdrawalFeePayment


@admin.register(Deposit)
class DepositAdmin(admin.ModelAdmin):
    list_display = ['user_email', 'tier_target', 'amount_display', 'method', 'status', 'created_at']
    list_filter = ['status', 'method', 'tier_target', 'created_at']
    search_fields = ['user__email', 'user__full_name']
    readonly_fields = ['id', 'user', 'tier_target', 'amount_usd', 'amount_ngn', 'method', 'proof_image', 'tx_hash', 'status', 'created_at']
    actions = ['approve_deposits', 'reject_deposits']
    ordering = ['-created_at']
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User'
    
    def amount_display(self, obj):
        usd = f'${float(obj.amount_usd):.2f}'
        if obj.amount_ngn:
            ngn = f'{float(obj.amount_ngn):,.0f}'
            return format_html('<strong>{}</strong><br><small>≈ ₦{}</small>', usd, ngn)
        return format_html('<strong>{}</strong>', usd)
    amount_display.short_description = 'Amount'
    
    def approve_deposits(self, request, queryset):
        """Approve deposits and upgrade users"""
        from apps.mining.models import MiningTier, UserMiningSession
        from apps.users.models import Notification
        
        for deposit in queryset.filter(status='pending'):
            try:
                user = deposit.user
                plan_number = deposit.tier_target
                
                # Get plan
                tier = MiningTier.objects.get(tier_number=plan_number)
                
                # Update user
                user.tier = plan_number
                user.tier_expiry = timezone.now() + timedelta(days=tier.duration_days) if plan_number > 1 else None
                user.last_mined_at = None  # Reset so they can mine immediately
                user.save()
                
                # Deactivate old sessions
                UserMiningSession.objects.filter(user=user, is_active=True).update(is_active=False)
                
                # Create new session
                UserMiningSession.objects.create(
                    user=user,
                    tier=plan_number,
                    started_at=timezone.now(),
                    expires_at=user.tier_expiry,
                    is_active=True
                )
                
                # Approve deposit
                deposit.status = 'approved'
                deposit.reviewed_at = timezone.now()
                deposit.save()
                
                # Notify user
                Notification.objects.create(
                    user=user,
                    type='tier',
                    title=f'🎉 Upgraded to {tier.name}!',
                    message=f'Your {tier.name} is active! Earn ${float(tier.earn_per_24h_usd):.2f} daily.',
                    icon='✅'
                )
                
                self.message_user(request, f'✅ {user.email} → Plan {plan_number}', level=messages.SUCCESS)
                
            except Exception as e:
                self.message_user(request, f'❌ {str(e)}', level=messages.ERROR)
    
    approve_deposits.short_description = '✅ Approve & Upgrade Users'
    
    def reject_deposits(self, request, queryset):
        """Reject deposits"""
        from apps.users.models import Notification
        
        for deposit in queryset.filter(status='pending'):
            deposit.status = 'rejected'
            deposit.reviewed_at = timezone.now()
            deposit.save()
            
            Notification.objects.create(
                user=deposit.user,
                type='deposit',
                title='❌ Deposit Rejected',
                message='Your deposit was rejected. Contact support.',
                icon='❌'
            )
        
        self.message_user(request, f'❌ Rejected {queryset.count()} deposits', level=messages.WARNING)
    
    reject_deposits.short_description = '❌ Reject Deposits'


@admin.register(Withdrawal)
class WithdrawalAdmin(admin.ModelAdmin):
    list_display = ['user_email', 'amount_display', 'wallet_address', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['user__email', 'wallet_address']
    readonly_fields = ['id', 'user', 'amount_usdt', 'amount_ngn', 'wallet_address', 'created_at']
    actions = ['approve_withdrawals', 'reject_withdrawals']
    ordering = ['-created_at']
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User'
    
    def amount_display(self, obj):
        usd = f'${float(obj.amount_usdt):.6f}'
        if obj.amount_ngn:
            ngn = f'{float(obj.amount_ngn):,.0f}'
            return format_html('<strong>{}</strong><br><small>≈ ₦{}</small>', usd, ngn)
        return format_html('<strong>{}</strong>', usd)
    amount_display.short_description = 'Amount'
    
    def approve_withdrawals(self, request, queryset):
        """Approve withdrawals and deduct balance"""
        from apps.users.models import Notification
        
        for withdrawal in queryset.filter(status='pending'):
            user = withdrawal.user
            
            # Check balance
            if user.balance_usdt >= withdrawal.amount_usdt:
                # Deduct balance
                user.balance_usdt -= Decimal(str(withdrawal.amount_usdt))
                if withdrawal.amount_ngn:
                    user.balance_ngn -= Decimal(str(withdrawal.amount_ngn))
                user.save()
                
                # Mark as approved
                withdrawal.status = 'approved'
                withdrawal.reviewed_at = timezone.now()
                withdrawal.save()
                
                # Create notification
                Notification.objects.create(
                    user=user,
                    type='withdrawal',
                    title='💸 Withdrawal Approved!',
                    message=f'Your withdrawal of ${float(withdrawal.amount_usdt):.2f} USDT has been approved.',
                    icon='✅'
                )
                
                self.message_user(request, f'✅ Approved {user.email}', level=messages.SUCCESS)
            else:
                self.message_user(request, f'❌ {user.email} has insufficient balance!', level=messages.ERROR)
    
    approve_withdrawals.short_description = '✅ Approve Withdrawals'
    
    def reject_withdrawals(self, request, queryset):
        """Reject withdrawals"""
        from apps.users.models import Notification
        
        for withdrawal in queryset.filter(status='pending'):
            withdrawal.status = 'rejected'
            withdrawal.reviewed_at = timezone.now()
            withdrawal.save()
            
            Notification.objects.create(
                user=withdrawal.user,
                type='withdrawal',
                title='❌ Withdrawal Rejected',
                message='Your withdrawal request was rejected. Contact support.',
                icon='❌'
            )
        
        self.message_user(request, f'❌ Rejected {queryset.count()} withdrawals', level=messages.WARNING)
    
    reject_withdrawals.short_description = '❌ Reject Withdrawals'


@admin.register(ExchangeRate)
class ExchangeRateAdmin(admin.ModelAdmin):
    list_display = ['usd_to_ngn', 'usd_to_ghs', 'updated_at', 'updated_by']
    readonly_fields = ['updated_at']
    
    def save_model(self, request, obj, form, change):
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(PaymentSettings)
class PaymentSettingsAdmin(admin.ModelAdmin):
    list_display = ['bank_name', 'account_number', 'usdt_wallet', 'updated_at']
    readonly_fields = ['updated_at', 'updated_by']
    
    fieldsets = (
        ('Crypto Payment', {
            'fields': ('usdt_wallet',),
        }),
        ('Bank Payment (NGN)', {
            'fields': ('bank_name', 'account_name', 'account_number'),
        }),
        ('Support & Help', {
            'fields': ('support_url', 'support_alt_url'),
            'description': 'Configure support links (Telegram, WhatsApp, email, helpdesk, etc.)',
        }),
        ('Metadata', {
            'fields': ('updated_at', 'updated_by'),
        }),
    )
    
    def has_add_permission(self, request):
        return not PaymentSettings.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        return False
    
    def save_model(self, request, obj, form, change):
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(WithdrawalFeePayment)
class WithdrawalFeePaymentAdmin(admin.ModelAdmin):
    list_display = ['user_email', 'tier', 'fee_display', 'method', 'status', 'created_at']
    list_filter = ['status', 'tier', 'method', 'created_at']
    search_fields = ['user__email']
    readonly_fields = ['id', 'user', 'tier', 'fee_amount_usd', 'method', 'proof_image', 'tx_hash', 'created_at']
    actions = ['approve_fee_payments', 'reject_fee_payments']
    ordering = ['-created_at']
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User'
    
    def fee_display(self, obj):
        return f'${float(obj.fee_amount_usd):.2f}'
    fee_display.short_description = 'Fee'
    
    def approve_fee_payments(self, request, queryset):
        """Approve withdrawal fees and unlock withdrawals"""
        from apps.users.models import Notification
        
        for payment in queryset.filter(status='pending'):
            user = payment.user
            
            # Approve payment
            payment.status = 'approved'
            payment.reviewed_at = timezone.now()
            payment.save()
            
            # UNLOCK WITHDRAWALS
            user.withdrawal_fee_paid = True
            user.save()
            
            # Notify
            Notification.objects.create(
                user=user,
                type='withdrawal',
                title='✅ Withdrawal Unlocked!',
                message='Your transfer fee is approved. You can now withdraw!',
                icon='🎉'
            )
            
            self.message_user(request, f'✅ {user.email} - Withdrawals unlocked!', level=messages.SUCCESS)
    
    approve_fee_payments.short_description = '✅ Approve & Unlock Withdrawals'
    
    def reject_fee_payments(self, request, queryset):
        """Reject withdrawal fees"""
        from apps.users.models import Notification
        
        for payment in queryset.filter(status='pending'):
            payment.status = 'rejected'
            payment.reviewed_at = timezone.now()
            payment.save()
            
            Notification.objects.create(
                user=payment.user,
                type='withdrawal',
                title='❌ Fee Rejected',
                message='Your transfer fee was rejected. Contact support.',
                icon='❌'
            )
        
        self.message_user(request, f'❌ Rejected {queryset.count()} fees', level=messages.WARNING)
    
    reject_fee_payments.short_description = '❌ Reject Fees'