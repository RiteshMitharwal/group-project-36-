from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.users.models import User
from apps.departments.models import Department
from .models import Module


class ModuleSearchOrderingTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username="admin_mod",
            password="admin123",
            role=User.Role.ADMIN,
        )
        dept = Department.objects.create(name="CS", code="CS")
        Module.objects.create(name="Finance Intro", code="FIN01", department=dept, credit_hours=15)
        Module.objects.create(name="Advanced Finance", code="FIN02", department=dept, credit_hours=20)
        Module.objects.create(name="Mathematics", code="MATH01", department=dept, credit_hours=10)

    def test_search_by_name(self):
        self.client.force_authenticate(user=self.admin)
        r = self.client.get("/api/modules?search=fin")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        results = r.json().get("results", [])
        self.assertEqual(len(results), 2)
        names = {m["name"] for m in results}
        self.assertEqual(names, {"Finance Intro", "Advanced Finance"})

    def test_search_by_code(self):
        self.client.force_authenticate(user=self.admin)
        r = self.client.get("/api/modules?search=MATH")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        results = r.json().get("results", [])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["code"], "MATH01")

    def test_ordering_by_name(self):
        self.client.force_authenticate(user=self.admin)
        r = self.client.get("/api/modules?ordering=name")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        results = r.json().get("results", [])
        names = [m["name"] for m in results]
        self.assertEqual(names, sorted(names))

    def test_ordering_by_credit_hours(self):
        self.client.force_authenticate(user=self.admin)
        r = self.client.get("/api/modules?ordering=credit_hours")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        results = r.json().get("results", [])
        hours = [m["credit_hours"] for m in results]
        self.assertEqual(hours, sorted(hours))
