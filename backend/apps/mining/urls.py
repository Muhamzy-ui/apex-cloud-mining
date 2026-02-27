from django.urls import path
from . import views

urlpatterns = [
    path('mine/', views.mine, name='mine'),
    path('status/', views.mining_status, name='mining-status'),
    path('earnings/', views.mining_earnings, name='mining-earnings'),
    path('tiers/', views.get_tiers, name='tiers'),
]