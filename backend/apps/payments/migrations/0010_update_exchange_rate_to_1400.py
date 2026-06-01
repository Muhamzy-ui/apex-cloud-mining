"""
Data migration: Update existing ExchangeRate record from 1600 → 1400 NGN/USDT
"""
from django.db import migrations


def update_exchange_rate(apps, schema_editor):
    ExchangeRate = apps.get_model('payments', 'ExchangeRate')
    ExchangeRate.objects.filter(usd_to_ngn=1600).update(usd_to_ngn=1400)


def reverse_exchange_rate(apps, schema_editor):
    ExchangeRate = apps.get_model('payments', 'ExchangeRate')
    ExchangeRate.objects.filter(usd_to_ngn=1400).update(usd_to_ngn=1600)


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0009_paymentsettings_referral_bonus_usdt_and_more'),
    ]

    operations = [
        migrations.RunPython(update_exchange_rate, reverse_exchange_rate),
    ]
