"""Apex Cloud Mining — Referrals App (COMPLETE)"""
from django.db import models
from django.conf import settings
from decimal import Decimal
import uuid


class ReferralCommission(models.Model):
    """Tracks every commission earned via referral.
    
    Commission is credited atomically at deposit approval time.
    A UNIQUE constraint on (deposit_id, referrer_id) prevents double-crediting.
    """
    STATUS_CHOICES = [
        ('pending',  'Pending'),
        ('credited', 'Credited'),
        ('reversed', 'Reversed'),
    ]

    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    referrer       = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='commissions_earned'
    )
    referee        = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='commissions_generated'
    )
    deposit        = models.ForeignKey(
        'payments.Deposit', on_delete=models.CASCADE, related_name='commissions'
    )

    commission_pct = models.DecimalField(max_digits=5, decimal_places=2, default=10)
    amount_usdt    = models.DecimalField(max_digits=12, decimal_places=6)

    # Audit & status
    status         = models.CharField(max_length=10, choices=STATUS_CHOICES, default='credited')
    is_paid_out    = models.BooleanField(default=False)
    paid_out_at    = models.DateTimeField(null=True, blank=True)

    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'referral_commissions'
        ordering = ['-created_at']
        # Critical: prevent double-commission on the same deposit
        unique_together = [('deposit', 'referrer')]
        indexes = [
            models.Index(fields=['referrer']),
            models.Index(fields=['referee']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.referrer.email} earned ${self.amount_usdt} from {self.referee.email}"


class AdminCommissionSummary(models.Model):
    """Running aggregate totals per admin — avoids expensive SUM() on every dashboard load.
    
    Updated atomically using F() expressions each time a commission is credited.
    Super Admins can query this table for O(1) per-admin lookups or
    a single SUM() across all rows for global totals.
    """
    admin           = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='commission_summary'
    )
    total_earned    = models.DecimalField(
        max_digits=16, decimal_places=6, default=Decimal('0'),
        verbose_name='Total Commission Earned (USDT)'
    )
    total_referrals = models.IntegerField(default=0, verbose_name='Total Users Referred')
    last_updated    = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'admin_commission_summary'
        verbose_name = 'Admin Commission Summary'
        verbose_name_plural = 'Admin Commission Summaries'

    def __str__(self):
        return f"{self.admin.email} — ${self.total_earned} total"