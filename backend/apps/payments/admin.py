"""
Apex Mining - Payment Admin (COMPLETE & FIXED)
"""
from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html
from django.contrib import messages
from datetime import timedelta
from decimal import Decimal
from .models import Deposit, Withdrawal, ExchangeRate, PaymentSettings, WithdrawalFeePayment, ReferralDeposit, ReferralWithdrawal


@admin.register(Deposit)
class DepositAdmin(admin.ModelAdmin):
    list_display = ['user_email', 'tier_target', 'amount_display', 'method', 'status', 'created_at']
    list_filter = ['status', 'method', 'tier_target', 'created_at']
    search_fields = ['user__email', 'user__full_name']
    readonly_fields = ['id', 'user', 'tier_target', 'amount_usd', 'amount_ngn', 'method', 'proof_image', 'tx_hash', 'status', 'created_at']
    actions = ['approve_deposits', 'reject_deposits']
    ordering = ['-created_at']
    
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
        usd = f'${float(obj.amount_usd):.2f}'
        if obj.amount_ngn:
            ngn = f'{float(obj.amount_ngn):,.0f}'
            return format_html('<strong>{}</strong><br><small>≈ ₦{}</small>', usd, ngn)
        return format_html('<strong>{}</strong>', usd)
    amount_display.short_description = 'Amount'
    
    def _process_deposit_approval(self, request, deposit):
        """Helper to process a single deposit approval"""
        from apps.mining.models import MiningTier, UserMiningSession
        from apps.users.models import Notification
        
        try:
            user = deposit.user
            plan_number = deposit.tier_target
            
            tier = MiningTier.objects.get(tier_number=plan_number)
            
            user.tier = plan_number
            user.tier_expiry = timezone.now() + timedelta(days=tier.duration_days) if plan_number > 1 else None
            user.last_mined_at = None
            user.save()
            
            UserMiningSession.objects.filter(user=user, is_active=True).update(is_active=False)
            
            UserMiningSession.objects.create(
                user=user,
                tier=plan_number,
                started_at=timezone.now(),
                expires_at=user.tier_expiry,
                is_active=True
            )
            
            deposit.status = 'approved'
            deposit.reviewed_at = timezone.now()
            deposit.save()
            
            Notification.objects.create(
                user=user,
                type='tier',
                title=f'🎉 Upgraded to {tier.name}!',
                message=f'Your {tier.name} is active! Earn ${float(tier.earn_per_24h_usd):.2f} daily.',
                icon='✅'
            )

            # --- Credit referral commission ---
            self._credit_referral_commission(user, deposit)

            return True, f'✅ {user.email} → Plan {plan_number}'
        except Exception as e:
            return False, f'❌ {str(e)}'

    def _credit_referral_commission(self, user, deposit):
        """Atomically credit commission to the user's referrer (if applicable).
        
        Uses F() to prevent race conditions.
        unique_together on (deposit, referrer) prevents double-crediting.
        """
        from apps.referrals.models import ReferralCommission, AdminCommissionSummary
        from apps.users.models import Notification
        from django.db.models import F

        referrer = user.referred_by
        if not referrer:
            return

        # Idempotency guard (also enforced at DB level via unique_together)
        if ReferralCommission.objects.filter(deposit=deposit, referrer=referrer).exists():
            return

        # 1. Determine Reward Amount
        commission_amt = Decimal('0.00')
        commission_pct = getattr(referrer, 'agent_commission_percent', Decimal('10.00')) if referrer.is_agent else Decimal('10.00')
        plan_number = deposit.tier_target
        
        try:
            tier_obj = MiningTier.objects.get(tier_number=plan_number)
            if tier_obj.referral_reward > 0:
                commission_amt = tier_obj.referral_reward
            else:
                # Fallback to percentage of deposit amount
                commission_amt = Decimal(str(deposit.amount_usd)) * (commission_pct / 100)
        except MiningTier.DoesNotExist:
            commission_amt = Decimal(str(deposit.amount_usd)) * (commission_pct / 100)

        # 2. Record commission
        ReferralCommission.objects.create(
            referrer=referrer,
            referee=user,
            deposit=deposit,
            tier=plan_number,
            commission_pct=commission_pct,
            amount_usdt=commission_amt,
            status='credited',
        )

        # 3. Credit referrer's wallet
        # Logic: "Referral should not affect junior admins"
        # -> Junior admins (Agents) keep using balance_usdt
        # -> Standard users use the new referral_isolation (referral_balance_usdt)
        if referrer.is_admin or referrer.is_staff or getattr(referrer, 'is_agent', False):
            # Junior Admin / Agent workflow (original)
            type(referrer).objects.filter(pk=referrer.pk).update(
                balance_usdt=F('balance_usdt') + commission_amt,
                total_earned=F('total_earned') + commission_amt,
            )
        else:
            # Standard user workflow (isolated)
            type(referrer).objects.filter(pk=referrer.pk).update(
                referral_balance_usdt=F('referral_balance_usdt') + commission_amt,
                total_earned=F('total_earned') + commission_amt,
            )

        # 3. Update aggregate summary (atomic upsert)
        AdminCommissionSummary.objects.get_or_create(admin=referrer)
        AdminCommissionSummary.objects.filter(admin=referrer).update(
            total_earned=F('total_earned') + commission_amt,
            total_referrals=F('total_referrals') + 1,
        )

        # 4. Notify referrer
        Notification.objects.create(
            user=referrer,
            type='referral',
            title='💰 Commission Earned!',
            message=f'You earned ${float(commission_amt):.2f} USDT from {user.email}\'s upgrade to Plan {deposit.tier_target}.',
            icon='💰',
        )

    def _process_deposit_rejection(self, request, deposit):
        """Helper to process a single deposit rejection"""
        from apps.users.models import Notification
        
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
        return True, 'Rejected'


    def approve_deposits(self, request, queryset):
        """Approve deposits and upgrade users"""
        success_count = 0
        for deposit in queryset.filter(status='pending'):
            success, msg = self._process_deposit_approval(request, deposit)
            if success:
                success_count += 1
                self.message_user(request, msg, level=messages.SUCCESS)
            else:
                self.message_user(request, msg, level=messages.ERROR)
    approve_deposits.short_description = '✅ Approve & Upgrade Users'
    
    def reject_deposits(self, request, queryset):
        """Reject deposits"""
        count = 0
        for deposit in queryset.filter(status='pending'):
            success, _ = self._process_deposit_rejection(request, deposit)
            if success: count += 1
        self.message_user(request, f'❌ Rejected {count} deposits', level=messages.WARNING)
    reject_deposits.short_description = '❌ Reject Deposits'

    def save_model(self, request, obj, form, change):
        """Handle individual saves from the edit page"""
        if change and 'status' in form.changed_data:
            # We must process it using the helper instead of the bulk queryset
            # First, check if the *original* database state was pending.
            # We don't want to re-approve an already approved item.
            original_obj = Deposit.objects.get(pk=obj.pk)
            if original_obj.status == 'pending':
                target_status = form.cleaned_data['status']
                if target_status == 'approved':
                    success, msg = self._process_deposit_approval(request, obj)
                    if success:
                        self.message_user(request, msg, level=messages.SUCCESS)
                    else:
                        self.message_user(request, msg, level=messages.ERROR)
                    return # the helper saves the object
                elif target_status == 'rejected':
                    self._process_deposit_rejection(request, obj)
                    self.message_user(request, f'❌ Deposit rejected', level=messages.WARNING)
                    return # the helper saves the object
        
        # If no status change from pending, just save normally
        super().save_model(request, obj, form, change)


