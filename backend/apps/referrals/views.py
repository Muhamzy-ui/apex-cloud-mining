"""Apex Cloud Mining — Referrals Views (COMPLETE)"""
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import status as http_status
from django.contrib.auth import get_user_model
from django.db.models import Sum
from .models import ReferralCommission, AdminCommissionSummary

User = get_user_model()


# ─────────────────────────────────────────────────────────────────────────────
# Serializers
# ─────────────────────────────────────────────────────────────────────────────
class ReferralCommissionSerializer(serializers.ModelSerializer):
    referee_name  = serializers.CharField(source='referee.full_name', read_only=True)
    referee_email = serializers.CharField(source='referee.email',     read_only=True)
    referrer_email = serializers.CharField(source='referrer.email',   read_only=True)

    class Meta:
        model  = ReferralCommission
        fields = ['id', 'referee_name', 'referee_email', 'referrer_email', 'amount_usdt', 'tier', 'commission_pct', 'status', 'created_at']


class ReferredUserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['full_name', 'email', 'tier', 'date_joined']


# ─────────────────────────────────────────────────────────────────────────────
# User: Own Referral Dashboard
# ─────────────────────────────────────────────────────────────────────────────
class ReferralDashboardView(APIView):
    """GET /api/v1/referrals/ — Full referral stats for any authenticated user"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        referred_users = User.objects.filter(referred_by=user).order_by('-date_joined')
        commissions    = ReferralCommission.objects.filter(referrer=user).order_by('-created_at')

        # Total earned (all-time)
        try:
            summary = user.commission_summary
            total_earned = float(summary.total_earned)
        except AdminCommissionSummary.DoesNotExist:
            total_earned = float(commissions.aggregate(total=Sum('amount_usdt'))['total'] or 0)

        from django.conf import settings
        frontend_url = "https://apex-mining-frontend.vercel.app"
        try:
            if hasattr(settings, 'CORS_ALLOWED_ORIGINS') and settings.CORS_ALLOWED_ORIGINS:
                frontend_url = settings.CORS_ALLOWED_ORIGINS[0]
        except Exception:
            pass
            
        return Response({
            'referral_code':    user.referral_code,
            'referral_link':    f"{frontend_url}/register?ref={user.referral_code}",
            'total_referrals':  referred_users.count(),
            'total_earned':     total_earned,
            'referral_balance': float(user.referral_balance_usdt),
            'referred_users':   ReferredUserSerializer(referred_users, many=True).data,
            'commission_log':   ReferralCommissionSerializer(commissions[:50], many=True).data,
        })


# ─────────────────────────────────────────────────────────────────────────────
# Admin: Referral Activity & Management
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_referral_activity(request):
    """GET /api/v1/referrals/admin/activity/ — Centralized log for all referral commissions"""
    if not (request.user.is_superuser or request.user.is_admin):
        return Response({'detail': '⛔ Admin access required.'}, status=http_status.HTTP_403_FORBIDDEN)

    commissions = ReferralCommission.objects.select_related('referrer', 'referee').order_by('-created_at')
    
    # Simple pagination/limit
    limit = int(request.GET.get('limit', 100))
    serializer = ReferralCommissionSerializer(commissions[:limit], many=True)
    
    return Response({
        'count': commissions.count(),
        'results': serializer.data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_referral_action(request):
    """POST /api/v1/referrals/admin/action/ — Manual approve/reject for auditing"""
    if not (request.user.is_superuser or request.user.is_admin):
        return Response({'detail': '⛔ Admin access required.'}, status=http_status.HTTP_403_FORBIDDEN)

    commission_id = request.data.get('id')
    action = request.data.get('action') # 'approve' | 'reject' (reverse)

    try:
        comm = ReferralCommission.objects.get(id=commission_id)
        referrer = comm.referrer
        # Logic: Agents use balance_usdt, Standard users use referral_balance_usdt
        is_agent_like = referrer.is_admin or referrer.is_staff or getattr(referrer, 'is_agent', False)
        balance_field = 'balance_usdt' if is_agent_like else 'referral_balance_usdt'
        
        if action == 'reject' and comm.status == 'credited':
            # REVERSE balancing
            from django.db.models import F
            User.objects.filter(pk=referrer.pk).update(
                **{balance_field: F(balance_field) - comm.amount_usdt},
                total_earned=F('total_earned') - comm.amount_usdt,
            )
            comm.status = 'reversed'
            comm.save()
            return Response({'detail': f'✅ Commission reversed successfully (from {balance_field}).'})
        
        elif action == 'approve' and comm.status != 'credited':
            # Manual credit correction
            from django.db.models import F
            User.objects.filter(pk=referrer.pk).update(
                **{balance_field: F(balance_field) + comm.amount_usdt},
                total_earned=F('total_earned') + comm.amount_usdt,
            )
            comm.status = 'credited'
            comm.save()
            return Response({'detail': f'✅ Commission credited successfully (to {balance_field}).'})

    except ReferralCommission.DoesNotExist:
        return Response({'detail': 'Commission not found.'}, status=http_status.HTTP_404_NOT_FOUND)

    return Response({'detail': 'Invalid action or state.'}, status=http_status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────────────────────
# Super Admin Only: Global Summaries
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def global_commissions(request):
    """GET /api/v1/referrals/global/ — Super Admin view of all admin commissions"""
    if not request.user.is_superuser:
        return Response({'detail': '⛔ Super Admin access required.'}, status=http_status.HTTP_403_FORBIDDEN)

    summaries = AdminCommissionSummary.objects.select_related('admin').order_by('-total_earned')

    data = []
    for s in summaries:
        data.append({
            'admin_id':        str(s.admin.id),
            'email':           s.admin.email,
            'full_name':       s.admin.full_name,
            'referral_code':   s.admin.referral_code,
            'total_earned':    float(s.total_earned),
            'total_referrals': s.total_referrals,
            'is_active':       s.admin.is_active,
            'last_updated':    s.last_updated.isoformat(),
        })

    platform_total = summaries.aggregate(total=Sum('total_earned'))['total'] or 0

    return Response({
        'platform_total_commissions': float(platform_total),
        'admin_count': summaries.count(),
        'admins': data,
    })


# ─────────────────────────────────────────────────────────────────────────────
# URL Config
# ─────────────────────────────────────────────────────────────────────────────
from django.urls import path

urlpatterns = [
    path('', ReferralDashboardView.as_view(), name='referral-dashboard'),
    path('global/', global_commissions, name='global-commissions'),
    path('admin/activity/', admin_referral_activity, name='admin-referral-activity'),
    path('admin/action/', admin_referral_action, name='admin-referral-action'),
]
