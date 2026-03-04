"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { LoginForm } from "@/components/auth/LoginForm";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace(user.role === "ADMIN" ? "/dashboard" : "/my-workload");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-background via-background to-primary/[0.06]">
        <div className="animate-pulse rounded-xl bg-primary/10 h-14 w-56" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-background via-background to-primary/[0.06]">
        <p className="text-muted-foreground">Redirecting…</p>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/[0.06]">
      <LoginForm />
    </div>
  );
}
