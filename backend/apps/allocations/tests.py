from decimal import Decimal

import pytest
from django.test import TestCase

from apps.allocations.services import (
    calculate_total_hours,
    calculate_utilisation,
    calculate_difference,
    calculate_status,
)


class TestWorkloadCalculations:
    def test_calculate_total_hours(self):
        assert calculate_total_hours(Decimal("100"), Decimal("200"), Decimal("50")) == Decimal("350")
        assert calculate_total_hours(Decimal("0"), Decimal("0"), Decimal("0")) == Decimal("0")

    def test_calculate_utilisation(self):
        assert calculate_utilisation(Decimal("1500"), 1500) == 100.0
        assert calculate_utilisation(Decimal("750"), 1500) == 50.0
        assert calculate_utilisation(Decimal("0"), 1500) == 0.0

    def test_calculate_utilisation_zero_capacity(self):
        assert calculate_utilisation(Decimal("100"), 0) == 0.0

    def test_calculate_difference(self):
        assert calculate_difference(Decimal("1600"), 1500) == Decimal("100")
        assert calculate_difference(Decimal("1400"), 1500) == Decimal("-100")

    def test_calculate_status_balanced(self):
        assert calculate_status(Decimal("1500"), 1500) == "BALANCED"
        assert calculate_status(Decimal("1350"), 1500) == "BALANCED"  # 90%
        assert calculate_status(Decimal("1650"), 1500) == "BALANCED"   # 110%

    def test_calculate_status_overloaded(self):
        # > 110% of capacity
        assert calculate_status(Decimal("1651"), 1500) == "OVERLOADED"
        assert calculate_status(Decimal("2000"), 1500) == "OVERLOADED"

    def test_calculate_status_underloaded(self):
        # < 90% of capacity
        assert calculate_status(Decimal("1349"), 1500) == "UNDERLOADED"
        assert calculate_status(Decimal("0"), 1500) == "UNDERLOADED"

    def test_calculate_status_boundary_90(self):
        assert calculate_status(Decimal("1350"), 1500) == "BALANCED"
        assert calculate_status(Decimal("1349.99"), 1500) == "UNDERLOADED"

    def test_calculate_status_boundary_110(self):
        assert calculate_status(Decimal("1650"), 1500) == "BALANCED"
        assert calculate_status(Decimal("1650.01"), 1500) == "OVERLOADED"

    def test_calculate_status_zero_capacity(self):
        assert calculate_status(Decimal("100"), 0) == "BALANCED"
