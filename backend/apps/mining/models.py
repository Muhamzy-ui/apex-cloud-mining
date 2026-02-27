"""
Apex Mining - Mining Models (FIXED)
"""
import uuid
from django.db import models
from django.conf import settings
from decimal import Decimal


class MiningTier(models.Model):
    """Mining tier/plan configuration"""
    tier_number = models.PositiveIntegerField(unique=True)
    name = models.CharField(max_length=50)
    price_usd = models.DecimalField(max_digits=10, decimal_places=2)
    earn_per_24h_usd = models.DecimalField(max_digits=10, decimal_places=2)
    duration_days = models.PositiveIntegerField()
    withdrawal_fee_usd = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('5.00'),
        verbose_name='Withdrawal Fee (USD)'
    )

    class Meta:
        db_table = 'mining_tiers'
        ordering = ['tier_number']
        verbose_name = 'Mining Tier'
        verbose_name_plural = 'Mining Tiers'

    def __str__(self):
        return f'{self.name} (Tier {self.tier_number})'


class UserMiningSession(models.Model):
    """Track user mining sessions"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='mining_sessions')
    tier = models.PositiveIntegerField()
    started_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'user_mining_sessions'
        ordering = ['-started_at']
        verbose_name = 'Mining Session'
        verbose_name_plural = 'Mining Sessions'

    def __str__(self):
        return f'{self.user.email} - Tier {self.tier}'


class MiningEarning(models.Model):
    """Track individual mining earnings"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='mining_earnings')
    tier = models.PositiveIntegerField()
    amount_usdt = models.DecimalField(max_digits=12, decimal_places=8)
    amount_ngn = models.DecimalField(max_digits=16, decimal_places=2, null=True, blank=True)
    mined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'mining_earnings'
        ordering = ['-mined_at']
        verbose_name = 'Mining Earning'
        verbose_name_plural = 'Mining Earnings'

    def __str__(self):
        return f'{self.user.email} - ${self.amount_usdt}'