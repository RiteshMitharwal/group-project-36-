"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { api, type AcademicYear } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Lock, Unlock } from "lucide-react";

export default function YearsPage() {
  const { token } = useAuth();
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AcademicYear | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ label: "", is_current: false, is_locked: false });

  const load = () => {
    if (!token) return;
    api.years.list(token).then(
      (r) => setYears(r.results || []),
      () => {}
    ).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    load();
  }, [token]);

  const openEdit = (y: AcademicYear) => {
    setEditing(y);
    setForm({ label: y.label, is_current: y.is_current, is_locked: y.is_locked });
  };

  const openCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm({ label: "", is_current: false, is_locked: false });
  };

  const save = async () => {
    if (!token) return;
    try {
      if (editing) {
        await api.years.update(token, editing.id, form);
        setYears((prev) => prev.map((y) => (y.id === editing.id ? { ...y, ...form } : y)));
        setEditing(null);
      } else if (creating) {
        const created = await api.years.create(token, form);
        setYears((prev) => [...prev, created].sort((a, b) => b.label.localeCompare(a.label)));
        setCreating(false);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to save");
    }
  };

  const remove = async (id: number) => {
    if (!token || !confirm("Delete this year?")) return;
    try {
      await api.years.delete(token, id);
      setYears((prev) => prev.filter((y) => y.id !== id));
      if (editing?.id === id) setEditing(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const toggleLock = async (y: AcademicYear) => {
    if (!token) return;
    try {
      await api.years.update(token, y.id, { is_locked: !y.is_locked });
      setYears((prev) =>
        prev.map((yr) => (yr.id === y.id ? { ...yr, is_locked: !yr.is_locked } : yr))
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update lock");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Academic years</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          Add year
        </Button>
      </div>

      {(editing || creating) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>{editing ? "Edit year" : "New year"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Label (e.g. 2025/26)</Label>
              <Input
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="2025/26"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_current}
                  onChange={(e) => setForm((f) => ({ ...f, is_current: e.target.checked }))}
                  className="rounded border-input"
                />
                <span className="text-sm">Current year</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_locked}
                  onChange={(e) => setForm((f) => ({ ...f, is_locked: e.target.checked }))}
                  className="rounded border-input"
                />
                <span className="text-sm">Locked (no allocation edits)</span>
              </label>
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
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Label</th>
                    <th className="text-left p-3 font-medium">Current</th>
                    <th className="text-left p-3 font-medium">Locked</th>
                    <th className="w-32 p-3" />
                  </tr>
                </thead>
                <tbody>
                  {years.map((y) => (
                    <tr key={y.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 font-medium">{y.label}</td>
                      <td className="p-3">{y.is_current ? "Yes" : "—"}</td>
                      <td className="p-3">{y.is_locked ? "🔒 Locked" : "—"}</td>
                      <td className="p-3 flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleLock(y)}
                          title={y.is_locked ? "Unlock" : "Lock"}
                        >
                          {y.is_locked ? (
                            <Unlock className="h-4 w-4" />
                          ) : (
                            <Lock className="h-4 w-4" />
                          )}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(y)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => remove(y.id)}>
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
