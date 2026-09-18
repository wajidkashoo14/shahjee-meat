"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveCollectionAction } from "@/server/actions/admin-actions";
import { useRouter } from "@/i18n/navigation";
import type { collections } from "@/db/schema";

type Collection = typeof collections.$inferSelect;

export function CollectionFormDialog({ collection }: { collection?: Collection }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [value, setValue] = useState({
    slug: collection?.slug ?? "",
    titleEn: collection?.titleEn ?? "",
    titleJa: collection?.titleJa ?? "",
    descriptionEn: collection?.descriptionEn ?? "",
    descriptionJa: collection?.descriptionJa ?? "",
    heroImage: collection?.heroImage ?? "https://picsum.photos/seed/new-collection/800/600",
    kind: (collection?.kind as "manual" | "rule") ?? "manual",
    ruleTag: collection?.ruleTag ?? "",
    sortOrder: collection?.sortOrder ?? 0,
  });

  function submit() {
    startTransition(async () => {
      await saveCollectionAction({ id: collection?.id, ...value });
      toast.success("Collection saved.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={collection ? "ghost" : "primary"} size="sm">
          {collection ? <Pencil className="size-4" /> : <Plus className="size-4" />}
          {collection ? "Edit" : "New collection"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{collection ? "Edit collection" : "New collection"}</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Title (EN)</Label><Input className="mt-1" value={value.titleEn} onChange={(e) => setValue((p) => ({ ...p, titleEn: e.target.value }))} /></div>
            <div><Label>Title (JA)</Label><Input className="mt-1" value={value.titleJa} onChange={(e) => setValue((p) => ({ ...p, titleJa: e.target.value }))} /></div>
          </div>
          <div><Label>Slug</Label><Input className="mt-1" value={value.slug} onChange={(e) => setValue((p) => ({ ...p, slug: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Description (EN)</Label><Textarea className="mt-1" rows={2} value={value.descriptionEn} onChange={(e) => setValue((p) => ({ ...p, descriptionEn: e.target.value }))} /></div>
            <div><Label>Description (JA)</Label><Textarea className="mt-1" rows={2} value={value.descriptionJa} onChange={(e) => setValue((p) => ({ ...p, descriptionJa: e.target.value }))} /></div>
          </div>
          <div><Label>Hero image URL</Label><Input className="mt-1" value={value.heroImage} onChange={(e) => setValue((p) => ({ ...p, heroImage: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Kind</Label>
              <Select value={value.kind} onValueChange={(v) => setValue((p) => ({ ...p, kind: v as "manual" | "rule" }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual (matches category)</SelectItem>
                  <SelectItem value="rule">Rule-based (matches a tag)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Rule tag</Label><Input className="mt-1" value={value.ruleTag} onChange={(e) => setValue((p) => ({ ...p, ruleTag: e.target.value }))} placeholder="grass-fed" disabled={value.kind !== "rule"} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={pending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
