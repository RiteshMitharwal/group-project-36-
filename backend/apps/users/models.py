from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        ACADEMIC = "ACADEMIC", "Academic"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.ACADEMIC)

    class Meta:
        db_table = "auth_user"
