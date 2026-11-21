import { ProductCard, type ProductCardData } from "@/components/shop/product-card";

/** Items that complete a row at this column count; leftovers would sit alone on a last row. */
const fits = (index: number, count: number, columns: number) =>
  count < columns || index < Math.floor(count / columns) * columns;

export function ProductRow({
  title,
  items,
  fullRows = false,
}: {
  title?: string;
  items: ProductCardData[];
  /** Merchandising strips: hide trailing cards that would leave a half-empty last row. */
  fullRows?: boolean;
}) {
  if (items.length === 0) return null;
  const n = items.length;
  return (
    <section>
      {title && <h2 className="font-display text-3xl sm:text-4xl">{title}</h2>}
      <div className={`grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-3 xl:grid-cols-4 ${title ? "mt-6" : ""}`}>
        {items.map((item, i) =>
          fullRows ? (
            <div
              key={item.product.id}
              className={[
                fits(i, n, 2) ? "block" : "hidden",
                fits(i, n, 3) ? "sm:block" : "sm:hidden",
                fits(i, n, 4) ? "xl:block" : "xl:hidden",
              ].join(" ")}
            >
              <ProductCard data={item} />
            </div>
          ) : (
            <ProductCard key={item.product.id} data={item} />
          ),
        )}
      </div>
    </section>
  );
}
