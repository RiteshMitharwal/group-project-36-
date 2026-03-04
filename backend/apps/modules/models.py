from django.db import models

from apps.departments.models import Department
from apps.academics.models import Academic


class Module(models.Model):
    code = models.CharField(max_length=50, unique=True, blank=True, null=True)
    name = models.CharField(max_length=255)
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name="modules",
    )
    credit_hours = models.PositiveIntegerField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "modules_module"
        ordering = ["name"]

    def __str__(self):
        return self.name or self.code or str(self.pk)


class Eligibility(models.Model):
    academic = models.ForeignKey(
        Academic,
        on_delete=models.CASCADE,
        related_name="eligibilities",
    )
    module = models.ForeignKey(
        Module,
        on_delete=models.CASCADE,
        related_name="eligibilities",
    )

    class Meta:
        db_table = "modules_eligibility"
        unique_together = [["academic", "module"]]

    def __str__(self):
        return f"{self.academic} - {self.module}"
