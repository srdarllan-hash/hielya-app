import { ProductDetailRuntime } from '../../../src/client/mvp-local-36/ProductDetailRuntime';

interface ProductDetailPageProps {
  params: Promise<{ productId: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { productId } = await params;
  return <ProductDetailRuntime productId={productId} />;
}
