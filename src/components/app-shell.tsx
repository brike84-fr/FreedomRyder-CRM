"use client";

import { useState, useEffect } from "react";
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
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      const supabase = createClient();
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("read", false);
      setUnreadCount(count || 0);
    };
    fetchCount();
  }, [pathname]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
        <div>
          <h1 className="font-[var(--font-heading)] text-xl tracking-tight">
            Freedom Ryder
          </h1>
          <p className="text-xs text-cream/50 tracking-wider mt-0.5">
            LEAD TRACKER
          </p>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-cream/60 hover:text-cream p-1"
        >
          <X className="w-5 h-5" />
        </button>
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
              onClick={() => setMobileOpen(false)}
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
    </>
  );

  return (
    <div className="flex h-screen w-full">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex w-64 bg-forest-deep text-cream flex-col shrink-0">
        {sidebarContent}
      </aside>

      {/* Sidebar - mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-forest-deep text-cream flex flex-col transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-cream">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-warm-white">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-ink p-1"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-[var(--font-heading)] text-lg text-ink">
            Freedom Ryder
          </h1>
          {unreadCount > 0 && (
            <Badge className="ml-auto bg-rust text-cream text-xs px-1.5 py-0 border-0">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="max-w-[1200px] mx-auto px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
