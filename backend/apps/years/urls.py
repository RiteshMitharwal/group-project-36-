from django.urls import path
from .views import YearListCreateView, YearDetailView

urlpatterns = [
    path("years", YearListCreateView.as_view(), name="year-list"),
    path("years/<int:pk>", YearDetailView.as_view(), name="year-detail"),
]
