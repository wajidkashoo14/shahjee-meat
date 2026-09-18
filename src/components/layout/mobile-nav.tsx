"use client";
import { Home, Grid2x2, Search, ShoppingBag, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useUIStore } from "@/store/ui-store";
import { useCartStore } from "@/store/cart-store";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const setCartOpen = useUIStore((s) => s.setCartOpen);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const itemCount = useCartStore((s) => s.summary?.itemCount ?? 0);
  const t = useTranslations("nav");

  const items = [
    { href: "/", icon: Home, label: t("home") },
    { href: "/collections", icon: Grid2x2, label: t("shop") },
  ];

  return (
    <nav className="print-hide fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-surface/95 backdrop-blur-md py-2 lg:hidden">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn("flex flex-col items-center gap-0.5 px-3 py-1 text-[11px]", active ? "text-primary" : "text-foreground-muted")}
          >
            <item.icon className="size-5" />
            {item.label}
          </Link>
        );
      })}
      <button onClick={() => setSearchOpen(true)} className="flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] text-foreground-muted">
        <Search className="size-5" />
        {t("search")}
      </button>
      <button onClick={() => setCartOpen(true)} className="relative flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] text-foreground-muted">
        <ShoppingBag className="size-5" />
        {t("cart")}
        {itemCount > 0 && (
          <span className="absolute right-1 top-0 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
            {itemCount > 9 ? "9+" : itemCount}
          </span>
        )}
      </button>
      <Link href="/account" className={cn("flex flex-col items-center gap-0.5 px-3 py-1 text-[11px]", pathname === "/account" ? "text-primary" : "text-foreground-muted")}>
        <User className="size-5" />
        {t("account")}
      </Link>
    </nav>
  );
}
