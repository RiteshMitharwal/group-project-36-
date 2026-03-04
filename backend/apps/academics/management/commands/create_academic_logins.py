"""Create login accounts for academics that don't have one (e.g. added via UI)."""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.users.models import User
from apps.academics.models import Academic


class Command(BaseCommand):
    help = (
        "Create login for each academic who has no user. "
        "Username = full name, password = full name + '123' (e.g. Rithvik Jenn / Rithvik Jenn123)."
    )

    @transaction.atomic
    def handle(self, *args, **options):
        academics = Academic.objects.filter(user__isnull=True).select_related("department")
        if not academics.exists():
            self.stdout.write("No academics without a login found.")
            return
        for ac in academics:
            base_username = ac.full_name.strip()
            username = base_username
            suffix = 1
            while User.objects.filter(username=username).exists():
                suffix += 1
                username = f"{base_username} {suffix}"
            user = User.objects.create(
                username=username,
                email=ac.email,
                role=User.Role.ACADEMIC,
            )
            user.set_password(username + "123")
            user.save()
            ac.user = user
            ac.save(update_fields=["user"])
            self.stdout.write(self.style.SUCCESS(f"Login created for {ac.full_name}: username={username!r}, password={username!r}123"))
        self.stdout.write(self.style.SUCCESS(f"Done. {academics.count()} login(s) created."))
