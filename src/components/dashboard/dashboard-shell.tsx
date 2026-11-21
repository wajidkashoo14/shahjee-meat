"use client";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: React.ReactNode };

/** Section roots (/admin, /account) match exactly; deeper items also match their sub-pages. */
function isActive(pathname: string, href: string) {
  if (pathname === href) return true;
  return href.split("/").length > 2 && pathname.startsWith(`${href}/`);
}

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
        <h1 className="font-display text-2xl">{title}</h1>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-full border border-input p-2 transition-colors hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[256px_1fr]">
        <aside className={cn("print-hide lg:block", mobileOpen ? "block" : "hidden")}>
          <div className="rounded-2xl bg-surface-inverse p-3 text-foreground-inverse shadow-[var(--shadow-card)] lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
            <div className="mb-2 hidden border-b border-border-inverse px-3 pb-4 pt-2 lg:block">
              <h1 className="font-display text-2xl">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-foreground-inverse-muted">{subtitle}</p>}
            </div>
            <nav className="flex flex-col gap-0.5">
              {navItems.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground-inverse",
                      active
                        ? "bg-surface-inverse-raised font-semibold text-foreground-inverse before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-foreground-inverse"
                        : "text-foreground-inverse-muted hover:bg-surface-inverse-raised/60 hover:text-foreground-inverse",
                    )}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
