import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getOrderForUser } from "@/server/account";
import { formatJpy } from "@/lib/utils";
import { taxInclusiveBreakdown } from "@/lib/tax";
import { PrintButton } from "@/components/account/print-button";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const locale = await getLocale();
  const order = await getOrderForUser(id, session!.user.id);
  if (!order) notFound();

  const { exclusive, tax } = taxInclusiveBreakdown(order.totalJpy);
  const isJa = locale === "ja";

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="print-hide mb-6 flex justify-end">
        <PrintButton />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-10">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl">Whole Cuts</h1>
            <p className="text-sm text-foreground-muted">{isJa ? "領収書" : "Receipt"}</p>
          </div>
          <div className="text-right text-sm text-foreground-muted">
            <p>{order.orderNumber}</p>
            <p>{order.createdAt.toLocaleDateString(isJa ? "ja-JP" : "en-US")}</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="font-medium text-foreground-muted">{isJa ? "お届け先" : "Ship to"}</p>
            <p className="mt-1">{order.shippingName}</p>
            <p>
              〒{order.shippingPostalCode} {order.shippingPrefecture}
              {order.shippingCity}
            </p>
            <p>{order.shippingAddressLine1}</p>
          </div>
          <div>
            <p className="font-medium text-foreground-muted">{isJa ? "お支払い方法" : "Payment method"}</p>
            <p className="mt-1 uppercase">{order.paymentMethod}</p>
          </div>
        </div>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-foreground-muted">
              <th className="pb-2 font-medium">{isJa ? "商品" : "Item"}</th>
              <th className="pb-2 text-right font-medium">{isJa ? "数量" : "Qty"}</th>
              <th className="pb-2 text-right font-medium">{isJa ? "金額" : "Amount"}</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-border">
                <td className="py-2">
                  {isJa ? item.nameJa : item.nameEn} ({isJa ? item.variantLabelJa : item.variantLabelEn})
                </td>
                <td className="py-2 text-right tabular-nums">{item.quantity}</td>
                <td className="py-2 text-right tabular-nums">{formatJpy(item.lineTotalJpy)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex flex-col items-end gap-1 text-sm">
          <div className="flex w-48 justify-between">
            <span className="text-foreground-muted">{isJa ? "小計（税抜）" : "Subtotal (excl. tax)"}</span>
            <span className="tabular-nums">{formatJpy(exclusive)}</span>
          </div>
          <div className="flex w-48 justify-between">
            <span className="text-foreground-muted">{isJa ? "消費税（8%）" : "Tax (8%)"}</span>
            <span className="tabular-nums">{formatJpy(tax)}</span>
          </div>
          <div className="flex w-48 justify-between font-semibold">
            <span>{isJa ? "合計" : "Total"}</span>
            <span className="tabular-nums">{formatJpy(order.totalJpy)}</span>
          </div>
        </div>

        <p className="mt-10 text-xs text-foreground-muted">
          Whole Cuts LLC — 1-1-1 Jingumae, Shibuya-ku, Tokyo 150-0001, Japan — support@wholecuts.example
        </p>
      </div>
    </div>
  );
}
