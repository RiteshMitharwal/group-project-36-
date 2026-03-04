"""
Workload calculation services. No computed fields stored in DB.
"""
from __future__ import annotations

from decimal import Decimal
from typing import Literal

StatusType = Literal["OVERLOADED", "UNDERLOADED", "BALANCED"]


def calculate_total_hours(
    teaching_hours: Decimal,
    research_hours: Decimal,
    admin_hours: Decimal,
) -> Decimal:
    """Sum of teaching + research + admin hours."""
    return teaching_hours + research_hours + admin_hours


def calculate_utilisation(total_hours: Decimal, capacity_hours: int) -> float:
    """Utilisation as percentage: (total / capacity) * 100."""
    if capacity_hours == 0:
        return 0.0
    return float((total_hours / Decimal(capacity_hours)) * 100)


def calculate_difference(total_hours: Decimal, capacity_hours: int) -> Decimal:
    """Difference: total - capacity (positive = over, negative = under)."""
    return total_hours - Decimal(capacity_hours)


def calculate_status(
    total_hours: Decimal,
    capacity_hours: int,
    overload_threshold: float = 1.10,
    underload_threshold: float = 0.90,
) -> StatusType:
    """
    OVERLOADED if total > capacity * 1.10
    UNDERLOADED if total < capacity * 0.90
    BALANCED otherwise
    """
    if capacity_hours == 0:
        return "BALANCED"
    cap = Decimal(capacity_hours)
    if total_hours > cap * Decimal(str(overload_threshold)):
        return "OVERLOADED"
    if total_hours < cap * Decimal(str(underload_threshold)):
        return "UNDERLOADED"
    return "BALANCED"
