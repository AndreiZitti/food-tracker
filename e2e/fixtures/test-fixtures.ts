import { test as base, expect, Page } from '@playwright/test';

/**
 * FitTrack Test Fixtures
 *
 * Extended Playwright test fixtures with authentication mocking,
 * database seeding, and common test utilities.
 */

// Test user data
export const TEST_USER = {
  id: 'test-user-123',
  email: 'test@fittrack.zitti.ro',
  name: 'Test User',
};

// Default user settings
export const DEFAULT_SETTINGS = {
  calorieGoal: 2000,
  proteinGoal: 150,
  carbsGoal: 200,
  fatGoal: 65,
  displayMode: 'simple' as 'simple' | 'advanced',
};

// Sample food items for testing
export const SAMPLE_FOODS = {
  chickenBreast: {
    name: 'Chicken Breast',
    brand: 'Generic',
    servingSize: '100g',
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    source: 'openfoodfacts',
    sourceId: '123456789',
  },
  banana: {
    name: 'Banana',
    brand: 'Fresh',
    servingSize: '1 medium (118g)',
    calories: 105,
    protein: 1.3,
    carbs: 27,
    fat: 0.4,
    source: 'openfoodfacts',
    sourceId: '987654321',
  },
  customMeal: {
    name: 'Homemade Salad',
    brand: 'Custom',
    servingSize: '1 bowl',
    calories: 250,
    protein: 15,
    carbs: 20,
    fat: 12,
    source: 'custom',
    sourceId: 'custom-123',
  },
};

// Meal types
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/**
 * Custom test fixture interface
 */
interface FitTrackFixtures {
  authenticatedPage: Page;
  mockAuth: () => Promise<void>;
  seedFoodLog: (entries: FoodLogEntry[]) => Promise<void>;
  clearFoodLog: () => Promise<void>;
  setUserSettings: (settings: Partial<typeof DEFAULT_SETTINGS>) => Promise<void>;
}

interface FoodLogEntry {
  date: string;
  meal: MealType;
  food: typeof SAMPLE_FOODS.chickenBreast;
  servings: number;
}

/**
 * Extended test with FitTrack fixtures
 */
export const test = base.extend<FitTrackFixtures>({
  // Authenticated page fixture
  authenticatedPage: async ({ page }, use) => {
    // Mock Supabase auth session
    await page.addInitScript(() => {
      // Mock localStorage for auth
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: {
          id: 'test-user-123',
          email: 'test@fittrack.zitti.ro',
        },
      }));
    });

    await use(page);
  },

  // Mock authentication helper
  mockAuth: async ({ page }, use) => {
    const mockAuth = async () => {
      await page.route('**/auth/v1/**', async (route) => {
        const url = route.request().url();

        if (url.includes('/token')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              access_token: 'mock-access-token',
              refresh_token: 'mock-refresh-token',
              user: TEST_USER,
            }),
          });
        } else if (url.includes('/user')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(TEST_USER),
          });
        } else {
          await route.continue();
        }
      });
    };

    await use(mockAuth);
  },

  // Seed food log with test data
  seedFoodLog: async ({ page }, use) => {
    const seedFoodLog = async (entries: FoodLogEntry[]) => {
      await page.route('**/api/log**', async (route) => {
        if (route.request().method() === 'GET') {
          const url = new URL(route.request().url());
          const date = url.searchParams.get('date');

          const filteredEntries = entries
            .filter(e => e.date === date)
            .map((entry, index) => ({
              id: `log-${index}`,
              user_id: TEST_USER.id,
              date: entry.date,
              meal: entry.meal,
              food_name: entry.food.name,
              brand: entry.food.brand,
              serving_size: entry.food.servingSize,
              servings: entry.servings,
              calories: entry.food.calories * entry.servings,
              protein: entry.food.protein * entry.servings,
              carbs: entry.food.carbs * entry.servings,
              fat: entry.food.fat * entry.servings,
              source: entry.food.source,
              source_id: entry.food.sourceId,
            }));

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(filteredEntries),
          });
        } else {
          await route.continue();
        }
      });
    };

    await use(seedFoodLog);
  },

  // Clear food log
  clearFoodLog: async ({ page }, use) => {
    const clearFoodLog = async () => {
      await page.route('**/api/log**', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
          });
        } else {
          await route.continue();
        }
      });
    };

    await use(clearFoodLog);
  },

  // Set user settings
  setUserSettings: async ({ page }, use) => {
    const setUserSettings = async (settings: Partial<typeof DEFAULT_SETTINGS>) => {
      const mergedSettings = { ...DEFAULT_SETTINGS, ...settings };

      await page.route('**/api/settings**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'settings-1',
            user_id: TEST_USER.id,
            calorie_goal: mergedSettings.calorieGoal,
            protein_goal: mergedSettings.proteinGoal,
            carbs_goal: mergedSettings.carbsGoal,
            fat_goal: mergedSettings.fatGoal,
            display_mode: mergedSettings.displayMode,
          }),
        });
      });
    };

    await use(setUserSettings);
  },
});

export { expect };
