from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include

def health(_request):
    return JsonResponse({"status": "ok"})

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health", health),
    path("api/auth/", include("apps.users.urls")),
    path("api/", include("apps.departments.urls")),
    path("api/", include("apps.academics.urls")),
    path("api/", include("apps.modules.urls")),
    path("api/", include("apps.years.urls")),
    path("api/", include("apps.allocations.urls")),
    path("api/", include("apps.analytics.urls")),
]
