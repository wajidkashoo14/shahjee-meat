import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PRIMARY_CATEGORIES } from "@/lib/nav";
import { Beef, Snowflake, Truck, ShieldCheck } from "lucide-react";

const linkClass = "block py-1 text-sm text-foreground-inverse-muted transition-colors hover:text-foreground-inverse";

export async function SiteFooter() {
  const t = await getTranslations("footer");

  return (
    <footer className="print-hide mt-24 bg-surface-inverse text-foreground-inverse">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-x-6 border-b border-border-inverse pb-8 sm:grid-cols-4">
          <TrustItem icon={<Snowflake className="size-5" />} title={t("trust.frozen.title")} desc={t("trust.frozen.desc")} />
          <TrustItem icon={<Truck className="size-5" />} title={t("trust.delivery.title")} desc={t("trust.delivery.desc")} />
          <TrustItem icon={<Beef className="size-5" />} title={t("trust.sourcing.title")} desc={t("trust.sourcing.desc")} />
          <TrustItem icon={<ShieldCheck className="size-5" />} title={t("trust.secure.title")} desc={t("trust.secure.desc")} />
        </div>

        <div className="grid grid-cols-2 gap-8 py-10 sm:grid-cols-4">
          <div>
            <p className="font-display text-2xl">Whole Cuts</p>
            <p className="mt-2 text-sm text-foreground-inverse-muted">{t("tagline")}</p>
          </div>
          <FooterCol title={t("cols.shop")}>
            {PRIMARY_CATEGORIES.map((c) => (
              <Link key={c.slug} href={`/collections/${c.slug}`} className={linkClass}>
                {c.labelEn}
              </Link>
            ))}
          </FooterCol>
          <FooterCol title={t("cols.help")}>
            <Link href="/shipping" className={linkClass}>{t("links.shipping")}</Link>
            <Link href="/frozen-handling" className={linkClass}>{t("links.frozenHandling")}</Link>
            <Link href="/faq" className={linkClass}>{t("links.faq")}</Link>
            <Link href="/contact" className={linkClass}>{t("links.contact")}</Link>
          </FooterCol>
          <FooterCol title={t("cols.company")}>
            <Link href="/about" className={linkClass}>{t("links.about")}</Link>
            <Link href="/privacy" className={linkClass}>{t("links.privacy")}</Link>
            <Link href="/terms" className={linkClass}>{t("links.terms")}</Link>
            <Link href="/tokushoho" className={linkClass}>{t("links.tokushoho")}</Link>
          </FooterCol>
        </div>

        <p className="border-t border-border-inverse pt-6 text-xs text-foreground-inverse-muted">
          © {new Date().getFullYear()} Whole Cuts. {t("rights")}
        </p>
      </div>
    </footer>
  );
}

function TrustItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 py-4">
      <span className="mt-0.5 text-foreground-inverse">{icon}</span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-foreground-inverse-muted">{desc}</p>
      </div>
    </div>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-foreground-inverse">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}
