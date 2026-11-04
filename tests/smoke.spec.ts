import { test, expect } from '@playwright/test';

test.describe('Playwright Runner Verification', () => {
  test('should verify browser engine starts and evaluates javascript', async ({ page }) => {
    const result = await page.evaluate(() => 2 + 2);
    expect(result).toBe(4);
  });
});
