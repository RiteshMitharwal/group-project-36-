"use client";

import { useState } from "react";
import Link from "next/link";
import { getApiBase } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    try {
      const res = await fetch(`${getApiBase()}/api/auth/forgot-password/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.detail || "Failed to send reset code.");
      }

      setInfo("If the account is eligible, a reset code has been sent to the registered email.");
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    try {
      const res = await fetch(`${getApiBase()}/api/auth/forgot-password/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          code: code.trim(),
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (typeof data === "object" && data !== null) {
          const firstError =
            data.detail ||
            data.new_password?.[0] ||
            data.confirm_password?.[0] ||
            data.username?.[0] ||
            "Failed to reset password.";
          throw new Error(firstError);
        }
        throw new Error("Failed to reset password.");
      }

      setInfo("Password reset successful. You can now sign in with your new password.");
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {info ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {info}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {step === 1 ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending code..." : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username-readonly">Username</Label>
                <Input
                  id="username-readonly"
                  value={username}
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">OTP</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter the OTP sent to your email"
                  maxLength={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                />
              </div>

              <div className="text-xs text-muted-foreground">
                Password must contain at least one uppercase letter, one lowercase letter, one number, and be at least 8 characters long.
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          )}

          <div className="text-sm">
            <Link href="/" className="text-primary hover:underline">
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}