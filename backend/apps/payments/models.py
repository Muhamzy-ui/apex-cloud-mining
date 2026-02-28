"""
Apex Mining - Payment Models (PRODUCTION READY)
"""
import uuid
from django.db import models
from django.conf import settings


class Deposit(models.Model):
    """User deposit/upgrade payments"""
    
    class Method(models.TextChoices):
        CRYPTO = 'crypto', 'USDT TRC20'
        BANK = 'bank', 'Bank Transfer (NGN)'

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='deposits'
    )
    tier_target = models.IntegerField()
    amount_usd = models.DecimalField(max_digits=12, decimal_places=2)
    amount_ngn = models.DecimalField(max_digits=16, decimal_places=2, null=True, blank=True)
    method = models.CharField(max_length=10, choices=Method.choices)
    proof_image = models.ImageField(upload_to='payment_proofs/', null=True, blank=True)
    tx_hash = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    admin_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'deposits'
        ordering = ['-created_at']
        verbose_name = 'Deposit'
        verbose_name_plural = 'Deposits'

    def __str__(self):
        return f"Deposit: {self.user.email} - Plan {self.tier_target} - ${self.amount_usd} [{self.status}]"


class Withdrawal(models.Model):
    """User withdrawal requests"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='withdrawals')
    amount_usdt = models.DecimalField(max_digits=12, decimal_places=8)
    amount_ngn = models.DecimalField(max_digits=16, decimal_places=2, null=True, blank=True)
    
    # Method: crypto or bank
    method = models.CharField(max_length=20, choices=[('crypto', 'Crypto'), ('bank', 'Bank')], default='crypto')
    
    # Crypto details
    wallet_address = models.CharField(max_length=200, blank=True)
    
    # Bank details
    bank_name = models.CharField(max_length=100, blank=True)
    account_number = models.CharField(max_length=20, blank=True)
    account_name = models.CharField(max_length=200, blank=True)
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[('pending', 'Pending'), ('processing', 'Processing'), ('approved', 'Approved'), ('rejected', 'Rejected')],
        default='pending'
    )
    
    # Transaction details
    transaction_id = models.CharField(max_length=100, blank=True, unique=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'withdrawals'
        ordering = ['-created_at']
        verbose_name = 'Withdrawal'
        verbose_name_plural = 'Withdrawals'

    def __str__(self):
        return f'{self.user.email} - ${self.amount_usdt} ({self.status})'
    
    def save(self, *args, **kwargs):
        if not self.transaction_id:
            # Generate unique transaction ID
            import random
            import string
            from django.utils import timezone
            date_str = timezone.now().strftime('%Y%m%d')
            random_str = ''.join(random.choices(string.digits, k=6))
            self.transaction_id = f'WD-{date_str}{random_str}'
        super().save(*args, **kwargs)


class ExchangeRate(models.Model):
    """Exchange rates (admin controlled)"""
    
    usd_to_ngn = models.DecimalField(max_digits=10, decimal_places=2, default=1600)
    usd_to_ghs = models.DecimalField(max_digits=10, decimal_places=2, default=15.5)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    class Meta:
        db_table = 'exchange_rates'
        verbose_name = 'Exchange Rate'
        verbose_name_plural = 'Exchange Rates'

    def __str__(self):
        return f"1 USD = ₦{self.usd_to_ngn} | GHS {self.usd_to_ghs}"
class PaymentSettings(models.Model):
    """Global payment settings (editable by admin)"""
    
    # Crypto
    usdt_wallet = models.CharField(max_length=120, default='TQnXpzuRr8PFRnKqDU5b7ZfmwdJGFH4kLm')
    
    # Bank
    bank_name = models.CharField(max_length=100, default='Opay')
    account_name = models.CharField(max_length=200, default='Apex Mining Ltd')
    account_number = models.CharField(max_length=20, default='0123456789')
    
    # Support links (admin-configurable)
    support_url = models.URLField(
        max_length=500,
        blank=True,
        default='',
        help_text='Primary support link (e.g. Telegram, WhatsApp, email, or helpdesk URL)'
    )
    support_alt_url = models.URLField(
        max_length=500,
        blank=True,
        default='',
        help_text='Optional secondary support link'
    )
    
    # Metadata
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    class Meta:
        db_table = 'payment_settings'
        verbose_name = 'Payment Setting'
        verbose_name_plural = 'Payment Settings'

    def __str__(self):
        return f"Payment Settings (Updated: {self.updated_at.strftime('%Y-%m-%d')})"
    
    def save(self, *args, **kwargs):
        # Ensure only one instance exists
        self.pk = 1
        super().save(*args, **kwargs)
    
    @classmethod
    def get_settings(cls):
        """Get or create payment settings"""
        obj, created = cls.objects.get_or_create(pk=1)
        return obj
class WithdrawalFeePayment(models.Model):
    """Track withdrawal fee payments - users must pay before they can withdraw"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='withdrawal_fee_payments')
    tier = models.PositiveIntegerField(verbose_name='Plan Tier')
    fee_amount_usd = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=20, choices=[('crypto', 'Crypto'), ('bank', 'Bank')])
    proof_image = models.ImageField(upload_to='withdrawal_fees/', null=True, blank=True)
    tx_hash = models.CharField(max_length=200, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')],
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'withdrawal_fee_payments'
        ordering = ['-created_at']
        verbose_name = 'Transfer Fee Payment'
        verbose_name_plural = 'Transfer Fee Payments'

    def __str__(self):
        return f'{self.user.email} - ${self.fee_amount_usd} ({self.status})'       