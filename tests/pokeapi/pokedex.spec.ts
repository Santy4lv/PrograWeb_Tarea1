import { test, expect } from '@playwright/test';
import { PokedexPage } from '../fixtures/pokedex-page';

test.describe('Pokédex Web Application E2E Tests', () => {
  let pokedex: PokedexPage;

  test.beforeEach(async ({ page }) => {
    pokedex = new PokedexPage(page);
    await pokedex.goto();
  });

  test('should display page title and system online status', async () => {
    await expect(pokedex.mainTitle).toHaveText('POKÉDEX ARCHIVES');
    await expect(pokedex.statusText).toHaveText('SYSTEM ONLINE');
  });

  test('should render pokemon cards in grid after loading', async () => {
    await expect(pokedex.pokemonCards.first()).toBeVisible({ timeout: 15000 });
    const count = await pokedex.pokemonCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should filter cards by elemental type chip', async () => {
    await expect(pokedex.pokemonCards.first()).toBeVisible({ timeout: 15000 });
    await pokedex.filterByType('fire');
    await expect(pokedex.pokemonCards.first()).toBeVisible();
    const typeBadges = pokedex.pokemonCards.first().locator('.type-badge');
    await expect(typeBadges.filter({ hasText: /fire/i })).toBeVisible();
  });

  test('should open and close specimen detail modal on card click', async () => {
    await expect(pokedex.pokemonCards.first()).toBeVisible({ timeout: 15000 });
    await pokedex.pokemonCards.first().click();
    await expect(pokedex.modal).toBeVisible();
    await pokedex.modalCloseBtn.click();
    await expect(pokedex.modal).toBeHidden();
  });
});

