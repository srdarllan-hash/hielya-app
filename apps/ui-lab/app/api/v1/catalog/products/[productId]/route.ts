import { runtimePublicApiHandlers } from '../../../../../../src/server/mvp-local-36/container';

export const runtime = 'nodejs';

interface ProductRouteContext {
  params: Promise<{ productId: string }>;
}

export const GET = async (request: Request, context: ProductRouteContext): Promise<Response> => {
  const { productId } = await context.params;
  return runtimePublicApiHandlers.getProduct(request, productId);
};
