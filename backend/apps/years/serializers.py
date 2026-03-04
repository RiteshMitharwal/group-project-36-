from rest_framework import serializers
from .models import AcademicYear


class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = ["id", "label", "is_current", "is_locked", "created_at", "updated_at"]
