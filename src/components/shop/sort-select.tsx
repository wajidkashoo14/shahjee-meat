"use client";
import { useQueryState } from "nuqs";
import { useTranslations } from "next-intl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SortOption } from "@/server/catalog";

const OPTIONS: SortOption[] = ["featured", "best-selling", "az", "za", "price-asc", "price-desc", "newest", "oldest"];

export function SortSelect() {
  const [sort, setSort] = useQueryState("sort", { defaultValue: "featured", clearOnDefault: true, shallow: false });
  const t = useTranslations("shop");

  return (
    <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
      <SelectTrigger className="w-44 sm:w-56">
        <span className="mr-1 hidden whitespace-nowrap text-foreground-muted sm:inline">{t("sortBy")}:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {t(`sort.${opt}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
