"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Upload,
  Download,
  Settings,
  Bell,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { mockNotifications } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", icon: Users },
  { href: "/import", label: "Import Leads", icon: Upload },
  { href: "/export", label: "Export", icon: Download },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar */}
      <aside className="w-64 bg-forest-deep text-cream flex flex-col shrink-0">
        {/* Brand */}
        <div className="px-6 py-5 border-b border-white/10">
          <h1 className="font-[var(--font-heading)] text-xl tracking-tight">
            Freedom Ryder
          </h1>
          <p className="text-xs text-cream/50 tracking-wider mt-0.5">
            LEAD TRACKER
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-forest text-cream"
                    : "text-cream/60 hover:text-cream hover:bg-white/5"
                )}
              >
                <item.icon className="w-4.5 h-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2.5 text-sm text-cream/60">
            <Bell className="w-4.5 h-4.5" />
            Notifications
            {unreadCount > 0 && (
              <Badge className="ml-auto bg-rust text-cream text-xs px-1.5 py-0 border-0">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="border-t border-white/10 pt-3 px-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-sage flex items-center justify-center text-xs font-semibold text-cream">
                  FL
                </div>
                <div>
                  <p className="text-sm font-medium">Forrest</p>
                  <p className="text-xs text-cream/40">Admin</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="text-cream/40 hover:text-cream transition-colors p-1.5 rounded-lg hover:bg-white/5"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-cream">
        <div className="max-w-[1200px] mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
