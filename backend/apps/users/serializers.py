"""
Apex Mining - User Serializers (COMPLETE)
"""
from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """User serializer with all fields"""
    can_withdraw = serializers.ReadOnlyField()
    can_mine = serializers.ReadOnlyField()
    mining_cooldown_remaining = serializers.ReadOnlyField()
    tier_expiry_countdown = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'phone', 'country', 'avatar',
            'tier', 'tier_expiry', 'balance_usdt', 'balance_ngn', 'total_earned',
            'last_mined_at', 'trc20_wallet', 'referral_code', 'referred_by',
            'withdrawal_fee_paid', 'is_admin', 'is_verified', 'is_agent',
            'date_joined', 'can_withdraw', 'can_mine', 'mining_cooldown_remaining',
            'tier_expiry_countdown'
        ]
        read_only_fields = [
            'id', 'date_joined', 'referral_code', 'balance_usdt', 'balance_ngn',
            'total_earned', 'tier', 'tier_expiry', 'withdrawal_fee_paid'
        ]


class DashboardSerializer(serializers.ModelSerializer):
    """Dashboard data with computed properties"""
    can_withdraw = serializers.ReadOnlyField()
    can_mine = serializers.ReadOnlyField()
    mining_cooldown_remaining = serializers.ReadOnlyField()
    tier_expiry_countdown = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'tier', 'tier_expiry',
            'balance_usdt', 'balance_ngn', 'total_earned',
            'trc20_wallet', 'last_mined_at', 'withdrawal_fee_paid',
            'referral_code', 'can_withdraw', 'can_mine',
            'mining_cooldown_remaining', 'tier_expiry_countdown'
        ]


class RegisterSerializer(serializers.Serializer):
    """Registration serializer"""
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    full_name = serializers.CharField(max_length=100)
    phone = serializers.CharField(max_length=20)
    country = serializers.CharField(max_length=3, default='NG')
    referral_code = serializers.CharField(max_length=8, required=False, allow_blank=True)
    
    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match'})
        
        if User.objects.filter(email=data['email'].lower()).exists():
            raise serializers.ValidationError({'email': 'Email already exists'})
        
        return data
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        referral_code = validated_data.pop('referral_code', None)
        
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            full_name=validated_data.get('full_name', ''),
            phone=validated_data.get('phone', ''),
            country=validated_data.get('country', 'NG')
        )
        
        # Handle referral
        if referral_code:
            try:
                referrer = User.objects.get(referral_code=referral_code)
                user.referred_by = referrer
                user.save()
            except User.DoesNotExist:
                pass
        
        return user