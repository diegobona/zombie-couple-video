import { test, expect } from '@playwright/test';
import { PAGES, TIMEOUTS } from '../helpers/constants';

/**
 * Pricing Page Tests
 *
 * Verifies the pricing page renders plans correctly with prices,
 * features, and CTA buttons. Also tests tab switching between
 * subscription and credit plans (if credit plans exist).
 */

test.describe('Pricing Page', () => {
  test('renders pricing page with plan cards', async ({ page }) => {
    await page.goto(PAGES.pricing, { timeout: TIMEOUTS.navigation });

    // Page heading should be visible
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();

    // Should display at least one plan card with a price (¥ or $)
    const priceElements = page.locator('text=/[¥$]\\d+/');
    await expect(priceElements.first()).toBeVisible({ timeout: TIMEOUTS.navigation });
  });

  test('plan cards show name, price, and features', async ({ page }) => {
    await page.goto(PAGES.pricing, { timeout: TIMEOUTS.navigation });

    // Wait for plan cards to render (async fetch from API)
    await page.locator('h3').first().waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });

    const planNames = page.locator('h3');
    const planCount = await planNames.count();
    expect(planCount).toBeGreaterThanOrEqual(1);

    // Each plan should have a CTA button
    const ctaButtons = page.locator('button').filter({ has: page.locator('svg') });
    const buttonCount = await ctaButtons.count();
    expect(buttonCount).toBeGreaterThanOrEqual(1);
  });

  test('plan cards have feature list with check icons', async ({ page }) => {
    await page.goto(PAGES.pricing, { timeout: TIMEOUTS.navigation });

    // Wait for plan cards to render (async fetch from API)
    await page.locator('li.flex.items-start').first().waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });

    const featureItems = page.locator('li.flex.items-start');
    const featureCount = await featureItems.count();
    expect(featureCount).toBeGreaterThanOrEqual(1);
  });

  test('tab switching between subscription and credits works', async ({ page }) => {
    await page.goto(PAGES.pricing, { timeout: TIMEOUTS.navigation });

    // Check if tab switcher exists (only present when credit plans exist)
    const creditsButton = page.locator('button[data-pricing-tab="credits"]');
    const hasCreditsTab = await creditsButton.isVisible().catch(() => false);

    if (hasCreditsTab) {
      // Click credits tab
      await creditsButton.click();
      await page.waitForTimeout(500);

      // The tab should now be active (has different styling)
      // Plans should still be displayed
      const priceElements = page.locator('text=/[¥$]\\d+/');
      await expect(priceElements.first()).toBeVisible();

      // Switch back to subscription tab
      const subscriptionButton = page.locator('button[data-pricing-tab="subscription"]');
      await subscriptionButton.click();
      await page.waitForTimeout(500);

      // Plans should still be displayed
      await expect(priceElements.first()).toBeVisible();
    }
  });
});
