"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useYearId } from "@/components/providers/YearProvider";
import { api, type MyWorkload } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

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

  const pieData = data
    ? [
        { name: "Teaching", value: Number(data.teaching_hours || 0), fill: COLORS[0] },
        { name: "Research", value: Number(data.research_hours || 0), fill: COLORS[1] },
        { name: "Admin", value: Number(data.admin_hours || 0), fill: COLORS[2] },
        {
          name: "Remaining",
          value: Math.max(0, Number(data.capacity_hours || 0) - Number(data.total_hours || 0)),
          fill: "#9ca3af",
        },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">My Workload</h1>

      {data && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Capacity & utilisation</CardTitle>
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
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Total hours</div>
              <div className="mt-1 text-2xl font-semibold">{data.total_hours}</div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Capacity</div>
              <div className="mt-1 text-2xl font-semibold">{data.capacity_hours}</div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Utilisation</div>
              <div className="mt-1 text-2xl font-semibold">{data.utilisation}%</div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Difference</div>
              <div className={`mt-1 text-2xl font-semibold ${data.difference >= 0 ? "text-rose-600" : "text-amber-600"}`}>
                {data.difference >= 0 ? "+" : ""}
                {data.difference}
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Progress</div>
              <div className="mt-3">
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${Math.min(100, Math.max(0, data.utilisation))}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">0% — 100% — 110%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Workload distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={110}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`${v} hrs`, "Hours"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No allocation for this year.</p>
            )}
          </CardContent>
        </Card>

        {data && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Teaching</span>
                <span className="font-medium">{data.teaching_hours}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Research</span>
                <span className="font-medium">{data.research_hours}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Admin</span>
                <span className="font-medium">{data.admin_hours}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-medium">
                  {Math.max(0, Number(data.capacity_hours || 0) - Number(data.total_hours || 0))}
                </span>
              </div>
              <div className="flex justify-between border-t pt-3 text-sm">
                <span className="font-medium">Total</span>
                <span className="font-semibold">{data.total_hours}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Teaching breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.teaching_items && data.teaching_items.length > 0 ? (
              data.teaching_items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="font-medium">
                      {item.module_detail?.code
                        ? `${item.module_detail.code} - ${item.module_detail.name}`
                        : item.module_detail?.name ?? `Module ${item.module}`}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.percentage}% of module
                    </div>
                  </div>
                  <div className="text-right font-medium">
                    {item.calculated_hours} hrs
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No teaching allocation.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Research breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.research_items && data.research_items.length > 0 ? (
              data.research_items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="font-medium">
                      {item.research_role_detail?.name ?? `Research Role ${item.research_role}`}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.percentage}% of role
                    </div>
                  </div>
                  <div className="text-right font-medium">
                    {item.calculated_hours} hrs
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No research allocation.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admin breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.admin_items && data.admin_items.length > 0 ? (
              data.admin_items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="font-medium">
                      {item.admin_role_detail?.name ?? `Admin Role ${item.admin_role}`}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.percentage}% of role
                    </div>
                  </div>
                  <div className="text-right font-medium">
                    {item.calculated_hours} hrs
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No admin allocation.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
