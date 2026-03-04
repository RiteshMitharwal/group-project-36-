from django.urls import path

from .views import CustomTokenObtainPairView, CustomTokenRefreshView, MeView

urlpatterns = [
    path("login", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("refresh", CustomTokenRefreshView.as_view(), name="token_refresh"),
    path("me", MeView.as_view(), name="me"),
]
