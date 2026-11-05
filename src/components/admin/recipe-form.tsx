"use client";
import { recipePhoto } from "@/db/photos";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveRecipeAction, deleteRecipeAction } from "@/server/actions/admin-actions";
import { slugify } from "@/lib/utils";

type ProductOption = { id: string; nameEn: string };

type RecipeFormValue = {
  id?: string;
  slug: string;
  titleEn: string;
  titleJa: string;
  excerptEn: string;
  excerptJa: string;
  bodyEn: string;
  bodyJa: string;
  heroImage: string;
  category: string;
  cookTimeMinutes: number;
  difficulty: "easy" | "medium" | "hard";
  servings: number;
  status: "draft" | "published";
  productIds: string[];
};

export function RecipeForm({ initial, products }: { initial?: Partial<RecipeFormValue> & { id?: string }; products: ProductOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState<RecipeFormValue>({
    id: initial?.id,
    slug: initial?.slug ?? "",
    titleEn: initial?.titleEn ?? "",
    titleJa: initial?.titleJa ?? "",
    excerptEn: initial?.excerptEn ?? "",
    excerptJa: initial?.excerptJa ?? "",
    bodyEn: initial?.bodyEn ?? "",
    bodyJa: initial?.bodyJa ?? "",
    heroImage: initial?.heroImage ?? recipePhoto("grill", "new"),
    category: initial?.category ?? "grill",
    cookTimeMinutes: initial?.cookTimeMinutes ?? 30,
    difficulty: initial?.difficulty ?? "easy",
    servings: initial?.servings ?? 2,
    status: initial?.status ?? "published",
    productIds: initial?.productIds ?? [],
  });

  function set<K extends keyof RecipeFormValue>(key: K, v: RecipeFormValue[K]) {
    setValue((p) => ({ ...p, [key]: v }));
  }

  function toggleProduct(id: string) {
    setValue((p) => ({ ...p, productIds: p.productIds.includes(id) ? p.productIds.filter((x) => x !== id) : [...p.productIds, id] }));
  }

  function submit() {
    if (!value.titleEn || !value.titleJa) {
      toast.error("Title (EN/JA) is required.");
      return;
    }
    startTransition(async () => {
      const res = await saveRecipeAction({ ...value, slug: value.slug || slugify(value.titleEn) });
      if (res.ok) {
        toast.success("Recipe saved.");
        router.push(`/admin/recipes/${res.recipeId}`);
        router.refresh();
      }
    });
  }

  function handleDelete() {
    if (!value.id || !window.confirm("Delete this recipe?")) return;
    startTransition(async () => {
      await deleteRecipeAction(value.id!);
      router.push("/admin/recipes");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader><CardTitle>Basics</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Title (EN)"><Input value={value.titleEn} onChange={(e) => set("titleEn", e.target.value)} /></Field>
          <Field label="Title (JA)"><Input value={value.titleJa} onChange={(e) => set("titleJa", e.target.value)} /></Field>
          <Field label="Slug"><Input value={value.slug} onChange={(e) => set("slug", e.target.value)} placeholder={slugify(value.titleEn)} /></Field>
          <Field label="Hero image URL"><Input value={value.heroImage} onChange={(e) => set("heroImage", e.target.value)} /></Field>
          <Field label="Category">
            <Select value={value.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["grill", "oven", "stew", "raw", "bbq"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Difficulty">
            <Select value={value.difficulty} onValueChange={(v) => set("difficulty", v as RecipeFormValue["difficulty"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Cook time (minutes)"><Input type="number" value={value.cookTimeMinutes} onChange={(e) => set("cookTimeMinutes", Number(e.target.value))} /></Field>
          <Field label="Servings"><Input type="number" value={value.servings} onChange={(e) => set("servings", Number(e.target.value))} /></Field>
          <Field label="Status">
            <Select value={value.status} onValueChange={(v) => set("status", v as RecipeFormValue["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Content</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Excerpt (EN)" full><Textarea rows={2} value={value.excerptEn} onChange={(e) => set("excerptEn", e.target.value)} /></Field>
          <Field label="Excerpt (JA)" full><Textarea rows={2} value={value.excerptJa} onChange={(e) => set("excerptJa", e.target.value)} /></Field>
          <Field label="Body (EN, markdown-ish)" full><Textarea rows={6} value={value.bodyEn} onChange={(e) => set("bodyEn", e.target.value)} /></Field>
          <Field label="Body (JA, markdown-ish)" full><Textarea rows={6} value={value.bodyJa} onChange={(e) => set("bodyJa", e.target.value)} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Linked products</CardTitle></CardHeader>
        <CardContent>
          <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
            {products.map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-sm">
                <Checkbox checked={value.productIds.includes(p.id)} onCheckedChange={() => toggleProduct(p.id)} />
                {p.nameEn}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        {value.id ? (
          <Button variant="outline" onClick={handleDelete} disabled={pending}><Trash2 className="size-4" /> Delete recipe</Button>
        ) : <span />}
        <Button onClick={submit} disabled={pending} size="lg">
          {pending && <Loader2 className="size-4 animate-spin" />} Save recipe
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
