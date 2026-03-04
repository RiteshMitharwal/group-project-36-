"use client";

import { useYearId } from "@/components/providers/YearProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, type AdminSummary, type RiskItem, type AcademicBreakdownItem, type Academic, type Department } from "@/lib/api";
import { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/* Distinct colors (no shades): Teaching = teal, Research = blue, Admin = amber */
const PIE_COLORS = ["hsl(172 66% 32%)", "hsl(217 70% 48%)", "hsl(38 92% 48%)"];
const BREAKDOWN_TEACHING = "hsl(172 66% 32%)";
const BREAKDOWN_RESEARCH = "hsl(217 70% 48%)";
const BREAKDOWN_ADMIN = "hsl(38 92% 48%)";

type BreakdownMode = "top10" | "top20" | "selected" | "all";

export default function DashboardPage() {
  const { token } = useAuth();
  const yearId = useYearId().yearId;
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [risk, setRisk] = useState<RiskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [academics, setAcademics] = useState<Academic[]>([]);
  const [breakdownDept, setBreakdownDept] = useState<number | "">("");
  const [breakdownMode, setBreakdownMode] = useState<BreakdownMode>("top10");
  const [selectedAcademicIds, setSelectedAcademicIds] = useState<number[]>([]);
  const [academicSearch, setAcademicSearch] = useState("");
  const [breakdownData, setBreakdownData] = useState<AcademicBreakdownItem[]>([]);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [breakdownError, setBreakdownError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !yearId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([api.analytics.adminSummary(token, yearId), api.analytics.adminRisk(token, yearId)])
      .then(([s, r]) => {
        setSummary(s);
        setRisk(r);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [token, yearId]);

  useEffect(() => {
    if (!token) return;
    api.departments.list(token).then((r) => setDepartments(r.results ?? []));
    api.academics.list(token).then((r) => setAcademics(r.results ?? []));
  }, [token]);

  useEffect(() => {
    if (!token || !yearId) {
      setBreakdownData([]);
      return;
    }
    if (breakdownMode === "selected" && selectedAcademicIds.length === 0) {
      setBreakdownData([]);
      setBreakdownLoading(false);
      setBreakdownError(null);
      return;
    }
    setBreakdownLoading(true);
    setBreakdownError(null);
    const opts: { dept?: number; academic_ids?: number[]; limit?: number } = {};
    if (breakdownDept !== "") opts.dept = breakdownDept;
    if (breakdownMode === "top10") opts.limit = 10;
    else if (breakdownMode === "top20") opts.limit = 20;
    else if (breakdownMode === "selected" && selectedAcademicIds.length > 0) opts.academic_ids = selectedAcademicIds;
    api.analytics
      .adminAcademicsBreakdown(token, yearId, Object.keys(opts).length ? opts : undefined)
      .then((data) => {
        setBreakdownData(data);
        setBreakdownError(null);
      })
      .catch((e) => {
        setBreakdownError(e instanceof Error ? e.message : "Failed to load breakdown");
        setBreakdownData([]);
      })
      .finally(() => setBreakdownLoading(false));
  }, [token, yearId, breakdownDept, breakdownMode, selectedAcademicIds]);

  const filteredAcademicsForSelect = useMemo(() => {
    const q = academicSearch.trim().toLowerCase();
    return q
      ? academics.filter(
          (a) =>
            a.full_name.toLowerCase().includes(q) ||
            a.email.toLowerCase().includes(q)
        )
      : academics;
  }, [academics, academicSearch]);

  const breakdownChartData = useMemo(
    () =>
      breakdownData.map((r) => ({
        ...r,
        name: r.full_name,
      })),
    [breakdownData]
  );

  if (!yearId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Select an academic year in the header.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-32" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  const statusCounts = summary?.status_counts ?? { OVERLOADED: 0, UNDERLOADED: 0, BALANCED: 0 };
  const pieData = [
    { name: "Overloaded", value: statusCounts.OVERLOADED, fill: PIE_COLORS[0] },
    { name: "Balanced", value: statusCounts.BALANCED, fill: PIE_COLORS[1] },
    { name: "Underloaded", value: statusCounts.UNDERLOADED, fill: PIE_COLORS[2] },
  ].filter((d) => d.value > 0);

  const bucketData = summary?.utilisation_buckets
    ? [
        { name: "< 90%", count: summary.utilisation_buckets.under_90 },
        { name: "90–110%", count: summary.utilisation_buckets["90_110"] },
        { name: "> 110%", count: summary.utilisation_buckets.over_110 },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of workload by department and status</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {(summary?.department_summary ?? []).map((dept) => (
          <Card key={dept.id} className="border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-foreground">
                {dept.name}
              </CardTitle>
              {dept.code && (
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">{dept.code}</span>
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {dept.allocation_count} allocation{dept.allocation_count !== 1 ? "s" : ""}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                T: {dept.teaching_hours} · R: {dept.research_hours} · A: {dept.admin_hours}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Status distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={pieData[i].fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No allocation data for this year.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Utilisation buckets</CardTitle>
          </CardHeader>
          <CardContent>
            {bucketData.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={bucketData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      boxShadow: "none",
                    }}
                    labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                  />
                  <Legend />
                  <Bar dataKey="count" name="Count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} stroke="none" background={false} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No data.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground">Workload Breakdown by Academic</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Department:</span>
              <select
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm min-w-[140px]"
                value={breakdownDept}
                onChange={(e) => setBreakdownDept(e.target.value === "" ? "" : Number(e.target.value))}
              >
                <option value="">All departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Mode:</span>
              <div className="flex rounded-md border border-input overflow-hidden">
                {(
                  [
                    ["top10", "Top 10"],
                    ["top20", "Top 20"],
                    ["selected", "Selected"],
                    ["all", "All"],
                  ] as const
                ).map(([mode, label]) => (
                  <Button
                    key={mode}
                    type="button"
                    variant={breakdownMode === mode ? "default" : "ghost"}
                    size="sm"
                    className="rounded-none border-0 border-r border-input last:border-0"
                    onClick={() => setBreakdownMode(mode)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            {breakdownMode === "selected" && (
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Input
                  placeholder="Search academics…"
                  className="max-w-[200px] h-8 text-sm"
                  value={academicSearch}
                  onChange={(e) => setAcademicSearch(e.target.value)}
                />
                <div className="relative flex-1 max-w-[280px]">
                  <select
                    multiple
                    className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm min-h-[80px] max-h-[120px]"
                    value={selectedAcademicIds.map(String)}
                    onChange={(e) => {
                      const opts = Array.from(e.target.selectedOptions, (o) => Number(o.value));
                      setSelectedAcademicIds(opts);
                    }}
                  >
                    {filteredAcademicsForSelect.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.full_name}
                        {a.department_detail ? ` (${a.department_detail.name})` : ""}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-muted-foreground mt-1 block">
                    Hold Ctrl/Cmd to select multiple
                  </span>
                </div>
              </div>
            )}
          </div>
          {breakdownLoading ? (
            <div className="h-[320px] flex items-center justify-center">
              <Skeleton className="h-full w-full max-w-2xl" />
            </div>
          ) : breakdownError ? (
            <p className="text-sm text-destructive py-4">{breakdownError}</p>
          ) : breakdownChartData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              {breakdownMode === "selected"
                ? "Select one or more academics above to view breakdown."
                : "No allocation data for this year and filter."}
            </p>
          ) : (
            <div className="w-full overflow-x-auto">
              <ResponsiveContainer
                width="100%"
                height={Math.min(500, Math.max(280, breakdownChartData.length * 36))}
              >
                <BarChart
                  layout="vertical"
                  data={breakdownChartData}
                  margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                >
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="full_name" width={140} tick={{ fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as AcademicBreakdownItem;
                      return (
                        <div className="rounded-md border bg-card p-3 text-sm shadow-md">
                          <p className="font-medium">{d.full_name}</p>
                          <p className="text-muted-foreground">{d.department_name}</p>
                          <p className="mt-1">
                            Teaching: {d.teaching_hours} · Research: {d.research_hours} · Admin: {d.admin_hours}
                          </p>
                          <p>
                            Total: {d.total_hours} · Capacity: {d.capacity_hours} · {d.utilisation_pct}%
                          </p>
                          <Badge
                            variant={
                              d.status === "OVERLOADED"
                                ? "overloaded"
                                : d.status === "UNDERLOADED"
                                  ? "underloaded"
                                  : "balanced"
                            }
                            className="mt-1"
                          >
                            {d.status}
                          </Badge>
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Bar dataKey="teaching_hours" name="Teaching" stackId="a" fill={BREAKDOWN_TEACHING} radius={[0, 4, 4, 0]} stroke="none" background={false} />
                  <Bar dataKey="research_hours" name="Research" stackId="a" fill={BREAKDOWN_RESEARCH} radius={0} stroke="none" background={false} />
                  <Bar dataKey="admin_hours" name="Admin" stackId="a" fill={BREAKDOWN_ADMIN} radius={[4, 0, 0, 4]} stroke="none" background={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground">Risk list (overloaded & underloaded)</CardTitle>
        </CardHeader>
        <CardContent>
          {risk.length === 0 ? (
            <p className="text-sm text-muted-foreground">No overloaded or underloaded academics.</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Department</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Hours</th>
                    <th className="text-right p-3 font-medium">Capacity</th>
                    <th className="text-right p-3 font-medium">Utilisation</th>
                  </tr>
                </thead>
                <tbody>
                  {risk.map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3">{r.academic_name}</td>
                      <td className="p-3 text-muted-foreground">{r.department}</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            r.status === "OVERLOADED"
                              ? "overloaded"
                              : r.status === "UNDERLOADED"
                                ? "underloaded"
                                : "balanced"
                          }
                        >
                          {r.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">{r.total_hours}</td>
                      <td className="p-3 text-right">{r.capacity_hours}</td>
                      <td className="p-3 text-right">{r.utilisation_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
