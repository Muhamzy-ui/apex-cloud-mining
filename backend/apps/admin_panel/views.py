"""
Apex Cloud Mining — Admin Panel API
All endpoints require is_staff=True
"""
from rest_framework import generics, serializers, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Sum, Count
from apps.payments.models import Deposit, Withdrawal, ExchangeRate
from apps.mining.models import MiningTier, UserMiningSession
from apps.referrals.models import ReferralCommission
from django.conf import settings
import datetime

User = get_user_model()


# ---- Serializers ----

class AdminUserSerializer(serializers.ModelSerializer):
    tier_label = serializers.ReadOnlyField()

    class Meta:
        model  = User
        fields = [
            'id', 'full_name', 'email', 'phone', 'country',
            'tier', 'tier_label', 'balance_usdt', 'total_earned',
            'is_active', 'is_verified', 'date_joined', 'last_mined_at',
        ]


class AdminDepositSerializer(serializers.ModelSerializer):
    user_name  = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email',     read_only=True)

    class Meta:
        model  = Deposit
        fields = '__all__'


class AdminWithdrawalSerializer(serializers.ModelSerializer):
    user_name  = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email',     read_only=True)

    class Meta:
        model  = Withdrawal
        fields = '__all__'


class AdminTierSerializer(serializers.ModelSerializer):
    class Meta:
        model  = MiningTier
        fields = '__all__'


class ExchangeRateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ExchangeRate
        fields = ['usd_to_ngn', 'usd_to_ghs', 'updated_at']
        read_only_fields = ['updated_at']


# ---- Views ----

class AdminStatsView(APIView):
    """GET /api/v1/admin/stats/ — Platform-wide dashboard stats"""
    permission_classes = [IsAdminUser]

    def get(self, request):
        today = timezone.now().date()
        return Response({
            'total_users':        User.objects.count(),
            'active_users':       User.objects.filter(is_active=True).count(),
            'new_today':          User.objects.filter(date_joined__date=today).count(),
            'total_deposits':     Deposit.objects.filter(status='approved').aggregate(t=Sum('amount_usd'))['t'] or 0,
            'pending_deposits':   Deposit.objects.filter(status='pending').count(),
            'pending_withdrawals':Withdrawal.objects.filter(status='pending').count(),
            'total_withdrawals':  Withdrawal.objects.filter(status='approved').aggregate(t=Sum('amount_usdt'))['t'] or 0,
            'users_by_tier': list(
                User.objects.values('tier').annotate(count=Count('id')).order_by('tier')
            ),
        })


class AdminUserListView(generics.ListAPIView):
    """GET /api/v1/admin/users/ — All users with search/filter"""
    permission_classes = [IsAdminUser]
    serializer_class   = AdminUserSerializer
    queryset           = User.objects.all()
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter]
    search_fields      = ['email', 'full_name', 'phone']
    ordering_fields    = ['date_joined', 'balance_usdt', 'tier']


