"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveProductAction, deleteProductAction } from "@/server/actions/admin-actions";
import { slugify } from "@/lib/utils";
import { PRIMARY_CATEGORIES } from "@/lib/nav";

type VariantRow = {
  id?: string;
  labelEn: string;
  labelJa: string;
  weightGrams: number;
  priceJpy: number;
  compareAtPriceJpy: number | null;
  stock: number;
};

type ProductFormValue = {
  id?: string;
  slug: string;
  nameEn: string;
  nameJa: string;
  subtitleEn: string;
  subtitleJa: string;
  descriptionEn: string;
  descriptionJa: string;
  cookingGuideEn: string;
  cookingGuideJa: string;
  origin: string;
  feed: string;
  grade: string;
  cut: string;
  category: string;
  tags: string;
  status: "draft" | "published" | "scheduled";
  isNewArrival: boolean;
  images: string[];
  variants: VariantRow[];
};

const emptyVariant = (): VariantRow => ({ labelEn: "", labelJa: "", weightGrams: 500, priceJpy: 0, compareAtPriceJpy: null, stock: 0 });

export function ProductForm({ initial }: { initial?: Partial<ProductFormValue> & { id?: string } }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState<ProductFormValue>({
    id: initial?.id,
    slug: initial?.slug ?? "",
    nameEn: initial?.nameEn ?? "",
    nameJa: initial?.nameJa ?? "",
    subtitleEn: initial?.subtitleEn ?? "",
    subtitleJa: initial?.subtitleJa ?? "",
    descriptionEn: initial?.descriptionEn ?? "",
    descriptionJa: initial?.descriptionJa ?? "",
    cookingGuideEn: initial?.cookingGuideEn ?? "",
    cookingGuideJa: initial?.cookingGuideJa ?? "",
    origin: initial?.origin ?? "",
    feed: initial?.feed ?? "",
    grade: initial?.grade ?? "",
    cut: initial?.cut ?? "",
    category: initial?.category ?? "beef",
    tags: initial?.tags ?? "",
    status: initial?.status ?? "published",
    isNewArrival: initial?.isNewArrival ?? false,
    images: initial?.images?.length ? initial.images : [""],
    variants: initial?.variants?.length ? initial.variants : [emptyVariant()],
  });

  function set<K extends keyof ProductFormValue>(key: K, v: ProductFormValue[K]) {
    setValue((prev) => ({ ...prev, [key]: v }));
  }

  function updateVariant(i: number, patch: Partial<VariantRow>) {
    setValue((prev) => ({ ...prev, variants: prev.variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)) }));
  }

  function submit() {
    if (!value.nameEn || !value.nameJa || value.variants.length === 0) {
      toast.error("Name (EN/JA) and at least one variant are required.");
      return;
    }
    startTransition(async () => {
      const res = await saveProductAction({
        ...value,
        slug: value.slug || slugify(value.nameEn),
        tags: value.tags.split(",").map((t) => t.trim()).filter(Boolean),
        images: value.images.filter(Boolean),
        variants: value.variants,
      });
      if (res.ok) {
        toast.success("Product saved.");
        router.push(`/admin/products/${res.productId}`);
        router.refresh();
      }
    });
  }

  function handleDelete() {
    if (!value.id || !window.confirm("Delete this product permanently?")) return;
    startTransition(async () => {
      await deleteProductAction(value.id!);
      router.push("/admin/products");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader><CardTitle>Basics</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name (English)"><Input value={value.nameEn} onChange={(e) => set("nameEn", e.target.value)} /></Field>
          <Field label="Name (Japanese)"><Input value={value.nameJa} onChange={(e) => set("nameJa", e.target.value)} /></Field>
          <Field label="Subtitle (English)"><Input value={value.subtitleEn} onChange={(e) => set("subtitleEn", e.target.value)} /></Field>
          <Field label="Subtitle (Japanese)"><Input value={value.subtitleJa} onChange={(e) => set("subtitleJa", e.target.value)} /></Field>
          <Field label="Slug"><Input value={value.slug} onChange={(e) => set("slug", e.target.value)} placeholder={slugify(value.nameEn) || "auto-generated"} /></Field>
          <Field label="Category">
            <Select value={value.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIMARY_CATEGORIES.filter((c) => c.slug !== "new-arrivals").map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>{c.labelEn}</SelectItem>
                ))}
                <SelectItem value="spices">Spices</SelectItem>
                <SelectItem value="frozen">Other Frozen</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Origin"><Input value={value.origin} onChange={(e) => set("origin", e.target.value)} placeholder="Australia" /></Field>
          <Field label="Feed"><Input value={value.feed} onChange={(e) => set("feed", e.target.value)} placeholder="grass-fed / grain-fed / organic" /></Field>
          <Field label="Grade"><Input value={value.grade} onChange={(e) => set("grade", e.target.value)} placeholder="wagyu / prime" /></Field>
          <Field label="Cut"><Input value={value.cut} onChange={(e) => set("cut", e.target.value)} placeholder="ribeye" /></Field>
          <Field label="Tags (comma separated)" full><Input value={value.tags} onChange={(e) => set("tags", e.target.value)} placeholder="grass-fed, australia, steaks" /></Field>
          <Field label="Status">
            <Select value={value.status} onValueChange={(v) => set("status", v as ProductFormValue["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={value.isNewArrival} onCheckedChange={(v) => set("isNewArrival", !!v)} />
              Mark as New Arrival
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Content</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Description (English)" full><Textarea rows={4} value={value.descriptionEn} onChange={(e) => set("descriptionEn", e.target.value)} /></Field>
          <Field label="Description (Japanese)" full><Textarea rows={4} value={value.descriptionJa} onChange={(e) => set("descriptionJa", e.target.value)} /></Field>
          <Field label="Cooking guide (English)" full><Textarea rows={3} value={value.cookingGuideEn} onChange={(e) => set("cookingGuideEn", e.target.value)} /></Field>
          <Field label="Cooking guide (Japanese)" full><Textarea rows={3} value={value.cookingGuideJa} onChange={(e) => set("cookingGuideJa", e.target.value)} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Images (URLs)</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-2">
          {value.images.map((url, i) => (
            <div key={i} className="flex gap-2">
              <Input value={url} onChange={(e) => setValue((p) => ({ ...p, images: p.images.map((u, idx) => (idx === i ? e.target.value : u)) }))} placeholder="https://…" />
              <Button variant="ghost" size="icon" onClick={() => setValue((p) => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }))}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button variant="secondary" size="sm" className="self-start" onClick={() => setValue((p) => ({ ...p, images: [...p.images, ""] }))}>
            <Plus className="size-4" /> Add image
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Variants (weight options)</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          {value.variants.map((v, i) => (
            <div key={i} className="grid grid-cols-2 gap-3 rounded-xl border border-border p-4 sm:grid-cols-6">
              <Field label="Label (EN)"><Input value={v.labelEn} onChange={(e) => updateVariant(i, { labelEn: e.target.value })} placeholder="0.6Kg~0.8Kg" /></Field>
              <Field label="Label (JA)"><Input value={v.labelJa} onChange={(e) => updateVariant(i, { labelJa: e.target.value })} placeholder="0.6kg〜0.8kg" /></Field>
              <Field label="Weight (g)"><Input type="number" value={v.weightGrams} onChange={(e) => updateVariant(i, { weightGrams: Number(e.target.value) })} /></Field>
              <Field label="Price (¥)"><Input type="number" value={v.priceJpy} onChange={(e) => updateVariant(i, { priceJpy: Number(e.target.value) })} /></Field>
              <Field label="Compare-at (¥)"><Input type="number" value={v.compareAtPriceJpy ?? ""} onChange={(e) => updateVariant(i, { compareAtPriceJpy: e.target.value ? Number(e.target.value) : null })} /></Field>
              <div className="flex items-end gap-2">
                <Field label="Stock"><Input type="number" value={v.stock} onChange={(e) => updateVariant(i, { stock: Number(e.target.value) })} /></Field>
                <Button variant="ghost" size="icon" onClick={() => setValue((p) => ({ ...p, variants: p.variants.filter((_, idx) => idx !== i) }))}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button variant="secondary" size="sm" className="self-start" onClick={() => setValue((p) => ({ ...p, variants: [...p.variants, emptyVariant()] }))}>
            <Plus className="size-4" /> Add variant
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-between gap-3">
        {value.id ? (
          <Button variant="outline" onClick={handleDelete} disabled={pending}>
            <Trash2 className="size-4" /> Delete product
          </Button>
        ) : <span />}
        <Button onClick={submit} disabled={pending} size="lg">
          {pending && <Loader2 className="size-4 animate-spin" />}
          Save product
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
