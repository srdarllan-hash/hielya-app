import { expect, test, type Page } from '@playwright/test';
import type { CartView } from '../../packages/application/src/cart';
import AxeBuilder from '@axe-core/playwright';
import { installSyntheticCatalogRoutes, syntheticProducts } from '../integration/home-catalog-api-integration.fixtures';
const stories = ['ready','empty','loading','below-minimum','address-pending','network-error','stock-error','outside-area','closed','alcohol-unavailable','high-demand-and-alcohol-unavailable','reserved','expired'];
for (const state of stories) test(`${state}: accessible cart at mobile width`, async ({ page }) => {
  await page.goto(`http://127.0.0.1:6006/iframe.html?id=screens-cart--${state}&viewMode=story&globals=a11y.manual:!true`);
  await expect(page.getByRole('heading', { name: 'Mi carrito' })).toBeVisible();
  expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByText(/WELCOME10|Cupón aplicado|Completa tu pedido/)).toHaveCount(0);
});
const product = syntheticProducts[0];
async function mock(page: Page) {
  const cart: CartView = { id: '00000000-0000-4000-8000-000000000001', revision: 1, status: 'ACTIVE', items: [] as {id:string; product: typeof product; quantity:number;unitPriceCents:number;lineTotalCents:number}[], productSubtotalCents: 0, deliveryFeeCents: null, totalCents: null, minimumReached: false, amountMissingForMinimumCents: 2500, reservation: null, availability: { storeStatus: 'OPEN', demand: { level: 'NORMAL', estimate: null }, alcohol: { status: 'AVAILABLE', reason: 'ELIGIBLE', snapshot: null } }, serverNow: new Date().toISOString(), refreshAfterMs: 15000 };
  await installSyntheticCatalogRoutes(page);
  await page.route('**/api/v1/carts**', async r => {
    const path = new URL(r.request().url()).pathname;
    if (path.endsWith('/items')) { cart.items = [{ id: 'line', product, quantity: 1, unitPriceCents: 2500, lineTotalCents: 2500 }]; cart.productSubtotalCents = 2500; cart.minimumReached = true; cart.amountMissingForMinimumCents = 0; cart.revision++; }
    if (path.endsWith('/items/line')) { cart.reservation = null; cart.status = 'ACTIVE'; const q = r.request().postDataJSON().quantity; cart.items = q === 0 ? [] : cart.items.map(i => ({ ...i, quantity: q })); cart.revision++; }
    await r.fulfill({ json: cart });
  });
  await page.goto('/');
  const added = page.waitForResponse(r => new URL(r.url()).pathname.endsWith('/items'));
  await page.getByRole('button', { name: `Añadir ${product.name} al carrito`, exact: true }).click();
  await (await added).finished();
  await page.getByRole('button', { name: 'Abrir carrito' }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByRole('heading', { name: product.name })).toBeVisible();
  return cart;
}
test('anonymous cart survives Ahora no and is lost after reload without browser storage', async ({ page }) => {
  await mock(page); await page.getByRole('button',{name:'Continuar', exact:true}).click();
  await expect(page).toHaveURL(/\/login$/); await page.getByRole('button',{name:'Ahora no'}).click();
  await expect(page).toHaveURL(/\/cart$/); await expect(page.getByRole('heading',{name:product.name})).toBeVisible();
  expect(await page.evaluate(() => ({local: localStorage.length,session: sessionStorage.length,cookie:document.cookie}))).toEqual({local:0,session:0,cookie:''});
  await page.reload(); await expect(page.getByText('Tu carrito está vacío. Añade productos para continuar.')).toBeVisible();
});
test('cart login returns to cart and claims with authenticated principal', async ({page}) => {
  await mock(page); let claims = 0;
  await page.route('**/claim', async r => { expect(r.request().headers().authorization).toBeTruthy(); claims++; await r.fallback(); });
  await page.route('**/auth/otp/request', r => r.fulfill({status:202,json:{challengeId:'synthetic',expiresInSeconds:300,resendAfterSeconds:60}}));
  await page.route('**/auth/otp/verify', r => r.fulfill({json:{sessionToken:'synthetic-session',expiresInSeconds:600,customer:{id:'synthetic-customer',phoneE164:'+34600000001',phoneVerifiedAt:new Date().toISOString(),status:'ACTIVE'}}}));
  await page.getByRole('button',{name:'Continuar',exact:true}).click(); await page.getByRole('textbox',{name:'Número de teléfono'}).fill('600000001'); await page.getByRole('button',{name:'Continuar',exact:true}).click();
  await page.getByRole('textbox',{name:'Dígito 1 de 6'}).evaluate(el => { const data=new DataTransfer(); data.setData('text','123456'); el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true})); });
  await expect(page).toHaveURL(/\/cart$/); await expect.poll(()=>claims).toBe(1); await expect(page.getByRole('heading',{name:product.name})).toBeVisible();
});

test('server expiration preserves items; active editing cancels without automatic reservation', async ({ page }) => {
  await page.clock.install(); const cart = await mock(page); let reserveRequests = 0;
  await page.route('**/checkout/reservations', r => { reserveRequests++; return r.abort(); });
  cart.reservation = { id: 'synthetic-reservation', status: 'ACTIVE', expiresAt: new Date(Date.now()+600000).toISOString() }; cart.status = 'RESERVED';
  await page.clock.fastForward(15001); await expect(page.getByText('Productos reservados')).toBeVisible();
  await expect(page.getByRole('timer')).toBeVisible(); await expect(page.getByRole('button',{name:'Continuar',exact:true})).toHaveCount(0);
  cart.reservation.status = 'EXPIRED'; cart.status = 'ACTIVE';
  await page.clock.fastForward(15001); await expect(page.getByText('Reserva caducada')).toBeVisible(); await expect(page.getByRole('heading',{name:product.name})).toBeVisible();
  await expect(page.getByRole('button',{name:'Reservar de nuevo'})).toBeVisible(); expect(reserveRequests).toBe(0);
  cart.reservation.status = 'ACTIVE'; cart.status = 'RESERVED';
  await page.clock.fastForward(15001); await expect(page.getByText('Productos reservados')).toBeVisible();
  await page.getByRole('button',{name:`Añadir ${product.name}`}).click();
  await expect(page.getByText('Productos reservados')).toHaveCount(0); expect(cart.reservation).toBeNull(); expect(cart.items[0].quantity).toBe(2); expect(reserveRequests).toBe(0);
});
