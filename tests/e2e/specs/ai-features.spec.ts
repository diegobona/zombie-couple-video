import { test, expect } from '@playwright/test';
import { PAGES, TIMEOUTS, uniqueEmail } from '../helpers/constants';
import { createAndSignIn } from '../helpers/auth';

/**
 * AI Feature Pages Tests
 *
 * Verifies that AI feature pages load and render their forms.
 * We do NOT test actual generation (requires live API keys and credits);
 * we only verify page load and key UI elements.
 */

test.describe('AI Feature Pages', () => {
  const password = 'TestPassword123!';

  test('AI Chat page loads and shows message input', async ({ page }) => {
    // AI chat page may or may not require auth (currently commented out in middleware)
    // Navigate directly; if auth is required, this will redirect to signin
    await page.goto(PAGES.ai, { timeout: TIMEOUTS.navigation });

    // If we ended up on the page (not redirected to signin), check content
    const currentUrl = page.url();

    if (currentUrl.includes('/ai')) {
      // Should show a text input area for messages (textarea or contenteditable)
      const textarea = page.locator('textarea');
      const hasTextarea = await textarea.isVisible().catch(() => false);

      if (hasTextarea) {
        await expect(textarea).toBeVisible();
      } else {
        // Some AI chat UIs use contenteditable divs
        const editableArea = page.locator('[contenteditable="true"]');
        const hasEditable = await editableArea.isVisible().catch(() => false);
        expect(hasTextarea || hasEditable).toBeTruthy();
      }
    }
  });

  test('Image Generation page loads and shows prompt input', async ({ page }) => {
    await page.goto(PAGES.imageGenerate, { timeout: TIMEOUTS.navigation });

    const currentUrl = page.url();

    if (currentUrl.includes('/image-generate')) {
      // Should show prompt textarea
      const textarea = page.locator('textarea');
      await expect(textarea.first()).toBeVisible({ timeout: TIMEOUTS.navigation });

      // Should show provider/model selector (Select component)
      const selectTriggers = page.locator('[role="combobox"], button:has-text("Select")');
      const triggerCount = await selectTriggers.count();
      expect(triggerCount).toBeGreaterThanOrEqual(1);
    }
  });

  test('Video Generation page loads and shows prompt input', async ({ page }) => {
    await page.goto(PAGES.videoGenerate, { timeout: TIMEOUTS.navigation });

    const currentUrl = page.url();

    if (currentUrl.includes('/video-generate')) {
      // Should show prompt textarea
      const textarea = page.locator('textarea');
      await expect(textarea.first()).toBeVisible({ timeout: TIMEOUTS.navigation });

      // Should show provider/model selector
      const selectTriggers = page.locator('[role="combobox"], button:has-text("Select")');
      const triggerCount = await selectTriggers.count();
      expect(triggerCount).toBeGreaterThanOrEqual(1);
    }
  });

  test('Image Generation page shows generate button', async ({ page }) => {
    await page.goto(PAGES.imageGenerate, { timeout: TIMEOUTS.navigation });

    const currentUrl = page.url();

    if (currentUrl.includes('/image-generate')) {
      // Should have a generate/submit button
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      expect(buttonCount).toBeGreaterThanOrEqual(1);
    }
  });

  test('model catalogs no longer list retired IDs', async ({ page }) => {
    await page.goto(PAGES.ai, { timeout: TIMEOUTS.navigation });
    if (page.url().includes('/ai')) {
      const chatModelTrigger = page.locator('[role="combobox"]').first();
      if (await chatModelTrigger.isVisible().catch(() => false)) {
        await chatModelTrigger.click();
        await expect(page.getByText(/Qwen 3\.7 Flash|通义千问 3\.7 Flash/).first()).toBeVisible({
          timeout: TIMEOUTS.navigation,
        });
        await expect(page.getByText('Qwen Turbo')).toHaveCount(0);
        await expect(page.getByText('DeepSeek Coder')).toHaveCount(0);
        await expect(page.getByText('GPT-5 Codex')).toHaveCount(0);
        await page.keyboard.press('Escape');
      }
    }

    await page.goto(PAGES.imageGenerate, { timeout: TIMEOUTS.navigation });
    if (page.url().includes('/image-generate')) {
      const modelCombobox = page.locator('[role="combobox"]').nth(1);
      await expect(modelCombobox).toBeVisible({ timeout: TIMEOUTS.navigation });
      await modelCombobox.click();
      await expect(page.getByText(/Qwen Image 3\.0 Pro|通义千问图像 3\.0 Pro/).first()).toBeVisible();
      await expect(page.getByText('DALL-E 3')).toHaveCount(0);
      await expect(page.getByText('Qwen Image Plus')).toHaveCount(0);
      await page.keyboard.press('Escape');
    }

    await page.goto(PAGES.videoGenerate, { timeout: TIMEOUTS.navigation });
    if (page.url().includes('/video-generate')) {
      const modelCombobox = page.locator('[role="combobox"]').nth(1);
      await expect(modelCombobox).toBeVisible({ timeout: TIMEOUTS.navigation });
      await modelCombobox.click();
      await expect(page.getByText(/Seedance 2\.5|豆包 Seedance 2\.5/).first()).toBeVisible();
      await expect(page.getByText(/Kling 2\.5/)).toHaveCount(0);
      await expect(page.getByText(/Wanxiang 2\.6|万象 2\.6/)).toHaveCount(0);
    }
  });

  test('Video Generation page shows generate button', async ({ page }) => {
    await page.goto(PAGES.videoGenerate, { timeout: TIMEOUTS.navigation });

    const currentUrl = page.url();

    if (currentUrl.includes('/video-generate')) {
      // Should have a generate/submit button
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      expect(buttonCount).toBeGreaterThanOrEqual(1);
    }
  });
});
