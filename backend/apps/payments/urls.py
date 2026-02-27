from django.urls import path
from . import views

urlpatterns = [
    path('deposit/', views.create_deposit),
    path('withdraw/', views.create_withdrawal),
    path('withdrawal-status/<str:transaction_id>/', views.get_withdrawal_status),
    path('withdrawal-limits/', views.get_withdrawal_limits),
    path('withdrawal-fees/', views.get_withdrawal_fees),
    path('settings/', views.get_payment_settings),
    path('pay-withdrawal-fee/', views.pay_withdrawal_fee),
    path('verify-account/', views.verify_account_number),
    path('banks/', views.get_nigerian_banks),
    path('transactions/', views.get_transactions),
]