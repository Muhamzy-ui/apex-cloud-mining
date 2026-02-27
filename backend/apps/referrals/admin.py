from django.contrib import admin
from .models import ReferralCommission # Matches your models.py

@admin.register(ReferralCommission)
class ReferralCommissionAdmin(admin.ModelAdmin):
    # Updated list_display to match the fields actually in your model
    list_display = ('referrer', 'referee', 'amount_usdt', 'commission_pct', 'created_at')
    list_filter = ('created_at', 'commission_pct')
    search_fields = ('referrer__email', 'referee__email')
    ordering = ('-created_at',)