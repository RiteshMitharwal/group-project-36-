from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import User
from .services import (
    get_admin_summary,
    get_admin_risk,
    get_admin_academics_breakdown,
    get_academic_my_workload,
    get_academic_history,
    get_academic_group_summary,
)


def _is_admin(user: User) -> bool:
    return user.role == User.Role.ADMIN


class AdminSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return Response({"detail": "Admin only."}, status=status.HTTP_403_FORBIDDEN)
        year = request.query_params.get("year")
        if not year:
            return Response({"detail": "year is required."}, status=status.HTTP_400_BAD_REQUEST)
        data = get_admin_summary(int(year))
        return Response(data)


class AdminRiskView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return Response({"detail": "Admin only."}, status=status.HTTP_403_FORBIDDEN)
        year = request.query_params.get("year")
        if not year:
            return Response({"detail": "year is required."}, status=status.HTTP_400_BAD_REQUEST)
        dept = request.query_params.get("dept")
        dept_id = int(dept) if dept else None
        data = get_admin_risk(int(year), dept_id=dept_id)
        return Response(data)


class AdminAcademicsBreakdownView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return Response({"detail": "Admin only."}, status=status.HTTP_403_FORBIDDEN)
        year = request.query_params.get("year")
        if not year:
            return Response({"detail": "year is required."}, status=status.HTTP_400_BAD_REQUEST)
        dept = request.query_params.get("dept")
        dept_id = int(dept) if dept else None
        academic_ids_param = request.query_params.get("academic_ids")
        academic_ids = None
        if academic_ids_param:
            try:
                academic_ids = [int(x.strip()) for x in academic_ids_param.split(",") if x.strip()]
            except ValueError:
                pass
        limit_param = request.query_params.get("limit")
        limit = int(limit_param) if limit_param else None
        data = get_admin_academics_breakdown(
            int(year),
            dept_id=dept_id,
            academic_ids=academic_ids,
            limit=limit,
        )
        return Response(data)


class AcademicMyWorkloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        year = request.query_params.get("year")
        if not year:
            return Response({"detail": "year is required."}, status=status.HTTP_400_BAD_REQUEST)
        data = get_academic_my_workload(request.user.id, int(year))
        if data is None:
            return Response({"detail": "Academic profile not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(data)


class AcademicHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = get_academic_history(request.user.id)
        return Response(data)


class AcademicGroupSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        year = request.query_params.get("year")
        if not year:
            return Response({"detail": "year is required."}, status=status.HTTP_400_BAD_REQUEST)
        data = get_academic_group_summary(request.user.id, int(year))
        if data is None:
            return Response({"detail": "Academic profile not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(data)
