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

    class Meta:
        model  = ReferralCommission
        fields = ['id', 'referee_name', 'referee_email', 'amount_usdt', 'commission_pct', 'status', 'created_at']


class ReferredUserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['full_name', 'email', 'tier', 'date_joined']


# ─────────────────────────────────────────────────────────────────────────────
# Agent / Admin: Own Referral Dashboard
# ─────────────────────────────────────────────────────────────────────────────
class ReferralDashboardView(APIView):
    """GET /api/v1/referrals/ — Full referral stats for the requesting admin/agent"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        referred_users = User.objects.filter(referred_by=user).order_by('-date_joined')
        commissions    = ReferralCommission.objects.filter(referrer=user)

        # Fetch or compute summary
        try:
            summary = user.commission_summary
            total_commission = float(summary.total_earned)
        except AdminCommissionSummary.DoesNotExist:
            total_commission = float(commissions.aggregate(total=Sum('amount_usdt'))['total'] or 0)

        return Response({
            'referral_code':    user.referral_code,
            'referral_link':    f"https://apex-mining.com/ref/{user.referral_code}",
            'total_referrals':  referred_users.count(),
            'total_commission': total_commission,
            'commission_pct':   float(user.agent_commission_percent),
            'referred_users':   ReferredUserSerializer(referred_users, many=True).data,
            'commission_log':   ReferralCommissionSerializer(commissions[:50], many=True).data,
        })


# ─────────────────────────────────────────────────────────────────────────────
# Super Admin Only: Global Commission Overview
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def global_commissions(request):
    """GET /api/v1/referrals/global/ — Super Admin view of all admin commissions"""
    if not request.user.is_superuser:
        return Response(
            {'detail': '⛔ Super Admin access required.'},
            status=http_status.HTTP_403_FORBIDDEN
        )

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
# URL Config (inline for simplicity)
# ─────────────────────────────────────────────────────────────────────────────
from django.urls import path

urlpatterns = [
    path('', ReferralDashboardView.as_view(), name='referral-dashboard'),
    path('global/', global_commissions, name='global-commissions'),
]