"""
Apex Mining — Admin Panel API (RBAC v2)

Role guards:
  - IsSuperAdmin: is_superuser role only — approve/delete admins, global commissions, audit log
  - IsJuniorAdminOrAbove: is_admin OR is_superuser — transaction approvals, user management
"""
from rest_framework import generics, serializers, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes as pc
from rest_framework.exceptions import PermissionDenied
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Sum, Count
from apps.payments.models import Deposit, Withdrawal, ExchangeRate, WithdrawalFeePayment
from apps.mining.models import MiningTier, UserMiningSession
from apps.referrals.models import ReferralCommission, AdminCommissionSummary
from apps.users.permissions import IsSuperAdmin, IsJuniorAdminOrAbove
from apps.users.models import AuditLog
import datetime

User = get_user_model()


def _ip(request):
    """Extract client IP."""
    fwd = request.META.get('HTTP_X_FORWARDED_FOR')
    return fwd.split(',')[0].strip() if fwd else request.META.get('REMOTE_ADDR')


# ──────────────────────────────────────────────────────────────────────────────
# Serializers
# ──────────────────────────────────────────────────────────────────────────────
class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = [
            'id', 'full_name', 'email', 'phone', 'country',
            'tier', 'balance_usdt', 'total_earned',
            'is_active', 'is_verified', 'is_admin', 'is_superuser',
            'admin_status', 'referral_code', 'date_joined', 'last_mined_at',
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


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'


# ──────────────────────────────────────────────────────────────────────────────
# Stats — Junior Admin and above
# ──────────────────────────────────────────────────────────────────────────────
class AdminStatsView(APIView):
    """GET /api/v1/admin/stats/"""
    permission_classes = [IsJuniorAdminOrAbove]

    def get(self, request):
        user = request.user
        today = timezone.now().date()

        # Super Admins see global stats; Junior Admins see only their downline
        if user.is_superuser:
            users_qs      = User.objects.all()
            deposits_qs   = Deposit.objects.all()
            withdraw_qs   = Withdrawal.objects.all()
        else:
            users_qs      = User.objects.filter(referred_by=user)
            deposits_qs   = Deposit.objects.filter(user__referred_by=user)
            withdraw_qs   = Withdrawal.objects.filter(user__referred_by=user)

        total_deposits    = float(deposits_qs.filter(status='approved').aggregate(t=Sum('amount_usd'))['t'] or 0)
        total_withdrawals = float(withdraw_qs.filter(status='approved').aggregate(t=Sum('amount_usdt'))['t'] or 0)

        return Response({
            'total_users':          users_qs.count(),
            'new_today':            users_qs.filter(date_joined__date=today).count(),
            'pending_deposits':     deposits_qs.filter(status='pending').count(),
            'pending_withdrawals':  withdraw_qs.filter(status='pending').count(),
            'approved_withdrawals': withdraw_qs.filter(status='approved').count(),
            'total_deposits':       total_deposits,
            'total_withdrawals':    total_withdrawals,
            'total_volume':         total_deposits + total_withdrawals,
            'users_by_tier':        list(users_qs.values('tier').annotate(count=Count('id')).order_by('tier')),
        })


# ──────────────────────────────────────────────────────────────────────────────
# User Management — Junior Admin sees only downline, Super Admin sees all
# ──────────────────────────────────────────────────────────────────────────────
class AdminUserListView(generics.ListAPIView):
    """GET /api/v1/admin/users/"""
    permission_classes = [IsJuniorAdminOrAbove]
    serializer_class   = AdminUserSerializer
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter]
    search_fields      = ['email', 'full_name', 'phone']
    ordering_fields    = ['date_joined', 'balance_usdt', 'tier']

    def get_queryset(self):
        if self.request.user.is_superuser:
            return User.objects.all()
        return User.objects.filter(referred_by=self.request.user)


