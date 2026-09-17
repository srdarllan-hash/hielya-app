import { runtimeAuthHandlers } from '../../../../../src/server/mvp-local-36/auth-container';

export const runtime = 'nodejs';

export const GET = (request: Request): Promise<Response> => (
  runtimeAuthHandlers.session(request)
);
