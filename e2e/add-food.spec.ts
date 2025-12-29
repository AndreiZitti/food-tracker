import { test, expect, SAMPLE_FOODS, DEFAULT_SETTINGS } from './fixtures/test-fixtures';
import { navigate, foodSearch, foodLogging, manualEntry, mockApi } from './utils/test-helpers';
import { ScreenshotPoints, waitForStableState } from './utils/screenshot-utils';

/**
 * Add Food E2E Tests
 *
 * Tests for the food search and logging feature including:
 * - Open Food Facts API search
 * - Barcode scanning
 * - Manual food entry
 * - Serving size adjustment
 * - Meal selection and confirmation
 */

test.describe('Add Food', () => {
  test.beforeEach(async ({ authenticatedPage, mockAuth, setUserSettings }) => {
    await mockAuth();
    await setUserSettings(DEFAULT_SETTINGS);
  });

  test.describe('Food Search', () => {
    test('should display search interface', async ({ authenticatedPage: page }) => {
      await page.goto('/add');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="search-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="barcode-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="manual-entry-button"]')).toBeVisible();

      // Screenshot: Empty search state
      await ScreenshotPoints.addFood.searchEmpty(page);
    });

    test('should search Open Food Facts and display results', async ({ authenticatedPage: page }) => {
      // Mock search results
      await page.route('**/api/food/search**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            SAMPLE_FOODS.chickenBreast,
            SAMPLE_FOODS.banana,
          ]),
        });
      });

      await page.goto('/add');
      await waitForStableState(page);

      await foodSearch.search(page, 'chicken');

      // Verify results are displayed
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
      await expect(page.locator('[data-testid="search-result-0"]')).toContainText('Chicken Breast');
      await expect(page.locator('[data-testid="search-result-1"]')).toContainText('Banana');

      // Screenshot: Search results
      await ScreenshotPoints.addFood.searchResults(page);
    });

    test('should show loading state while searching', async ({ authenticatedPage: page }) => {
      await page.route('**/api/food/search**', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      });

      await page.goto('/add');
      await page.fill('[data-testid="search-input"]', 'test');

      // Should show loading indicator
      await expect(page.locator('[data-testid="search-loading"]')).toBeVisible();
    });

    test('should show no results message when search returns empty', async ({ authenticatedPage: page }) => {
      await page.route('**/api/food/search**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      });

      await page.goto('/add');
      await foodSearch.search(page, 'xyznonexistent');

      await expect(page.locator('[data-testid="no-results"]')).toBeVisible();
      await expect(page.locator('[data-testid="no-results"]')).toContainText('No foods found');

      // Screenshot: No results
      await ScreenshotPoints.addFood.noResults(page);
    });

    test('should debounce search input', async ({ authenticatedPage: page }) => {
      let searchCount = 0;
      await page.route('**/api/food/search**', async (route) => {
        searchCount++;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      });

      await page.goto('/add');

      // Type quickly
      await page.fill('[data-testid="search-input"]', 'c');
      await page.fill('[data-testid="search-input"]', 'ch');
      await page.fill('[data-testid="search-input"]', 'chi');
      await page.fill('[data-testid="search-input"]', 'chic');
      await page.fill('[data-testid="search-input"]', 'chick');

      await page.waitForTimeout(500); // Wait for debounce

      // Should have made fewer requests than keystrokes
      expect(searchCount).toBeLessThanOrEqual(2);
    });

    test('should clear search results when input is cleared', async ({ authenticatedPage: page }) => {
      await mockApi.foodSearch(page, [SAMPLE_FOODS.chickenBreast]);

      await page.goto('/add');
      await foodSearch.search(page, 'chicken');
      await expect(page.locator('[data-testid="search-result-0"]')).toBeVisible();

      await foodSearch.clearSearch(page);

      await expect(page.locator('[data-testid="search-results"]')).not.toBeVisible();
    });

    test('should show recently logged foods', async ({ authenticatedPage: page }) => {
      await page.route('**/api/food/recent**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([SAMPLE_FOODS.banana]),
        });
      });

      await page.goto('/add');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="recent-foods"]')).toBeVisible();
      await expect(page.locator('[data-testid="recent-food-0"]')).toContainText('Banana');
    });
  });

  test.describe('Barcode Scanner', () => {
    test('should open barcode scanner', async ({ authenticatedPage: page }) => {
      await page.goto('/add');
      await waitForStableState(page);

      await foodSearch.openBarcodeScanner(page);

      await expect(page.locator('[data-testid="barcode-scanner"]')).toBeVisible();
      await expect(page.locator('[data-testid="camera-view"]')).toBeVisible();

      // Screenshot: Barcode scanner
      await ScreenshotPoints.addFood.barcodeScanner(page);
    });

    test('should request camera permission', async ({ authenticatedPage: page }) => {
      // Grant camera permission
      await page.context().grantPermissions(['camera']);

      await page.goto('/add');
      await foodSearch.openBarcodeScanner(page);

      // Camera should be active (video element should exist)
      await expect(page.locator('[data-testid="camera-view"] video')).toBeVisible();
    });

    test('should find food by barcode', async ({ authenticatedPage: page }) => {
      await mockApi.barcodeLookup(page, SAMPLE_FOODS.chickenBreast);

      await page.goto('/add');

      // Simulate barcode detection by calling the API directly
      await page.route('**/api/food/barcode/123456789', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(SAMPLE_FOODS.chickenBreast),
        });
      });

      // Trigger barcode found event
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('barcode-detected', {
          detail: { barcode: '123456789' },
        }));
      });

      await expect(page.locator('[data-testid="food-detail"]')).toBeVisible();
      await expect(page.locator('[data-testid="food-detail"]')).toContainText('Chicken Breast');
    });

    test('should show not found message for unknown barcode', async ({ authenticatedPage: page }) => {
      await mockApi.barcodeLookup(page, null);

      await page.goto('/add');

      // Simulate unknown barcode
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('barcode-detected', {
          detail: { barcode: 'unknown123' },
        }));
      });

      await expect(page.locator('[data-testid="barcode-not-found"]')).toBeVisible();
      await expect(page.locator('[data-testid="barcode-not-found"]')).toContainText('Product not found');
      await expect(page.locator('[data-testid="add-manually-button"]')).toBeVisible();
    });

    test('should close barcode scanner on cancel', async ({ authenticatedPage: page }) => {
      await page.goto('/add');
      await foodSearch.openBarcodeScanner(page);

      await page.click('[data-testid="scanner-close"]');

      await expect(page.locator('[data-testid="barcode-scanner"]')).not.toBeVisible();
    });

    test('should have flashlight toggle', async ({ authenticatedPage: page }) => {
      await page.goto('/add');
      await foodSearch.openBarcodeScanner(page);

      await expect(page.locator('[data-testid="flashlight-toggle"]')).toBeVisible();
    });
  });

  test.describe('Manual Entry', () => {
    test('should open manual entry form', async ({ authenticatedPage: page }) => {
      await page.goto('/add');
      await waitForStableState(page);

      await foodSearch.openManualEntry(page);

      await expect(page.locator('[data-testid="manual-entry-form"]')).toBeVisible();

      // Screenshot: Manual entry form
      await ScreenshotPoints.addFood.manualEntry(page);
    });

    test('should have all required fields', async ({ authenticatedPage: page }) => {
      await page.goto('/add');
      await foodSearch.openManualEntry(page);

      await expect(page.locator('[data-testid="food-name-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="serving-size-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="calories-input"]')).toBeVisible();
    });

    test('should show macro fields in advanced mode', async ({ authenticatedPage: page, setUserSettings }) => {
      await setUserSettings({ displayMode: 'advanced' });

      await page.goto('/add');
      await foodSearch.openManualEntry(page);

      await expect(page.locator('[data-testid="protein-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="carbs-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="fat-input"]')).toBeVisible();
    });

    test('should hide macro fields in simple mode', async ({ authenticatedPage: page, setUserSettings }) => {
      await setUserSettings({ displayMode: 'simple' });

      await page.goto('/add');
      await foodSearch.openManualEntry(page);

      await expect(page.locator('[data-testid="protein-input"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="carbs-input"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="fat-input"]')).not.toBeVisible();
    });

    test('should validate required fields', async ({ authenticatedPage: page }) => {
      await page.goto('/add');
      await foodSearch.openManualEntry(page);

      // Try to submit empty form
      await manualEntry.submitForm(page);

      // Should show validation errors
      await expect(page.locator('[data-testid="food-name-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="calories-error"]')).toBeVisible();
    });

    test('should validate numeric fields', async ({ authenticatedPage: page }) => {
      await page.goto('/add');
      await foodSearch.openManualEntry(page);

      await page.fill('[data-testid="food-name-input"]', 'Test Food');
      await page.fill('[data-testid="calories-input"]', 'abc');

      await manualEntry.submitForm(page);

      await expect(page.locator('[data-testid="calories-error"]')).toContainText('must be a number');
    });

    test('should create custom food and show in food detail', async ({ authenticatedPage: page }) => {
      await page.route('**/api/food/custom', async (route) => {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'custom-1',
            ...SAMPLE_FOODS.customMeal,
          }),
        });
      });

      await page.goto('/add');
      await foodSearch.openManualEntry(page);
      await manualEntry.fillForm(page, SAMPLE_FOODS.customMeal);
      await manualEntry.submitForm(page);

      // Should show food detail view
      await expect(page.locator('[data-testid="food-detail"]')).toBeVisible();
      await expect(page.locator('[data-testid="food-detail"]')).toContainText('Homemade Salad');
    });

    test('should save custom food for future use checkbox', async ({ authenticatedPage: page }) => {
      await page.goto('/add');
      await foodSearch.openManualEntry(page);

      await expect(page.locator('[data-testid="save-for-later-checkbox"]')).toBeVisible();
      await expect(page.locator('[data-testid="save-for-later-checkbox"]')).toBeChecked();
    });
  });

  test.describe('Food Detail', () => {
    test('should display food details when selected', async ({ authenticatedPage: page }) => {
      await mockApi.foodSearch(page, [SAMPLE_FOODS.chickenBreast]);

      await page.goto('/add');
      await foodSearch.search(page, 'chicken');
      await foodSearch.selectResult(page, 0);

      await expect(page.locator('[data-testid="food-detail"]')).toBeVisible();
      await expect(page.locator('[data-testid="food-name"]')).toContainText('Chicken Breast');
      await expect(page.locator('[data-testid="food-brand"]')).toContainText('Generic');
      await expect(page.locator('[data-testid="food-calories"]')).toContainText('165');

      // Screenshot: Food detail
      await ScreenshotPoints.addFood.foodDetail(page);
    });

    test('should show nutrition info', async ({ authenticatedPage: page }) => {
      await mockApi.foodSearch(page, [SAMPLE_FOODS.chickenBreast]);

      await page.goto('/add');
      await foodSearch.search(page, 'chicken');
      await foodSearch.selectResult(page, 0);

      await expect(page.locator('[data-testid="nutrition-protein"]')).toContainText('31');
      await expect(page.locator('[data-testid="nutrition-carbs"]')).toContainText('0');
      await expect(page.locator('[data-testid="nutrition-fat"]')).toContainText('3.6');
    });

    test('should go back to search when back is pressed', async ({ authenticatedPage: page }) => {
      await mockApi.foodSearch(page, [SAMPLE_FOODS.chickenBreast]);

      await page.goto('/add');
      await foodSearch.search(page, 'chicken');
      await foodSearch.selectResult(page, 0);

      await page.click('[data-testid="back-button"]');

      await expect(page.locator('[data-testid="food-detail"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    });
  });

  test.describe('Serving Adjustment', () => {
    test('should display serving adjuster', async ({ authenticatedPage: page }) => {
      await mockApi.foodSearch(page, [SAMPLE_FOODS.chickenBreast]);

      await page.goto('/add');
      await foodSearch.search(page, 'chicken');
      await foodSearch.selectResult(page, 0);

      await expect(page.locator('[data-testid="serving-adjuster"]')).toBeVisible();
      await expect(page.locator('[data-testid="servings-input"]')).toHaveValue('1');

      // Screenshot: Serving adjuster
      await ScreenshotPoints.addFood.servingAdjuster(page);
    });

    test('should update calories when servings change', async ({ authenticatedPage: page }) => {
      await mockApi.foodSearch(page, [SAMPLE_FOODS.chickenBreast]);

      await page.goto('/add');
      await foodSearch.search(page, 'chicken');
      await foodSearch.selectResult(page, 0);

      // Initial calories: 165
      await expect(page.locator('[data-testid="adjusted-calories"]')).toContainText('165');

      await foodLogging.adjustServings(page, 2);

      // Updated calories: 330
      await expect(page.locator('[data-testid="adjusted-calories"]')).toContainText('330');
    });

    test('should support decimal servings', async ({ authenticatedPage: page }) => {
      await mockApi.foodSearch(page, [SAMPLE_FOODS.chickenBreast]);

      await page.goto('/add');
      await foodSearch.search(page, 'chicken');
      await foodSearch.selectResult(page, 0);

      await foodLogging.adjustServings(page, 0.5);

      // Updated calories: 82.5 (rounded to 83 or shows as 82.5)
      const caloriesText = await page.locator('[data-testid="adjusted-calories"]').textContent();
      const calories = parseFloat(caloriesText || '0');
      expect(calories).toBeCloseTo(82.5, 0);
    });

    test('should have quick serving buttons', async ({ authenticatedPage: page }) => {
      await mockApi.foodSearch(page, [SAMPLE_FOODS.chickenBreast]);

      await page.goto('/add');
      await foodSearch.search(page, 'chicken');
      await foodSearch.selectResult(page, 0);

      await expect(page.locator('[data-testid="quick-serving-0.5"]')).toBeVisible();
      await expect(page.locator('[data-testid="quick-serving-1"]')).toBeVisible();
      await expect(page.locator('[data-testid="quick-serving-1.5"]')).toBeVisible();
      await expect(page.locator('[data-testid="quick-serving-2"]')).toBeVisible();
    });

    test('should increment/decrement servings with buttons', async ({ authenticatedPage: page }) => {
      await mockApi.foodSearch(page, [SAMPLE_FOODS.chickenBreast]);

      await page.goto('/add');
      await foodSearch.search(page, 'chicken');
      await foodSearch.selectResult(page, 0);

      await page.click('[data-testid="servings-increment"]');
      await expect(page.locator('[data-testid="servings-input"]')).toHaveValue('2');

      await page.click('[data-testid="servings-decrement"]');
      await expect(page.locator('[data-testid="servings-input"]')).toHaveValue('1');
    });

    test('should not allow zero or negative servings', async ({ authenticatedPage: page }) => {
      await mockApi.foodSearch(page, [SAMPLE_FOODS.chickenBreast]);

      await page.goto('/add');
      await foodSearch.search(page, 'chicken');
      await foodSearch.selectResult(page, 0);

      await foodLogging.adjustServings(page, 0);
      await expect(page.locator('[data-testid="servings-error"]')).toBeVisible();

      await foodLogging.adjustServings(page, -1);
      await expect(page.locator('[data-testid="servings-error"]')).toBeVisible();
    });
  });

  test.describe('Meal Selection', () => {
    test('should display meal selector', async ({ authenticatedPage: page }) => {
      await mockApi.foodSearch(page, [SAMPLE_FOODS.chickenBreast]);

      await page.goto('/add');
      await foodSearch.search(page, 'chicken');
      await foodSearch.selectResult(page, 0);

      await expect(page.locator('[data-testid="meal-selector"]')).toBeVisible();
      await expect(page.locator('[data-testid="meal-option-breakfast"]')).toBeVisible();
      await expect(page.locator('[data-testid="meal-option-lunch"]')).toBeVisible();
      await expect(page.locator('[data-testid="meal-option-dinner"]')).toBeVisible();
      await expect(page.locator('[data-testid="meal-option-snack"]')).toBeVisible();

      // Screenshot: Meal selector
      await ScreenshotPoints.addFood.mealSelector(page);
    });

    test('should preselect meal when coming from diary', async ({ authenticatedPage: page }) => {
      await page.goto('/add?meal=lunch');
      await waitForStableState(page);

      await mockApi.foodSearch(page, [SAMPLE_FOODS.chickenBreast]);
      await foodSearch.search(page, 'chicken');
      await foodSearch.selectResult(page, 0);

      await expect(page.locator('[data-testid="meal-option-lunch"]')).toHaveClass(/selected/);
    });

    test('should select meal on tap', async ({ authenticatedPage: page }) => {
      await mockApi.foodSearch(page, [SAMPLE_FOODS.chickenBreast]);

      await page.goto('/add');
      await foodSearch.search(page, 'chicken');
      await foodSearch.selectResult(page, 0);

      await foodLogging.selectMeal(page, 'dinner');

      await expect(page.locator('[data-testid="meal-option-dinner"]')).toHaveClass(/selected/);
      await expect(page.locator('[data-testid="meal-option-breakfast"]')).not.toHaveClass(/selected/);
    });

    test('should default to appropriate meal based on time of day', async ({ authenticatedPage: page }) => {
      await mockApi.foodSearch(page, [SAMPLE_FOODS.chickenBreast]);

      await page.goto('/add');
      await foodSearch.search(page, 'chicken');
      await foodSearch.selectResult(page, 0);

      // At least one meal should be selected by default
      const selectedMeal = page.locator('[data-testid^="meal-option-"].selected');
      await expect(selectedMeal).toHaveCount(1);
    });
  });

  test.describe('Add Confirmation', () => {
    test('should add food to log on confirm', async ({ authenticatedPage: page }) => {
      await mockApi.foodSearch(page, [SAMPLE_FOODS.chickenBreast]);

      let loggedFood: any = null;
      await page.route('**/api/log', async (route) => {
        if (route.request().method() === 'POST') {
          loggedFood = JSON.parse(route.request().postData() || '{}');
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ id: 'log-1', ...loggedFood }),
          });
        }
      });

      await page.goto('/add');
      await foodSearch.search(page, 'chicken');
      await foodSearch.selectResult(page, 0);
      await foodLogging.selectMeal(page, 'lunch');
      await foodLogging.adjustServings(page, 1.5);
      await foodLogging.confirmAdd(page);

      expect(loggedFood).toBeTruthy();
      expect(loggedFood.meal).toBe('lunch');
      expect(loggedFood.servings).toBe(1.5);
      expect(loggedFood.food_name).toBe('Chicken Breast');

      // Screenshot: Success toast
      await ScreenshotPoints.addFood.addSuccess(page);
    });

    test('should show success toast after adding', async ({ authenticatedPage: page }) => {
      await mockApi.foodSearch(page, [SAMPLE_FOODS.chickenBreast]);
      await page.route('**/api/log', async (route) => {
        await route.fulfill({ status: 201, body: JSON.stringify({ id: 'log-1' }) });
      });

      await page.goto('/add');
      await foodSearch.search(page, 'chicken');
      await foodSearch.selectResult(page, 0);
      await foodLogging.confirmAdd(page);

      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-toast"]')).toContainText('Added');
    });

    test('should navigate to diary after adding', async ({ authenticatedPage: page }) => {
      await mockApi.foodSearch(page, [SAMPLE_FOODS.chickenBreast]);
      await page.route('**/api/log', async (route) => {
        await route.fulfill({ status: 201, body: JSON.stringify({ id: 'log-1' }) });
      });

      await page.goto('/add');
      await foodSearch.search(page, 'chicken');
      await foodSearch.selectResult(page, 0);
      await foodLogging.confirmAdd(page);

      await expect(page).toHaveURL(/\/diary/);
    });

    test('should allow adding another food', async ({ authenticatedPage: page }) => {
      await mockApi.foodSearch(page, [SAMPLE_FOODS.chickenBreast]);
      await page.route('**/api/log', async (route) => {
        await route.fulfill({ status: 201, body: JSON.stringify({ id: 'log-1' }) });
      });

      await page.goto('/add');
      await foodSearch.search(page, 'chicken');
      await foodSearch.selectResult(page, 0);

      // Click "Add Another" instead of regular confirm
      await page.click('[data-testid="add-another-button"]');

      // Should stay on add page
      await expect(page).toHaveURL(/\/add/);
      // Should show empty search
      await expect(page.locator('[data-testid="search-input"]')).toHaveValue('');
    });

    test('should show error on add failure', async ({ authenticatedPage: page }) => {
      await mockApi.foodSearch(page, [SAMPLE_FOODS.chickenBreast]);
      await page.route('**/api/log', async (route) => {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Server error' }),
        });
      });

      await page.goto('/add');
      await foodSearch.search(page, 'chicken');
      await foodSearch.selectResult(page, 0);
      await foodLogging.confirmAdd(page);

      await expect(page.locator('[data-testid="error-toast"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-toast"]')).toContainText('Failed to add');
    });

    test('should cancel and return to search', async ({ authenticatedPage: page }) => {
      await mockApi.foodSearch(page, [SAMPLE_FOODS.chickenBreast]);

      await page.goto('/add');
      await foodSearch.search(page, 'chicken');
      await foodSearch.selectResult(page, 0);
      await foodLogging.cancelAdd(page);

      await expect(page.locator('[data-testid="food-detail"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="search-input"]')).toBeVisible();
    });
  });

  test.describe('Custom Foods', () => {
    test('should show custom foods tab', async ({ authenticatedPage: page }) => {
      await page.goto('/add');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="tab-custom"]')).toBeVisible();
    });

    test('should list user custom foods', async ({ authenticatedPage: page }) => {
      await page.route('**/api/food/custom', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([SAMPLE_FOODS.customMeal]),
          });
        }
      });

      await page.goto('/add');
      await page.click('[data-testid="tab-custom"]');

      await expect(page.locator('[data-testid="custom-food-0"]')).toContainText('Homemade Salad');
    });

    test('should search within custom foods', async ({ authenticatedPage: page }) => {
      await page.route('**/api/food/custom**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([SAMPLE_FOODS.customMeal]),
        });
      });

      await page.goto('/add');
      await page.click('[data-testid="tab-custom"]');
      await page.fill('[data-testid="custom-search-input"]', 'salad');

      await expect(page.locator('[data-testid="custom-food-0"]')).toBeVisible();
    });

    test('should delete custom food', async ({ authenticatedPage: page }) => {
      await page.route('**/api/food/custom**', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{ id: 'custom-1', ...SAMPLE_FOODS.customMeal }]),
          });
        } else if (route.request().method() === 'DELETE') {
          await route.fulfill({ status: 200, body: '{}' });
        }
      });

      await page.goto('/add');
      await page.click('[data-testid="tab-custom"]');
      await page.click('[data-testid="custom-food-0"] [data-testid="delete-button"]');
      await page.click('[data-testid="confirm-delete"]');

      await expect(page.locator('[data-testid="custom-food-0"]')).not.toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have accessible search input', async ({ authenticatedPage: page }) => {
      await page.goto('/add');

      const searchInput = page.locator('[data-testid="search-input"]');
      await expect(searchInput).toHaveAttribute('aria-label');
      await expect(searchInput).toHaveAttribute('type', 'search');
    });

    test('should announce search results to screen readers', async ({ authenticatedPage: page }) => {
      await mockApi.foodSearch(page, [SAMPLE_FOODS.chickenBreast, SAMPLE_FOODS.banana]);

      await page.goto('/add');
      await foodSearch.search(page, 'food');

      // Should have aria-live region for results
      await expect(page.locator('[data-testid="search-results"]')).toHaveAttribute('aria-live', 'polite');
    });

    test('should support keyboard navigation in search results', async ({ authenticatedPage: page }) => {
      await mockApi.foodSearch(page, [SAMPLE_FOODS.chickenBreast, SAMPLE_FOODS.banana]);

      await page.goto('/add');
      await foodSearch.search(page, 'food');

      // Focus should move through results with arrow keys
      await page.keyboard.press('ArrowDown');
      await expect(page.locator('[data-testid="search-result-0"]')).toBeFocused();

      await page.keyboard.press('ArrowDown');
      await expect(page.locator('[data-testid="search-result-1"]')).toBeFocused();

      // Enter should select
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-testid="food-detail"]')).toBeVisible();
    });
  });
});
