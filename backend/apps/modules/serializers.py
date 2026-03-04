from rest_framework import serializers
from apps.departments.serializers import DepartmentSerializer
from apps.academics.serializers import AcademicSerializer
from .models import Module, Eligibility


class ModuleSerializer(serializers.ModelSerializer):
    department_detail = DepartmentSerializer(source="department", read_only=True)

    class Meta:
        model = Module
        fields = [
            "id",
            "code",
            "name",
            "department",
            "department_detail",
            "credit_hours",
            "is_active",
            "created_at",
            "updated_at",
        ]


class EligibilitySerializer(serializers.ModelSerializer):
    academic_detail = AcademicSerializer(source="academic", read_only=True)
    module_detail = ModuleSerializer(source="module", read_only=True)

    class Meta:
        model = Eligibility
        fields = ["id", "academic", "academic_detail", "module", "module_detail"]

    def validate(self, attrs):
        academic = attrs.get("academic")
        module = attrs.get("module")
        if not academic.is_active:
            raise serializers.ValidationError(
                {"academic": "Academic must be active to be assigned eligibility."}
            )
        if not module.is_active:
            raise serializers.ValidationError(
                {"module": "Module must be active to be assigned in eligibility."}
            )
        if academic.department_id != module.department_id:
            raise serializers.ValidationError(
                "Academic and module must belong to the same department."
            )
        return attrs
