"use client";
import { useQueryState, parseAsArrayOf, parseAsString, parseAsInteger, parseAsBoolean } from "nuqs";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export type Facets = { origins: string[]; feeds: string[]; grades: string[]; cuts: string[] };

function labelize(v: string) {
  return v
    .split("-")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}

export function FilterPanel({ facets, onNavigate }: { facets: Facets; onNavigate?: () => void }) {
  const t = useTranslations("shop");
  const [origin, setOrigin] = useQueryState("origin", parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow: false, clearOnDefault: true }));
  const [feed, setFeed] = useQueryState("feed", parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow: false, clearOnDefault: true }));
  const [grade, setGrade] = useQueryState("grade", parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow: false, clearOnDefault: true }));
  const [cut, setCut] = useQueryState("cut", parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow: false, clearOnDefault: true }));
  const [minPrice, setMinPrice] = useQueryState("min", parseAsInteger.withOptions({ shallow: false, clearOnDefault: true }));
  const [maxPrice, setMaxPrice] = useQueryState("max", parseAsInteger.withOptions({ shallow: false, clearOnDefault: true }));
  const [inStock, setInStock] = useQueryState("inStock", parseAsBoolean.withDefault(false).withOptions({ shallow: false, clearOnDefault: true }));

  function toggle(list: string[], setter: (v: string[]) => void, value: string) {
    if (list.includes(value)) setter(list.filter((v) => v !== value));
    else setter([...list, value]);
    onNavigate?.();
  }

  function clearAll() {
    setOrigin(null);
    setFeed(null);
    setGrade(null);
    setCut(null);
    setMinPrice(null);
    setMaxPrice(null);
    setInStock(null);
    onNavigate?.();
  }

  const hasAny = origin.length || feed.length || grade.length || cut.length || minPrice || maxPrice || inStock;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg">{t("filters")}</h3>
        {!!hasAny && (
          <button onClick={clearAll} className="text-xs text-primary hover:underline">
            {t("clearFilters")}
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="in-stock-switch">{t("filterInStock")}</Label>
        <Switch id="in-stock-switch" checked={inStock} onCheckedChange={(v) => { setInStock(v || null); onNavigate?.(); }} />
      </div>

      <Separator />

      <FacetGroup title={t("filterPrice")}>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="¥0"
            defaultValue={minPrice ?? ""}
            onBlur={(e) => { setMinPrice(e.target.value ? Number(e.target.value) : null); onNavigate?.(); }}
            className="h-9"
          />
          <span className="text-foreground-muted">–</span>
          <Input
            type="number"
            placeholder="¥30,000"
            defaultValue={maxPrice ?? ""}
            onBlur={(e) => { setMaxPrice(e.target.value ? Number(e.target.value) : null); onNavigate?.(); }}
            className="h-9"
          />
        </div>
      </FacetGroup>

      {facets.origins.length > 0 && (
        <FacetGroup title={t("filterOrigin")}>
          {facets.origins.map((o) => (
            <FacetCheckbox key={o} checked={origin.includes(o)} onChange={() => toggle(origin, setOrigin, o)} label={o} />
          ))}
        </FacetGroup>
      )}

      {facets.feeds.length > 0 && (
        <FacetGroup title={t("filterFeed")}>
          {facets.feeds.map((f) => (
            <FacetCheckbox key={f} checked={feed.includes(f)} onChange={() => toggle(feed, setFeed, f)} label={labelize(f)} />
          ))}
        </FacetGroup>
      )}

      {facets.grades.length > 0 && (
        <FacetGroup title={t("filterGrade")}>
          {facets.grades.map((g) => (
            <FacetCheckbox key={g} checked={grade.includes(g)} onChange={() => toggle(grade, setGrade, g)} label={labelize(g)} />
          ))}
        </FacetGroup>
      )}

      {facets.cuts.length > 0 && (
        <FacetGroup title={t("filterCut")}>
          {facets.cuts.map((c) => (
            <FacetCheckbox key={c} checked={cut.includes(c)} onChange={() => toggle(cut, setCut, c)} label={labelize(c)} />
          ))}
        </FacetGroup>
      )}

      {onNavigate && (
        <Button onClick={onNavigate} className="w-full">
          {t("filters")}
        </Button>
      )}
    </div>
  );
}

function FacetGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">{title}</p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function FacetCheckbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      {label}
    </label>
  );
}
