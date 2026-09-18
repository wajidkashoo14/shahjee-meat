"use client";
import { useTransition } from "react";
import { Trash2, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { deleteAddressAction, setDefaultAddressAction } from "@/server/actions/account-actions";

export function AddressActions({ addressId, isDefault }: { addressId: string; isDefault: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations("account.addresses");

  return (
    <div className="flex gap-2">
      {!isDefault && (
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => startTransition(async () => { await setDefaultAddressAction(addressId); router.refresh(); })}
        >
          <Star className="size-4" /> {t("setDefault")}
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => startTransition(async () => { await deleteAddressAction(addressId); router.refresh(); })}
      >
        <Trash2 className="size-4 text-sale" />
      </Button>
    </div>
  );
}
