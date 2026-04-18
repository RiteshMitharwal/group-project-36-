from django.urls import path
from .views import WorkloadAllocationListCreateView, WorkloadAllocationDetailView

urlpatterns = [
    path("allocations/", WorkloadAllocationListCreateView.as_view()),
    path("allocations/<int:pk>/", WorkloadAllocationDetailView.as_view()),
]