class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/v1/admin/users/<id>/ — View or modify a user"""
    permission_classes = [IsJuniorAdminOrAbove]
    serializer_class   = AdminUserSerializer

    def get_queryset(self):
        if self.request.user.is_superuser:
            return User.objects.all()
        # Junior Admin can only see their referrals
        return User.objects.filter(referred_by=self.request.user)

    def perform_update(self, serializer):
        target = self.get_object()
        # Junior Admin cannot edit other admins or superusers
        if not self.request.user.is_superuser and (target.is_admin or target.is_superuser):
            raise PermissionDenied("⛔ You cannot modify admin accounts.")
        
        serializer.save()
        AuditLog.log(
            actor=self.request.user, 
            action='settings_changed', 
            target=target, 
            ip=_ip(self.request),
            detail=f"Admin updated details for user {target.email}"
        )


class AdminUserToggleView(APIView):
    """POST /api/v1/admin/users/<id>/toggle/ — Activate or deactivate a user"""
    permission_classes = [IsJuniorAdminOrAbove]

    def post(self, request, pk):
        target = User.objects.get(pk=pk)

        # Junior Admins cannot deactivate other admins
        if not request.user.is_superuser and (target.is_admin or target.is_superuser):
            return Response(
                {'detail': '⛔ You cannot deactivate admin accounts.', 'code': 'insufficient_role'},
                status=status.HTTP_403_FORBIDDEN
            )

        target.is_active = not target.is_active
        target.save(update_fields=['is_active'])

        action = 'admin_reactivated' if target.is_active else 'admin_deactivated'
        AuditLog.log(
            actor=request.user, action=action, target=target, ip=_ip(request),
            detail=f"{'Activated' if target.is_active else 'Deactivated'} user {target.email}"
        )
        return Response({'status': 'active' if target.is_active else 'deactivated'})


# ──────────────────────────────────────────────────────────────────────────────
# Admin Approval — Super Admin only
# ──────────────────────────────────────────────────────────────────────────────
class PendingAdminListView(generics.ListAPIView):
    """GET /api/v1/admin/pending-admins/ — List pending admin applications"""
    permission_classes = [IsSuperAdmin]
    serializer_class   = AdminUserSerializer

    def get_queryset(self):
        return User.objects.filter(admin_status='pending').order_by('-date_joined')


class ApproveAdminView(APIView):
    """POST /api/v1/admin/approve-admin/<id>/"""
    permission_classes = [IsSuperAdmin]

    def post(self, request, pk):
        target = User.objects.get(pk=pk)
        if target.admin_status != 'pending':
            return Response({'detail': 'Not pending.'}, status=400)

        target.admin_status = 'approved'
        target.is_admin = True
        target.is_staff = True
        target.save(update_fields=['admin_status', 'is_admin', 'is_staff'])

        from apps.users.models import Notification
        Notification.objects.create(
            user=target, type='system',
            title='✅ Admin Access Granted!',
            message='Your admin application has been approved.',
            icon='✅',
        )
        AuditLog.log(
            actor=request.user, action='admin_approved', target=target, ip=_ip(request),
            detail=f'Super Admin approved Junior Admin application for {target.email}'
        )
        return Response({'detail': f'{target.email} approved as Junior Admin.'})


class RejectAdminView(APIView):
    """POST /api/v1/admin/reject-admin/<id>/"""
    permission_classes = [IsSuperAdmin]

    def post(self, request, pk):
        target = User.objects.get(pk=pk)
        target.admin_status = 'rejected'
        target.is_admin = False
        target.is_staff = target.is_agent  # Preserve staff if still an agent
        target.save(update_fields=['admin_status', 'is_admin', 'is_staff'])

        AuditLog.log(
            actor=request.user, action='admin_rejected', target=target, ip=_ip(request),
            detail=f'Super Admin rejected admin application for {target.email}'
        )
        return Response({'detail': f'{target.email} application rejected.'})


class DeleteAdminView(APIView):
    """DELETE /api/v1/admin/delete-admin/<id>/ — Super Admin only"""
    permission_classes = [IsSuperAdmin]

    def delete(self, request, pk):
        target = User.objects.get(pk=pk)
        if target.is_superuser:
            return Response({'detail': '⛔ Cannot delete a Super Admin.'}, status=400)

        email = target.email  # capture before deletion
        AuditLog.log(
            actor=request.user, action='admin_deleted', target=target, ip=_ip(request),
            detail=f'Super Admin permanently deleted {email}'
        )
        target.delete()
        return Response({'detail': f'{email} deleted.'})


# ──────────────────────────────────────────────────────────────────────────────
# Deposits — Junior Admin and above
# ──────────────────────────────────────────────────────────────────────────────
class AdminDepositListView(generics.ListAPIView):
    """GET /api/v1/admin/deposits/"""
    permission_classes = [IsJuniorAdminOrAbove]
    serializer_class   = AdminDepositSerializer
    filter_backends    = [filters.SearchFilter]
    search_fields      = ['user__email', 'user__full_name', 'status']

    def get_queryset(self):
        if self.request.user.is_superuser:
            return Deposit.objects.all()
        return Deposit.objects.filter(user__referred_by=self.request.user)


class AdminDepositApproveView(APIView):
    """POST /api/v1/admin/deposits/<id>/approve/"""
    permission_classes = [IsJuniorAdminOrAbove]

    def post(self, request, pk):
        deposit = Deposit.objects.get(pk=pk)
        if deposit.status != 'pending':
            return Response({'detail': 'Already reviewed.'}, status=400)

        # Junior Admin can only approve their own downline's deposits
        if not request.user.is_superuser and deposit.user.referred_by != request.user:
            return Response({'detail': '⛔ Not in your downline.'}, status=403)

        deposit.status      = 'approved'
        deposit.reviewed_at = timezone.now()
        deposit.save()

        user = deposit.user
        user.tier = deposit.tier_target
        user.save(update_fields=['tier'])

        AuditLog.log(
            actor=request.user, action='deposit_approved', target=deposit.user, ip=_ip(request),
            detail=f'Deposit ${deposit.amount_usd} approved — {deposit.user.email} → Plan {deposit.tier_target}'
        )
        return Response({'detail': 'Deposit approved.'})


class AdminDepositRejectView(APIView):
    """POST /api/v1/admin/deposits/<id>/reject/"""
    permission_classes = [IsJuniorAdminOrAbove]

    def post(self, request, pk):
        deposit = Deposit.objects.get(pk=pk)
        if not request.user.is_superuser and deposit.user.referred_by != request.user:
            return Response({'detail': '⛔ Not in your downline.'}, status=403)
        deposit.status      = 'rejected'
        deposit.reviewed_at = timezone.now()
        deposit.save()
        AuditLog.log(
            actor=request.user, action='deposit_rejected', target=deposit.user,
            ip=_ip(request), detail=f'Deposit ${deposit.amount_usd} rejected for {deposit.user.email}'
        )
        return Response({'detail': 'Deposit rejected.'})


# ──────────────────────────────────────────────────────────────────────────────
# Withdrawals — Junior Admin and above
# ──────────────────────────────────────────────────────────────────────────────
class AdminWithdrawalListView(generics.ListAPIView):
    """GET /api/v1/admin/withdrawals/"""
    permission_classes = [IsJuniorAdminOrAbove]
    serializer_class   = AdminWithdrawalSerializer

    def get_queryset(self):
        if self.request.user.is_superuser:
            return Withdrawal.objects.all()
        return Withdrawal.objects.filter(user__referred_by=self.request.user)


class AdminWithdrawalApproveView(APIView):
    """POST /api/v1/admin/withdrawals/<id>/approve/"""
    permission_classes = [IsJuniorAdminOrAbove]

    def post(self, request, pk):
        wd = Withdrawal.objects.get(pk=pk)
        if not request.user.is_superuser and wd.user.referred_by != request.user:
            return Response({'detail': '⛔ Not in your downline.'}, status=403)
        if wd.status not in ['pending', 'processing']:
            return Response({'detail': 'Already reviewed.'}, status=400)
        wd.status = 'approved'
        wd.reviewed_at = timezone.now()
        wd.save()
        AuditLog.log(
            actor=request.user, action='withdrawal_approved', target=wd.user, ip=_ip(request),
            detail=f'Withdrawal ${wd.amount_usdt} USDT approved for {wd.user.email}'
        )
        return Response({'detail': 'Withdrawal approved.'})


class AdminWithdrawalRejectView(APIView):
    """POST /api/v1/admin/withdrawals/<id>/reject/"""
    permission_classes = [IsJuniorAdminOrAbove]

    def post(self, request, pk):
        wd = Withdrawal.objects.get(pk=pk)
        if not request.user.is_superuser and wd.user.referred_by != request.user:
            return Response({'detail': '⛔ Not in your downline.'}, status=403)
        if wd.status != 'pending':
            return Response({'detail': 'Cannot reject at this stage.'}, status=400)
        wd.user.balance_usdt += wd.amount_usdt
        wd.user.save(update_fields=['balance_usdt'])
        wd.status = 'rejected'
        wd.reviewed_at = timezone.now()
        wd.save()
        AuditLog.log(
            actor=request.user, action='withdrawal_rejected', target=wd.user, ip=_ip(request),
            detail=f'Withdrawal ${wd.amount_usdt} USDT rejected, balance refunded to {wd.user.email}'
        )
        return Response({'detail': 'Withdrawal rejected and balance refunded.'})


# ──────────────────────────────────────────────────────────────────────────────
# Global Commissions — Super Admin only
# ──────────────────────────────────────────────────────────────────────────────
class GlobalCommissionsView(APIView):
    """GET /api/v1/admin/commissions/ — Super Admin global commission overview"""
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        summaries = AdminCommissionSummary.objects.select_related('admin').order_by('-total_earned')
        platform_total = summaries.aggregate(t=Sum('total_earned'))['t'] or 0
        return Response({
            'platform_total': float(platform_total),
            'admin_count': summaries.count(),
            'admins': [
                {
                    'admin_id':        str(s.admin.id),
                    'email':           s.admin.email,
                    'full_name':       s.admin.full_name,
                    'referral_code':   s.admin.referral_code,
                    'total_earned':    float(s.total_earned),
                    'total_referrals': s.total_referrals,
                    'is_active':       s.admin.is_active,
                } for s in summaries
            ]
        })


# ──────────────────────────────────────────────────────────────────────────────
# Audit Log — Super Admin only
# ──────────────────────────────────────────────────────────────────────────────
class AuditLogListView(generics.ListAPIView):
    """GET /api/v1/admin/audit-log/ — Tamper-resistant audit trail"""
    permission_classes = [IsSuperAdmin]
    serializer_class   = AuditLogSerializer
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter]
    search_fields      = ['actor_email', 'target_email', 'action', 'detail']
    ordering_fields    = ['-created_at']

    def get_queryset(self):
        qs = AuditLog.objects.all()
        action = self.request.query_params.get('action')
        if action:
            qs = qs.filter(action=action)
        return qs


# ──────────────────────────────────────────────────────────────────────────────
# Tier & Exchange Rate — Super Admin only (read allowed for Junior)
# ──────────────────────────────────────────────────────────────────────────────
class AdminTierListView(generics.ListCreateAPIView):
    """GET/POST /api/v1/admin/tiers/"""
    permission_classes = [IsJuniorAdminOrAbove]
    serializer_class   = AdminTierSerializer
    queryset           = MiningTier.objects.all()

    def create(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            return Response({'detail': '⛔ Only Super Admin can create plans.'}, status=403)
        return super().create(request, *args, **kwargs)


class AdminTierDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PUT/DELETE /api/v1/admin/tiers/<id>/"""
    permission_classes = [IsSuperAdmin]
    serializer_class   = AdminTierSerializer
    queryset           = MiningTier.objects.all()

    def perform_update(self, serializer):
        serializer.save()
        AuditLog.log(actor=self.request.user, action='settings_changed',
                     detail=f'Mining tier updated: Plan {serializer.instance.tier_number}')


class AdminExchangeRateView(generics.RetrieveUpdateAPIView):
    """GET/PUT /api/v1/admin/exchange-rate/ — Super Admin only"""
    permission_classes = [IsSuperAdmin]
    serializer_class   = ExchangeRateSerializer

    def get_object(self):
        rate, _ = ExchangeRate.objects.get_or_create(pk=1, defaults={'usd_to_ngn': 1450, 'usd_to_ghs': 15.5})
        return rate

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
        AuditLog.log(actor=self.request.user, action='settings_changed',
                     detail=f'Exchange rate updated: {serializer.validated_data}')