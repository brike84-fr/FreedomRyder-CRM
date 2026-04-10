"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Mail, Clock, User, KeyRound } from "lucide-react";
import { updateSettings } from "@/lib/actions";
import { createClient } from "@/lib/supabase/client";
import type { EmailSequenceSettings } from "@/lib/data";

interface SettingsContentProps {
  settings: EmailSequenceSettings | null;
  userEmail: string;
}

export function SettingsContent({ settings, userEmail }: SettingsContentProps) {
  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handlePasswordChange = async () => {
    setPasswordError("");
    setPasswordMessage("");

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match");
      return;
    }

    setPasswordSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSaving(false);

    if (error) {
      setPasswordError(error.message);
      return;
    }

    setPasswordMessage("Password updated");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordMessage(""), 3000);
  };

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sendingEmail, setSendingEmail] = useState(settings?.sending_email || "freedomryderusa@gmail.com");

  const [email1Delay, setEmail1Delay] = useState(String(settings?.email_1_delay_hours ?? 0));
  const [email2Delay, setEmail2Delay] = useState(String(settings?.email_2_delay_days ?? 3));
  const [email3Delay, setEmail3Delay] = useState(String(settings?.email_3_delay_days ?? 4));

  const [email1Subject, setEmail1Subject] = useState(settings?.email_1_subject || "Thanks for Reaching Out!");
  const [email2Subject, setEmail2Subject] = useState(settings?.email_2_subject || "Following Up — Freedom Ryder");
  const [email3Subject, setEmail3Subject] = useState(settings?.email_3_subject || "One Last Thing — Freedom Ryder");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const result = await updateSettings({
      sending_email: sendingEmail,
      email_1_delay_hours: parseInt(email1Delay) || 0,
      email_2_delay_days: parseInt(email2Delay) || 3,
      email_3_delay_days: parseInt(email3Delay) || 4,
      email_1_subject: email1Subject,
      email_2_subject: email2Subject,
      email_3_subject: email3Subject,
    });
    setSaving(false);
    if ("error" in result) {
      setError(result.error);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[var(--font-heading)] text-3xl text-ink">Settings</h1>
        <p className="text-ink-muted text-sm mt-1">
          Configure email sequences, tags, and system preferences.
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
                  disabled={passwordSaving || !newPassword || !confirmPassword}
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

      {/* Email settings */}
      <Card className="bg-warm-white border-border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-ink-light uppercase tracking-wider flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm text-ink">Sending Email Address</Label>
            <Input
              value={sendingEmail}
              onChange={(e) => setSendingEmail(e.target.value.slice(0, 254))}
              className="mt-1 bg-cream border-border max-w-md"
              placeholder="email@freedomryder.com"
              maxLength={254}
              type="email"
            />
            <p className="text-xs text-ink-muted mt-1">
              All automated emails will be sent from this address.
            </p>
          </div>
          <div className="text-xs text-ink-muted bg-cream rounded-lg p-3 border border-border">
            <strong className="text-ink">To pause all automation:</strong> deactivate the
            &ldquo;FR - Email Sequence Manager&rdquo; workflow in n8n. To pause one lead, open
            the lead and click Pause Sequence.
          </div>
        </CardContent>
      </Card>

      {/* Sequence timing */}
      <Card className="bg-warm-white border-border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-ink-light uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Email Sequence Timing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-forest text-cream flex items-center justify-center text-xs font-medium">1</div>
                <Label className="text-sm font-medium text-ink">Auto-Reply</Label>
              </div>
              <div>
                <Label className="text-xs text-ink-muted">Delay (hours)</Label>
                <Input
                  type="number"
                  value={email1Delay}
                  onChange={(e) => setEmail1Delay(e.target.value)}
                  className="mt-1 bg-cream border-border"
                  min="0"
                />
              </div>
              <div>
                <Label className="text-xs text-ink-muted">Subject Line</Label>
                <Input
                  value={email1Subject}
                  onChange={(e) => setEmail1Subject(e.target.value.slice(0, 200))}
                  className="mt-1 bg-cream border-border"
                  maxLength={200}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-forest text-cream flex items-center justify-center text-xs font-medium">2</div>
                <Label className="text-sm font-medium text-ink">Follow-Up</Label>
              </div>
              <div>
                <Label className="text-xs text-ink-muted">Delay (days after email 1)</Label>
                <Input
                  type="number"
                  value={email2Delay}
                  onChange={(e) => setEmail2Delay(e.target.value)}
                  className="mt-1 bg-cream border-border"
                  min="1"
                />
                <p className="text-[10px] text-ink-muted/70 mt-1">
                  Fires N days after the auto-reply was sent.
                </p>
              </div>
              <div>
                <Label className="text-xs text-ink-muted">Subject Line</Label>
                <Input
                  value={email2Subject}
                  onChange={(e) => setEmail2Subject(e.target.value.slice(0, 200))}
                  className="mt-1 bg-cream border-border"
                  maxLength={200}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-forest text-cream flex items-center justify-center text-xs font-medium">3</div>
                <Label className="text-sm font-medium text-ink">Handoff to Bob</Label>
              </div>
              <div>
                <Label className="text-xs text-ink-muted">Delay (days after email 2)</Label>
                <Input
                  type="number"
                  value={email3Delay}
                  onChange={(e) => setEmail3Delay(e.target.value)}
                  className="mt-1 bg-cream border-border"
                  min="1"
                />
                <p className="text-[10px] text-ink-muted/70 mt-1">
                  Fires N days after the follow-up was sent, then assigns to Bob.
                </p>
              </div>
              <div>
                <Label className="text-xs text-ink-muted">Subject Line</Label>
                <Input
                  value={email3Subject}
                  onChange={(e) => setEmail3Subject(e.target.value.slice(0, 200))}
                  className="mt-1 bg-cream border-border"
                  maxLength={200}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="bg-border" />

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} className="bg-forest text-cream hover:bg-forest-deep">
          {saving ? "Saving..." : "Save All Settings"}
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-forest">
            <CheckCircle2 className="w-4 h-4" /> Settings saved
          </span>
        )}
        {error && <span className="text-sm text-rust">{error}</span>}
      </div>
    </div>
  );
}
