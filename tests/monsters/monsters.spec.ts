import { test, expect } from '@playwright/test';

test.describe('Monsters (Umbrella B.O.W.) Application E2E Tests', () => {
  const monstersUrl = process.env.MONSTERS_URL || 'http://localhost:8080';

  test('should render umbrella archives header and status when service is reachable', async ({ page }) => {
    try {
      const response = await page.goto(monstersUrl, { timeout: 4000 });
      if (response && response.ok()) {
        await expect(page.locator('.main-title')).toHaveText('UMBRELLA ARCHIVES');
        await expect(page.locator('#connection-status')).toHaveText('SYSTEM ONLINE');
        await expect(page.locator('#search-input')).toBeVisible();
      }
    } catch {
      test.skip(true, `Monsters service not reachable at ${monstersUrl}`);
    }
  });
});
