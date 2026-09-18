"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { Search, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useUIStore } from "@/store/ui-store";
import { searchAction } from "@/server/actions/search-actions";
import { formatJpy } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Results = Awaited<ReturnType<typeof searchAction>>;

export function CommandPalette() {
  const open = useUIStore((s) => s.searchOpen);
  const setOpen = useUIStore((s) => s.setSearchOpen);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results>({ products: [], recipes: [] });
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const locale = useLocale() as "en" | "ja";
  const t = useTranslations("search");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  useEffect(() => {
    if (!query.trim()) {
      // Clearing results when the query is emptied is a direct response to
      // a prop/state change, not derived render state — the debounced
      // search below is the async case this effect exists for.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults({ products: [], recipes: [] });
      return;
    }
    const handle = setTimeout(() => {
      startTransition(async () => setResults(await searchAction(query)));
    }, 200);
    return () => clearTimeout(handle);
  }, [query]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-24 z-[60] w-[92vw] max-w-xl -translate-x-1/2 rounded-2xl border border-border bg-surface shadow-2xl"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
        >
          <DialogPrimitive.Title className="sr-only">{t("title")}</DialogPrimitive.Title>
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search className="size-4 text-foreground-muted" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("placeholder")}
              className="h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-muted"
            />
            <button onClick={() => setOpen(false)} aria-label="Close" className="p-2 text-foreground-muted hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>
          <div className={cn("max-h-[60vh] overflow-y-auto p-2", pending && "opacity-60")}>
            {query.trim() && results.products.length === 0 && results.recipes.length === 0 && (
              <p className="p-6 text-center text-sm text-foreground-muted">{t("noResults")}</p>
            )}
            {results.products.length > 0 && (
              <div className="p-2">
                <p className="px-2 pb-1 text-xs font-semibold uppercase text-foreground-muted">{t("products")}</p>
                {results.products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => go(`/products/${p.slug}`)}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-surface-raised"
                  >
                    <span>{locale === "ja" ? p.nameJa : p.nameEn}</span>
                    <span className="text-foreground-muted tabular-nums">
                      {p.variants[0] ? formatJpy(p.variants[0].priceJpy) : ""}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {results.recipes.length > 0 && (
              <div className="p-2">
                <p className="px-2 pb-1 text-xs font-semibold uppercase text-foreground-muted">{t("recipes")}</p>
                {results.recipes.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => go(`/recipes/${r.slug}`)}
                    className="block w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-surface-raised"
                  >
                    {locale === "ja" ? r.titleJa : r.titleEn}
                  </button>
                ))}
              </div>
            )}
            {!query.trim() && (
              <p className="p-6 text-center text-sm text-foreground-muted">{t("hint")}</p>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
