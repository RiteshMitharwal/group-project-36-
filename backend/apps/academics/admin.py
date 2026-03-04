from django.contrib import admin
from .models import Academic


@admin.register(Academic)
class AcademicAdmin(admin.ModelAdmin):
    list_display = ["full_name", "email", "department", "capacity_hours", "is_active"]
    list_filter = ["department", "is_active"]
