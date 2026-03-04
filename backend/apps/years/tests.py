from django.test import TestCase
from .models import AcademicYear


class SingleCurrentYearTests(TestCase):
    def test_only_one_year_can_be_current(self):
        y1 = AcademicYear.objects.create(label="2023/24", is_current=True)
        self.assertTrue(y1.is_current)
        y2 = AcademicYear.objects.create(label="2024/25", is_current=True)
        y1.refresh_from_db()
        self.assertFalse(y1.is_current)
        self.assertTrue(y2.is_current)

    def test_setting_existing_year_current_unsets_others(self):
        y1 = AcademicYear.objects.create(label="2023/24", is_current=True)
        y2 = AcademicYear.objects.create(label="2024/25", is_current=False)
        y2.is_current = True
        y2.save()
        y1.refresh_from_db()
        self.assertFalse(y1.is_current)
        self.assertTrue(AcademicYear.objects.get(pk=y2.pk).is_current)