@admin.register(ReferralDeposit)
class ReferralDepositAdmin(DepositAdmin):
    """Specialized monitor for deposits from referred users only"""
    verbose_name = 'Referral Deposit Monitor'

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # Show all deposits where the user was referred by someone
        return qs.filter(user__referred_by__isnull=False)

    def get_model_perms(self, request):
        # Only Super Admins and Admins can see this monitor
        if request.user.is_superuser or request.user.is_admin:
            return super().get_model_perms(request)
        return {}


@admin.register(Withdrawal)
class WithdrawalAdmin(admin.ModelAdmin):
    list_display = ['user_email', 'amount_display', 'wallet_address', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['user__email', 'wallet_address']
    readonly_fields = ['id', 'user', 'amount_usdt', 'amount_ngn', 'wallet_address', 'created_at']
    actions = ['approve_withdrawals', 'reject_withdrawals']
    ordering = ['-created_at']
    
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
        usd = f'${float(obj.amount_usdt):.6f}'
        if obj.amount_ngn:
            ngn = f'{float(obj.amount_ngn):,.0f}'
            return format_html('<strong>{}</strong><br><small>≈ ₦{}</small>', usd, ngn)
        return format_html('<strong>{}</strong>', usd)
    amount_display.short_description = 'Amount'

    def _process_withdrawal_approval(self, request, withdrawal):
        from apps.users.models import Notification
        user = withdrawal.user
        
        # Check correct balance based on source
        if withdrawal.is_referral:
            if user.referral_balance_usdt >= withdrawal.amount_usdt:
                user.referral_balance_usdt -= Decimal(str(withdrawal.amount_usdt))
                user.save()
                
                withdrawal.status = 'approved'
                withdrawal.reviewed_at = timezone.now()
                withdrawal.save()
                
                Notification.objects.create(
                    user=user,
                    type='referral',
                    title='💸 Referral Reward Withdrawn!',
                    message=f'Your referral reward withdrawal of ${float(withdrawal.amount_usdt):.2f} USDT has been approved.',
                    icon='✅'
                )
                return True, f'✅ Approved Referral WD for {user.email}'
            else:
                return False, f'❌ {user.email} has insufficient referral balance!'
        else:
            # Standard mining balance withdrawal
            if user.balance_usdt >= withdrawal.amount_usdt:
                user.balance_usdt -= Decimal(str(withdrawal.amount_usdt))
                if withdrawal.amount_ngn:
                    user.balance_ngn -= Decimal(str(withdrawal.amount_ngn))
                user.save()
                
                withdrawal.status = 'approved'
                withdrawal.reviewed_at = timezone.now()
                withdrawal.save()
                
                Notification.objects.create(
                    user=user,
                    type='withdrawal',
                    title='💸 Withdrawal Approved!',
                    message=f'Your withdrawal of ${float(withdrawal.amount_usdt):.2f} USDT has been approved.',
                    icon='✅'
                )
                return True, f'✅ Approved {user.email}'
            else:
                return False, f'❌ {user.email} has insufficient mining balance!'

    def _process_withdrawal_rejection(self, request, withdrawal):
        from apps.users.models import Notification
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
        return True, 'Rejected'

    def approve_withdrawals(self, request, queryset):
        """Approve withdrawals and deduct from balance"""
        count = 0
        for withdrawal in queryset.filter(status='pending'):
            success, msg = self._process_withdrawal_approval(request, withdrawal)
            if success:
                count += 1
                self.message_user(request, msg, level=messages.SUCCESS)
            else:
                self.message_user(request, msg, level=messages.ERROR)
        if count > 0:
            self.message_user(request, f'Successfully approved {count} withdrawals.', level=messages.SUCCESS)
    approve_withdrawals.short_description = '✅ Approve Withdrawals'
    
    def reject_withdrawals(self, request, queryset):
        """Reject withdrawals"""
        count = 0
        for withdrawal in queryset.filter(status='pending'):
            success, _ = self._process_withdrawal_rejection(request, withdrawal)
            if success: count += 1
        self.message_user(request, f'❌ Rejected {count} withdrawals', level=messages.WARNING)
    reject_withdrawals.short_description = '❌ Reject Withdrawals'

    def save_model(self, request, obj, form, change):
        """Handle individual saves from the edit page"""
        if change and 'status' in form.changed_data:
            original_obj = Withdrawal.objects.get(pk=obj.pk)
            if original_obj.status == 'pending':
                target_status = form.cleaned_data['status']
                if target_status == 'approved':
                    success, msg = self._process_withdrawal_approval(request, obj)
                    if success:
                        self.message_user(request, msg, level=messages.SUCCESS)
                    else:
                        self.message_user(request, msg, level=messages.ERROR)
                    return
                elif target_status == 'rejected':
                    self._process_withdrawal_rejection(request, obj)
                    self.message_user(request, f'❌ Withdrawal rejected', level=messages.WARNING)
                    return

        super().save_model(request, obj, form, change)


@admin.register(ReferralWithdrawal)
class ReferralWithdrawalAdmin(WithdrawalAdmin):
    """Specialized monitor for referral earnings withdrawals ONLY"""
    verbose_name = 'Referral Withdrawal Monitor'
    
    def get_queryset(self, request):
        # We override WithdrawalAdmin's filtered queryset to show ONLY referrals
        # But we still want to respect the Super Admin vs Agent filtering if needed
        # Actually, for the global monitor, just showing referrals is the goal.
        qs = Withdrawal.objects.filter(is_referral=True)
        return qs
    
    def get_model_perms(self, request):
        # Only Super Admins and Admins can see this monitor
        if request.user.is_superuser or request.user.is_admin:
            return super().get_model_perms(request)
        return {}
    
    def _process_withdrawal_approval(self, request, withdrawal):
        from apps.users.models import Notification
        user = withdrawal.user
        
        # Check correct balance based on source
        if withdrawal.is_referral:
            if user.referral_balance_usdt >= withdrawal.amount_usdt:
                user.referral_balance_usdt -= Decimal(str(withdrawal.amount_usdt))
                user.save()
                
                withdrawal.status = 'approved'
                withdrawal.reviewed_at = timezone.now()
                withdrawal.save()
                
                Notification.objects.create(
                    user=user,
                    type='referral',
                    title='💸 Referral Reward Withdrawn!',
                    message=f'Your referral reward withdrawal of ${float(withdrawal.amount_usdt):.2f} USDT has been approved.',
                    icon='✅'
                )
                return True, f'✅ Approved Referral WD for {user.email}'
            else:
                return False, f'❌ {user.email} has insufficient referral balance!'
        else:
            # Standard mining balance withdrawal
            if user.balance_usdt >= withdrawal.amount_usdt:
                user.balance_usdt -= Decimal(str(withdrawal.amount_usdt))
                if withdrawal.amount_ngn:
                    user.balance_ngn -= Decimal(str(withdrawal.amount_ngn))
                user.save()
                
                withdrawal.status = 'approved'
                withdrawal.reviewed_at = timezone.now()
                withdrawal.save()
                
                Notification.objects.create(
                    user=user,
                    type='withdrawal',
                    title='💸 Withdrawal Approved!',
                    message=f'Your withdrawal of ${float(withdrawal.amount_usdt):.2f} USDT has been approved.',
                    icon='✅'
                )
                return True, f'✅ Approved {user.email}'
            else:
                return False, f'❌ {user.email} has insufficient mining balance!'

    def _process_withdrawal_rejection(self, request, withdrawal):
        from apps.users.models import Notification
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
        return True, 'Rejected'

    def approve_withdrawals(self, request, queryset):
        """Approve withdrawals and deduct balance"""
        success_count = 0
        for withdrawal in queryset.filter(status='pending'):
            success, msg = self._process_withdrawal_approval(request, withdrawal)
            if success:
                success_count += 1
                self.message_user(request, msg, level=messages.SUCCESS)
            else:
                self.message_user(request, msg, level=messages.ERROR)
    approve_withdrawals.short_description = '✅ Approve Withdrawals'
    
    def reject_withdrawals(self, request, queryset):
        """Reject withdrawals"""
        count = 0
        for withdrawal in queryset.filter(status='pending'):
            success, _ = self._process_withdrawal_rejection(request, withdrawal)
            if success: count += 1
        self.message_user(request, f'❌ Rejected {count} withdrawals', level=messages.WARNING)
    reject_withdrawals.short_description = '❌ Reject Withdrawals'

    def save_model(self, request, obj, form, change):
        """Handle individual saves from the edit page"""
        if change and 'status' in form.changed_data:
            original_obj = Withdrawal.objects.get(pk=obj.pk)
            if original_obj.status == 'pending':
                target_status = form.cleaned_data['status']
                if target_status == 'approved':
                    success, msg = self._process_withdrawal_approval(request, obj)
                    if success:
                        self.message_user(request, msg, level=messages.SUCCESS)
                    else:
                        self.message_user(request, msg, level=messages.ERROR)
                    return
                elif target_status == 'rejected':
                    self._process_withdrawal_rejection(request, obj)
                    self.message_user(request, f'❌ Withdrawal rejected', level=messages.WARNING)
                    return

        super().save_model(request, obj, form, change)


@admin.register(ExchangeRate)
class ExchangeRateAdmin(admin.ModelAdmin):
    list_display = ['usd_to_ngn', 'usd_to_ghs', 'updated_at', 'updated_by']
    readonly_fields = ['updated_at']

    def has_module_perms(self, request):
        return request.user.is_superuser or request.user.is_admin

    def has_view_permission(self, request, obj=None):
        return request.user.is_superuser or request.user.is_admin

    def has_change_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_add_permission(self, request):
        return request.user.is_superuser

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser

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

    def has_module_perms(self, request):
        # Admins and Superusers can see the module
        return request.user.is_superuser or request.user.is_admin

    def has_view_permission(self, request, obj=None):
        return request.user.is_superuser or request.user.is_admin

    def has_change_permission(self, request, obj=None):
        # Only Super Admins can change global settings
        return request.user.is_superuser

    def has_add_permission(self, request):
        return (not PaymentSettings.objects.exists()) and request.user.is_superuser

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
    
    def fee_display(self, obj):
        return f'${float(obj.fee_amount_usd):.2f}'
    fee_display.short_description = 'Fee'
    
    def _process_fee_approval(self, request, payment):
        from apps.users.models import Notification
        user = payment.user
        
        payment.status = 'approved'
        payment.reviewed_at = timezone.now()
        payment.save()
        
        user.withdrawal_fee_paid = True
        user.save()
        
        Notification.objects.create(
            user=user,
            type='withdrawal',
            title='✅ Withdrawal Unlocked!',
            message='Your transfer fee is approved. You can now withdraw!',
            icon='🎉'
        )
        return True, f'✅ {user.email} - Withdrawals unlocked!'

    def _process_fee_rejection(self, request, payment):
        from apps.users.models import Notification
        user = payment.user
        
        payment.status = 'rejected'
        payment.reviewed_at = timezone.now()
        payment.save()
        
        # Explicitly ensure withdrawal is NOT opened/unlocked
        user.withdrawal_fee_paid = False
        user.save()
        
        Notification.objects.create(
            user=user,
            type='withdrawal',
            title='❌ Fee Rejected',
            message='Your transfer fee was rejected. Contact support.',
            icon='❌'
        )
        return True, 'Rejected'

    def approve_fee_payments(self, request, queryset):
        """Approve withdrawal fees and unlock withdrawals"""
        count = 0
        for payment in queryset.filter(status='pending'):
            success, msg = self._process_fee_approval(request, payment)
            if success:
                count += 1
                self.message_user(request, msg, level=messages.SUCCESS)
        if count > 0:
            self.message_user(request, f'Approved {count} fees.', level=messages.SUCCESS)
    approve_fee_payments.short_description = '✅ Approve & Unlock Withdrawals'
    
    def reject_fee_payments(self, request, queryset):
        """Reject withdrawal fees"""
        count = 0
        for payment in queryset.filter(status='pending'):
            success, _ = self._process_fee_rejection(request, payment)
            if success: count += 1
        self.message_user(request, f'❌ Rejected {count} fees', level=messages.WARNING)
    reject_fee_payments.short_description = '❌ Reject Fees'

    def save_model(self, request, obj, form, change):
        """Handle individual saves from the edit page"""
        if change and 'status' in form.changed_data:
            original_obj = WithdrawalFeePayment.objects.get(pk=obj.pk)
            if original_obj.status == 'pending':
                target_status = form.cleaned_data['status']
                if target_status == 'approved':
                    success, msg = self._process_fee_approval(request, obj)
                    if success:
                        self.message_user(request, msg, level=messages.SUCCESS)
                    return
                elif target_status == 'rejected':
                    self._process_fee_rejection(request, obj)
                    self.message_user(request, f'❌ Fee payment rejected', level=messages.WARNING)
                    return

        super().save_model(request, obj, form, change)