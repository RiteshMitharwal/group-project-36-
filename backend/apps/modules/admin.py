from django.contrib import admin
from .models import Module, Eligibility


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "department", "credit_hours", "is_active"]


@admin.register(Eligibility)
class EligibilityAdmin(admin.ModelAdmin):
    list_display = ["academic", "module"]