class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/v1/admin/users/<id>/ — View or modify a user"""
    permission_classes = [IsAdminUser]
    serializer_class   = AdminUserSerializer
    queryset           = User.objects.all()


class AdminUserToggleView(APIView):
    """POST /api/v1/admin/users/<id>/toggle/ — Ban or unban user"""
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        user = User.objects.get(pk=pk)
        user.is_active = not user.is_active
        user.save(update_fields=['is_active'])
        return Response({'status': 'active' if user.is_active else 'banned'})


class AdminDepositListView(generics.ListAPIView):
    """GET /api/v1/admin/deposits/ — All deposits"""
    permission_classes = [IsAdminUser]
    serializer_class   = AdminDepositSerializer
    queryset           = Deposit.objects.all()
    filter_backends    = [filters.SearchFilter]
    search_fields      = ['user__email', 'user__full_name', 'status']


class AdminDepositApproveView(APIView):
    """POST /api/v1/admin/deposits/<id>/approve/ — Approve deposit and activate tier"""
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        deposit = Deposit.objects.get(pk=pk)
        if deposit.status != 'pending':
            return Response({'detail': 'Already reviewed.'}, status=400)

        deposit.status      = 'approved'
        deposit.reviewed_at = timezone.now()
        deposit.save()

        # Upgrade user tier
        user = deposit.user
        old_tier = user.tier
        user.tier        = deposit.tier_target
        user.tier_expiry = timezone.now() + datetime.timedelta(
            days=MiningTier.objects.get(tier_number=deposit.tier_target).duration_days
        )
        user.save(update_fields=['tier', 'tier_expiry'])

        # Create or update mining session
        tier_obj = MiningTier.objects.get(tier_number=deposit.tier_target)
        UserMiningSession.objects.update_or_create(
            user=user,
            defaults={
                'tier':       tier_obj,
                'expires_at': user.tier_expiry,
                'is_active':  True,
            }
        )

        # Credit referral commission if applicable
        if user.referred_by and deposit.tier_target > 1:
            commission_pct = settings.APEX_REFERRAL_COMMISSION_PCT / 100
            commission_amt = float(deposit.amount_usd) * commission_pct
            referrer = user.referred_by
            referrer.balance_usdt     += commission_amt
            referrer.referral_earnings += commission_amt
            referrer.save(update_fields=['balance_usdt', 'referral_earnings'])
            ReferralCommission.objects.create(
                referrer=referrer, referee=user,
                deposit=deposit, amount_usdt=commission_amt,
            )

        return Response({
            'detail': f'Deposit approved. User upgraded from Tier {old_tier} to Tier {deposit.tier_target}.'
        })


class AdminDepositRejectView(APIView):
    """POST /api/v1/admin/deposits/<id>/reject/ — Reject deposit"""
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        deposit = Deposit.objects.get(pk=pk)
        deposit.status    = 'rejected'
        deposit.admin_note = request.data.get('reason', '')
        deposit.reviewed_at = timezone.now()
        deposit.save()
        return Response({'detail': 'Deposit rejected.'})


class AdminWithdrawalListView(generics.ListAPIView):
    """GET /api/v1/admin/withdrawals/ — All withdrawals"""
    permission_classes = [IsAdminUser]
    serializer_class   = AdminWithdrawalSerializer
    queryset           = Withdrawal.objects.all()


class AdminWithdrawalApproveView(APIView):
    """POST /api/v1/admin/withdrawals/<id>/approve/"""
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        wd = Withdrawal.objects.get(pk=pk)
        if wd.status not in ['pending', 'processing']:
            return Response({'detail': 'Already reviewed.'}, status=400)
        wd.status      = 'approved'
        wd.reviewed_at = timezone.now()
        wd.tx_hash     = request.data.get('tx_hash', '')
        wd.save()
        return Response({'detail': 'Withdrawal approved and processed.'})


class AdminWithdrawalRejectView(APIView):
    """POST /api/v1/admin/withdrawals/<id>/reject/ — Reject and refund"""
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        wd = Withdrawal.objects.get(pk=pk)
        if wd.status != 'pending':
            return Response({'detail': 'Cannot reject at this stage.'}, status=400)
        # Refund
        wd.user.balance_usdt += wd.amount_usdt
        wd.user.save(update_fields=['balance_usdt'])
        wd.status     = 'rejected'
        wd.admin_note = request.data.get('reason', '')
        wd.reviewed_at = timezone.now()
        wd.save()
        return Response({'detail': 'Withdrawal rejected and balance refunded.'})


class AdminTierListView(generics.ListCreateAPIView):
    """GET/POST /api/v1/admin/tiers/"""
    permission_classes = [IsAdminUser]
    serializer_class   = AdminTierSerializer
    queryset           = MiningTier.objects.all()


class AdminTierDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PUT/DELETE /api/v1/admin/tiers/<id>/"""
    permission_classes = [IsAdminUser]
    serializer_class   = AdminTierSerializer
    queryset           = MiningTier.objects.all()


class AdminExchangeRateView(generics.RetrieveUpdateAPIView):
    """GET/PUT /api/v1/admin/exchange-rate/"""
    permission_classes = [IsAdminUser]
    serializer_class   = ExchangeRateSerializer

    def get_object(self):
        rate, _ = ExchangeRate.objects.get_or_create(
            pk=1,
            defaults={'usd_to_ngn': 1450, 'usd_to_ghs': 15.5, 'updated_by': self.request.user}
        )
        return rate