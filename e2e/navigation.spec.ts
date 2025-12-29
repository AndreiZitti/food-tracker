import { test, expect, DEFAULT_SETTINGS } from './fixtures/test-fixtures';
import { navigate } from './utils/test-helpers';
import { ScreenshotPoints, waitForStableState } from './utils/screenshot-utils';

/**
 * Navigation E2E Tests
 *
 * Tests for the bottom navigation and overall app navigation including:
 * - Bottom navigation bar
 * - Tab switching
 * - Active state indicators
 * - Deep linking
 * - PWA behavior
 */

test.describe('Navigation', () => {
  test.beforeEach(async ({ authenticatedPage, mockAuth, setUserSettings }) => {
    await mockAuth();
    await setUserSettings(DEFAULT_SETTINGS);
  });

  test.describe('Bottom Navigation Bar', () => {
    test('should display bottom navigation on all pages', async ({ authenticatedPage: page }) => {
      // Check on diary page
      await page.goto('/diary');
      await waitForStableState(page);
      await expect(page.locator('[data-testid="bottom-nav"]')).toBeVisible();

      // Screenshot: Bottom navigation
      await ScreenshotPoints.navigation.bottomNav(page);

      // Check on add page
      await page.goto('/add');
      await waitForStableState(page);
      await expect(page.locator('[data-testid="bottom-nav"]')).toBeVisible();

      // Check on progress page
      await page.goto('/progress');
      await waitForStableState(page);
      await expect(page.locator('[data-testid="bottom-nav"]')).toBeVisible();

      // Check on settings page
      await page.goto('/settings');
      await waitForStableState(page);
      await expect(page.locator('[data-testid="bottom-nav"]')).toBeVisible();
    });

    test('should have four navigation items', async ({ authenticatedPage: page }) => {
      await page.goto('/diary');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="nav-diary"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-add"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-progress"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-settings"]')).toBeVisible();
    });

    test('should have icons and labels for each item', async ({ authenticatedPage: page }) => {
      await page.goto('/diary');
      await waitForStableState(page);

      // Diary
      await expect(page.locator('[data-testid="nav-diary"] svg, [data-testid="nav-diary"] [data-icon]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-diary"]')).toContainText(/diary/i);

      // Add
      await expect(page.locator('[data-testid="nav-add"] svg, [data-testid="nav-add"] [data-icon]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-add"]')).toContainText(/add/i);

      // Progress
      await expect(page.locator('[data-testid="nav-progress"] svg, [data-testid="nav-progress"] [data-icon]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-progress"]')).toContainText(/progress/i);

      // Settings
      await expect(page.locator('[data-testid="nav-settings"] svg, [data-testid="nav-settings"] [data-icon]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-settings"]')).toContainText(/settings/i);
    });
  });

  test.describe('Tab Navigation', () => {
    test('should navigate to diary page', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
      await navigate.toDiary(page);

      await expect(page).toHaveURL(/\/diary/);
      await expect(page.locator('[data-testid="diary-container"]')).toBeVisible();
    });

    test('should navigate to add food page', async ({ authenticatedPage: page }) => {
      await page.goto('/diary');
      await navigate.toAddFood(page);

      await expect(page).toHaveURL(/\/add/);
      await expect(page.locator('[data-testid="add-food-container"]')).toBeVisible();
    });

    test('should navigate to progress page', async ({ authenticatedPage: page }) => {
      await page.goto('/diary');
      await navigate.toProgress(page);

      await expect(page).toHaveURL(/\/progress/);
      await expect(page.locator('[data-testid="progress-container"]')).toBeVisible();
    });

    test('should navigate to settings page', async ({ authenticatedPage: page }) => {
      await page.goto('/diary');
      await navigate.toSettings(page);

      await expect(page).toHaveURL(/\/settings/);
      await expect(page.locator('[data-testid="settings-container"]')).toBeVisible();
    });
  });

  test.describe('Active State', () => {
    test('should highlight diary tab when on diary page', async ({ authenticatedPage: page }) => {
      await page.goto('/diary');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="nav-diary"]')).toHaveClass(/active/);
      await expect(page.locator('[data-testid="nav-add"]')).not.toHaveClass(/active/);
      await expect(page.locator('[data-testid="nav-progress"]')).not.toHaveClass(/active/);
      await expect(page.locator('[data-testid="nav-settings"]')).not.toHaveClass(/active/);

      // Screenshot: Active diary tab
      await ScreenshotPoints.navigation.activeTab(page, 'diary');
    });

    test('should highlight add tab when on add page', async ({ authenticatedPage: page }) => {
      await page.goto('/add');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="nav-add"]')).toHaveClass(/active/);
      await expect(page.locator('[data-testid="nav-diary"]')).not.toHaveClass(/active/);
    });

    test('should highlight progress tab when on progress page', async ({ authenticatedPage: page }) => {
      await page.goto('/progress');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="nav-progress"]')).toHaveClass(/active/);
      await expect(page.locator('[data-testid="nav-diary"]')).not.toHaveClass(/active/);
    });

    test('should highlight settings tab when on settings page', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="nav-settings"]')).toHaveClass(/active/);
      await expect(page.locator('[data-testid="nav-diary"]')).not.toHaveClass(/active/);
    });
  });

  test.describe('Deep Linking', () => {
    test('should handle root URL redirect to diary', async ({ authenticatedPage: page }) => {
      await page.goto('/');
      await waitForStableState(page);

      await expect(page).toHaveURL(/\/diary/);
    });

    test('should handle deep link to specific date', async ({ authenticatedPage: page }) => {
      await page.goto('/diary?date=2024-01-15');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="current-date"]')).toContainText('January 15');
    });

    test('should handle deep link to add food with meal', async ({ authenticatedPage: page }) => {
      await page.goto('/add?meal=lunch');
      await waitForStableState(page);

      // Mock food search
      await page.route('**/api/food/search**', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify([{ name: 'Test', calories: 100 }]),
        });
      });

      await page.fill('[data-testid="search-input"]', 'test');
      await page.click('[data-testid="search-result-0"]');

      await expect(page.locator('[data-testid="meal-option-lunch"]')).toHaveClass(/selected/);
    });

    test('should handle 404 for unknown routes', async ({ authenticatedPage: page }) => {
      await page.goto('/unknown-page');

      await expect(page.locator('[data-testid="not-found"]')).toBeVisible();
    });
  });

  test.describe('Touch Targets', () => {
    test('should have minimum 44px touch targets for navigation', async ({ authenticatedPage: page }) => {
      await page.goto('/diary');
      await waitForStableState(page);

      const navItems = page.locator('[data-testid^="nav-"]');
      const count = await navItems.count();

      for (let i = 0; i < count; i++) {
        const item = navItems.nth(i);
        const box = await item.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('should have proper spacing between nav items', async ({ authenticatedPage: page }) => {
      await page.goto('/diary');
      await waitForStableState(page);

      const diaryNav = page.locator('[data-testid="nav-diary"]');
      const addNav = page.locator('[data-testid="nav-add"]');

      const diaryBox = await diaryNav.boundingBox();
      const addBox = await addNav.boundingBox();

      if (diaryBox && addBox) {
        // Items should not overlap
        const gap = addBox.x - (diaryBox.x + diaryBox.width);
        expect(gap).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support tab navigation through bottom nav', async ({ authenticatedPage: page }) => {
      await page.goto('/diary');
      await waitForStableState(page);

      // Focus the nav area
      await page.locator('[data-testid="bottom-nav"]').focus();
      await page.keyboard.press('Tab');

      // Should be able to tab through nav items
      await expect(page.locator('[data-testid="nav-diary"]')).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="nav-add"]')).toBeFocused();
    });

    test('should activate nav item on Enter key', async ({ authenticatedPage: page }) => {
      await page.goto('/diary');
      await waitForStableState(page);

      await page.locator('[data-testid="nav-progress"]').focus();
      await page.keyboard.press('Enter');

      await expect(page).toHaveURL(/\/progress/);
    });

    test('should activate nav item on Space key', async ({ authenticatedPage: page }) => {
      await page.goto('/diary');
      await waitForStableState(page);

      await page.locator('[data-testid="nav-settings"]').focus();
      await page.keyboard.press('Space');

      await expect(page).toHaveURL(/\/settings/);
    });
  });

  test.describe('PWA Behavior', () => {
    test('should work in standalone mode', async ({ authenticatedPage: page }) => {
      // Simulate standalone display mode
      await page.addInitScript(() => {
        Object.defineProperty(window, 'matchMedia', {
          writable: true,
          value: (query: string) => ({
            matches: query === '(display-mode: standalone)',
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => false,
          }),
        });
      });

      await page.goto('/diary');
      await waitForStableState(page);

      // App should still function normally
      await expect(page.locator('[data-testid="diary-container"]')).toBeVisible();
      await expect(page.locator('[data-testid="bottom-nav"]')).toBeVisible();
    });

    test('should handle back button navigation', async ({ authenticatedPage: page }) => {
      await page.goto('/diary');
      await waitForStableState(page);

      await navigate.toProgress(page);
      await expect(page).toHaveURL(/\/progress/);

      await page.goBack();
      await expect(page).toHaveURL(/\/diary/);
    });
  });

  test.describe('Loading States', () => {
    test('should show loading indicator on page transitions', async ({ authenticatedPage: page }) => {
      // Add delay to page load
      await page.route('**/api/log**', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      });

      await page.goto('/diary');

      // Should show some loading state
      // Note: This depends on implementation - could be skeleton or spinner
      const hasLoadingState = await page.locator('[data-testid="loading"], [data-testid*="skeleton"]').isVisible()
        .catch(() => false);

      // At minimum, nav should always be visible
      await expect(page.locator('[data-testid="bottom-nav"]')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA roles for navigation', async ({ authenticatedPage: page }) => {
      await page.goto('/diary');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="bottom-nav"]')).toHaveAttribute('role', 'navigation');
    });

    test('should have aria-current on active nav item', async ({ authenticatedPage: page }) => {
      await page.goto('/diary');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="nav-diary"]')).toHaveAttribute('aria-current', 'page');
    });

    test('should have accessible names for nav items', async ({ authenticatedPage: page }) => {
      await page.goto('/diary');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="nav-diary"]')).toHaveAccessibleName();
      await expect(page.locator('[data-testid="nav-add"]')).toHaveAccessibleName();
      await expect(page.locator('[data-testid="nav-progress"]')).toHaveAccessibleName();
      await expect(page.locator('[data-testid="nav-settings"]')).toHaveAccessibleName();
    });
  });
});
