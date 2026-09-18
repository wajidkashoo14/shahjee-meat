import { db } from "@/db";
import { RecipeForm } from "@/components/admin/recipe-form";

export default async function NewRecipePage() {
  const products = await db.query.products.findMany({ columns: { id: true, nameEn: true } });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">New recipe</h1>
      <RecipeForm products={products} />
    </div>
  );
}
