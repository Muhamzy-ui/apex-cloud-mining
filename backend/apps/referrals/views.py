"""Apex Cloud Mining — Referrals Views"""
from rest_framework import serializers, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from .models import ReferralCommission

User = get_user_model()


class ReferralCommissionSerializer(serializers.ModelSerializer):
    referee_name  = serializers.CharField(source='referee.full_name', read_only=True)
    referee_email = serializers.CharField(source='referee.email',     read_only=True)

    class Meta:
        model  = ReferralCommission
        fields = ['id', 'referee_name', 'referee_email', 'amount_usdt', 'commission_pct', 'created_at']


class ReferredUserSerializer(serializers.ModelSerializer):
    tier_label = serializers.ReadOnlyField()

    class Meta:
        model  = User
        fields = ['full_name', 'email', 'tier', 'tier_label', 'date_joined']


class ReferralDashboardView(APIView):
    """GET /api/v1/referrals/ — Full referral stats"""
    def get(self, request):
        user = request.user
        referred_users = User.objects.filter(referred_by=user).order_by('-date_joined')
        commissions    = ReferralCommission.objects.filter(referrer=user)

        return Response({
            'referral_code':    user.referral_code,
            'referral_link':    f"https://apexcloudmining.com/ref/{user.referral_code}",
            'total_referrals':  referred_users.count(),
            'total_commission': float(user.referral_earnings),
            'commission_pct':   10,
            'referred_users':   ReferredUserSerializer(referred_users, many=True).data,
            'commission_log':   ReferralCommissionSerializer(commissions, many=True).data,
        })


# ---- URL Config ----
from django.urls import path

urlpatterns = [
    path('', ReferralDashboardView.as_view(), name='referral-dashboard'),
]