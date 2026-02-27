"""
Apex Cloud Mining — Daily Earnings Distribution
Runs every day at midnight (Africa/Lagos).

ALL users earn every day:
- Tier 1 (free, permanent): $1.00/day — ALWAYS active, never expires
- Tier 2–5: their plan rate for duration of their plan
"""
from celery import shared_task
from django.utils import timezone
from django.db import transaction
import logging

logger = logging.getLogger(__name__)


@shared_task(name='distribute_daily_earnings')
def distribute_daily_earnings():
    from apps.users.models import User
    from apps.mining.models import MiningEarning, MiningTier, UserMiningSession

    now     = timezone.now()
    count   = 0
    total   = 0

    with transaction.atomic():
        # All active users
        users = User.objects.filter(is_active=True).select_for_update()

        for user in users:
            earn_amount = None

            # --- Tier 1 (free/permanent) ALWAYS earns $1/day, NEVER expires ---
            if user.tier == 1:
                earn_amount = 1.00
                # Ensure tier_expiry is None (permanent)
                if user.tier_expiry is not None:
                    user.tier_expiry = None
                    user.save(update_fields=['tier_expiry'])

            else:
                # Paid tiers: check if session is still active
                session = UserMiningSession.objects.filter(
                    user=user, is_active=True
                ).order_by('-started_at').first()

                if session:
                    if session.expires_at and now > session.expires_at:
                        # Session expired — downgrade to Tier 1 (permanent)
                        session.is_active = False
                        session.save()
                        user.tier = 1
                        user.tier_expiry = None  # Tier 1 is PERMANENT
                        user.save(update_fields=['tier', 'tier_expiry'])
                        # Still earn Tier 1 rate
                        earn_amount = 1.00
                        logger.info(f'[Mining] User {user.email} tier expired, reset to Tier 1 (permanent)')
                    else:
                        # Active paid tier — earn their rate
                        try:
                            tier_obj = MiningTier.objects.get(tier_number=user.tier)
                            earn_amount = float(tier_obj.earn_per_24h_usd)
                        except MiningTier.DoesNotExist:
                            earn_amount = 1.00
                else:
                    # No session (shouldn't happen for paid tiers but handle it)
                    # Reset to Tier 1 permanent
                    user.tier = 1
                    user.tier_expiry = None
                    user.save(update_fields=['tier', 'tier_expiry'])
                    earn_amount = 1.00

            if earn_amount is not None:
                # Credit user balance
                user.balance_usdt  = float(user.balance_usdt or 0) + earn_amount
                user.total_earned  = float(user.total_earned  or 0) + earn_amount
                user.save(update_fields=['balance_usdt', 'total_earned'])

                # Log the earning
                MiningEarning.objects.create(
                    user       = user,
                    amount_usd = earn_amount,
                    tier       = user.tier,
                    earned_at  = now,
                )
                count += 1
                total += earn_amount

    logger.info(f'[Mining] Distributed ${total:.2f} USDT to {count} users (all Tier 1 users earn permanently)')
    return {'users_paid': count, 'total_usd': total}