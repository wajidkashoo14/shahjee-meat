import { notFound } from "next/navigation";
import { db } from "@/db";
import { getRecipeAdmin } from "@/server/admin";
import { RecipeForm } from "@/components/admin/recipe-form";

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [recipe, products] = await Promise.all([
    getRecipeAdmin(id),
    db.query.products.findMany({ columns: { id: true, nameEn: true } }),
  ]);
  if (!recipe) notFound();

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Edit recipe</h1>
      <RecipeForm
        products={products}
        initial={{
          id: recipe.id,
          slug: recipe.slug,
          titleEn: recipe.titleEn,
          titleJa: recipe.titleJa,
          excerptEn: recipe.excerptEn,
          excerptJa: recipe.excerptJa,
          bodyEn: recipe.bodyEn,
          bodyJa: recipe.bodyJa,
          heroImage: recipe.heroImage,
          category: recipe.category,
          cookTimeMinutes: recipe.cookTimeMinutes,
          difficulty: recipe.difficulty as "easy" | "medium" | "hard",
          servings: recipe.servings,
          status: recipe.status as "draft" | "published",
          productIds: recipe.products.map((p) => p.productId),
        }}
      />
    </div>
  );
}
