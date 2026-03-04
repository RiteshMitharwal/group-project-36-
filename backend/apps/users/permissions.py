from rest_framework.permissions import BasePermission

from .models import User


class IsAdminRole(BasePermission):
    """Only users with role ADMIN can access."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == User.Role.ADMIN
        )
