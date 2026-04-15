"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/providers/AuthProvider";
import { getApiBase } from "@/lib/api";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading, error } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login(username, password);
    } catch {
      // error set in provider
    }
  }

  return (
    <Card className="w-full max-w-md border border-border shadow-xl bg-card">
      <CardHeader className="space-y-2 pb-2">
        <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
          <span className="text-2xl font-bold text-primary">W</span>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-center text-foreground">
          Workload Management
        </CardTitle>
        <p className="text-sm text-muted-foreground text-center">
          Sign in to your account
        </p>
      </CardHeader>
      <CardContent className="pt-2">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-foreground font-medium">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="e.g. admin or Alex Wilson"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              className="h-11 border-border focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="h-11 border-border focus-visible:ring-primary"
            />
          </div>
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm text-primary hover:underline">
              Forgot Password?
            </Link>
          </div>
          {error && (
            <div className="space-y-1.5 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-sm text-destructive font-medium">{error}</p>
              {error.includes("Cannot reach the server") && (
                <>
                  <p className="text-xs text-muted-foreground">
                    Backend not reachable. In a terminal: cd backend && source .venv/bin/activate && python manage.py runserver 0.0.0.0:8000
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Test: <a href={`${getApiBase()}/api/health`} target="_blank" rel="noopener noreferrer" className="underline text-primary">API health</a>. Or set <code className="text-xs bg-muted px-1 rounded">NEXT_PUBLIC_API_URL</code> in frontend/.env.local and restart.
                  </p>
                </>
              )}
              {(error.includes("credentials") || error.includes("active account")) && (
                <p className="text-xs text-muted-foreground">
                  Demo: admin / admin123. Or run in backend: python manage.py seed_workload
                </p>
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground text-center">
            Demo: admin / admin123 · Academics: full name / full name123
          </p>
          <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
