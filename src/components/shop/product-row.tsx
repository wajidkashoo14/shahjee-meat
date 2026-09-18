import { ProductCard, type ProductCardData } from "@/components/shop/product-card";

export function ProductRow({ title, items }: { title?: string; items: ProductCardData[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      {title && <h2 className="font-display text-2xl sm:text-3xl">{title}</h2>}
      <div className={`grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4 ${title ? "mt-6" : ""}`}>
        {items.map((item) => (
          <ProductCard key={item.product.id} data={item} />
        ))}
      </div>
    </section>
  );
}
