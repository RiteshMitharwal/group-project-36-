"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { api, type Module as ModuleType } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2 } from "lucide-react";

const ORDERING_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "code", label: "Code" },
  { value: "credit_hours", label: "Credit hours" },
];

export default function ModulesPage() {
  const { token } = useAuth();
  const [modules, setModules] = useState<ModuleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("name");
  const [editing, setEditing] = useState<ModuleType | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", department: 0, credit_hours: 15, is_active: true });
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);

  const load = () => {
    if (!token) return;
    setLoading(true);
    api.modules.list(token, { search: search || undefined, ordering }).then(
      (r) => {
        setModules(r.results || []);
        setLoading(false);
      },
      () => setLoading(false)
    );
  };

  useEffect(() => {
    if (!token) return;
    api.departments.list(token).then((r) => setDepartments(r.results || []));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [token, search, ordering]);

  const openEdit = (m: ModuleType) => {
    setEditing(m);
    setForm({
      code: m.code ?? "",
      name: m.name,
      department: m.department,
      credit_hours: m.credit_hours,
      is_active: m.is_active ?? true,
    });
  };

  const openCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm({
      code: "",
      name: "",
      department: departments[0]?.id ?? 0,
      credit_hours: 15,
      is_active: true,
    });
  };

  const save = async () => {
    if (!token) return;
    try {
      const payload = { ...form, code: form.code || undefined };
      if (editing) {
        await api.modules.update(token, editing.id, payload);
        setModules((prev) =>
          prev.map((x) =>
            x.id === editing.id
              ? { ...x, ...payload, code: payload.code ?? x.code }
              : x
          )
        );
        setEditing(null);
      } else if (creating) {
        const created = await api.modules.create(token, payload);
        setModules((prev) => [...prev, created]);
        setCreating(false);
      }
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to save");
    }
  };

  const remove = async (id: number) => {
    if (!token || !confirm("Delete this module?")) return;
    try {
      await api.modules.delete(token, id);
      setModules((prev) => prev.filter((x) => x.id !== id));
      if (editing?.id === id) setEditing(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Modules</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          Add module
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-muted-foreground">Search</Label>
          <Input
            placeholder="Name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-muted-foreground">Order by</Label>
          <select
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
          >
            {ORDERING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {(editing || creating) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>{editing ? "Edit module" : "New module"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Module name"
                />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={form.department}
                  onChange={(e) => setForm((f) => ({ ...f, department: Number(e.target.value) }))}
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Credit hours</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.credit_hours}
                  onChange={(e) => setForm((f) => ({ ...f, credit_hours: Number(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="mod_active"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="rounded border-input"
              />
              <Label htmlFor="mod_active">Active</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={save}>Save</Button>
              <Button variant="outline" onClick={() => { setEditing(null); setCreating(false); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Code</th>
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Department</th>
                    <th className="text-right p-3 font-medium">Credits</th>
                    <th className="text-left p-3 font-medium">Active</th>
                    <th className="w-24 p-3" />
                  </tr>
                </thead>
                <tbody>
                  {modules.map((m) => (
                    <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 text-muted-foreground">{m.code ?? "—"}</td>
                      <td className="p-3">{m.name}</td>
                      <td className="p-3">{(m as { department_detail?: { name: string } }).department_detail?.name ?? m.department}</td>
                      <td className="p-3 text-right">{m.credit_hours}</td>
                      <td className="p-3">{m.is_active ? "Yes" : "No"}</td>
                      <td className="p-3 flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(m)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => remove(m.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
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
