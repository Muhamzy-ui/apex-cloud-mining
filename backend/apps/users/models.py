"""
Apex Mining - User Model (COMPLETE & FIXED)
"""
import uuid
import random
import string
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from decimal import Decimal


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email required')
        email = self.normalize_email(email).lower()
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields['is_staff'] = True
        extra_fields['is_superuser'] = True
        extra_fields['is_admin'] = True
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """User model with mining and agent features"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=3, default='NG')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    # Mining & Balance
    tier = models.PositiveIntegerField(default=1)
    tier_expiry = models.DateTimeField(null=True, blank=True)
    balance_usdt = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('0'))
    balance_ngn = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal('0'))
    total_earned = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('0'))
    last_mined_at = models.DateTimeField(null=True, blank=True, verbose_name='Last Mining Time')
    trc20_wallet = models.CharField(max_length=50, blank=True)

    # Withdrawal
    withdrawal_fee_paid = models.BooleanField(default=False, verbose_name='Withdrawal Fee Paid')

    # Referral System
    referral_code = models.CharField(max_length=8, unique=True, blank=True)
    referred_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='referrals'
    )

    # Agent/Admin System
    is_agent = models.BooleanField(default=False, verbose_name='Is Agent')
    agent_wallet_usdt = models.CharField(max_length=120, blank=True, verbose_name='Agent USDT Wallet')
    agent_bank_name = models.CharField(max_length=100, blank=True, verbose_name='Agent Bank Name')
    agent_account_name = models.CharField(max_length=200, blank=True, verbose_name='Agent Account Name')
    agent_account_number = models.CharField(max_length=20, blank=True, verbose_name='Agent Account Number')
    agent_commission_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('10.00'),
        verbose_name='Agent Commission %'
    )

    # Account Status
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_admin = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()
    USERNAME_FIELD = 'email'

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.email

    def save(self, *args, **kwargs):
        if self.email:
            self.email = self.email.lower()

        if not self.referral_code:
            self.referral_code = ''.join(
                random.choices(string.ascii_uppercase + string.digits, k=8)
            )

        super().save(*args, **kwargs)

    def has_perm(self, perm, obj=None):
        if self.is_admin or self.is_staff:
            return True
        return super().has_perm(perm, obj)

    def has_module_perms(self, app_label):
        if self.is_admin or self.is_staff:
            return True
        return super().has_module_perms(app_label)

    # ==================== PROPERTIES ====================

    @property
    def can_withdraw(self):
        """
        Check if user can withdraw:
        - All tiers: Must have paid withdrawal fee
        - Plan 1 only: Must also have 100 USDT minimum
        """
        if not self.withdrawal_fee_paid:
            return False

        if self.tier == 1:
            return self.balance_usdt >= Decimal('100.00')

        return True

    @property
    def can_pay_withdrawal_fee(self):
        """
        Check if user can pay withdrawal fee:
        - Plan 2-5: Can pay immediately after upgrade
        - Plan 1: Can pay after mining to 100 USDT
        """
        if self.tier == 1:
            return self.balance_usdt >= Decimal('100.00')

        return self.tier > 1

    @property
    def can_mine(self):
        """Check if user can mine"""
        return self.mining_cooldown_remaining == 0

    @property
    def mining_cooldown_remaining(self):
        """Get remaining cooldown time in seconds"""
        if not self.last_mined_at:
            return 0

        elapsed = (timezone.now() - self.last_mined_at).total_seconds()
        cooldown = 24 * 60 * 60  # 24 hours

        if elapsed >= cooldown:
            return 0

        return int(cooldown - elapsed)

    @property
    def tier_expiry_countdown(self):
        """Get tier expiry countdown"""
        if not self.tier_expiry or self.tier == 1:
            return None

        now = timezone.now()

        if now >= self.tier_expiry:
            return {
                'expired': True,
                'days': 0,
                'hours': 0,
                'minutes': 0,
                'total_seconds': 0
            }

        diff = self.tier_expiry - now

        return {
            'expired': False,
            'days': diff.days,
            'hours': diff.seconds // 3600,
            'minutes': (diff.seconds % 3600) // 60,
            'total_seconds': int(diff.total_seconds())
        }


class Notification(models.Model):
    """User notifications"""

    TYPES = [
        ('mining', 'Mining'),
        ('withdrawal', 'Withdrawal'),
        ('deposit', 'Deposit'),
        ('tier', 'Tier Upgrade'),
        ('referral', 'Referral'),
        ('system', 'System'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=50, choices=TYPES, default='system')
    title = models.CharField(max_length=200)
    message = models.TextField()
    icon = models.CharField(max_length=10, default='🔔')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_notifications'
        ordering = ['-created_at']
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'

    def __str__(self):
        return f'{self.user.email} - {self.title}'


class EmailVerificationCode(models.Model):
    """Store 6-digit email verification codes"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verification_codes')
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        db_table = 'email_verification_codes'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} - {self.code}'
        
    def save(self, *args, **kwargs):
        if not self.expires_at:
            # Code valid for 15 minutes
            self.expires_at = timezone.now() + timezone.timedelta(minutes=15)
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at


class PasswordResetCode(models.Model):
    """Store 6-digit password reset codes"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_codes')
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        db_table = 'password_reset_codes'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} - {self.code}'
        
    def save(self, *args, **kwargs):
        if not self.expires_at:
            # Code valid for 15 minutes
            self.expires_at = timezone.now() + timezone.timedelta(minutes=15)
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at
