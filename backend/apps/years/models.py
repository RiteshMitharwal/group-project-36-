from django.db import models, transaction


class AcademicYear(models.Model):
    label = models.CharField(max_length=50, unique=True)
    is_current = models.BooleanField(default=False)
    is_locked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "years_academicyear"
        ordering = ["-label"]

    def __str__(self):
        return self.label

    def save(self, *args, **kwargs):
        with transaction.atomic():
            if self.is_current:
                qs = AcademicYear.objects.filter(is_current=True)
                if self.pk:
                    qs = qs.exclude(pk=self.pk)
                qs.update(is_current=False)
            super().save(*args, **kwargs)
