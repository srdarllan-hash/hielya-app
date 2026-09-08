import { HomeCatalogRuntime } from '../src/client/mvp-local-36/HomeCatalogRuntime';
import { AuthHomeRuntime } from '../src/client/auth/AuthHomeRuntime';

export default function Page() {
  return <AuthHomeRuntime><HomeCatalogRuntime /></AuthHomeRuntime>;
}
