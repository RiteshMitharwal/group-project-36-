from django.urls import path
from .views import AllocationListCreateView, AllocationDetailView

urlpatterns = [
    path("allocations", AllocationListCreateView.as_view(), name="allocation-list"),
    path("allocations/<int:pk>", AllocationDetailView.as_view(), name="allocation-detail"),
]
