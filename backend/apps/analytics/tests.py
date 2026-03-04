from decimal import Decimal

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.users.models import User
from apps.departments.models import Department
from apps.academics.models import Academic
from apps.years.models import AcademicYear
from apps.allocations.models import WorkloadAllocation


class AnalyticsPermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username="admin_test",
            password="admin123",
            role=User.Role.ADMIN,
        )
        self.academic_user = User.objects.create_user(
            username="acad_test",
            password="acad123",
            role=User.Role.ACADEMIC,
        )
        dept = Department.objects.create(name="Test Dept", code="T")
        self.academic_profile = Academic.objects.create(
            user=self.academic_user,
            full_name="Test Academic",
            email="acad@test.edu",
            department=dept,
            capacity_hours=1500,
        )
        self.year = AcademicYear.objects.create(label="2024/25", is_current=True, is_locked=False)

    def test_admin_can_access_admin_summary(self):
        self.client.force_authenticate(user=self.admin)
        r = self.client.get(f"/api/analytics/admin/summary?year={self.year.id}")
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_academic_cannot_access_admin_summary(self):
        self.client.force_authenticate(user=self.academic_user)
        r = self.client.get(f"/api/analytics/admin/summary?year={self.year.id}")
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_academic_can_access_my_workload(self):
        self.client.force_authenticate(user=self.academic_user)
        r = self.client.get(f"/api/academic/my-workload?year={self.year.id}")
        self.assertIn(r.status_code, (status.HTTP_200_OK, status.HTTP_404_NOT_FOUND))

    def test_academic_can_access_group_summary(self):
        self.client.force_authenticate(user=self.academic_user)
        r = self.client.get(f"/api/academic/group-summary?year={self.year.id}")
        self.assertEqual(r.status_code, status.HTTP_200_OK)


class AdminRiskTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username="admin_risk",
            password="admin123",
            role=User.Role.ADMIN,
        )
        dept1 = Department.objects.create(name="Dept1", code="D1")
        dept2 = Department.objects.create(name="Dept2", code="D2")
        self.ac1 = Academic.objects.create(
            full_name="Overloaded",
            email="over@test.edu",
            department=dept1,
            capacity_hours=1000,
        )
        self.ac2 = Academic.objects.create(
            full_name="Underloaded",
            email="under@test.edu",
            department=dept1,
            capacity_hours=1000,
        )
        self.ac3 = Academic.objects.create(
            full_name="Balanced",
            email="bal@test.edu",
            department=dept2,
            capacity_hours=1000,
        )
        self.year = AcademicYear.objects.create(label="2024/25", is_current=True, is_locked=False)
        WorkloadAllocation.objects.create(
            academic=self.ac1,
            academic_year=self.year,
            teaching_hours=Decimal("600"),
            research_hours=Decimal("500"),
            admin_hours=Decimal("100"),
        )
        WorkloadAllocation.objects.create(
            academic=self.ac2,
            academic_year=self.year,
            teaching_hours=Decimal("200"),
            research_hours=Decimal("200"),
            admin_hours=Decimal("100"),
        )
        WorkloadAllocation.objects.create(
            academic=self.ac3,
            academic_year=self.year,
            teaching_hours=Decimal("400"),
            research_hours=Decimal("400"),
            admin_hours=Decimal("200"),
        )

    def test_risk_returns_only_non_balanced(self):
        self.client.force_authenticate(user=self.admin)
        r = self.client.get(f"/api/analytics/admin/risk?year={self.year.id}")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        data = r.json()
        self.assertEqual(len(data), 2)
        names = {x["academic_name"] for x in data}
        self.assertEqual(names, {"Overloaded", "Underloaded"})

    def test_risk_includes_required_fields(self):
        self.client.force_authenticate(user=self.admin)
        r = self.client.get(f"/api/analytics/admin/risk?year={self.year.id}")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        row = next(x for x in r.json() if x["academic_name"] == "Overloaded")
        self.assertIn("teaching_hours", row)
        self.assertIn("research_hours", row)
        self.assertIn("admin_hours", row)
        self.assertEqual(row["total_hours"], 1200)
        self.assertEqual(row["capacity_hours"], 1000)
        self.assertIn("utilisation_pct", row)
        self.assertIn("difference", row)
        self.assertEqual(row["status"], "OVERLOADED")

    def test_risk_dept_filter(self):
        self.client.force_authenticate(user=self.admin)
        r = self.client.get(f"/api/analytics/admin/risk?year={self.year.id}&dept={self.ac1.department_id}")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        data = r.json()
        self.assertEqual(len(data), 2)
        for x in data:
            self.assertEqual(x["department"], "Dept1")


class AdminAcademicsBreakdownTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username="admin_breakdown",
            password="admin123",
            role=User.Role.ADMIN,
        )
        self.academic_user = User.objects.create_user(
            username="acad_breakdown",
            password="acad123",
            role=User.Role.ACADEMIC,
        )
        dept1 = Department.objects.create(name="Dept1", code="D1")
        dept2 = Department.objects.create(name="Dept2", code="D2")
        self.ac1 = Academic.objects.create(
            full_name="Alice",
            email="alice@test.edu",
            department=dept1,
            capacity_hours=1000,
        )
        self.ac2 = Academic.objects.create(
            full_name="Bob",
            email="bob@test.edu",
            department=dept1,
            capacity_hours=1000,
        )
        self.ac3 = Academic.objects.create(
            full_name="Carol",
            email="carol@test.edu",
            department=dept2,
            capacity_hours=1000,
        )
        self.year = AcademicYear.objects.create(label="2024/25", is_current=True, is_locked=False)
        WorkloadAllocation.objects.create(
            academic=self.ac1,
            academic_year=self.year,
            teaching_hours=Decimal("300"),
            research_hours=Decimal("400"),
            admin_hours=Decimal("300"),
        )
        WorkloadAllocation.objects.create(
            academic=self.ac2,
            academic_year=self.year,
            teaching_hours=Decimal("200"),
            research_hours=Decimal("300"),
            admin_hours=Decimal("200"),
        )
        WorkloadAllocation.objects.create(
            academic=self.ac3,
            academic_year=self.year,
            teaching_hours=Decimal("400"),
            research_hours=Decimal("400"),
            admin_hours=Decimal("200"),
        )

    def test_admin_can_access_and_gets_expected_fields(self):
        self.client.force_authenticate(user=self.admin)
        r = self.client.get(f"/api/analytics/admin/academics-breakdown?year={self.year.id}")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        data = r.json()
        self.assertEqual(len(data), 3)
        row = next(x for x in data if x["full_name"] == "Alice")
        self.assertEqual(row["academic_id"], self.ac1.id)
        self.assertEqual(row["department_name"], "Dept1")
        self.assertEqual(row["teaching_hours"], 300)
        self.assertEqual(row["research_hours"], 400)
        self.assertEqual(row["admin_hours"], 300)
        self.assertEqual(row["total_hours"], 1000)
        self.assertEqual(row["capacity_hours"], 1000)
        self.assertIn("utilisation_pct", row)
        self.assertIn("difference", row)
        self.assertIn("status", row)

    def test_academic_cannot_access(self):
        self.client.force_authenticate(user=self.academic_user)
        r = self.client.get(f"/api/analytics/admin/academics-breakdown?year={self.year.id}")
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_limit_works(self):
        self.client.force_authenticate(user=self.admin)
        r = self.client.get(f"/api/analytics/admin/academics-breakdown?year={self.year.id}&limit=2")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        data = r.json()
        self.assertEqual(len(data), 2)
        totals = sorted([x["total_hours"] for x in data], reverse=True)
        self.assertEqual(totals, [1000, 1000])

    def test_academic_ids_filter_works(self):
        self.client.force_authenticate(user=self.admin)
        ids = f"{self.ac3.id},{self.ac1.id}"
        r = self.client.get(f"/api/analytics/admin/academics-breakdown?year={self.year.id}&academic_ids={ids}")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        data = r.json()
        self.assertEqual(len(data), 2)
        self.assertEqual(data[0]["full_name"], "Carol")
        self.assertEqual(data[1]["full_name"], "Alice")
