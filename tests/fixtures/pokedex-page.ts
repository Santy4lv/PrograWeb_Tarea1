import { type Page, type Locator } from '@playwright/test';

export class PokedexPage {
  readonly page: Page;
  readonly mainTitle: Locator;
  readonly statusText: Locator;
  readonly searchInput: Locator;
  readonly searchBtn: Locator;
  readonly clearBtn: Locator;
  readonly genFilter: Locator;
  readonly specimensCount: Locator;
  readonly pokemonGrid: Locator;
  readonly pokemonCards: Locator;
  readonly modal: Locator;
  readonly modalCloseBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.mainTitle = page.locator('.main-title');
    this.statusText = page.locator('#connection-status');
    this.searchInput = page.locator('#search-input');
    this.searchBtn = page.locator('#search-btn');
    this.clearBtn = page.locator('#clear-search-btn');
    this.genFilter = page.locator('#gen-filter');
    this.specimensCount = page.locator('#specimens-count');
    this.pokemonGrid = page.locator('#pokemon-grid');
    this.pokemonCards = page.locator('.pokemon-card');
    this.modal = page.locator('#pokemon-modal');
    this.modalCloseBtn = page.locator('#modal-close-btn');
  }

  async goto() {
    await this.page.goto('/');
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchBtn.click();
  }

  async filterByType(type: string) {
    await this.page.locator(`.filter-chip[data-type="${type}"]`).click();
  }
}

