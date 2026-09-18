import { setRequestLocale, getTranslations } from "next-intl/server";
import { ContactForm } from "@/components/shop/contact-form";

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl">{t("title")}</h1>
      <p className="mt-3 text-foreground-muted">{t("subtitle")}</p>
      <div className="mt-8">
        <ContactForm />
      </div>
    </div>
  );
}
