from decimal import Decimal

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.users.models import User
from apps.departments.models import Department
from apps.academics.models import Academic
from apps.years.models import AcademicYear
from apps.allocations.models import WorkloadAllocation


class LockedYearTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username="admin_lock",
            password="admin123",
            role=User.Role.ADMIN,
        )
        dept = Department.objects.create(name="Dept", code="D")
        self.academic = Academic.objects.create(
            full_name="Ac",
            email="ac@lock.edu",
            department=dept,
            capacity_hours=1500,
        )
        self.locked_year = AcademicYear.objects.create(
            label="2020/21",
            is_current=False,
            is_locked=True,
        )
        self.open_year = AcademicYear.objects.create(
            label="2024/25",
            is_current=True,
            is_locked=False,
        )

    def test_cannot_create_allocation_for_locked_year(self):
        self.client.force_authenticate(user=self.admin)
        r = self.client.post(
            "/api/allocations",
            data={
                "academic": self.academic.id,
                "academic_year": self.locked_year.id,
                "teaching_hours": 500,
                "research_hours": 500,
                "admin_hours": 200,
            },
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_423_LOCKED)
        self.assertIn("locked", r.json().get("detail", "").lower())

    def test_can_create_allocation_for_open_year(self):
        self.client.force_authenticate(user=self.admin)
        r = self.client.post(
            "/api/allocations",
            data={
                "academic": self.academic.id,
                "academic_year": self.open_year.id,
                "teaching_hours": 500,
                "research_hours": 500,
                "admin_hours": 200,
            },
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)

    def test_cannot_update_allocation_for_locked_year(self):
        alloc = WorkloadAllocation.objects.create(
            academic=self.academic,
            academic_year=self.locked_year,
            teaching_hours=Decimal("400"),
            research_hours=Decimal("400"),
            admin_hours=Decimal("200"),
        )
        self.client.force_authenticate(user=self.admin)
        r = self.client.patch(
            f"/api/allocations/{alloc.id}",
            data={"teaching_hours": 600},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_423_LOCKED)

    def test_cannot_delete_allocation_for_locked_year(self):
        alloc = WorkloadAllocation.objects.create(
            academic=self.academic,
            academic_year=self.locked_year,
            teaching_hours=Decimal("400"),
            research_hours=Decimal("400"),
            admin_hours=Decimal("200"),
        )
        self.client.force_authenticate(user=self.admin)
        r = self.client.delete(f"/api/allocations/{alloc.id}")
        self.assertEqual(r.status_code, status.HTTP_423_LOCKED)

    def test_can_view_allocations_for_locked_year(self):
        WorkloadAllocation.objects.create(
            academic=self.academic,
            academic_year=self.locked_year,
            teaching_hours=Decimal("400"),
            research_hours=Decimal("400"),
            admin_hours=Decimal("200"),
        )
        self.client.force_authenticate(user=self.admin)
        r = self.client.get(f"/api/allocations?year={self.locked_year.id}")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(len(r.json().get("results", r.json())), 1)
