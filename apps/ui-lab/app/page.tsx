import { HomeScreen, coerceHomeState } from '@hielya/ui';
export default async function Page({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const params = await searchParams;
  return <HomeScreen state={coerceHomeState(params.state)} />;
}
