"""Apex Cloud Mining — Referrals App"""
from django.db import models
from django.conf import settings
import uuid


class ReferralCommission(models.Model):
    """Tracks every commission earned via referral"""
    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    referrer      = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='commissions_earned'
    )
    referee       = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='commissions_generated'
    )
    deposit       = models.ForeignKey(
        'payments.Deposit', on_delete=models.CASCADE, related_name='commissions'
    )
    commission_pct = models.DecimalField(max_digits=5, decimal_places=2, default=10)
    amount_usdt   = models.DecimalField(max_digits=12, decimal_places=6)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'referral_commissions'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.referrer.email} earned ${self.amount_usdt} from {self.referee.email}"