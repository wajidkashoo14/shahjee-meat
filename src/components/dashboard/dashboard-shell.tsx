"use client";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: React.ReactNode };

export function DashboardShell({
  navItems,
  title,
  subtitle,
  children,
}: {
  navItems: readonly NavItem[];
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="print-hide mb-6 flex items-center justify-between lg:hidden">
        <div>
          <h1 className="font-display text-2xl">{title}</h1>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-full border border-border p-2">
          {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <aside className={cn("print-hide lg:block", mobileOpen ? "block" : "hidden")}>
          <div className="hidden lg:block">
            <h1 className="font-display text-2xl">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-foreground-muted">{subtitle}</p>}
          </div>
          <nav className="mt-6 flex flex-col gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active ? "bg-primary text-primary-foreground" : "text-foreground-muted hover:bg-surface-raised hover:text-foreground",
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
