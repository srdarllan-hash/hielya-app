import { runtimeAuthHandlers } from '../../../../../../src/server/mvp-local-36/auth-container';

export const runtime = 'nodejs';

export const POST = (request: Request): Promise<Response> => (
  runtimeAuthHandlers.verifyOtp(request)
);
