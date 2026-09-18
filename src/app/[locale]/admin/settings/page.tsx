import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSetting, listShippingZonesAdmin } from "@/server/admin";
import { SettingsForm } from "@/components/admin/settings-form";
import { ShippingZonesTable } from "@/components/admin/shipping-zones-table";

export default async function AdminSettingsPage() {
  const [threshold, taxRate, leadTime, tokushoho, zones] = await Promise.all([
    getSetting("free_shipping_threshold_jpy"),
    getSetting("reduced_tax_rate"),
    getSetting("delivery_lead_time_business_days"),
    getSetting("tokushoho_text"),
    listShippingZonesAdmin(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <SettingsForm
        freeShippingThreshold={threshold ?? 15000}
        taxRate={taxRate ?? 0.08}
        leadTimeDays={leadTime ?? 2}
        tokushohoText={tokushoho ?? ""}
      />
      <Card>
        <CardHeader><CardTitle>Shipping zones (per prefecture)</CardTitle></CardHeader>
        <CardContent>
          <ShippingZonesTable zones={zones} />
        </CardContent>
      </Card>
    </div>
  );
}
