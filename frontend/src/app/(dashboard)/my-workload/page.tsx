"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useYearId } from "@/components/providers/YearProvider";
import { api, type MyWorkload } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(142 76% 36%)", "hsl(217 33% 40%)"];

export default function MyWorkloadPage() {
  const { token } = useAuth();
  const yearId = useYearId().yearId;
  const [data, setData] = useState<MyWorkload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !yearId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api.analytics.myWorkload(token, yearId)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [token, yearId]);

  if (!yearId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">My Workload</h1>
        <p className="text-muted-foreground">Select an academic year in the header.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">My Workload</h1>
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
        <h1 className="text-2xl font-semibold">My Workload</h1>
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  const barData = data
    ? [
        { name: "Teaching", hours: data.teaching_hours, fill: COLORS[0] },
        { name: "Research", hours: data.research_hours, fill: COLORS[1] },
        { name: "Admin", hours: data.admin_hours, fill: COLORS[2] },
      ].filter((d) => d.hours > 0)
    : [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">My Workload</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Hours by category</CardTitle>
            {data && (
              <Badge
                variant={
                  data.status === "OVERLOADED"
                    ? "overloaded"
                    : data.status === "UNDERLOADED"
                      ? "underloaded"
                      : "balanced"
                }
              >
                {data.status}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} layout="vertical" margin={{ left: 60 }}>
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={80} />
                  <Tooltip formatter={(v: number) => [`${v} hrs`, "Hours"]} />
                  <Legend />
                  <Bar dataKey="hours" name="Hours" radius={[0, 4, 4, 0]}>
                    {barData.map((_, i) => (
                      <Cell key={i} fill={barData[i].fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No allocation for this year.</p>
            )}
          </CardContent>
        </Card>

        {data && (
          <Card>
            <CardHeader>
              <CardTitle>Capacity & utilisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total hours</span>
                <span className="font-medium">{data.total_hours}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Capacity</span>
                <span className="font-medium">{data.capacity_hours}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Utilisation</span>
                <span className="font-medium">{data.utilisation}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Difference</span>
                <span className={data.difference >= 0 ? "text-rose-600" : "text-amber-600"}>
                  {data.difference >= 0 ? "+" : ""}{data.difference} hrs
                </span>
              </div>
              <div className="pt-2">
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${Math.min(100, Math.max(0, data.utilisation))}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">0% — 100% — 110%</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
