"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { api, type AcademicYear } from "@/lib/api";

export function useYears() {
  const { token } = useAuth();
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [currentYearId, setCurrentYearIdState] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const setCurrentYearId = useCallback((id: number | null) => {
    setCurrentYearIdState(id);
    if (typeof window !== "undefined") {
      if (id != null) localStorage.setItem("workload_year", String(id));
      else localStorage.removeItem("workload_year");
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setYears([]);
      setLoading(false);
      return;
    }
    api.years.list(token).then(
      (data) => {
        const list = data.results || [];
        setYears(list);
        if (currentYearId === null && list.length > 0) {
          const stored = typeof window !== "undefined" ? localStorage.getItem("workload_year") : null;
          const current = list.find((y) => y.is_current);
          const id = stored ? Number(stored) : (current?.id ?? list[0]?.id);
          if (id && list.some((y) => y.id === id)) setCurrentYearIdState(id);
          else setCurrentYearIdState(list[0]?.id ?? null);
        }
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, [token]);

  return { years, currentYearId, setCurrentYearId, loading };
}
