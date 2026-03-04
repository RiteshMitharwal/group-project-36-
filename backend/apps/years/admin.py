from django.contrib import admin
from .models import AcademicYear


@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    list_display = ["label", "is_current", "is_locked", "created_at"]
