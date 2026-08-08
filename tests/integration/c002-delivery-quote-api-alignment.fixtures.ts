import { expect, type Page, type Request, type Route } from '@playwright/test';

export const DELIVERY_QUOTE_PATH = '/api/v1/delivery/quote';
export const DELIVERY_QUOTE_PATTERN = '**/api/v1/delivery/quote';
export const C002_ALIGNMENT_NAMESPACE = 'C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1';

const correlationId = '88888888-8888-4888-8888-888888888888';

export interface CapturedDeliveryQuoteRequest {
  method: string;
  contentType: string | null;
  body: unknown;
}

export interface DeliveryQuoteRouteControl {
  calls: CapturedDeliveryQuoteRequest[];
  release?: () => void;
}

export interface RuntimeErrorCollector {
  errors: string[];
  allowHttpStatus(status: number): void;
  allowRequestAbort(): void;
}

export const collectRuntimeErrors = (page: Page): RuntimeErrorCollector => {
  const errors: string[] = [];
  const allowedHttpStatuses = new Set<number>();
  let requestAbortAllowed = false;
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    const expectedHttpFailure = text.match(
      /^Failed to load resource: the server responded with a status of (\d{3}) \(/,
    );
    if (expectedHttpFailure && allowedHttpStatuses.has(Number(expectedHttpFailure[1]))) return;
    if (requestAbortAllowed && /Failed to load resource.*(?:ERR_ABORTED|ERR_FAILED)/.test(text)) return;
    errors.push(`console: ${text}`);
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  return {
    errors,
    allowHttpStatus(status) {
      allowedHttpStatuses.add(status);
    },
    allowRequestAbort() {
      requestAbortAllowed = true;
    },
  };
};

const readRequest = (request: Request): CapturedDeliveryQuoteRequest => {
  let body: unknown;
  try {
    body = request.postDataJSON();
  } catch {
    body = request.postData();
  }
  return {
    method: request.method(),
    contentType: request.headers()['content-type'] ?? null,
    body,
  };
};

const fulfillJson = async (route: Route, body: unknown, status = 200) => route.fulfill({
  status,
  contentType: 'application/json',
  headers: { 'x-correlation-id': correlationId },
  body: JSON.stringify(body),
});

const publicError = (code: 'OUT_OF_AREA' | 'CONFIGURATION_UNAVAILABLE') => ({
  code,
  message: code === 'OUT_OF_AREA'
    ? 'The address is outside the delivery area.'
    : 'The delivery quote is temporarily unavailable.',
  correlationId,
});

export async function installSuccessfulDeliveryQuoteRoute(
  page: Page,
): Promise<DeliveryQuoteRouteControl> {
  const calls: CapturedDeliveryQuoteRequest[] = [];
  await page.route(DELIVERY_QUOTE_PATTERN, async (route) => {
    calls.push(readRequest(route.request()));
    await fulfillJson(route, {
      withinArea: true,
      routeDistanceKm: 2.5,
      feeCents: 350,
    });
  });
  return { calls };
}

export async function installOutOfAreaDeliveryQuoteRoute(
  page: Page,
): Promise<DeliveryQuoteRouteControl> {
  const calls: CapturedDeliveryQuoteRequest[] = [];
  await page.route(DELIVERY_QUOTE_PATTERN, async (route) => {
    calls.push(readRequest(route.request()));
    await fulfillJson(route, publicError('OUT_OF_AREA'), 400);
  });
  return { calls };
}

export async function installConfigurationUnavailableRoute(
  page: Page,
): Promise<DeliveryQuoteRouteControl> {
  const calls: CapturedDeliveryQuoteRequest[] = [];
  await page.route(DELIVERY_QUOTE_PATTERN, async (route) => {
    calls.push(readRequest(route.request()));
    await fulfillJson(route, publicError('CONFIGURATION_UNAVAILABLE'), 400);
  });
  return { calls };
}

export async function installRetryableDeliveryQuoteRoute(
  page: Page,
): Promise<DeliveryQuoteRouteControl> {
  const calls: CapturedDeliveryQuoteRequest[] = [];
  await page.route(DELIVERY_QUOTE_PATTERN, async (route) => {
    calls.push(readRequest(route.request()));
    if (calls.length === 1) {
      await fulfillJson(route, publicError('CONFIGURATION_UNAVAILABLE'), 400);
      return;
    }
    await fulfillJson(route, {
      withinArea: true,
      routeDistanceKm: 2.5,
      feeCents: 350,
    });
  });
  return { calls };
}

export async function installPausedDeliveryQuoteRoute(
  page: Page,
): Promise<DeliveryQuoteRouteControl> {
  const calls: CapturedDeliveryQuoteRequest[] = [];
  let release!: () => void;
  const released = new Promise<void>((resolve) => { release = resolve; });
  await page.route(DELIVERY_QUOTE_PATTERN, async (route) => {
    calls.push(readRequest(route.request()));
    await released;
    await fulfillJson(route, {
      withinArea: true,
      routeDistanceKm: 2.5,
      feeCents: 350,
    }).catch(() => undefined);
  });
  return { calls, release };
}

export async function installTimedOutDeliveryQuoteRoute(
  page: Page,
): Promise<DeliveryQuoteRouteControl> {
  const calls: CapturedDeliveryQuoteRequest[] = [];
  await page.route(DELIVERY_QUOTE_PATTERN, async (route) => {
    calls.push(readRequest(route.request()));
    await new Promise((resolve) => setTimeout(resolve, 9_000));
    await fulfillJson(route, {
      withinArea: true,
      routeDistanceKm: 2.5,
      feeCents: 350,
    }).catch(() => undefined);
  });
  return { calls };
}

export const driveManualAddressToQuote = async (page: Page) => {
  await page.goto('/location');
  await expect(page.locator('[data-screen-id="C-002"]')).toHaveAttribute('data-state', 'idle');
  await page.getByRole('button', { name: 'Introducir dirección' }).click();
  await page.getByRole('combobox', { name: 'Dirección de entrega' }).fill('Paseo');
  await page.getByRole('button', { name: 'Buscar dirección' }).click();
  await page.getByText('Paseo Marítimo Rey de España, 65').click();
  await page.getByRole('button', { name: 'Confirmar dirección' }).click();
};

export const expectOnlyCoordinatesRequest = (call: CapturedDeliveryQuoteRequest) => {
  expect(call.method).toBe('POST');
  expect(call.contentType).toContain('application/json');
  expect(call.body).toEqual({ latitude: 36.5384, longitude: -4.6239 });
  expect(Object.keys(call.body as Record<string, unknown>).sort()).toEqual(['latitude', 'longitude']);
};
