import { Page, expect } from '@playwright/test';
import { MealType, SAMPLE_FOODS } from '../fixtures/test-fixtures';

/**
 * FitTrack Test Helpers
 *
 * Common operations and utilities for E2E tests.
 */

/**
 * Navigation helpers
 */
export const navigate = {
  toDiary: async (page: Page) => {
    await page.click('[data-testid="nav-diary"]');
    await page.waitForURL('**/diary');
    await expect(page.locator('[data-testid="diary-container"]')).toBeVisible();
  },

  toAddFood: async (page: Page) => {
    await page.click('[data-testid="nav-add"]');
    await page.waitForURL('**/add');
    await expect(page.locator('[data-testid="add-food-container"]')).toBeVisible();
  },

  toProgress: async (page: Page) => {
    await page.click('[data-testid="nav-progress"]');
    await page.waitForURL('**/progress');
    await expect(page.locator('[data-testid="progress-container"]')).toBeVisible();
  },

  toSettings: async (page: Page) => {
    await page.click('[data-testid="nav-settings"]');
    await page.waitForURL('**/settings');
    await expect(page.locator('[data-testid="settings-container"]')).toBeVisible();
  },
};

/**
 * Date navigation helpers
 */
export const dateNavigation = {
  goToPreviousDay: async (page: Page) => {
    await page.click('[data-testid="date-prev"]');
    await page.waitForLoadState('networkidle');
  },

  goToNextDay: async (page: Page) => {
    await page.click('[data-testid="date-next"]');
    await page.waitForLoadState('networkidle');
  },

  goToToday: async (page: Page) => {
    await page.click('[data-testid="date-today"]');
    await page.waitForLoadState('networkidle');
  },

  selectDate: async (page: Page, date: string) => {
    await page.click('[data-testid="date-picker-trigger"]');
    await page.waitForSelector('[data-testid="date-picker"]');
    await page.click(`[data-testid="date-${date}"]`);
    await page.waitForLoadState('networkidle');
  },

  getCurrentDate: async (page: Page): Promise<string> => {
    const dateElement = page.locator('[data-testid="current-date"]');
    return await dateElement.textContent() || '';
  },
};

/**
 * Food search helpers
 */
export const foodSearch = {
  search: async (page: Page, query: string) => {
    await page.fill('[data-testid="search-input"]', query);
    await page.waitForLoadState('networkidle');
  },

  clearSearch: async (page: Page) => {
    await page.click('[data-testid="search-clear"]');
    await expect(page.locator('[data-testid="search-input"]')).toHaveValue('');
  },

  selectResult: async (page: Page, index: number = 0) => {
    await page.click(`[data-testid="search-result-${index}"]`);
    await expect(page.locator('[data-testid="food-detail"]')).toBeVisible();
  },

  openBarcodeScanner: async (page: Page) => {
    await page.click('[data-testid="barcode-button"]');
    await expect(page.locator('[data-testid="barcode-scanner"]')).toBeVisible();
  },

  openManualEntry: async (page: Page) => {
    await page.click('[data-testid="manual-entry-button"]');
    await expect(page.locator('[data-testid="manual-entry-form"]')).toBeVisible();
  },
};

/**
 * Food logging helpers
 */
export const foodLogging = {
  adjustServings: async (page: Page, servings: number) => {
    await page.fill('[data-testid="servings-input"]', servings.toString());
    await page.waitForTimeout(100); // Debounce
  },

  selectMeal: async (page: Page, meal: MealType) => {
    await page.click(`[data-testid="meal-option-${meal}"]`);
    await expect(page.locator(`[data-testid="meal-option-${meal}"]`)).toHaveClass(/selected/);
  },

  confirmAdd: async (page: Page) => {
    await page.click('[data-testid="add-food-confirm"]');
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  },

  cancelAdd: async (page: Page) => {
    await page.click('[data-testid="add-food-cancel"]');
    await expect(page.locator('[data-testid="food-detail"]')).not.toBeVisible();
  },

  deleteEntry: async (page: Page, entryId: string) => {
    await page.click(`[data-testid="food-entry-${entryId}"] [data-testid="delete-button"]`);
    await page.click('[data-testid="confirm-delete"]');
    await expect(page.locator(`[data-testid="food-entry-${entryId}"]`)).not.toBeVisible();
  },
};

/**
 * Manual entry helpers
 */
export const manualEntry = {
  fillForm: async (page: Page, food: typeof SAMPLE_FOODS.chickenBreast) => {
    await page.fill('[data-testid="food-name-input"]', food.name);
    await page.fill('[data-testid="brand-input"]', food.brand || '');
    await page.fill('[data-testid="serving-size-input"]', food.servingSize);
    await page.fill('[data-testid="calories-input"]', food.calories.toString());
    await page.fill('[data-testid="protein-input"]', food.protein.toString());
    await page.fill('[data-testid="carbs-input"]', food.carbs.toString());
    await page.fill('[data-testid="fat-input"]', food.fat.toString());
  },

  submitForm: async (page: Page) => {
    await page.click('[data-testid="manual-entry-submit"]');
    await page.waitForLoadState('networkidle');
  },

  clearForm: async (page: Page) => {
    await page.click('[data-testid="manual-entry-clear"]');
  },
};

