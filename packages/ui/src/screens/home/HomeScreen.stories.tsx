import type { Meta, StoryObj } from '@storybook/react';
import { HomeScreen, type HomeScreenProps } from './HomeScreen';
import {
  historicalHomeCatalogFixture,
  historicalHomeDeliveryFixture,
  historicalHomeHeroImageFixture,
  historicalHomeOperationalFactsFixture,
} from './home.data';

const historicalFixtureArgs = {
  catalogState: 'HOME_CATALOG_READY',
  catalog: historicalHomeCatalogFixture,
  cartCount: 3,
  selectedCategoryId: historicalHomeCatalogFixture.categories[0]?.id,
  heroImage: historicalHomeHeroImageFixture,
  deliverySummary: historicalHomeDeliveryFixture,
  operationalFacts: historicalHomeOperationalFactsFixture,
} satisfies Partial<HomeScreenProps>;

const meta = { title: 'Screens/C-005 Home Master', component: HomeScreen, parameters: { layout: 'fullscreen' }, tags: ['autodocs'] } satisfies Meta<typeof HomeScreen>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Ready: Story = { args: { ...historicalFixtureArgs, state: 'ready' } };
export const Loading: Story = { args: { ...historicalFixtureArgs, state: 'loading', catalogState: 'HOME_CATALOG_LOADING' } };
export const Closed: Story = { args: { ...historicalFixtureArgs, state: 'closed' } };
export const HighDemand: Story = { args: { ...historicalFixtureArgs, state: 'high-demand' } };
export const Error: Story = { args: { ...historicalFixtureArgs, state: 'error', catalogState: 'HOME_CATALOG_ERROR' } };
export const EmptyCart: Story = { args: { ...historicalFixtureArgs, state: 'empty-cart', cartCount: 0 } };
export const AlcoholCutoff: Story = { args: { ...historicalFixtureArgs, state: 'alcohol-cutoff' } };
export const OutOfArea: Story = { args: { ...historicalFixtureArgs, state: 'out-of-area' } };
