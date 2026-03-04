"""
Apex Mining - User Admin (RBAC: Super Admin vs Junior Admin)

Role hierarchy:
  - Super Admin (is_superuser=True): Full control, approves/rejects admins.
  - Junior Admin (is_admin=True, is_superuser=False): Operational control over
    deposits/withdrawals. Cannot access global settings or manage other admins.
  - Agent (is_agent=True): Access restricted to their own referral downline.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.db import models
from django.contrib import messages
from .models import User, Notification


# ─────────────────────────────────────────────────────────────────────────────
# Pending Admin Applications (Super Admin Only view)
# ─────────────────────────────────────────────────────────────────────────────
class PendingAdminProxy(User):
    """Proxy model so we can register a dedicated admin section for pending applications."""
    class Meta:
        proxy = True
        verbose_name = 'Pending Admin Application'
        verbose_name_plural = '⚠️ Pending Admin Applications'


@admin.register(PendingAdminProxy)
class PendingAdminApplicationAdmin(admin.ModelAdmin):
    """Super Admin only: Approve or reject Junior Admin applications."""
    list_display = ['email', 'full_name', 'date_joined', 'admin_status']
    list_filter = ['admin_status']
    search_fields = ['email', 'full_name']
    actions = ['approve_admins', 'reject_admins']
    readonly_fields = ['email', 'full_name', 'date_joined', 'referral_code']
    ordering = ['-date_joined']

    fieldsets = (
        ('Applicant Info', {'fields': ('email', 'full_name', 'date_joined', 'referral_code')}),
        ('Admin Application', {'fields': ('admin_status',)}),
    )

    def get_queryset(self, request):
        # Only Super Admins can view this section
        if not request.user.is_superuser:
            return super().get_queryset(request).none()
        return super().get_queryset(request).filter(
            admin_status__in=['pending', 'approved', 'rejected']
        )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_module_perms(self, request):
        return request.user.is_superuser

    def approve_admins(self, request, queryset):
        """Approve selected admin applications and grant Junior Admin access."""
        if not request.user.is_superuser:
            self.message_user(request, '⛔ Only Super Admins can approve.', level=messages.ERROR)
            return
        updated = 0
        for user in queryset.filter(admin_status='pending'):
            user.admin_status = 'approved'
            user.is_admin = True
            user.is_staff = True
            user.save()
            # Notify the user
            Notification.objects.create(
                user=user,
                type='system',
                title='✅ Admin Access Granted!',
                message='Your admin application has been approved. You can now log into the admin panel.',
                icon='✅',
            )
            updated += 1
        self.message_user(request, f'✅ {updated} admin(s) approved.', level=messages.SUCCESS)
    approve_admins.short_description = '✅ Approve selected admin applications'

    def reject_admins(self, request, queryset):
        """Reject selected admin applications."""
        if not request.user.is_superuser:
            self.message_user(request, '⛔ Only Super Admins can reject.', level=messages.ERROR)
            return
        updated = 0
        for user in queryset.filter(admin_status='pending'):
            user.admin_status = 'rejected'
            user.is_admin = False
            user.is_staff = False
            user.save()
            Notification.objects.create(
                user=user,
                type='system',
                title='❌ Admin Application Rejected',
                message='Your admin application was rejected. Please contact support.',
                icon='❌',
            )
            updated += 1
        self.message_user(request, f'❌ {updated} application(s) rejected.', level=messages.WARNING)
    reject_admins.short_description = '❌ Reject selected admin applications'

    def save_model(self, request, obj, form, change):
        """Auto-wire permissions on manual status change via edit page."""
        if not request.user.is_superuser:
            self.message_user(request, '⛔ Only Super Admins can modify admin status.', level=messages.ERROR)
            return
        if 'admin_status' in form.changed_data:
            if obj.admin_status == 'approved':
                obj.is_admin = True
                obj.is_staff = True
                Notification.objects.create(
                    user=obj,
                    type='system',
                    title='✅ Admin Access Granted!',
                    message='Your admin application has been approved.',
                    icon='✅',
                )
            elif obj.admin_status == 'rejected':
                obj.is_admin = False
                obj.is_staff = obj.is_agent  # Keep staff if still agent
                Notification.objects.create(
                    user=obj,
                    type='system',
                    title='❌ Admin Application Rejected',
                    message='Your admin application was rejected.',
                    icon='❌',
                )
        super().save_model(request, obj, form, change)


# ─────────────────────────────────────────────────────────────────────────────
# Main User Admin
# ─────────────────────────────────────────────────────────────────────────────
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'full_name', 'tier', 'balance_usdt', 'is_admin', 'is_agent', 'admin_status', 'date_joined']
    list_filter = ['tier', 'is_admin', 'is_agent', 'is_verified', 'admin_status', 'country']
    search_fields = ['email', 'full_name', 'phone', 'referral_code']
    ordering = ['-date_joined']

    # Super Admin sees everything
    SUPER_ADMIN_FIELDSETS = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('full_name', 'phone', 'country', 'avatar')}),
        ('Mining', {'fields': ('tier', 'tier_expiry', 'balance_usdt', 'balance_ngn', 'total_earned', 'trc20_wallet')}),
        ('Referral', {'fields': ('referral_code', 'referred_by')}),
        ('Agent Info', {'fields': ('is_agent', 'agent_wallet_usdt', 'agent_bank_name', 'agent_account_name', 'agent_account_number', 'agent_commission_percent')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_admin', 'is_verified', 'is_superuser')}),
        ('Admin Application', {'fields': ('admin_status',)}),
    )

    # Junior Admin sees limited, operational-relevant fields only
    JUNIOR_ADMIN_FIELDSETS = (
        (None, {'fields': ('email',)}),
        ('Personal Info', {'fields': ('full_name', 'phone', 'country')}),
        ('Mining', {'fields': ('tier', 'balance_usdt', 'total_earned')}),
        ('Referral', {'fields': ('referral_code', 'referred_by')}),
        ('Account Status', {'fields': ('is_active', 'is_verified', 'withdrawal_fee_paid')}),
    )

    add_fieldsets = (
        (None, {'fields': ('email', 'password1', 'password2')}),
    )

    def get_fieldsets(self, request, obj=None):
        if request.user.is_superuser:
            return self.SUPER_ADMIN_FIELDSETS
        return self.JUNIOR_ADMIN_FIELDSETS

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser or request.user.is_admin:
            return qs
        if request.user.is_agent:
            return qs.filter(models.Q(id=request.user.id) | models.Q(referred_by=request.user))
        return qs.none()

    def get_readonly_fields(self, request, obj=None):
        readonly = list(super().get_readonly_fields(request, obj) or [])
        if not request.user.is_superuser:
            # Junior Admins can't touch any permission flags or financial balances
            readonly.extend([
                'is_staff', 'is_superuser', 'is_admin', 'is_agent',
                'admin_status', 'balance_usdt', 'balance_ngn', 'total_earned',
                'referral_code', 'referred_by', 'agent_commission_percent',
            ])
        return readonly

    def has_delete_permission(self, request, obj=None):
        # Only Super Admins can delete users
        return request.user.is_superuser

    def has_add_permission(self, request):
        # Only Super Admins can manually create users via admin
        return request.user.is_superuser


# ─────────────────────────────────────────────────────────────────────────────
# Notifications
# ─────────────────────────────────────────────────────────────────────────────
@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user_email', 'type', 'title', 'is_read', 'created_at']
    list_filter = ['type', 'is_read', 'created_at']
    search_fields = ['user__email', 'title', 'message']
    readonly_fields = ['user', 'type', 'title', 'message', 'icon', 'created_at']
    ordering = ['-created_at']

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User'

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser