from django.urls import path
from . import views

urlpatterns = [
    path('stats/',                          views.AdminStatsView.as_view()),
    path('users/',                          views.AdminUserListView.as_view()),
    path('users/<uuid:pk>/',                views.AdminUserDetailView.as_view()),
    path('users/<uuid:pk>/toggle/',         views.AdminUserToggleView.as_view()),
    path('deposits/',                       views.AdminDepositListView.as_view()),
    path('deposits/<uuid:pk>/approve/',     views.AdminDepositApproveView.as_view()),
    path('deposits/<uuid:pk>/reject/',      views.AdminDepositRejectView.as_view()),
    path('withdrawals/',                    views.AdminWithdrawalListView.as_view()),
    path('withdrawals/<uuid:pk>/approve/',  views.AdminWithdrawalApproveView.as_view()),
    path('withdrawals/<uuid:pk>/reject/',   views.AdminWithdrawalRejectView.as_view()),
    path('tiers/',                          views.AdminTierListView.as_view()),
    path('tiers/<int:pk>/',                 views.AdminTierDetailView.as_view()),
    path('exchange-rate/',                  views.AdminExchangeRateView.as_view()),
]