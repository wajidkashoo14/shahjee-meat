"use server";
import { searchProducts, searchRecipes } from "@/server/search";

export async function searchAction(query: string) {
  const [productResults, recipeResults] = await Promise.all([searchProducts(query), searchRecipes(query)]);
  return { products: productResults, recipes: recipeResults };
}
