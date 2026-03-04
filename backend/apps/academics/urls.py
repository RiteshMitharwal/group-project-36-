from django.urls import path
from .views import (
    AcademicListCreateView,
    AcademicDetailView,
    AcademicEligibleModulesView,
)

urlpatterns = [
    path("academics", AcademicListCreateView.as_view(), name="academic-list"),
    path("academics/<int:pk>", AcademicDetailView.as_view(), name="academic-detail"),
    path("academics/<int:pk>/eligible-modules", AcademicEligibleModulesView.as_view(), name="academic-eligible-modules"),
]
