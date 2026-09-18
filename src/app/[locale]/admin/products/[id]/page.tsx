import { notFound } from "next/navigation";
import { getProductAdmin } from "@/server/admin";
import { ProductForm } from "@/components/admin/product-form";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductAdmin(id);
  if (!product) notFound();

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Edit product</h1>
      <ProductForm
        initial={{
          id: product.id,
          slug: product.slug,
          nameEn: product.nameEn,
          nameJa: product.nameJa,
          subtitleEn: product.subtitleEn,
          subtitleJa: product.subtitleJa,
          descriptionEn: product.descriptionEn,
          descriptionJa: product.descriptionJa,
          cookingGuideEn: product.cookingGuideEn,
          cookingGuideJa: product.cookingGuideJa,
          origin: product.origin,
          feed: product.feed ?? "",
          grade: product.grade ?? "",
          cut: product.cut ?? "",
          category: product.category,
          tags: product.tagsCsv,
          status: product.status as "draft" | "published" | "scheduled",
          isNewArrival: product.isNewArrival,
          images: product.images.map((i) => i.url),
          variants: product.variants.map((v) => ({
            id: v.id,
            labelEn: v.labelEn,
            labelJa: v.labelJa,
            weightGrams: v.weightGrams,
            priceJpy: v.priceJpy,
            compareAtPriceJpy: v.compareAtPriceJpy,
            stock: v.stock,
          })),
        }}
      />
    </div>
  );
}
