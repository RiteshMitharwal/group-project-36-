from rest_framework import serializers
from apps.academics.serializers import AcademicSerializer
from apps.years.serializers import AcademicYearSerializer
from .models import WorkloadAllocation
from .services import (
    calculate_total_hours,
    calculate_utilisation,
    calculate_difference,
    calculate_status,
)


class WorkloadAllocationSerializer(serializers.ModelSerializer):
    academic_detail = AcademicSerializer(source="academic", read_only=True)
    academic_year_detail = AcademicYearSerializer(source="academic_year", read_only=True)
    total_hours = serializers.SerializerMethodField()
    utilisation = serializers.SerializerMethodField()
    difference = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    created_by_username = serializers.SerializerMethodField()

    class Meta:
        model = WorkloadAllocation
        fields = [
            "id",
            "academic",
            "academic_detail",
            "academic_year",
            "academic_year_detail",
            "teaching_hours",
            "research_hours",
            "admin_hours",
            "notes",
            "total_hours",
            "utilisation",
            "difference",
            "status",
            "created_by_username",
            "created_at",
            "updated_at",
        ]

    def get_created_by_username(self, obj):
        return obj.created_by.username if obj.created_by_id else None

    def get_total_hours(self, obj):
        return calculate_total_hours(
            obj.teaching_hours,
            obj.research_hours,
            obj.admin_hours,
        )

    def get_utilisation(self, obj):
        total = calculate_total_hours(
            obj.teaching_hours,
            obj.research_hours,
            obj.admin_hours,
        )
        return round(
            calculate_utilisation(total, obj.academic.capacity_hours),
            2,
        )

    def get_difference(self, obj):
        total = calculate_total_hours(
            obj.teaching_hours,
            obj.research_hours,
            obj.admin_hours,
        )
        return float(calculate_difference(total, obj.academic.capacity_hours))

    def get_status(self, obj):
        total = calculate_total_hours(
            obj.teaching_hours,
            obj.research_hours,
            obj.admin_hours,
        )
        return calculate_status(total, obj.academic.capacity_hours)


class WorkloadAllocationWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkloadAllocation
        fields = [
            "id",
            "academic",
            "academic_year",
            "teaching_hours",
            "research_hours",
            "admin_hours",
            "notes",
        ]

    def validate_teaching_hours(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Teaching hours cannot be negative.")
        return value

    def validate_research_hours(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Research hours cannot be negative.")
        return value

    def validate_admin_hours(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Admin hours cannot be negative.")
        return value

    def validate(self, attrs):
        academic = attrs.get("academic")
        academic_year = attrs.get("academic_year")
        if academic and academic_year:
            if WorkloadAllocation.objects.filter(
                academic=academic, academic_year=academic_year
            ).exclude(pk=self.instance.pk if self.instance else None).exists():
                raise serializers.ValidationError(
                    "An allocation already exists for this academic and year."
                )
        return attrs
