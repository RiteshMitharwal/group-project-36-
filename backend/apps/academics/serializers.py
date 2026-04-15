from rest_framework import serializers

from apps.departments.serializers import DepartmentSerializer
from apps.users.models import User

from .models import Academic


class AcademicSerializer(serializers.ModelSerializer):
    department_detail = DepartmentSerializer(source="department", read_only=True)
    first_name = serializers.CharField(source="user.first_name", required=False)
    last_name = serializers.CharField(source="user.last_name", required=False)
    username = serializers.CharField(source="user.username", required=False)

    class Meta:
        model = Academic
        fields = [
            "id",
            "user",
            "first_name",
            "last_name",
            "username",
            "full_name",
            "email",
            "department",
            "department_detail",
            "capacity_hours",
            "is_active",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            "user": {"read_only": True},
            "full_name": {"read_only": True},
        }

    def validate_username(self, value):
        username = value.strip()
        if not username:
            raise serializers.ValidationError("Username is required.")

        qs = User.objects.filter(username__iexact=username)
        if self.instance and self.instance.user_id:
            qs = qs.exclude(pk=self.instance.user_id)

        if qs.exists():
            raise serializers.ValidationError("Username already exists. Try another one.")

        return username

    def validate_email(self, value):
        email = value.strip()

        qs = User.objects.filter(email__iexact=email)
        if self.instance and self.instance.user_id:
            qs = qs.exclude(pk=self.instance.user_id)

        if qs.exists():
            raise serializers.ValidationError("A user with this email already exists.")

        return email

    def validate(self, attrs):
        user_data = attrs.get("user", {})
        current_user = self.instance.user if self.instance and self.instance.user else None

        first_name = (
            user_data.get("first_name")
            if "first_name" in user_data
            else (current_user.first_name if current_user else "")
        )
        last_name = (
            user_data.get("last_name")
            if "last_name" in user_data
            else (current_user.last_name if current_user else "")
        )
        username = (
            user_data.get("username")
            if "username" in user_data
            else (current_user.username if current_user else "")
        )

        first_name = (first_name or "").strip()
        last_name = (last_name or "").strip()
        username = (username or "").strip()

        errors = {}
        if not first_name:
            errors["first_name"] = "First name is required."
        if not last_name:
            errors["last_name"] = "Last name is required."
        if not username:
            errors["username"] = "Username is required."

        if errors:
            raise serializers.ValidationError(errors)

        return attrs

    def _build_full_name(self, first_name: str, last_name: str) -> str:
        return f"{first_name.strip()} {last_name.strip()}".strip()

    def create(self, validated_data):
        user_data = validated_data.pop("user", {})
        first_name = user_data["first_name"].strip()
        last_name = user_data["last_name"].strip()
        username = user_data["username"].strip()
        email = validated_data["email"].strip()
        full_name = self._build_full_name(first_name, last_name)

        user = User(
            username=username,
            first_name=first_name,
            last_name=last_name,
            email=email,
            role=User.Role.ACADEMIC,
        )

        if hasattr(user, "is_email_verified"):
            user.is_email_verified = False
        if hasattr(user, "must_verify_email"):
            user.must_verify_email = True

        user.set_password(username + "123")
        user.save()

        validated_data["user"] = user
        validated_data["full_name"] = full_name
        validated_data["email"] = email

        return super().create(validated_data)

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        email = validated_data.get("email", instance.email).strip()

        user = instance.user or User(role=User.Role.ACADEMIC)
        is_new_user = user.pk is None

        first_name = (user_data.get("first_name", user.first_name or "")).strip()
        last_name = (user_data.get("last_name", user.last_name or "")).strip()
        username = (user_data.get("username", user.username or "")).strip()
        full_name = self._build_full_name(first_name, last_name)

        user.first_name = first_name
        user.last_name = last_name
        user.username = username
        user.email = email
        user.role = User.Role.ACADEMIC

        if is_new_user:
            if hasattr(user, "is_email_verified"):
                user.is_email_verified = False
            if hasattr(user, "must_verify_email"):
                user.must_verify_email = True
            user.set_password(username + "123")

        user.save()

        validated_data["user"] = user
        validated_data["full_name"] = full_name
        validated_data["email"] = email

        return super().update(instance, validated_data)