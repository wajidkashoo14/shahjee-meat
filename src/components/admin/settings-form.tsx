"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { saveSettingAction } from "@/server/actions/admin-actions";

export function SettingsForm({
  freeShippingThreshold,
  taxRate,
  leadTimeDays,
  tokushohoText,
}: {
  freeShippingThreshold: number;
  taxRate: number;
  leadTimeDays: number;
  tokushohoText: string;
}) {
  const [threshold, setThreshold] = useState(freeShippingThreshold);
  const [rate, setRate] = useState(taxRate);
  const [lead, setLead] = useState(leadTimeDays);
  const [tokushoho, setTokushoho] = useState(tokushohoText);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function save() {
    startTransition(async () => {
      await Promise.all([
        saveSettingAction("free_shipping_threshold_jpy", threshold),
        saveSettingAction("reduced_tax_rate", rate),
        saveSettingAction("delivery_lead_time_business_days", lead),
        saveSettingAction("tokushoho_text", tokushoho),
      ]);
      toast.success("Settings saved.");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader><CardTitle>Store settings</CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label>Free shipping threshold (¥)</Label>
            <Input type="number" className="mt-1" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />
          </div>
          <div>
            <Label>Reduced tax rate (0–1)</Label>
            <Input type="number" step="0.01" className="mt-1" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
          </div>
          <div>
            <Label>Delivery lead time (business days)</Label>
            <Input type="number" className="mt-1" value={lead} onChange={(e) => setLead(Number(e.target.value))} />
          </div>
        </div>
        <div>
          <Label>特定商取引法に基づく表記 (Tokushoho legal text)</Label>
          <Textarea className="mt-1" rows={6} value={tokushoho} onChange={(e) => setTokushoho(e.target.value)} />
        </div>
        <Button onClick={save} disabled={pending} className="self-start">Save settings</Button>
      </CardContent>
    </Card>
  );
}
