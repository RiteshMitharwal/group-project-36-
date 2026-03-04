"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { YearProvider, useYearId } from "@/components/providers/YearProvider";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  BookOpen,
  History,
  BarChart3,
  LogOut,
  Moon,
  Sun,
  ChevronDown,
  BookOpenCheck,
} from "lucide-react";
import { useState, useRef, useEffect as useEffectDom } from "react";
import { cn } from "@/lib/cn";
import { useYears } from "@/hooks/useYears";

const adminNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/academics", label: "Academics", icon: Users },
  { href: "/modules", label: "Modules", icon: BookOpenCheck },
  { href: "/years", label: "Years", icon: Calendar },
  { href: "/allocations", label: "Allocations", icon: ClipboardList },
];

const academicNav = [
  { href: "/my-workload", label: "My Workload", icon: BookOpen },
  { href: "/history", label: "History", icon: History },
  { href: "/group-summary", label: "Group Summary", icon: BarChart3 },
];

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  const { years } = useYears();
  const { yearId, setYearId } = useYearId();

  useEffectDom(() => {
    function handleClick(e: MouseEvent) {
      if (userRef.current && !userRef.current.contains(e.target as Node))
        setUserOpen(false);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const nav = user.role === "ADMIN" ? adminNav : academicNav;

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-60 border-r border-border bg-card flex flex-col shadow-sm">
        <div className="p-5 border-b border-border">
          <Link
            href={user.role === "ADMIN" ? "/dashboard" : "/my-workload"}
            className="flex items-center gap-2 font-bold text-lg text-foreground hover:text-primary transition-colors"
          >
            <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">W</span>
            Workload
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center justify-between px-6 gap-4 bg-card">
          {user.role === "ADMIN" && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Year:</span>
              {years.length > 0 ? (
                <select
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={yearId ?? ""}
                  onChange={(e) => setYearId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">All years</option>
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.label} {y.is_locked ? "🔒" : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-sm text-muted-foreground">Loading…</span>
              )}
            </div>
          )}
          {user.role === "ACADEMIC" && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Year:</span>
              {years.length > 0 ? (
                <select
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={yearId ?? ""}
                  onChange={(e) => setYearId(e.target.value ? Number(e.target.value) : null)}
                >
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.label}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-sm text-muted-foreground">Loading…</span>
              )}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <div className="relative" ref={userRef}>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() => setUserOpen((o) => !o)}
              >
                {user.username}
                <ChevronDown className="h-4 w-4" />
              </Button>
              {userOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-md border border-border bg-card py-1 shadow-lg z-50">
                  <div className="px-3 py-2 text-sm text-muted-foreground border-b border-border">
                    {user.email}
                  </div>
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                    onClick={() => {
                      logout();
                      setUserOpen(false);
                      router.push("/");
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const { years, currentYearId, setCurrentYearId } = useYears();

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <div className="animate-pulse rounded-lg bg-muted h-12 w-48" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <YearProvider yearId={currentYearId} setYearId={setCurrentYearId}>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </YearProvider>
  );
}
