from rest_framework import status
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.response import Response
from apps.users.permissions import IsAdminRole

from apps.years.models import AcademicYear
from .models import WorkloadAllocation
from .serializers import WorkloadAllocationSerializer, WorkloadAllocationWriteSerializer

LOCKED_MESSAGE = "This academic year is locked. Viewing only."


def allocation_year_locked_response():
    return Response({"detail": LOCKED_MESSAGE}, status=status.HTTP_423_LOCKED)


def is_year_locked(academic_year_id: int) -> bool:
    try:
        return AcademicYear.objects.get(pk=academic_year_id).is_locked
    except AcademicYear.DoesNotExist:
        return False


class AllocationListCreateView(ListCreateAPIView):
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        qs = WorkloadAllocation.objects.select_related(
            "academic",
            "academic__department",
            "academic_year",
            "created_by",
        ).all()
        year = self.request.query_params.get("year")
        dept = self.request.query_params.get("dept")
        academic = self.request.query_params.get("academic")
        if year:
            qs = qs.filter(academic_year_id=year)
        if dept:
            qs = qs.filter(academic__department_id=dept)
        if academic:
            qs = qs.filter(academic_id=academic)
        return qs

    def get_serializer_class(self):
        if self.request.method == "POST":
            return WorkloadAllocationWriteSerializer
        return WorkloadAllocationSerializer

    def create(self, request, *args, **kwargs):
        academic_year_id = request.data.get("academic_year")
        if academic_year_id and is_year_locked(academic_year_id):
            return allocation_year_locked_response()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save(created_by=request.user)
        read_serializer = WorkloadAllocationSerializer(instance)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)


class AllocationDetailView(RetrieveUpdateDestroyAPIView):
    queryset = WorkloadAllocation.objects.select_related(
        "academic",
        "academic__department",
        "academic_year",
        "created_by",
    )
    permission_classes = [IsAdminRole]

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return WorkloadAllocationWriteSerializer
        return WorkloadAllocationSerializer

    def update(self, request, *args, **kwargs):
        obj = self.get_object()
        if obj.academic_year.is_locked:
            return allocation_year_locked_response()
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        if obj.academic_year.is_locked:
            return allocation_year_locked_response()
        return super().destroy(request, *args, **kwargs)
