"""
Apex Mining - User Views (COMPLETE)
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
import random
import string
from django.utils import timezone
from .models import User, Notification, EmailVerificationCode, PasswordResetCode
from .serializers import UserSerializer, RegisterSerializer, DashboardSerializer
from .utils import send_verification_email, send_password_reset_email


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register new user (Requires Email Verification)"""
    serializer = RegisterSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # Save user with is_verified=False (if not already handled in serializer)
    user = serializer.save()
    user.is_verified = False
    user.save(update_fields=['is_verified'])
    
    # Generate 6-digit code
    code = ''.join(random.choices(string.digits, k=6))
    EmailVerificationCode.objects.create(user=user, code=code)
    
    # Send email
    send_verification_email(user.email, code)
    
    return Response({
        'requires_verification': True,
        'email': user.email,
        'message': 'Verification code sent to email'
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login user"""
    email = request.data.get('email', '').strip().lower()
    password = request.data.get('password', '')
    
    if not email or not password:
        return Response(
            {'detail': 'Email and password required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {'detail': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not user.check_password(password):
        return Response(
            {'detail': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not user.is_active:
        return Response(
            {'detail': 'Account disabled'},
            status=status.HTTP_401_UNAUTHORIZED
        )
        
    if not user.is_verified:
        return Response(
            {'detail': 'Account not verified. Please verify your email.', 'unverified': True, 'email': user.email},
            status=status.HTTP_403_FORBIDDEN
        )
    
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    """Verify email with 6-digit code"""
    email = request.data.get('email', '').strip().lower()
    code = request.data.get('code', '').strip()
    
    if not email or not code:
        return Response({'detail': 'Email and code required'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        user = User.objects.get(email=email)
        verification = EmailVerificationCode.objects.filter(
            user=user, code=code, is_used=False
        ).order_by('-created_at').first()
        
        if not verification:
            return Response({'detail': 'Invalid verification code'}, status=status.HTTP_400_BAD_REQUEST)
            
        if verification.is_expired:
            return Response({'detail': 'Verification code expired'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Success
        user.is_verified = True
        user.save(update_fields=['is_verified'])
        verification.is_used = True
        verification.save(update_fields=['is_used'])
        
        # Return login tokens
        refresh = RefreshToken.for_user(user)
        return Response({
            'detail': 'Email verified successfully',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        })
        
    except User.DoesNotExist:
        return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_verification(request):
    """Resend 6-digit verification code"""
    email = request.data.get('email', '').strip().lower()
    
    if not email:
        return Response({'detail': 'Email required'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        user = User.objects.get(email=email)
        if user.is_verified:
            return Response({'detail': 'Email already verified'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Invalidate previous unused codes
        EmailVerificationCode.objects.filter(user=user, is_used=False).update(is_used=True)
        
        # Generate new 6-digit code
        code = ''.join(random.choices(string.digits, k=6))
        EmailVerificationCode.objects.create(user=user, code=code)
        
        send_verification_email(user.email, code)
        
        return Response({'detail': 'New verification code sent'})
        
    except User.DoesNotExist:
        # Don't reveal if user exists or not for security on this endpoint
        return Response({'detail': 'New verification code sent'})


@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    """Request a password reset code"""
    email = request.data.get('email', '').strip().lower()
    
    if not email:
        return Response({'detail': 'Email required'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        user = User.objects.get(email=email)
        
        # Invalidate previous unused codes
        PasswordResetCode.objects.filter(user=user, is_used=False).update(is_used=True)
        
        # Generate new 6-digit code
        code = ''.join(random.choices(string.digits, k=6))
        PasswordResetCode.objects.create(user=user, code=code)
        
        send_password_reset_email(user.email, code)
        
        return Response({'detail': 'Password reset code sent'})
        
    except User.DoesNotExist:
        # Don't reveal user existence
        return Response({'detail': 'Password reset code sent'})


@api_view(['POST'])
@permission_classes([AllowAny])
def confirm_password_reset(request):
    """Confirm password reset with code and set new password"""
    email = request.data.get('email', '').strip().lower()
    code = request.data.get('code', '').strip()
    new_password = request.data.get('new_password', '')
    
    if not email or not code or not new_password:
        return Response({'detail': 'Email, code, and new_password required'}, status=status.HTTP_400_BAD_REQUEST)
        
    if len(new_password) < 8:
        return Response({'detail': 'Password must be at least 8 characters'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        user = User.objects.get(email=email)
        reset_entry = PasswordResetCode.objects.filter(
            user=user, code=code, is_used=False
        ).order_by('-created_at').first()
        
        if not reset_entry:
            return Response({'detail': 'Invalid or expired reset code'}, status=status.HTTP_400_BAD_REQUEST)
            
        if reset_entry.is_expired:
            return Response({'detail': 'Reset code expired'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Success, change password
        user.set_password(new_password)
        user.save()
        reset_entry.is_used = True
        reset_entry.save(update_fields=['is_used'])
        
        return Response({'detail': 'Password reset successfully. You can now log in.'})
        
    except User.DoesNotExist:
        return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def me(request):
    """Get or update current user"""
    if request.method == 'GET':
        return Response(UserSerializer(request.user).data)
    
    serializer = UserSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    """Get dashboard data"""
    serializer = DashboardSerializer(request.user)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bind_wallet(request):
    """Bind TRC20 wallet"""
    wallet = request.data.get('trc20_wallet', '').strip()
    
    if not wallet:
        return Response(
            {'detail': 'Wallet address required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    request.user.trc20_wallet = wallet
    request.user.save(update_fields=['trc20_wallet'])
    
    return Response({'detail': 'Wallet saved successfully'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change password"""
    old = request.data.get('old_password')
    new = request.data.get('new_password')
    
    if not old or not new:
        return Response(
            {'detail': 'Old and new password required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not request.user.check_password(old):
        return Response(
            {'detail': 'Incorrect current password'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    request.user.set_password(new)
    request.user.save()
    
    return Response({'detail': 'Password changed successfully'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    """Get user notifications"""
    notifications = Notification.objects.filter(user=request.user)[:20]
    
    data = [{
        'id': str(n.id),
        'type': n.type,
        'title': n.title,
        'message': n.message,
        'icon': n.icon,
        'is_read': n.is_read,
        'created_at': n.created_at.isoformat()
    } for n in notifications]
    
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    """Mark notification as read"""
    try:
        notif = Notification.objects.get(id=notification_id, user=request.user)
        notif.is_read = True
        notif.save(update_fields=['is_read'])
        return Response({'detail': 'Marked as read'})
    except Notification.DoesNotExist:
        return Response(
            {'detail': 'Notification not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def agent_payment_info(request):
    """Get payment info for user's referrer (agent)"""
    user = request.user
    
    # Check if user was referred by an agent
    if user.referred_by and user.referred_by.is_agent:
        agent = user.referred_by
        return Response({
            'has_agent': True,
            'agent_name': agent.full_name or agent.email.split('@')[0],
            'usdt_wallet': agent.agent_wallet_usdt or '',
            'bank_name': agent.agent_bank_name or '',
            'account_name': agent.agent_account_name or '',
            'account_number': agent.agent_account_number or '',
        })
    
    # No agent, use default payment settings
    from apps.payments.models import PaymentSettings
    settings = PaymentSettings.get_settings()
    
    return Response({
        'has_agent': False,
        'agent_name': None,
        'usdt_wallet': settings.usdt_wallet,
        'bank_name': settings.bank_name,
        'account_name': settings.account_name,
        'account_number': settings.account_number,
    })