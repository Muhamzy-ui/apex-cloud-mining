"""
Apex Mining - Payment Views (COMPLETE)
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from decimal import Decimal
from .models import Deposit, Withdrawal, ExchangeRate, PaymentSettings, WithdrawalFeePayment


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_deposit(request):
    """Create deposit/upgrade payment"""
    user = request.user
    
    tier_target = request.data.get('tier_target')
    amount_usd = request.data.get('amount_usd')
    amount_ngn = request.data.get('amount_ngn')
    method = request.data.get('method', 'crypto')
    proof_image = request.FILES.get('proof_image')
    tx_hash = request.data.get('tx_hash', '')
    
    if not tier_target or not amount_usd:
        return Response(
            {'detail': 'Missing required fields'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    deposit = Deposit.objects.create(
        user=user,
        tier_target=tier_target,
        amount_usd=amount_usd,
        amount_ngn=amount_ngn or 0,
        method=method,
        proof_image=proof_image,
        tx_hash=tx_hash
    )
    
    return Response({
        'message': 'Deposit submitted successfully',
        'deposit_id': str(deposit.id)
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_withdrawal(request):
    """Create withdrawal request"""
    user = request.user
    
    # Check if withdrawals are enabled
    if not user.can_withdraw:
        return Response(
            {'detail': 'Withdrawals not available. Please upgrade or reach minimum balance.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    amount_usdt = Decimal(str(request.data.get('amount_usdt', 0)))
    method = request.data.get('method', 'crypto')
    
    # Validation
    if amount_usdt < Decimal('10.00'):
        return Response(
            {'detail': 'Minimum withdrawal is $10 USDT'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if amount_usdt > user.balance_usdt:
        return Response(
            {'detail': 'Insufficient balance'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get exchange rate for NGN conversion
    try:
        rate = ExchangeRate.objects.first()
        amount_ngn = amount_usdt * Decimal(str(rate.usd_to_ngn)) if rate else None
    except:
        amount_ngn = None
    
    # Create withdrawal
    withdrawal = Withdrawal.objects.create(
        user=user,
        amount_usdt=amount_usdt,
        amount_ngn=amount_ngn,
        method=method,
        wallet_address=request.data.get('wallet_address', ''),
        bank_name=request.data.get('bank_name', ''),
        account_number=request.data.get('account_number', ''),
        account_name=request.data.get('account_name', ''),
    )
    
    return Response({
        'message': 'Withdrawal request submitted successfully',
        'transaction_id': withdrawal.transaction_id,
        'amount_usdt': float(amount_usdt),
        'amount_ngn': float(amount_ngn) if amount_ngn else None,
        'status': 'pending'
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_withdrawal_status(request, transaction_id):
    """Get withdrawal status by transaction ID"""
    try:
        withdrawal = Withdrawal.objects.get(
            transaction_id=transaction_id,
            user=request.user
        )
        
        return Response({
            'transaction_id': withdrawal.transaction_id,
            'amount_usdt': float(withdrawal.amount_usdt),
            'amount_ngn': float(withdrawal.amount_ngn) if withdrawal.amount_ngn else None,
            'method': withdrawal.method,
            'status': withdrawal.status,
            'created_at': withdrawal.created_at.isoformat(),
            'completed_at': withdrawal.completed_at.isoformat() if withdrawal.completed_at else None,
            'destination': withdrawal.wallet_address if withdrawal.method == 'crypto' else withdrawal.account_number,
        })
    except Withdrawal.DoesNotExist:
        return Response(
            {'detail': 'Withdrawal not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_withdrawal_limits(request):
    """Get min/max withdrawal limits based on user tier"""
    user = request.user
    
    # Define limits per tier
    limits = {
        1: {'min': 10, 'max': 10000},
        2: {'min': 10, 'max': 10000},
        3: {'min': 10, 'max': 10000},
        4: {'min': 10, 'max': 10000},
        5: {'min': 10, 'max': 10000},
    }
    
    tier_limits = limits.get(user.tier, {'min': 10, 'max': 10000})
    
    return Response({
        'min_withdrawal_usd': tier_limits['min'],
        'max_withdrawal_usd': tier_limits['max'],
        'balance_usdt': float(user.balance_usdt),
        'can_withdraw': user.can_withdraw,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def get_payment_settings(request):
    """Get payment settings including support links"""
    settings = PaymentSettings.get_settings()
    return Response({
        'usdt_wallet': settings.usdt_wallet,
        'bank_name': settings.bank_name,
        'account_name': settings.account_name,
        'account_number': settings.account_number,
        'support_url': settings.support_url,
        'support_alt_url': settings.support_alt_url,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def get_withdrawal_fees(request):
    """Get withdrawal fees for all tiers (admin-configurable)"""
    try:
        from apps.mining.models import MiningTier
        tiers = MiningTier.objects.all().order_by('tier_number')
        fees = {
            tier.tier_number: {
                'plan_name': tier.name,
                'withdrawal_fee_usd': float(tier.withdrawal_fee_usd),
            }
            for tier in tiers
        }
        return Response({'fees': fees})
    except Exception as e:
        print(f'❌ Withdrawal fees error: {str(e)}')
        # Fallback to default fees if DB query fails
        return Response({
            'fees': {
                1: {'plan_name': 'Plan 1', 'withdrawal_fee_usd': 10.0},
                2: {'plan_name': 'Plan 2', 'withdrawal_fee_usd': 8.0},
                3: {'plan_name': 'Plan 3', 'withdrawal_fee_usd': 5.0},
                4: {'plan_name': 'Plan 4', 'withdrawal_fee_usd': 3.0},
                5: {'plan_name': 'Plan 5', 'withdrawal_fee_usd': 0.0},
            }
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pay_withdrawal_fee(request):
    """Submit withdrawal fee payment"""
    user = request.user
    
    # Check if already paid
    if user.withdrawal_fee_paid:
        return Response(
            {'detail': 'You have already paid the withdrawal fee'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if user can pay (Plan 1 = 100 USDT, Others = immediate)
    if user.tier == 1 and user.balance_usdt < Decimal('100.00'):
        return Response(
            {'detail': 'Plan 1 users must mine to 100 USDT before paying withdrawal fee'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get tier's withdrawal fee
    try:
        from apps.mining.models import MiningTier
        tier = MiningTier.objects.get(tier_number=user.tier)
        fee_amount = tier.withdrawal_fee_usd
    except MiningTier.DoesNotExist:
        fee_amount = Decimal('10.00')  # Default
    
    # Create withdrawal fee payment
    payment = WithdrawalFeePayment.objects.create(
        user=user,
        tier=user.tier,
        fee_amount_usd=fee_amount,
        method=request.data.get('method', 'crypto'),
        proof_image=request.FILES.get('proof_image'),
        tx_hash=request.data.get('tx_hash', '')
    )
    
    return Response({
        'message': 'Withdrawal fee payment submitted! Awaiting admin approval.',
        'payment_id': str(payment.id),
        'fee_amount': float(fee_amount)
    }, status=status.HTTP_201_CREATED)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_account_number(request):
    """Verify Nigerian bank account number using Paystack or mock for testing"""
    from django.conf import settings
    account_number = request.data.get('account_number')
    bank_code = request.data.get('bank_code')
    
    if not account_number or not bank_code:
        return Response(
            {'detail': 'Account number and bank code required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if Paystack API is configured
    paystack_key = getattr(settings, 'PAYSTACK_SECRET_KEY', None)
    
    if paystack_key and paystack_key != 'YOUR_PAYSTACK_SECRET_KEY':
        # Use real Paystack API
        try:
            import requests
            
            headers = {
                'Authorization': f'Bearer {paystack_key}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(
                f'https://api.paystack.co/bank/resolve?account_number={account_number}&bank_code={bank_code}',
                headers=headers,
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status'):
                    raw_name = data['data'].get('account_name', '')
                    # Provide a nicely formatted display name while keeping raw result for debugging
                    display_name = raw_name.title() if isinstance(raw_name, str) else raw_name
                    return Response({
                        'account_name': display_name,
                        'raw_account_name': raw_name,
                        'account_number': account_number,
                    })
            
            return Response(
                {'detail': 'Account verification failed. Check account number and bank code.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        except Exception as e:
            print(f'⚠️ Paystack verification error: {str(e)}')
            return Response(
                {'detail': 'Account verification service unavailable. Please try again.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
    
    else:
        # Development mode: Generate realistic mock names for testing
        # In production, configure PAYSTACK_SECRET_KEY in settings
        import random

        mock_names = {
            '0000000001': 'Chioma Okoro',
            '0000000002': 'Tunde Adeyemi',
            '0000000003': 'Zainab Hussein',
            '0000000004': 'Ngozi Ezeoke',
            '0000000005': 'David Okafor',
            '0072410373': 'John Oyedele',  # User's test account (from screenshot)
            '1234567890': 'Grace Nwosu',
            '9876543210': 'Emeka Chukwu',
        }

        # Return specific name if in mock list, otherwise generate based on account number
        if account_number in mock_names:
            account_name = mock_names[account_number]
        else:
            # Hash account number to generate consistent but realistic name
            hash_val = abs(hash(account_number)) % 1000
            first_names = ['Chioma', 'Tunde', 'Zainab', 'Ngozi', 'David', 'Grace', 'Emeka', 'Amara', 'Kayode', 'Blessing']
            last_names = ['Okoro', 'Adeyemi', 'Hussein', 'Ezeoke', 'Okafor', 'Nwosu', 'Chukwu', 'Iyanda', 'Mwangi', 'Ogunlade']
            first = first_names[hash_val % len(first_names)]
            last = last_names[(hash_val // len(first_names)) % len(last_names)]
            account_name = f'{first} {last}'

        return Response({
            'account_name': account_name,
            'account_number': account_number,
            '_debug_mode': 'This is a test response. Configure PAYSTACK_SECRET_KEY for real verification.'
        })


@api_view(['GET'])
@permission_classes([AllowAny])
def get_nigerian_banks(request):
    """Get list of Nigerian banks with codes"""
    banks = [
        {'name': 'Access Bank', 'code': '044'},
        {'name': 'Citibank', 'code': '023'},
        {'name': 'Ecobank Nigeria', 'code': '050'},
        {'name': 'Fidelity Bank', 'code': '070'},
        {'name': 'First Bank of Nigeria', 'code': '011'},
        {'name': 'First City Monument Bank', 'code': '214'},
        {'name': 'Guaranty Trust Bank', 'code': '058'},
        {'name': 'Heritage Bank', 'code': '030'},
        {'name': 'Keystone Bank', 'code': '082'},
        {'name': 'Polaris Bank', 'code': '076'},
        {'name': 'Stanbic IBTC Bank', 'code': '221'},
        {'name': 'Standard Chartered Bank', 'code': '068'},
        {'name': 'Sterling Bank', 'code': '232'},
        {'name': 'Union Bank of Nigeria', 'code': '032'},
        {'name': 'United Bank For Africa', 'code': '033'},
        {'name': 'Unity Bank', 'code': '215'},
        {'name': 'Wema Bank', 'code': '035'},
        {'name': 'Zenith Bank', 'code': '057'},
        {'name': 'Opay', 'code': '999992'},
        {'name': 'PalmPay', 'code': '999991'},
        {'name': 'Kuda Bank', 'code': '090267'},
        {'name': 'Moniepoint', 'code': '090405'},
    ]
    
    return Response(banks)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_transactions(request):
    """Get user transactions"""
    user = request.user
    trans_type = request.GET.get('type', 'all')
    
    transactions = []
    
    try:
        # Deposits
        if trans_type in ['all', 'deposit', 'deposits']:
            deposits = Deposit.objects.filter(user=user).order_by('-created_at')
            for d in deposits:
                transactions.append({
                    'id': str(d.id),
                    'type': 'deposit',
                    'label': f'Plan {d.tier_target} Upgrade',
                    'amount': float(d.amount_usd),
                    'amount_usdt': float(d.amount_usd),
                    'amount_ngn': float(d.amount_ngn) if d.amount_ngn else 0,
                    'status': d.status,
                    'date': d.created_at.isoformat(),
                    'created_at': d.created_at.isoformat(),
                    'description': f'Plan {d.tier_target} Upgrade'
                })
        
        # Withdrawals
        if trans_type in ['all', 'withdrawal', 'withdrawals']:
            withdrawals = Withdrawal.objects.filter(user=user).order_by('-created_at')
            for w in withdrawals:
                transactions.append({
                    'id': str(w.id),
                    'type': 'withdrawal',
                    'label': 'Withdrawal Request',
                    'amount': -float(w.amount_usdt),
                    'amount_usdt': float(w.amount_usdt),
                    'amount_ngn': float(w.amount_ngn) if w.amount_ngn else 0,
                    'status': w.status,
                    'date': w.created_at.isoformat(),
                    'created_at': w.created_at.isoformat(),
                    'description': 'Withdrawal Request'
                })
        
        # Mining (Earnings)
        if trans_type in ['all', 'mining', 'earnings']:
            from apps.mining.models import MiningEarning
            earnings = MiningEarning.objects.filter(user=user).order_by('-mined_at')[:50]
            for e in earnings:
                transactions.append({
                    'id': str(e.id),
                    'type': 'earning',
                    'label': 'Mining Reward',
                    'amount': float(e.amount_usdt),
                    'amount_usdt': float(e.amount_usdt),
                    'amount_ngn': 0,
                    'status': 'credited',
                    'date': e.mined_at.isoformat(),
                    'created_at': e.mined_at.isoformat(),
                    'description': 'Mining Reward'
                })

        # Withdrawal Fee Payments
        if trans_type in ['all', 'withdrawal_fee', 'fee_payments']:
            fees = WithdrawalFeePayment.objects.filter(user=user).order_by('-created_at')
            for f in fees:
                transactions.append({
                    'id': str(f.id),
                    'type': 'withdrawal_fee',
                    'label': 'Withdrawal Fee Payment',
                    'amount': -float(f.fee_amount_usd),
                    'amount_usdt': float(f.fee_amount_usd),
                    'amount_ngn': 0,
                    'status': f.status,
                    'date': f.created_at.isoformat(),
                    'created_at': f.created_at.isoformat(),
                    'description': 'One-time withdrawal fee payment',
                })
        
        # Sort by date
        transactions.sort(key=lambda x: x['date'], reverse=True)
        
        return Response({
            'results': transactions,
            'count': len(transactions)
        })
        
    except Exception as e:
        print(f'❌ Transaction error: {str(e)}')
        import traceback
        traceback.print_exc()
        return Response({'results': [], 'count': 0}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_exchange_rate(request):
    """Get current USD to NGN exchange rate (admin-controlled)"""
    try:
        rate = ExchangeRate.objects.first()
        if rate:
            return Response({
                'usd_to_ngn': float(rate.usd_to_ngn),
                'usd_to_ghs': float(rate.usd_to_ghs),
                'updated_at': rate.updated_at.isoformat(),
            })
    except Exception:
        pass
    # Fallback default
    return Response({'usd_to_ngn': 1600, 'usd_to_ghs': 15.5})