"""
APEX MINING - MINING VIEWS (PRODUCTION READY)
Fixed: Mining functionality, earnings calculation, session management
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from .models import MiningTier, UserMiningSession, MiningEarning

# Earnings per plan (24 hours)
EARN_PER_DAY = {
    1: Decimal('1.00'),
    2: Decimal('50.00'),
    3: Decimal('130.00'),
    4: Decimal('399.00'),
    5: Decimal('1200.00'),
}

NGN_RATE = 1600  # 1 USDT = 1600 NGN


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mine(request):
    """
    Mine earnings (once per 24 hours)
    """
    user = request.user
    now = timezone.now()
    
    # Check if user can mine
    if user.last_mined_at:
        time_since_last_mine = now - user.last_mined_at
        if time_since_last_mine < timedelta(hours=24):
            remaining = timedelta(hours=24) - time_since_last_mine
            hours = int(remaining.total_seconds() // 3600)
            minutes = int((remaining.total_seconds() % 3600) // 60)
            return Response({
                'detail': f'Please wait {hours}h {minutes}m before mining again',
                'can_mine': False,
                'remaining_seconds': int(remaining.total_seconds())
            }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if plan is active
    if user.tier_expiry and now > user.tier_expiry:
        return Response({
            'detail': 'Your plan has expired. Please upgrade.',
            'can_mine': False
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Get earnings for current tier
    earn_amount_usd = EARN_PER_DAY.get(user.tier, Decimal('1.00'))
    earn_amount_ngn = earn_amount_usd * NGN_RATE
    
    # Update user balance
    user.balance_usdt += earn_amount_usd
    user.balance_ngn += earn_amount_ngn
    user.total_earned += earn_amount_usd
    user.last_mined_at = now
    user.save(update_fields=['balance_usdt', 'balance_ngn', 'total_earned', 'last_mined_at'])
    
    # Create earning record
    MiningEarning.objects.create(
        user=user,
        tier=user.tier,
        amount_usdt=earn_amount_usd,
        amount_ngn=earn_amount_ngn,
        mined_at=now
    )
    
    return Response({
        'success': True,
        'earned_usdt': str(earn_amount_usd),
        'earned_ngn': str(earn_amount_ngn),
        'new_balance_usdt': str(user.balance_usdt),
        'new_balance_ngn': str(user.balance_ngn),
        'next_mine_at': (now + timedelta(hours=24)).isoformat()
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mining_status(request):
    """Get mining status"""
    user = request.user
    now = timezone.now()
    
    can_mine = True
    remaining_seconds = 0
    
    if user.last_mined_at:
        time_since_last_mine = now - user.last_mined_at
        if time_since_last_mine < timedelta(hours=24):
            can_mine = False
            remaining = timedelta(hours=24) - time_since_last_mine
            remaining_seconds = int(remaining.total_seconds())
    
    # Check expiry
    is_expired = False
    if user.tier_expiry and now > user.tier_expiry:
        is_expired = True
        can_mine = False
    
    return Response({
        'can_mine': can_mine,
        'remaining_seconds': remaining_seconds,
        'last_mined_at': user.last_mined_at.isoformat() if user.last_mined_at else None,
        'tier': user.tier,
        'earn_per_day': str(EARN_PER_DAY.get(user.tier, Decimal('1.00'))),
        'is_expired': is_expired,
        'tier_expiry': user.tier_expiry.isoformat() if user.tier_expiry else None,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mining_earnings(request):
    """Get mining earnings history"""
    earnings = MiningEarning.objects.filter(user=request.user).order_by('-mined_at')[:50]
    
    data = [{
        'id': e.id,
        'tier': e.tier,
        'amount_usdt': str(e.amount_usdt),
        'amount_ngn': str(e.amount_ngn),
        'mined_at': e.mined_at.isoformat(),
    } for e in earnings]
    
    return Response({'earnings': data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_tiers(request):
    """Get all mining tiers/plans"""
    tiers = MiningTier.objects.all().order_by('tier_number')
    
    data = [{
        'tier_number': t.tier_number,
        'name': t.name,
        'price_usd': str(t.price_usd),
        'earn_per_24h_usd': str(t.earn_per_24h_usd),
        'duration_days': t.duration_days,
        'withdrawal_fee_usd': str(t.withdrawal_fee_usd),  # required for transfer fee display
    } for t in tiers]
    
    return Response({'tiers': data})