import os
import django
import sys

# Setup Django environment
sys.path.append('c:/Users/HP/apex-cloud-mining/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apex_project.settings')
django.setup()

from apps.mining.models import MiningTier

TIERS = [
    {'tier_number': 1, 'name': 'Plan 1', 'price_usd': 0.00, 'earn_per_24h_usd': 1.00, 'duration_days': 100, 'withdrawal_fee_usd': 5.00},
    {'tier_number': 2, 'name': 'Plan 2', 'price_usd': 16.00, 'earn_per_24h_usd': 50.00, 'duration_days': 14, 'withdrawal_fee_usd': 10.00},
    {'tier_number': 3, 'name': 'Plan 3', 'price_usd': 69.99, 'earn_per_24h_usd': 130.00, 'duration_days': 14, 'withdrawal_fee_usd': 15.00},
    {'tier_number': 4, 'name': 'Plan 4', 'price_usd': 235.99, 'earn_per_24h_usd': 399.00, 'duration_days': 14, 'withdrawal_fee_usd': 20.00},
    {'tier_number': 5, 'name': 'Plan 5', 'price_usd': 699.99, 'earn_per_24h_usd': 699.00, 'duration_days': 30, 'withdrawal_fee_usd': 25.00},
]

def create_tiers():
    for td in TIERS:
        tier, created = MiningTier.objects.get_or_create(
            tier_number=td['tier_number'],
            defaults=td
        )
        if created:
            print(f"Created Tier {tier.tier_number}: {tier.name}")
        else:
            print(f"Tier {tier.tier_number} already exists.")

if __name__ == "__main__":
    create_tiers()
