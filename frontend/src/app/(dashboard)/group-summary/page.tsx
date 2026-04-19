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

  const chartData = (data?.peers ?? []).map((p, index) => ({
    name: p.is_you ? "You" : `Peer ${index + 1}`,
    teaching: p.teaching_hours,
    research: p.research_hours,
    admin: p.admin_hours,
    total: p.total_hours,
    status: p.status,
    is_you: p.is_you,
  }));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Group summary</h1>
      <p className="text-sm text-muted-foreground">
        Department workload comparison is anonymised. No individual names are shown.
      </p>

      {data && (
        <Card>
          <CardHeader>
            <CardTitle>{data.department_name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Department workload comparison
            </p>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex justify-end">
              {chartData.find((d) => d.is_you)?.status && (
                <span className="inline-flex rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
                  {chartData.find((d) => d.is_you)?.status}
                </span>
              )}
            </div>
            {chartData.length > 0 ? (
              <div className="h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                  >
                    <XAxis type="number" />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={80}
                      tick={({ x, y, payload }) => (
                        <text
                          x={x}
                          y={y + 4}
                          textAnchor="end"
                          fill={payload.value === "You" ? "#ffffff" : "#9ca3af"}
                          fontWeight={payload.value === "You" ? 700 : 400}
                        >
                          {payload.value}
                        </text>
                      )}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [`${value} hrs`, name]}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Legend />
                    <Bar dataKey="teaching" stackId="a" fill="#14b8a6" name="Teaching" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="research" stackId="a" fill="#3b82f6" name="Research" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="admin" stackId="a" fill="#f59e0b" name="Admin" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No allocation data for this year in your department.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
