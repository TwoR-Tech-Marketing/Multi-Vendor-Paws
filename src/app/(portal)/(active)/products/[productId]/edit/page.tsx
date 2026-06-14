import { ProductFormSection } from "@/features/products/presentation/ProductFormSection";

type EditProductPageProps = {
  params: Promise<{ productId: string }>;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { productId } = await params;
  return <ProductFormSection mode="edit" productId={productId} />;
}
