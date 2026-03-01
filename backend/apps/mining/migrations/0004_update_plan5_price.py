# Generated manually - Update Plan 5 price_usd to 699.99

from django.db import migrations

def update_plan5_price(apps, schema_editor):
    MiningTier = apps.get_model('mining', 'MiningTier')
    MiningTier.objects.filter(tier_number=5).update(
        price_usd=699.99,
        earn_per_24h_usd=699.00,
    )

def reverse_update_plan5_price(apps, schema_editor):
    MiningTier = apps.get_model('mining', 'MiningTier')
    MiningTier.objects.filter(tier_number=5).update(
        price_usd=435.99,
        earn_per_24h_usd=699.00,
    )

class Migration(migrations.Migration):

    dependencies = [
        ('mining', '0003_seed_mining_tiers'),
    ]

    operations = [
        migrations.RunPython(update_plan5_price, reverse_update_plan5_price),
    ]
