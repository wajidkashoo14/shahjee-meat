import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listAllCollections } from "@/server/catalog";

export const revalidate = 60;

export default async function CollectionsIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const collections = await listAllCollections();

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-5xl">{locale === "ja" ? "コレクション" : "Collections"}</h1>
      <p className="mt-3 max-w-2xl text-foreground-muted">
        {locale === "ja"
          ? "牛肉、豚肉、シャルキュトリーからスパイスまで、カテゴリーからお探しください。"
          : "Browse beef, pork, charcuterie and more — or dive into a curated cut like grass-fed or Wagyu."}
      </p>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c) => (
          <Link key={c.id} href={`/collections/${c.slug}`} className="group relative overflow-hidden rounded-2xl">
            <div className="relative aspect-[4/3]">
              <Image
                src={c.heroImage}
                alt={locale === "ja" ? c.titleJa : c.titleEn}
                fill
                sizes="(min-width: 1024px) 33vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/10 to-transparent" />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-5">
              <h2 className="font-display text-2xl text-bone">{locale === "ja" ? c.titleJa : c.titleEn}</h2>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
