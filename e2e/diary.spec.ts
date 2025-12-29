import { test, expect, SAMPLE_FOODS, DEFAULT_SETTINGS } from './fixtures/test-fixtures';
import { navigate, dateNavigation, assertions, foodLogging } from './utils/test-helpers';
import { ScreenshotPoints, waitForStableState } from './utils/screenshot-utils';

/**
 * Diary View E2E Tests
 *
 * Tests for the daily food diary feature including:
 * - Date navigation (today, previous, next days)
 * - Meal sections (breakfast, lunch, dinner, snacks)
 * - Daily totals calculation
 * - Simple vs Advanced mode display
 * - Food entry management
 */

test.describe('Diary View', () => {
  test.beforeEach(async ({ authenticatedPage, mockAuth, setUserSettings }) => {
    await mockAuth();
    await setUserSettings(DEFAULT_SETTINGS);
  });

  test.describe('Date Navigation', () => {
    test('should display today by default', async ({ authenticatedPage: page }) => {
      await page.goto('/diary');
      await waitForStableState(page);

      // Verify today's date is displayed
      const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      await expect(page.locator('[data-testid="current-date"]')).toContainText(today);

      // Screenshot: Initial diary view
      await ScreenshotPoints.diary.emptyState(page);
    });

    test('should navigate to previous day', async ({ authenticatedPage: page }) => {
      await page.goto('/diary');
      await waitForStableState(page);

      const initialDate = await dateNavigation.getCurrentDate(page);
      await dateNavigation.goToPreviousDay(page);

      const newDate = await dateNavigation.getCurrentDate(page);
      expect(newDate).not.toBe(initialDate);

      // Screenshot: Previous day navigation
      await ScreenshotPoints.diary.dateNavigation(page, 'prev');
    });

    test('should navigate to next day', async ({ authenticatedPage: page }) => {
      await page.goto('/diary');
      await dateNavigation.goToPreviousDay(page);
      await waitForStableState(page);

      const initialDate = await dateNavigation.getCurrentDate(page);
      await dateNavigation.goToNextDay(page);

      const newDate = await dateNavigation.getCurrentDate(page);
      expect(newDate).not.toBe(initialDate);

      // Screenshot: Next day navigation
      await ScreenshotPoints.diary.dateNavigation(page, 'next');
    });

    test('should return to today when today button is pressed', async ({ authenticatedPage: page }) => {
      await page.goto('/diary');
      await dateNavigation.goToPreviousDay(page);
      await dateNavigation.goToPreviousDay(page);
      await waitForStableState(page);

      await dateNavigation.goToToday(page);

      const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      await expect(page.locator('[data-testid="current-date"]')).toContainText(today);
    });

    test('should not allow navigation to future dates', async ({ authenticatedPage: page }) => {
      await page.goto('/diary');
      await waitForStableState(page);

      // Next button should be disabled when on today
      const nextButton = page.locator('[data-testid="date-next"]');
      await expect(nextButton).toBeDisabled();
    });
  });

  test.describe('Meal Sections', () => {
    test('should display all four meal sections', async ({ authenticatedPage: page }) => {
      await page.goto('/diary');
      await waitForStableState(page);

      // Verify all meal sections exist
      await expect(page.locator('[data-testid="meal-breakfast"]')).toBeVisible();
      await expect(page.locator('[data-testid="meal-lunch"]')).toBeVisible();
      await expect(page.locator('[data-testid="meal-dinner"]')).toBeVisible();
      await expect(page.locator('[data-testid="meal-snack"]')).toBeVisible();
    });

    test('should expand meal section when clicked', async ({ authenticatedPage: page }) => {
      await page.goto('/diary');
      await waitForStableState(page);

      // Click to expand breakfast
      await page.click('[data-testid="meal-breakfast"] [data-testid="meal-header"]');
      await expect(page.locator('[data-testid="meal-breakfast"]')).toHaveClass(/expanded/);

      // Screenshot: Expanded meal section
      await ScreenshotPoints.diary.mealExpanded(page, 'breakfast');
    });

    test('should show add button for each meal', async ({ authenticatedPage: page }) => {
      await page.goto('/diary');
      await waitForStableState(page);

      const meals = ['breakfast', 'lunch', 'dinner', 'snack'];
      for (const meal of meals) {
        await expect(page.locator(`[data-testid="meal-${meal}"] [data-testid="add-to-meal"]`)).toBeVisible();
      }
    });

    test('should display food entries in correct meal section', async ({ authenticatedPage: page, seedFoodLog }) => {
      const today = new Date().toISOString().split('T')[0];
      await seedFoodLog([
        { date: today, meal: 'breakfast', food: SAMPLE_FOODS.banana, servings: 1 },
        { date: today, meal: 'lunch', food: SAMPLE_FOODS.chickenBreast, servings: 1.5 },
      ]);

      await page.goto('/diary');
      await waitForStableState(page);

      // Verify entries are in correct sections
      await expect(page.locator('[data-testid="meal-breakfast"]')).toContainText('Banana');
      await expect(page.locator('[data-testid="meal-lunch"]')).toContainText('Chicken Breast');

      // Screenshot: Diary with meals
      await ScreenshotPoints.diary.withMeals(page);
    });
  });

  test.describe('Daily Totals', () => {
    test('should display daily calorie total', async ({ authenticatedPage: page, seedFoodLog }) => {
      const today = new Date().toISOString().split('T')[0];
      await seedFoodLog([
        { date: today, meal: 'breakfast', food: SAMPLE_FOODS.banana, servings: 1 },
        { date: today, meal: 'lunch', food: SAMPLE_FOODS.chickenBreast, servings: 1 },
      ]);

      await page.goto('/diary');
      await waitForStableState(page);

      // Expected total: 105 (banana) + 165 (chicken) = 270 calories
      await assertions.dailyTotals(page, { calories: 270 });

      // Screenshot: Daily totals
      await ScreenshotPoints.diary.dailyTotals(page);
    });

    test('should show progress bar relative to calorie goal', async ({ authenticatedPage: page, seedFoodLog, setUserSettings }) => {
      await setUserSettings({ calorieGoal: 2000 });

      const today = new Date().toISOString().split('T')[0];
      await seedFoodLog([
        { date: today, meal: 'breakfast', food: SAMPLE_FOODS.chickenBreast, servings: 6 }, // 990 calories
      ]);

      await page.goto('/diary');
      await waitForStableState(page);

      // 990/2000 = ~49.5%
      const progressBar = page.locator('[data-testid="calorie-progress-bar"]');
      await expect(progressBar).toBeVisible();
    });

    test('should update totals when food is deleted', async ({ authenticatedPage: page, seedFoodLog }) => {
      const today = new Date().toISOString().split('T')[0];
      await seedFoodLog([
        { date: today, meal: 'breakfast', food: SAMPLE_FOODS.banana, servings: 1 },
      ]);

      await page.goto('/diary');
      await waitForStableState(page);

      // Initial total should be 105
      await assertions.dailyTotals(page, { calories: 105 });

      // Delete the entry (mock the delete response)
      await page.route('**/api/log/**', async (route) => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill({ status: 200, body: '{}' });
        }
      });

      await foodLogging.deleteEntry(page, 'log-0');

      // Total should now be 0
      await assertions.dailyTotals(page, { calories: 0 });
    });
  });

  test.describe('Simple Mode (Calories Only)', () => {
    test('should only show calories in simple mode', async ({ authenticatedPage: page, setUserSettings }) => {
      await setUserSettings({ displayMode: 'simple' });

      await page.goto('/diary');
      await waitForStableState(page);

      // Calories should be visible
      await expect(page.locator('[data-testid="total-calories"]')).toBeVisible();

      // Macros should NOT be visible
      await expect(page.locator('[data-testid="total-protein"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="total-carbs"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="total-fat"]')).not.toBeVisible();
    });

    test('should not show macro progress bars in simple mode', async ({ authenticatedPage: page, setUserSettings }) => {
      await setUserSettings({ displayMode: 'simple' });

      await page.goto('/diary');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="macro-breakdown"]')).not.toBeVisible();
    });
  });

  test.describe('Advanced Mode (Full Macros)', () => {
    test('should show all macros in advanced mode', async ({ authenticatedPage: page, setUserSettings, seedFoodLog }) => {
      await setUserSettings({ displayMode: 'advanced' });

      const today = new Date().toISOString().split('T')[0];
      await seedFoodLog([
        { date: today, meal: 'lunch', food: SAMPLE_FOODS.chickenBreast, servings: 1 },
      ]);

      await page.goto('/diary');
      await waitForStableState(page);

      // All macros should be visible
      await expect(page.locator('[data-testid="total-calories"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-protein"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-carbs"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-fat"]')).toBeVisible();

      // Verify values
      await assertions.dailyTotals(page, {
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
      });

      // Screenshot: Advanced mode with macros
      await ScreenshotPoints.diary.advancedMode(page);
    });

    test('should show macro progress bars in advanced mode', async ({ authenticatedPage: page, setUserSettings }) => {
      await setUserSettings({ displayMode: 'advanced' });

      await page.goto('/diary');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="macro-breakdown"]')).toBeVisible();
      await expect(page.locator('[data-testid="protein-progress"]')).toBeVisible();
      await expect(page.locator('[data-testid="carbs-progress"]')).toBeVisible();
      await expect(page.locator('[data-testid="fat-progress"]')).toBeVisible();
    });
  });

  test.describe('Food Entry Management', () => {
    test('should show food entry details', async ({ authenticatedPage: page, seedFoodLog }) => {
      const today = new Date().toISOString().split('T')[0];
      await seedFoodLog([
        { date: today, meal: 'breakfast', food: SAMPLE_FOODS.banana, servings: 2 },
      ]);

      await page.goto('/diary');
      await waitForStableState(page);

      const entry = page.locator('[data-testid="food-entry-log-0"]');
      await expect(entry).toContainText('Banana');
      await expect(entry).toContainText('2'); // servings
      await expect(entry).toContainText('210'); // calories (105 * 2)
    });

    test('should navigate to add food when meal add button is clicked', async ({ authenticatedPage: page }) => {
      await page.goto('/diary');
      await waitForStableState(page);

      await page.click('[data-testid="meal-breakfast"] [data-testid="add-to-meal"]');

      await expect(page).toHaveURL(/\/add/);
      // Meal should be preselected
      await expect(page.locator('[data-testid="meal-option-breakfast"]')).toHaveClass(/selected/);
    });

    test('should confirm before deleting food entry', async ({ authenticatedPage: page, seedFoodLog }) => {
      const today = new Date().toISOString().split('T')[0];
      await seedFoodLog([
        { date: today, meal: 'breakfast', food: SAMPLE_FOODS.banana, servings: 1 },
      ]);

      await page.goto('/diary');
      await waitForStableState(page);

      // Click delete button
      await page.click('[data-testid="food-entry-log-0"] [data-testid="delete-button"]');

      // Confirmation dialog should appear
      await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible();
      await expect(page.locator('[data-testid="confirm-dialog"]')).toContainText('Delete');
    });

    test('should swipe to delete on mobile', async ({ authenticatedPage: page, seedFoodLog }) => {
      const today = new Date().toISOString().split('T')[0];
      await seedFoodLog([
        { date: today, meal: 'breakfast', food: SAMPLE_FOODS.banana, servings: 1 },
      ]);

      await page.goto('/diary');
      await waitForStableState(page);

      const entry = page.locator('[data-testid="food-entry-log-0"]');
      const box = await entry.boundingBox();

      if (box) {
        // Simulate swipe left
        await page.mouse.move(box.x + box.width - 10, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + 10, box.y + box.height / 2, { steps: 10 });
        await page.mouse.up();

        // Delete action should be revealed
        await expect(page.locator('[data-testid="swipe-delete-action"]')).toBeVisible();
      }
    });
  });

  test.describe('Empty States', () => {
    test('should show empty state message when no entries', async ({ authenticatedPage: page, clearFoodLog }) => {
      await clearFoodLog();

      await page.goto('/diary');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="empty-diary-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="empty-diary-message"]')).toContainText('No food logged');
    });

    test('should show call-to-action in empty state', async ({ authenticatedPage: page, clearFoodLog }) => {
      await clearFoodLog();

      await page.goto('/diary');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="add-first-food-button"]')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels for date navigation', async ({ authenticatedPage: page }) => {
      await page.goto('/diary');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="date-prev"]')).toHaveAttribute('aria-label', /previous/i);
      await expect(page.locator('[data-testid="date-next"]')).toHaveAttribute('aria-label', /next/i);
      await expect(page.locator('[data-testid="date-today"]')).toHaveAttribute('aria-label', /today/i);
    });

    test('should support keyboard navigation', async ({ authenticatedPage: page }) => {
      await page.goto('/diary');
      await waitForStableState(page);

      // Tab through elements
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="date-prev"]')).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="date-today"]')).toBeFocused();
    });

    test('should have sufficient touch targets', async ({ authenticatedPage: page }) => {
      await page.goto('/diary');
      await waitForStableState(page);

      const buttons = page.locator('button, [role="button"]');
      const count = await buttons.count();

      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i);
        const box = await button.boundingBox();
        if (box) {
          // Minimum touch target size: 44x44 pixels
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });
  });

  test.describe('Loading States', () => {
    test('should show loading skeleton while fetching data', async ({ authenticatedPage: page }) => {
      // Add delay to API response
      await page.route('**/api/log**', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      });

      await page.goto('/diary');

      // Should show loading state
      await expect(page.locator('[data-testid="diary-skeleton"]')).toBeVisible();

      // Wait for loading to complete
      await expect(page.locator('[data-testid="diary-skeleton"]')).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Error Handling', () => {
    test('should show error message on API failure', async ({ authenticatedPage: page }) => {
      await page.route('**/api/log**', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' }),
        });
      });

      await page.goto('/diary');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });

    test('should retry on error', async ({ authenticatedPage: page }) => {
      let attempts = 0;
      await page.route('**/api/log**', async (route) => {
        attempts++;
        if (attempts === 1) {
          await route.fulfill({
            status: 500,
            body: JSON.stringify({ error: 'Server error' }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
          });
        }
      });

      await page.goto('/diary');
      await page.click('[data-testid="retry-button"]');

      await expect(page.locator('[data-testid="error-message"]')).not.toBeVisible();
      expect(attempts).toBe(2);
    });
  });
});
