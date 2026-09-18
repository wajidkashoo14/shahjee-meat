import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getProductBySlug, getRelatedProducts, getAdjacentProducts, toCardData } from "@/server/catalog";
import { db } from "@/db";
import { reviews as reviewsTable, questions as questionsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ProductGallery } from "@/components/shop/product-gallery";
import { BuyBox } from "@/components/shop/buy-box";
import { ProductTabs } from "@/components/shop/product-tabs";
import { BulkInquiryForm } from "@/components/shop/bulk-inquiry-form";
import { ProductRow } from "@/components/shop/product-row";
import { isWishlistedAction } from "@/server/actions/engagement-actions";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { slug, locale } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const name = locale === "ja" ? product.nameJa : product.nameEn;
  const desc = (locale === "ja" ? product.descriptionJa : product.descriptionEn).slice(0, 155);
  return {
    title: product.seoTitle || name,
    description: product.seoDescription || desc,
    openGraph: { title: name, description: desc, images: [] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("product");

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, adjacent, reviewsRows, questionRows, wishlisted] = await Promise.all([
    getRelatedProducts(product.id, product.category),
    getAdjacentProducts(product.category, product.createdAt),
    db.query.reviews.findMany({
      where: eq(reviewsTable.productId, product.id),
      with: { images: true },
      orderBy: (r, { desc }) => [desc(r.createdAt)],
    }),
    db.query.questions.findMany({
      where: eq(questionsTable.productId, product.id),
      with: { answers: true },
      orderBy: (q, { desc }) => [desc(q.createdAt)],
    }),
    isWishlistedAction(product.id),
  ]);

  const approvedReviews = reviewsRows.filter((r) => r.status === "approved");
  const answeredQA = questionRows.filter((q) => q.status === "answered");
  const name = locale === "ja" ? product.nameJa : product.nameEn;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: locale === "ja" ? product.descriptionJa : product.descriptionEn,
    image: product.images.map((i) => i.url),
    offers: product.variants.map((v) => ({
      "@type": "Offer",
      priceCurrency: "JPY",
      price: v.priceJpy,
      availability: v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    })),
    ...(product.ratingCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.ratingAvg, reviewCount: product.ratingCount } }
      : {}),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="mb-6 text-xs text-foreground-muted">
        <Link href="/">Home</Link> <span className="mx-1">/</span>
        <Link href={`/collections/${product.category}`}>{product.category}</Link> <span className="mx-1">/</span>
        <span className="text-foreground">{name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} name={name} />
        <BuyBox product={product} variants={product.variants} initiallyWishlisted={wishlisted} />
      </div>

      <ProductTabs product={product} reviews={approvedReviews} qa={answeredQA} />

      <div className="mt-16">
        <BulkInquiryForm productId={product.id} productName={name} />
      </div>

      {related.length > 0 && (
        <div className="mt-20">
          <ProductRow title={t("relatedProducts")} items={related.map((r) => toCardData(r))} />
        </div>
      )}

      <div className="mt-16 flex items-center justify-between border-t border-border pt-6 text-sm">
        {adjacent.prev ? (
          <Link href={`/products/${adjacent.prev.slug}`} className="flex items-center gap-1 text-foreground-muted hover:text-foreground">
            <ChevronLeft className="size-4" /> {t("previousProduct")}
          </Link>
        ) : (
          <span />
        )}
        {adjacent.next ? (
          <Link href={`/products/${adjacent.next.slug}`} className="flex items-center gap-1 text-foreground-muted hover:text-foreground">
            {t("nextProduct")} <ChevronRight className="size-4" />
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
