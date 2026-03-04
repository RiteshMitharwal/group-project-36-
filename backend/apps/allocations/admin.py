from django.contrib import admin
from .models import WorkloadAllocation


@admin.register(WorkloadAllocation)
class WorkloadAllocationAdmin(admin.ModelAdmin):
    list_display = ["academic", "academic_year", "teaching_hours", "research_hours", "admin_hours"]
