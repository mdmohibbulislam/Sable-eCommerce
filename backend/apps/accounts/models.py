"""Custom user model authenticating by email address."""

import uuid

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    """Email-first user manager.

    Django's default manager assumes ``username`` is the login field. The
    storefront logs in with an email, so usernames are derived automatically
    and the manager signature is simplified to ``create_user(email, password)``.
    """

    use_in_migrations = True

    @staticmethod
    def _derive_username(email: str) -> str:
        local = email.split("@")[0][:20] or "user"
        return f"{local}-{uuid.uuid4().hex[:6]}"

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("An email address is required.")
        email = self.normalize_email(email).lower()
        extra_fields.setdefault("username", self._derive_username(email))
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if not extra_fields.get("is_staff") or not extra_fields.get("is_superuser"):
            raise ValueError("A superuser must have is_staff and is_superuser set to True.")
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    email = models.EmailField("email address", unique=True)
    phone = models.CharField(max_length=32, blank=True)
    marketing_opt_in = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []

    objects = UserManager()  # type: ignore[assignment]

    class Meta:
        ordering = ["-date_joined"]
        verbose_name = "user"
        verbose_name_plural = "users"

    @property
    def display_name(self) -> str:
        full = f"{self.first_name} {self.last_name}".strip()
        return full or self.username

    def __str__(self) -> str:
        return self.email or self.username
