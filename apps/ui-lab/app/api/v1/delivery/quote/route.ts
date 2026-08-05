import { runtimePublicApiHandlers } from '../../../../../src/server/mvp-local-36/container';

export const runtime = 'nodejs';

export const POST = (request: Request): Promise<Response> => (
  runtimePublicApiHandlers.quoteDelivery(request)
);