/**
 * Settings helpers
 */
export const settings = {
  setCalorieGoal: async (page: Page, calories: number) => {
    await page.fill('[data-testid="calorie-goal-input"]', calories.toString());
  },

  setProteinGoal: async (page: Page, protein: number) => {
    await page.fill('[data-testid="protein-goal-input"]', protein.toString());
  },

  setCarbsGoal: async (page: Page, carbs: number) => {
    await page.fill('[data-testid="carbs-goal-input"]', carbs.toString());
  },

  setFatGoal: async (page: Page, fat: number) => {
    await page.fill('[data-testid="fat-goal-input"]', fat.toString());
  },

  toggleDisplayMode: async (page: Page) => {
    await page.click('[data-testid="display-mode-toggle"]');
    await page.waitForTimeout(100);
  },

  getDisplayMode: async (page: Page): Promise<'simple' | 'advanced'> => {
    const toggle = page.locator('[data-testid="display-mode-toggle"]');
    const isAdvanced = await toggle.getAttribute('data-mode');
    return isAdvanced === 'advanced' ? 'advanced' : 'simple';
  },

  saveSettings: async (page: Page) => {
    await page.click('[data-testid="save-settings"]');
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  },
};

/**
 * Progress/Weight helpers
 */
export const progress = {
  logWeight: async (page: Page, weight: number, unit: 'kg' | 'lb' = 'kg') => {
    await page.click('[data-testid="log-weight-button"]');
    await expect(page.locator('[data-testid="weight-log-modal"]')).toBeVisible();
    await page.fill('[data-testid="weight-input"]', weight.toString());
    await page.click(`[data-testid="unit-${unit}"]`);
    await page.click('[data-testid="save-weight"]');
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  },

  selectTimeRange: async (page: Page, range: '7d' | '30d') => {
    await page.click(`[data-testid="range-${range}"]`);
    await page.waitForLoadState('networkidle');
  },

  getChartData: async (page: Page, chartType: 'calorie' | 'weight'): Promise<boolean> => {
    const chart = page.locator(`[data-testid="${chartType}-chart"]`);
    return await chart.locator('.recharts-line').count() > 0;
  },
};

/**
 * Assertion helpers
 */
export const assertions = {
  dailyTotals: async (page: Page, expected: { calories?: number; protein?: number; carbs?: number; fat?: number }) => {
    if (expected.calories !== undefined) {
      const caloriesText = await page.locator('[data-testid="total-calories"]').textContent();
      expect(parseInt(caloriesText || '0')).toBe(expected.calories);
    }
    if (expected.protein !== undefined) {
      const proteinText = await page.locator('[data-testid="total-protein"]').textContent();
      expect(parseFloat(proteinText || '0')).toBe(expected.protein);
    }
    if (expected.carbs !== undefined) {
      const carbsText = await page.locator('[data-testid="total-carbs"]').textContent();
      expect(parseFloat(carbsText || '0')).toBe(expected.carbs);
    }
    if (expected.fat !== undefined) {
      const fatText = await page.locator('[data-testid="total-fat"]').textContent();
      expect(parseFloat(fatText || '0')).toBe(expected.fat);
    }
  },

  mealCount: async (page: Page, meal: MealType, count: number) => {
    const entries = page.locator(`[data-testid="meal-${meal}"] [data-testid^="food-entry-"]`);
    await expect(entries).toHaveCount(count);
  },

  goalProgress: async (page: Page, type: 'calories' | 'protein' | 'carbs' | 'fat', percentage: number) => {
    const progressBar = page.locator(`[data-testid="${type}-progress"]`);
    const width = await progressBar.evaluate(el => {
      const style = window.getComputedStyle(el);
      return parseFloat(style.width) / parseFloat(el.parentElement?.style.width || '1') * 100;
    });
    expect(width).toBeCloseTo(percentage, 1);
  },
};

/**
 * Mock API responses
 */
export const mockApi = {
  foodSearch: async (page: Page, results: typeof SAMPLE_FOODS.chickenBreast[]) => {
    await page.route('**/api/food/search**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(results),
      });
    });
  },

  barcodeLookup: async (page: Page, food: typeof SAMPLE_FOODS.chickenBreast | null) => {
    await page.route('**/api/food/barcode/**', async (route) => {
      if (food) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(food),
        });
      } else {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Product not found' }),
        });
      }
    });
  },

  networkError: async (page: Page, urlPattern: string) => {
    await page.route(urlPattern, async (route) => {
      await route.abort('failed');
    });
  },

  slowResponse: async (page: Page, urlPattern: string, delayMs: number) => {
    await page.route(urlPattern, async (route) => {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      await route.continue();
    });
  },
};

/**
 * PWA helpers
 */
export const pwa = {
  isInstallable: async (page: Page): Promise<boolean> => {
    return await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
  },

  isOfflineCapable: async (page: Page): Promise<boolean> => {
    // Check if service worker is registered
    const swRegistered = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      return registration !== undefined;
    });
    return swRegistered;
  },

  simulateOffline: async (page: Page) => {
    await page.context().setOffline(true);
  },

  simulateOnline: async (page: Page) => {
    await page.context().setOffline(false);
  },
};
