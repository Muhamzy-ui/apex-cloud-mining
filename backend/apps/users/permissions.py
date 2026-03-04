"""
Apex Mining — Custom DRF Permission Classes (Production RBAC)

Usage in views:
    from apps.users.permissions import IsSuperAdmin, IsJuniorAdminOrAbove

@api_view(['POST'])
@permission_classes([IsSuperAdmin])
def approve_admin(request): ...

What happens on unauthorized access:
    - Returns HTTP 403 with a structured JSON error
    - Response includes 'role_required' so frontend can redirect accordingly
    - Deactivated admins are caught by IsActiveAdmin and receive HTTP 403
"""
from rest_framework.permissions import BasePermission
from rest_framework.exceptions import PermissionDenied


def _get_client_ip(request):
    """Extract real IP respecting proxy headers."""
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


class IsSuperAdmin(BasePermission):
    """Only is_superuser=True users may access this endpoint."""
    message = {
        'detail': '⛔ Super Admin access required.',
        'code': 'super_admin_required',
        'role_required': 'super_admin',
    }

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if not request.user.is_active:
            raise PermissionDenied({
                'detail': '🚫 Your account has been deactivated.',
                'code': 'account_deactivated',
            })
        return bool(request.user.is_superuser)


class IsJuniorAdminOrAbove(BasePermission):
    """is_admin=True OR is_superuser=True. Blocks deactivated accounts."""
    message = {
        'detail': '⛔ Admin access required.',
        'code': 'admin_required',
        'role_required': 'junior_admin',
    }

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if not request.user.is_active:
            raise PermissionDenied({
                'detail': '🚫 Your account has been deactivated. Contact support.',
                'code': 'account_deactivated',
            })
        return bool(request.user.is_admin or request.user.is_superuser)


class IsAgentOrAbove(BasePermission):
    """is_agent, is_admin, or is_superuser."""
    message = {
        'detail': '⛔ Agent or Admin access required.',
        'code': 'agent_required',
    }

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if not request.user.is_active:
            raise PermissionDenied({'detail': '🚫 Account deactivated.', 'code': 'account_deactivated'})
        return bool(request.user.is_agent or request.user.is_admin or request.user.is_superuser)


class CannotModifyOtherAdmins(BasePermission):
    """Ensures a Junior Admin cannot perform actions on other Admin/Superuser accounts."""
    message = {
        'detail': '⛔ Junior Admins cannot modify other admin accounts.',
        'code': 'insufficient_role',
    }

    def has_object_permission(self, request, view, obj):
        # Super Admin can do anything
        if request.user.is_superuser:
            return True
        # Junior Admin cannot touch other admins or superusers
        if hasattr(obj, 'is_admin') and (obj.is_admin or obj.is_superuser):
            return False
        return True
