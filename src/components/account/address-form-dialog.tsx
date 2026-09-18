"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AddressFields, type AddressValue } from "@/components/checkout/address-fields";
import { saveAddressAction } from "@/server/actions/account-actions";
import { useRouter } from "@/i18n/navigation";
import type { addresses } from "@/db/schema";

type Address = typeof addresses.$inferSelect;

export function AddressFormDialog({ address, trigger }: { address?: Address; trigger?: React.ReactNode }) {
  const t = useTranslations("account.addresses");
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(address?.label ?? "Home");
  const [isDefault, setIsDefault] = useState(address?.isDefault ?? false);
  const [value, setValue] = useState<AddressValue>({
    fullName: address?.fullName ?? "",
    fullNameKana: address?.fullNameKana ?? "",
    phone: address?.phone ?? "",
    postalCode: address?.postalCode ?? "",
    prefecture: address?.prefecture ?? "",
    city: address?.city ?? "",
    addressLine1: address?.addressLine1 ?? "",
    addressLine2: address?.addressLine2 ?? "",
  });
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    startTransition(async () => {
      await saveAddressAction({ id: address?.id, label, isDefault, ...value });
      toast.success(t("saved"));
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="secondary" size="sm">
            {address ? <Pencil className="size-4" /> : <Plus className="size-4" />}
            {address ? t("editAddress") : t("addNew")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{address ? t("editAddress") : t("addNew")}</DialogTitle>
        </DialogHeader>
        <div className="mb-4">
          <label className="text-sm font-medium">{t("label")}</label>
          <input
            className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-2 text-sm"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
        <AddressFields value={value} onChange={setValue} />
        <label className="mt-3 flex items-center gap-2 text-sm">
          <Checkbox checked={isDefault} onCheckedChange={(v) => setIsDefault(!!v)} />
          {t("setDefault")}
        </label>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={submit} disabled={pending}>
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
