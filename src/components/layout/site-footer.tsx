import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PRIMARY_CATEGORIES } from "@/lib/nav";
import { Beef, Snowflake, Truck, ShieldCheck } from "lucide-react";

export async function SiteFooter() {
  const t = await getTranslations("footer");

  return (
    <footer className="print-hide mt-24 border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-2 gap-8 border-b border-border pb-10 sm:grid-cols-4">
          <TrustItem icon={<Snowflake className="size-5" />} title={t("trust.frozen.title")} desc={t("trust.frozen.desc")} />
          <TrustItem icon={<Truck className="size-5" />} title={t("trust.delivery.title")} desc={t("trust.delivery.desc")} />
          <TrustItem icon={<Beef className="size-5" />} title={t("trust.sourcing.title")} desc={t("trust.sourcing.desc")} />
          <TrustItem icon={<ShieldCheck className="size-5" />} title={t("trust.secure.title")} desc={t("trust.secure.desc")} />
        </div>

        <div className="grid grid-cols-2 gap-8 py-10 sm:grid-cols-4">
          <div>
            <p className="font-display text-lg">Whole Cuts</p>
            <p className="mt-2 text-sm text-foreground-muted">{t("tagline")}</p>
          </div>
          <FooterCol title={t("cols.shop")}>
            {PRIMARY_CATEGORIES.map((c) => (
              <Link key={c.slug} href={`/collections/${c.slug}`} className="block py-1 text-sm text-foreground-muted hover:text-foreground">
                {c.labelEn}
              </Link>
            ))}
          </FooterCol>
          <FooterCol title={t("cols.help")}>
            <Link href="/shipping" className="block py-1 text-sm text-foreground-muted hover:text-foreground">{t("links.shipping")}</Link>
            <Link href="/frozen-handling" className="block py-1 text-sm text-foreground-muted hover:text-foreground">{t("links.frozenHandling")}</Link>
            <Link href="/faq" className="block py-1 text-sm text-foreground-muted hover:text-foreground">{t("links.faq")}</Link>
            <Link href="/contact" className="block py-1 text-sm text-foreground-muted hover:text-foreground">{t("links.contact")}</Link>
          </FooterCol>
          <FooterCol title={t("cols.company")}>
            <Link href="/about" className="block py-1 text-sm text-foreground-muted hover:text-foreground">{t("links.about")}</Link>
            <Link href="/privacy" className="block py-1 text-sm text-foreground-muted hover:text-foreground">{t("links.privacy")}</Link>
            <Link href="/terms" className="block py-1 text-sm text-foreground-muted hover:text-foreground">{t("links.terms")}</Link>
            <Link href="/tokushoho" className="block py-1 text-sm text-foreground-muted hover:text-foreground">{t("links.tokushoho")}</Link>
          </FooterCol>
        </div>

        <p className="border-t border-border pt-6 text-xs text-foreground-muted">
          © {new Date().getFullYear()} Whole Cuts. {t("rights")}
        </p>
      </div>
    </footer>
  );
}

function TrustItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 py-6">
      <span className="text-primary">{icon}</span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-foreground-muted">{desc}</p>
      </div>
    </div>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
