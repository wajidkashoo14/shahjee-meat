"use client";
import { useState } from "react";
import { Menu, Search, ShoppingBag, User, LayoutDashboard, LogOut } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { useUIStore } from "@/store/ui-store";
import { useCartStore } from "@/store/cart-store";
import { authClient } from "@/lib/auth-client";
import { PRIMARY_CATEGORIES, CURATED_COLLECTIONS } from "@/lib/nav";

export function HeaderClient({ isSignedIn, role }: { isSignedIn: boolean; role?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const setCartOpen = useUIStore((s) => s.setCartOpen);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const itemCount = useCartStore((s) => s.summary?.itemCount ?? 0);
  const locale = useLocale() as "en" | "ja";
  const t = useTranslations("nav");

  return (
    <header className="print-hide sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <button className="lg:hidden p-2 -ml-2" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <Link href="/" className="font-display text-xl font-semibold tracking-tight">
            Whole Cuts
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-1">
          {PRIMARY_CATEGORIES.slice(0, 5).map((c) => (
            <Link
              key={c.slug}
              href={`/collections/${c.slug}`}
              className="rounded-full px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
            >
              {locale === "ja" ? c.labelJa : c.labelEn}
            </Link>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground">
                {t("shopBy")}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {CURATED_COLLECTIONS.map((c) => (
                <DropdownMenuItem key={c.slug} asChild>
                  <Link href={`/collections/${c.slug}`}>{locale === "ja" ? c.labelJa : c.labelEn}</Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/collections">{t("allCollections")}</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/recipes" className="rounded-full px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground">
            {t("recipes")}
          </Link>
        </nav>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Search" onClick={() => setSearchOpen(true)}>
            <Search className="size-4" />
          </Button>
          <LocaleSwitcher />
          <ThemeToggle />
          <AccountMenu isSignedIn={isSignedIn} role={role} />
          <Button variant="ghost" size="icon" aria-label="Cart" className="relative" onClick={() => setCartOpen(true)}>
            <ShoppingBag className="size-4" />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Whole Cuts</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 px-6">
            {PRIMARY_CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={`/collections/${c.slug}`}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-surface-raised"
              >
                {locale === "ja" ? c.labelJa : c.labelEn}
              </Link>
            ))}
            <Link href="/recipes" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-surface-raised">
              {t("recipes")}
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}

function AccountMenu({ isSignedIn, role }: { isSignedIn: boolean; role?: string }) {
  const t = useTranslations("nav");

  if (!isSignedIn) {
    return (
      <Button variant="ghost" size="icon" aria-label="Sign in" asChild>
        <Link href="/sign-in">
          <User className="size-4" />
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Account">
          <User className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/account">
            <LayoutDashboard className="size-4" /> {t("dashboard")}
          </Link>
        </DropdownMenuItem>
        {(role === "admin" || role === "staff") && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <LayoutDashboard className="size-4" /> {t("adminPanel")}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  // A full reload clears the cart store and any other
                  // in-memory state tied to the now-ended session.
                  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                  window.location.href = "/";
                },
              },
            })
          }
        >
          <LogOut className="size-4" /> {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
