import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/db";
import { Clock, ChefHat, Users } from "lucide-react";

export const revalidate = 60;

export default async function RecipesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("recipes");
  const recipes = await db.query.recipes.findMany({
    where: (r, { eq }) => eq(r.status, "published"),
    orderBy: (r, { desc }) => [desc(r.createdAt)],
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-5xl">{t("title")}</h1>
      <p className="mt-3 max-w-2xl text-foreground-muted">{t("subtitle")}</p>

      <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map((r) => (
          <Link key={r.id} href={`/recipes/${r.slug}`} className="group flex flex-col">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
              <Image
                src={r.heroImage}
                alt={locale === "ja" ? r.titleJa : r.titleEn}
                fill
                sizes="(min-width: 1024px) 33vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <h2 className="mt-3 font-display text-xl group-hover:text-primary">{locale === "ja" ? r.titleJa : r.titleEn}</h2>
            <p className="mt-1 text-sm text-foreground-muted">{locale === "ja" ? r.excerptJa : r.excerptEn}</p>
            <div className="mt-3 flex items-center gap-4 text-xs text-foreground-muted">
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" /> {r.cookTimeMinutes} {t("minutes")}
              </span>
              <span className="flex items-center gap-1">
                <ChefHat className="size-3.5" /> {t(`difficulty.${r.difficulty}`)}
              </span>
              <span className="flex items-center gap-1">
                <Users className="size-3.5" /> {r.servings}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
