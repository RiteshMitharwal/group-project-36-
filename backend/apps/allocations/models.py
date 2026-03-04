from decimal import Decimal

from django.conf import settings
from django.db import models

from apps.academics.models import Academic
from apps.years.models import AcademicYear


class WorkloadAllocation(models.Model):
    academic = models.ForeignKey(
        Academic,
        on_delete=models.CASCADE,
        related_name="workload_allocations",
    )
    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.CASCADE,
        related_name="workload_allocations",
    )
    teaching_hours = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))
    research_hours = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))
    admin_hours = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_allocations",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "allocations_workloadallocation"
        unique_together = [["academic", "academic_year"]]
        ordering = ["academic_year", "academic"]
        constraints = [
            models.CheckConstraint(
                check=models.Q(teaching_hours__gte=0)
                & models.Q(research_hours__gte=0)
                & models.Q(admin_hours__gte=0),
                name="allocations_hours_non_negative",
            )
        ]

    def __str__(self):
        return f"{self.academic} - {self.academic_year}"
