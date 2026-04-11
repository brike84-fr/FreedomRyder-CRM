"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, User, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface SettingsContentProps {
  userEmail: string;
}

export function SettingsContent({ userEmail }: SettingsContentProps) {
  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handlePasswordChange = async () => {
    setPasswordError("");
    setPasswordMessage("");

    if (!currentPassword) {
      setPasswordError("Current password is required");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match");
      return;
    }

    setPasswordSaving(true);
    const supabase = createClient();

    // Verify current password first
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword,
    });
    if (verifyError) {
      setPasswordSaving(false);
      setPasswordError("Current password is incorrect");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSaving(false);

    if (error) {
      setPasswordError(error.message);
      return;
    }

    setPasswordMessage("Password updated");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordMessage(""), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[var(--font-heading)] text-3xl text-ink">Settings</h1>
        <p className="text-ink-muted text-sm mt-1">
          Manage your account.
        </p>
      </div>

      {/* Account */}
      <Card className="bg-warm-white border-border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-ink-light uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm text-ink">Signed in as</Label>
            <p className="text-sm text-ink-muted mt-1">{userEmail || "Not signed in"}</p>
          </div>

          <Separator className="bg-border" />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <KeyRound className="w-4 h-4 text-ink-muted" />
              <Label className="text-sm text-ink font-medium">Change Password</Label>
            </div>
            <div className="space-y-3 max-w-md">
              <div>
                <Label htmlFor="current-password" className="text-xs text-ink-muted">
                  Current password
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value.slice(0, 72))}
                  className="mt-1 bg-cream border-border"
                  placeholder="Enter current password"
                  maxLength={72}
                  autoComplete="current-password"
                />
              </div>
              <div>
                <Label htmlFor="new-password" className="text-xs text-ink-muted">
                  New password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value.slice(0, 72))}
                  className="mt-1 bg-cream border-border"
                  placeholder="At least 8 characters"
                  maxLength={72}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <Label htmlFor="confirm-password" className="text-xs text-ink-muted">
                  Confirm new password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value.slice(0, 72))}
                  className="mt-1 bg-cream border-border"
                  placeholder="Type it again"
                  maxLength={72}
                  autoComplete="new-password"
                />
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handlePasswordChange}
                  disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
                  className="bg-forest text-cream hover:bg-forest-deep"
                >
                  {passwordSaving ? "Updating..." : "Update Password"}
                </Button>
                {passwordMessage && (
                  <span className="flex items-center gap-1.5 text-sm text-forest">
                    <CheckCircle2 className="w-4 h-4" /> {passwordMessage}
                  </span>
                )}
                {passwordError && (
                  <span className="text-sm text-rust">{passwordError}</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
