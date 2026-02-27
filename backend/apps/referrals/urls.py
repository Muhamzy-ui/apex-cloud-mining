from django.urls import path
from .views import ReferralDashboardView

urlpatterns = [
    path('', ReferralDashboardView.as_view(), name='referral-dashboard'),
]