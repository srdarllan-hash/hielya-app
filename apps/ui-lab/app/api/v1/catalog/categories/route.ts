import { runtimePublicApiHandlers } from '../../../../../src/server/mvp-local-36/container';

export const runtime = 'nodejs';

export const GET = (request: Request): Promise<Response> => (
  runtimePublicApiHandlers.listCategories(request)
);
