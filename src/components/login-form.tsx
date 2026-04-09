"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATIONS = [0, 0, 0, 0, 0, 15, 30, 60, 120, 300]; // seconds per attempt

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(0);
  const router = useRouter();

  // Tick every second while locked so countdown updates
  useEffect(() => {
    if (lockedUntil === 0) return;
    const interval = setInterval(() => {
      const current = Date.now();
      if (current >= lockedUntil) {
        setLockedUntil(0);
        clearInterval(interval);
      } else {
        setNow(current);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const secondsRemaining =
    lockedUntil === 0 ? 0 : Math.max(0, Math.ceil((lockedUntil - now) / 1000));
  const isLocked = secondsRemaining > 0;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked) {
      setError(`Too many attempts. Try again in ${secondsRemaining}s.`);
      return;
    }

    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        const lockSeconds =
          LOCKOUT_DURATIONS[Math.min(newAttempts, LOCKOUT_DURATIONS.length - 1)];
        const until = Date.now() + lockSeconds * 1000;
        setLockedUntil(until);
        setError(`Too many failed attempts. Locked for ${lockSeconds}s.`);
      } else {
        setError(error.message);
      }

      setLoading(false);
      return;
    }

    setAttempts(0);
    setLockedUntil(0);
    router.push("/");
    router.refresh();
  };

  return (
    <Card className="bg-warm-white border-border shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-ink text-center">
          Sign in
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-rust bg-rust-light px-3 py-2.5 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm text-ink">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="forrest@freedomryder.com"
              className="bg-cream border-border"
              required
              autoComplete="email"
              disabled={isLocked}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm text-ink">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="bg-cream border-border"
              required
              autoComplete="current-password"
              disabled={isLocked}
            />
          </div>

          <Button
            type="submit"
            disabled={loading || isLocked}
            className="w-full bg-forest text-cream hover:bg-forest-deep"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isLocked ? (
              `Locked (${secondsRemaining}s)`
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
