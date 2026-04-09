"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Mail, Clock, Tag, X } from "lucide-react";
import { updateSettings } from "@/lib/actions";
import type { EmailSequenceSettings } from "@/lib/data";

export function SettingsContent({ settings }: { settings: EmailSequenceSettings | null }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sendingEmail, setSendingEmail] = useState(settings?.sending_email || "freedomryderusa@gmail.com");
  const [sequenceEnabled, setSequenceEnabled] = useState(true);

  const [email1Delay, setEmail1Delay] = useState(String(settings?.email_1_delay_hours ?? 0));
  const [email2Delay, setEmail2Delay] = useState(String(settings?.email_2_delay_days ?? 3));
  const [email3Delay, setEmail3Delay] = useState(String(settings?.email_3_delay_days ?? 7));

  const [email1Subject, setEmail1Subject] = useState(settings?.email_1_subject || "Thanks for Reaching Out!");
  const [email2Subject, setEmail2Subject] = useState(settings?.email_2_subject || "Following Up — Freedom Ryder");
  const [email3Subject, setEmail3Subject] = useState(settings?.email_3_subject || "One Last Thing — Freedom Ryder");

  const [tags, setTags] = useState(["hot", "medium", "cold", "veteran", "ad lead", "bob's lead"]);
  const [newTag, setNewTag] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const result = await updateSettings({
      sending_email: sendingEmail,
      email_1_delay_hours: parseInt(email1Delay) || 0,
      email_2_delay_days: parseInt(email2Delay) || 3,
      email_3_delay_days: parseInt(email3Delay) || 7,
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

  const addTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[var(--font-heading)] text-3xl text-ink">Settings</h1>
        <p className="text-ink-muted text-sm mt-1">
          Configure email sequences, tags, and system preferences.
        </p>
      </div>

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
          <div className="flex items-center gap-3">
            <Switch
              checked={sequenceEnabled}
              onCheckedChange={setSequenceEnabled}
            />
            <Label className="text-sm text-ink">
              Auto-start email sequence for new leads
            </Label>
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
                <Label className="text-xs text-ink-muted">Delay (days after email 1)</Label>
                <Input
                  type="number"
                  value={email3Delay}
                  onChange={(e) => setEmail3Delay(e.target.value)}
                  className="mt-1 bg-cream border-border"
                  min="1"
                />
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

      {/* Tags */}
      <Card className="bg-warm-white border-border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-ink-light uppercase tracking-wider flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Lead Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-sm py-1 px-3 flex items-center gap-1.5"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="hover:text-rust transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2 max-w-sm">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value.slice(0, 50))}
              placeholder="Add new tag..."
              className="bg-cream border-border"
              maxLength={50}
              onKeyDown={(e) => e.key === "Enter" && addTag()}
            />
            <Button onClick={addTag} variant="outline" className="border-border">
              Add
            </Button>
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
