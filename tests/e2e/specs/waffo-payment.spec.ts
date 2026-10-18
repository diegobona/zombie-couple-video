import { test, expect, type Page } from '@playwright/test';
import { config } from 'dotenv';
import { resolve } from 'path';
import { PAGES, TIMEOUTS, uniqueEmail } from '../helpers/constants';
import { signUpViaAPI } from '../helpers/auth';

config({ path: resolve(__dirname, '../../../.env') });

/**
 * Waffo Pancake E2E Tests
 *
 * Covers three purchase flows:
 *   A) Subscription — "Waffo Monthly Plan"
 *   B) One-time — "Waffo Monthly Plan (One Time)"
 *   C) Credits — "100 Credits Waffo"
 *
 * Prerequisites:
 * 1. Dev server on port 7001
 * 2. Webhook tunnel → /api/payment/webhook/waffo
 * 3. .env has WAFFO_MERCHANT_ID and WAFFO_PRIVATE_KEY (Test API key)
 * 4. Real PROD_xxx IDs in config/payment.ts (not placeholders)
 *
 * Test card: 4576 7500 0000 0110, any future expiry, any CVC
 */

const WAFFO_TEST_CARD = {
  number: '4576750000000110',
  expiry: '1232',
  cvc: '123',
  name: 'Test Checkout User',
};

const hasWaffoCredentials = Boolean(process.env.WAFFO_MERCHANT_ID && process.env.WAFFO_PRIVATE_KEY);

async function initiateWaffoCheckout(
  page: Page,
  planNamePattern: RegExp,
  tab: 'subscription' | 'credits' = 'subscription',
): Promise<void> {
  await page.goto(PAGES.pricing, { timeout: TIMEOUTS.navigation });
  await page.waitForLoadState('networkidle');
  await page.locator('h3').first().waitFor({ state: 'attached', timeout: TIMEOUTS.navigation });

  if (tab === 'credits') {
    const creditsTab = page.locator('button[data-pricing-tab="credits"]');
    await creditsTab.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
    await creditsTab.click();
    await page.waitForTimeout(1000);
  }

  // The provider filter defaults to the recommended plan's provider (Stripe);
  // switch to Waffo so its plan cards are visible.
  const providerFilter = page.locator('button[data-provider-filter="waffo"]');
  await providerFilter.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
  await providerFilter.click();
  await page.waitForTimeout(500);

  const planHeading = page.locator('h3').filter({ hasText: planNamePattern });
  await planHeading.waitFor({ state: 'attached', timeout: TIMEOUTS.navigation });
  await planHeading.scrollIntoViewIfNeeded();

  const card = planHeading.locator('xpath=ancestor::div[@data-plan-id]').first();
  const ctaButton = card.locator('button').first();
  await ctaButton.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
  await expect(ctaButton).toBeEnabled({ timeout: TIMEOUTS.navigation });
  await ctaButton.click();

  await page.waitForURL(
    (url) => url.hostname.includes('waffo') && !url.hostname.includes('localhost'),
    { timeout: TIMEOUTS.stripe },
  );
}

async function fillAndSubmitWaffoCheckout(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');

  const continueDetails = page.getByRole('button', { name: /^Continue$/i }).first();
  await continueDetails.waitFor({ state: 'visible', timeout: 20_000 });
  await continueDetails.click();

  const visaSuccess = page.getByRole('button', { name: /^Success$/i }).first();
  await visaSuccess.waitFor({ state: 'visible', timeout: 20_000 });
  await visaSuccess.click();

  const expiry = page.getByPlaceholder('mm/yy').first();
  if (await expiry.isVisible({ timeout: 3_000 }).catch(() => false)) {
    const expiryValue = await expiry.inputValue().catch(() => '');
    if (!expiryValue) {
      await expiry.fill(WAFFO_TEST_CARD.expiry);
    }
  }

  const cvc = page.getByPlaceholder('CVV').first();
  if (await cvc.isVisible({ timeout: 2_000 }).catch(() => false)) {
    const cvcValue = await cvc.inputValue().catch(() => '');
    if (!cvcValue) {
      await cvc.fill(WAFFO_TEST_CARD.cvc);
    }
  }

  const nameInput = page.getByPlaceholder('Cardholder Name').first();
  if (await nameInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
    const nameValue = await nameInput.inputValue().catch(() => '');
    if (!nameValue) {
      await nameInput.fill(WAFFO_TEST_CARD.name);
    }
  }

  const payButton = page.getByRole('button', { name: /^(Subscribe|Pay|Purchase)$/i }).last();
  await payButton.scrollIntoViewIfNeeded();
  await expect(payButton).toBeEnabled({ timeout: 30_000 });
  await payButton.click();

  // Waffo hosts its own success screen; "Done" returns to our successUrl.
  const doneLink = page.getByRole('link', { name: /^Done$/i });
  await doneLink.waitFor({ state: 'visible', timeout: 60_000 });
  await doneLink.click();

  await page.waitForURL(/payment-success/, { timeout: 30_000 });
}

test.describe('Waffo payment', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(({}, testInfo) => {
    test.skip(!hasWaffoCredentials, 'WAFFO_MERCHANT_ID / WAFFO_PRIVATE_KEY not configured');
    if (testInfo.title.includes('complete')) {
      test.skip(
        process.env.E2E_WAFFO_COMPLETE !== 'true',
        'Set E2E_WAFFO_COMPLETE=true to run hosted checkout completion (needs webhook tunnel + real product IDs)',
      );
    }
  });

  test('redirects subscription checkout to Waffo', async ({ page }) => {
    const email = uniqueEmail('waffo-sub');
    await signUpViaAPI(page, { name: 'Waffo Sub User', email, password: 'Test1234!' });
    await initiateWaffoCheckout(page, /Waffo Monthly Plan(?! \(One Time\))/);
    expect(page.url()).toContain('waffo');
  });

  test('redirects one-time checkout to Waffo', async ({ page }) => {
    const email = uniqueEmail('waffo-once');
    await signUpViaAPI(page, { name: 'Waffo OneTime User', email, password: 'Test1234!' });
    await initiateWaffoCheckout(page, /Waffo Monthly Plan \(One Time\)/);
    expect(page.url()).toContain('waffo');
  });

  test('redirects credits checkout to Waffo', async ({ page }) => {
    const email = uniqueEmail('waffo-credits');
    await signUpViaAPI(page, { name: 'Waffo Credits User', email, password: 'Test1234!' });
    await initiateWaffoCheckout(page, /100 Credits Waffo/, 'credits');
    expect(page.url()).toContain('waffo');
  });

  test('completes Waffo subscription checkout', async ({ page }) => {
    test.setTimeout(180_000);
    const email = uniqueEmail('waffo-sub-pay');
    await signUpViaAPI(page, { name: 'Waffo Sub Pay', email, password: 'Test1234!' });
    await initiateWaffoCheckout(page, /Waffo Monthly Plan(?! \(One Time\))/);
    await fillAndSubmitWaffoCheckout(page);
    await expect(page).toHaveURL(/payment-success/);
  });
});
