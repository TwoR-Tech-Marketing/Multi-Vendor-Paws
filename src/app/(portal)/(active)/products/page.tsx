import { Suspense } from "react";

import { ProductsPageClient } from "@/features/products/presentation/ProductsPageClient";
import { ProductsSkeleton } from "@/features/products/presentation/ProductsSkeleton";

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsSkeleton />}>
      <ProductsPageClient />
    </Suspense>
  );
}
