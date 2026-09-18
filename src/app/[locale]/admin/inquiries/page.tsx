import { listInquiriesAdmin } from "@/server/admin";
import { InquiryRow } from "@/components/admin/inquiry-row";

export default async function AdminInquiriesPage() {
  const inquiries = await listInquiriesAdmin();

  return (
    <div className="flex flex-col gap-4">
      {inquiries.map((i) => (
        <InquiryRow key={i.id} inquiry={i} />
      ))}
      {inquiries.length === 0 && <p className="py-8 text-center text-foreground-muted">No inquiries yet.</p>}
    </div>
  );
}
