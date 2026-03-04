from django.urls import path
from .views import (
    AdminSummaryView,
    AdminRiskView,
    AdminAcademicsBreakdownView,
    AcademicMyWorkloadView,
    AcademicHistoryView,
    AcademicGroupSummaryView,
)

urlpatterns = [
    path("analytics/admin/summary", AdminSummaryView.as_view(), name="admin-summary"),
    path("analytics/admin/risk", AdminRiskView.as_view(), name="admin-risk"),
    path("analytics/admin/academics-breakdown", AdminAcademicsBreakdownView.as_view(), name="admin-academics-breakdown"),
    path("academic/my-workload", AcademicMyWorkloadView.as_view(), name="academic-my-workload"),
    path("academic/history", AcademicHistoryView.as_view(), name="academic-history"),
    path("academic/group-summary", AcademicGroupSummaryView.as_view(), name="academic-group-summary"),
]
