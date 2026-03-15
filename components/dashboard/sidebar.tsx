"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  TrendingUp,
  Lightbulb,
  BarChart2,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    label: "Profile Setup",
    href: "/dashboard/profile",
    icon: User,
    badge: null,
  },
  {
    label: "Trends",
    href: "/dashboard/trends",
    icon: TrendingUp,
    badge: null,
  },
  {
    label: "Post Ideas",
    href: "/dashboard/post-ideas",
    icon: Lightbulb,
    badge: null,
  },
  {
    label: "Import Data",
    href: "/dashboard/import",
    icon: Upload,
    badge: null,
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart2,
    badge: null,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-[220px] border-r bg-white flex flex-col">
      <div className="flex h-14 items-center px-4 border-b">
        <span className="font-semibold text-sm text-muted-foreground tracking-widest uppercase">
          Menu
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="h-2 w-2 rounded-full bg-red-500" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t">
        <p className="text-xs text-muted-foreground">ProfilePulse v0.1</p>
      </div>
    </aside>
  );
}
