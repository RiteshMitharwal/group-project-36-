"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useYearId } from "@/components/providers/YearProvider";
import { api, type GroupSummary } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function GroupSummaryPage() {
  const { token } = useAuth();
  const yearId = useYearId().yearId;
  const [data, setData] = useState<GroupSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !yearId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api.analytics.groupSummary(token, yearId)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [token, yearId]);

  if (!yearId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Group summary</h1>
        <p className="text-muted-foreground">Select an academic year in the header.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Group summary</h1>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Group summary</h1>
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  const chartData = data?.distribution
    ? [
        { name: "Under 90%", count: data.distribution.under_90 },
        { name: "90–110%", count: data.distribution["90_110"] },
        { name: "Over 110%", count: data.distribution.over_110 },
      ]
    : [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Group summary</h1>
      <p className="text-muted-foreground text-sm">
        Anonymised distribution for your department. No individual names are shown.
      </p>

      {data && (
        <Card>
          <CardHeader>
            <CardTitle>{data.department_name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Utilisation distribution (count of academics in each bucket)
            </p>
          </CardHeader>
          <CardContent>
            {chartData.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No allocation data for this year in your department.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
