import random
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.users.models import User
from apps.departments.models import Department
from apps.academics.models import Academic
from apps.modules.models import Module, Eligibility
from apps.years.models import AcademicYear
from apps.allocations.models import WorkloadAllocation


class Command(BaseCommand):
    help = "Seed workload data: 25 academics, 4 depts, 4 years, allocations. Admin: admin/admin123. Each academic gets login: username = full name, password = full name + 123."

    @transaction.atomic
    def handle(self, *args, **options):
        # Admin user
        admin_user, _ = User.objects.get_or_create(
            username="admin",
            defaults={"email": "admin@example.com", "role": User.Role.ADMIN, "is_staff": True, "is_superuser": True},
        )
        if not admin_user.check_password("admin123"):
            admin_user.set_password("admin123")
            admin_user.save()

        # Departments
        dept_names = [
            ("Computer Science", "CS"),
            ("Mathematics", "MATH"),
            ("Engineering", "ENG"),
            ("Business", "BUS"),
        ]
        departments = []
        for name, code in dept_names:
            d, _ = Department.objects.get_or_create(name=name, defaults={"code": code})
            departments.append(d)

        # Academic years
        year_labels = ["2022/23", "2023/24", "2024/25", "2025/26"]
        years = []
        for i, label in enumerate(year_labels):
            y, _ = AcademicYear.objects.get_or_create(
                label=label,
                defaults={"is_current": i == len(year_labels) - 1, "is_locked": label == "2022/23"},
            )
            years.append(y)

        # Academics (25): create first, then create a login for each (username = full name, password = full name + 123)
        first_names = ["Alex", "Jordan", "Sam", "Taylor", "Morgan", "Casey", "Riley", "Quinn", "Avery", "Parker"]
        last_names = ["Smith", "Jones", "Brown", "Wilson", "Lee", "Davis", "Clark", "Lewis", "Walker", "Hall"]
        academics = []
        for i in range(25):
            fn = random.choice(first_names)
            ln = random.choice(last_names)
            full_name = f"{fn} {ln}"
            email = f"academic{i+1}@university.edu"
            cap = random.choice([1400, 1500, 1600])
            ac, _ = Academic.objects.get_or_create(
                email=email,
                defaults={
                    "full_name": full_name,
                    "user": None,
                    "department": random.choice(departments),
                    "capacity_hours": cap,
                    "is_active": True,
                },
            )
            academics.append(ac)

        # Create a login for each academic: username = full name (unique), password = username + "123"
        for ac in academics:
            base_username = ac.full_name
            username = base_username
            suffix = 1
            while User.objects.filter(username=username).exists():
                suffix += 1
                username = f"{base_username} {suffix}"
            user, created = User.objects.get_or_create(
                username=username,
                defaults={"email": ac.email, "role": User.Role.ACADEMIC},
            )
            user.set_password(username + "123")
            user.save()
            ac.user = user
            ac.save(update_fields=["user"])

        # Modules per department
        modules = []
        for d in departments:
            for j in range(4):
                code = f"{d.code}0{j+1}"
                name = f"{d.name} Module {j+1}"
                m, _ = Module.objects.get_or_create(
                    code=code,
                    defaults={"name": name, "department": d, "credit_hours": 15, "is_active": True},
                )
                modules.append(m)

        # Eligibility: random academic-module pairs
        for _ in range(40):
            ac = random.choice(academics)
            mod = random.choice(modules)
            if mod.department_id == ac.department_id:
                Eligibility.objects.get_or_create(academic=ac, module=mod)

        # Allocations: random hours, some overload/underload
        for ac in academics:
            for yr in years:
                teaching = Decimal(random.randint(200, 700))
                research = Decimal(random.randint(200, 600))
                admin = Decimal(random.randint(50, 300))
                # Force a few overload/underload
                if ac.id % 7 == 0 and yr.id == years[-1].id:
                    teaching += Decimal(400)
                if ac.id % 11 == 0 and yr.id == years[-1].id:
                    teaching = Decimal(100)
                    research = Decimal(100)
                WorkloadAllocation.objects.get_or_create(
                    academic=ac,
                    academic_year=yr,
                    defaults={
                        "teaching_hours": teaching,
                        "research_hours": research,
                        "admin_hours": admin,
                        "notes": "",
                    },
                )

        self.stdout.write(
            self.style.SUCCESS(
                "Seed complete. Admin: admin/admin123. Academics: login with full name as username, password = name + 123 (e.g. Alex Wilson / Alex Wilson123)."
            )
        )
