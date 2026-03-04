from decimal import Decimal

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.users.models import User
from apps.departments.models import Department
from apps.academics.models import Academic
from apps.years.models import AcademicYear
from apps.allocations.models import WorkloadAllocation


class AllocationValidationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username="admin_val",
            password="admin123",
            role=User.Role.ADMIN,
        )
        dept = Department.objects.create(name="Dept", code="D")
        self.academic = Academic.objects.create(
            full_name="Ac",
            email="ac@val.edu",
            department=dept,
            capacity_hours=1500,
        )
        self.year = AcademicYear.objects.create(
            label="2024/25",
            is_current=True,
            is_locked=False,
        )

    def test_negative_hours_returns_400(self):
        self.client.force_authenticate(user=self.admin)
        r = self.client.post(
            "/api/allocations",
            data={
                "academic": self.academic.id,
                "academic_year": self.year.id,
                "teaching_hours": -10,
                "research_hours": 500,
                "admin_hours": 200,
            },
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("teaching", str(r.json()).lower())

    def test_duplicate_academic_year_returns_400(self):
        WorkloadAllocation.objects.create(
            academic=self.academic,
            academic_year=self.year,
            teaching_hours=Decimal("400"),
            research_hours=Decimal("400"),
            admin_hours=Decimal("200"),
        )
        self.client.force_authenticate(user=self.admin)
        r = self.client.post(
            "/api/allocations",
            data={
                "academic": self.academic.id,
                "academic_year": self.year.id,
                "teaching_hours": 100,
                "research_hours": 100,
                "admin_hours": 100,
            },
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        data_str = str(r.json()).lower()
        self.assertTrue(
            "allocation" in data_str or "already" in data_str or "unique" in data_str,
            msg=data_str,
        )
