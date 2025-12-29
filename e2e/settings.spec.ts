import { test, expect, DEFAULT_SETTINGS, TEST_USER } from './fixtures/test-fixtures';
import { navigate, settings } from './utils/test-helpers';
import { ScreenshotPoints, waitForStableState } from './utils/screenshot-utils';

/**
 * Settings View E2E Tests
 *
 * Tests for the settings and preferences feature including:
 * - Goal editing (calories, macros)
 * - Display mode toggle (simple/advanced)
 * - Account information
 * - Data management
 */

test.describe('Settings View', () => {
  test.beforeEach(async ({ authenticatedPage, mockAuth, setUserSettings }) => {
    await mockAuth();
    await setUserSettings(DEFAULT_SETTINGS);
  });

  test.describe('Overview', () => {
    test('should display settings page', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="settings-container"]')).toBeVisible();

      // Screenshot: Settings overview
      await ScreenshotPoints.settings.overview(page);
    });

    test('should show all main sections', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="goals-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="display-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="account-section"]')).toBeVisible();
    });
  });

  test.describe('Calorie Goal', () => {
    test('should display current calorie goal', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="calorie-goal-input"]')).toHaveValue('2000');
    });

    test('should update calorie goal', async ({ authenticatedPage: page }) => {
      let savedSettings: any = null;
      await page.route('**/api/settings**', async (route) => {
        if (route.request().method() === 'PUT') {
          savedSettings = JSON.parse(route.request().postData() || '{}');
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              ...DEFAULT_SETTINGS,
              ...savedSettings,
            }),
          });
        } else {
          await route.continue();
        }
      });

      await page.goto('/settings');
      await settings.setCalorieGoal(page, 1800);
      await settings.saveSettings(page);

      expect(savedSettings.calorie_goal).toBe(1800);
    });

    test('should validate calorie goal range', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
      await waitForStableState(page);

      // Too low
      await settings.setCalorieGoal(page, 500);
      await settings.saveSettings(page);
      await expect(page.locator('[data-testid="calorie-goal-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="calorie-goal-error"]')).toContainText('at least 1000');

      // Too high
      await settings.setCalorieGoal(page, 15000);
      await settings.saveSettings(page);
      await expect(page.locator('[data-testid="calorie-goal-error"]')).toContainText('maximum');
    });

    test('should show recommended calorie range', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="calorie-recommendation"]')).toBeVisible();
    });
  });

  test.describe('Macro Goals (Advanced Mode)', () => {
    test('should show macro goals in advanced mode', async ({ authenticatedPage: page, setUserSettings }) => {
      await setUserSettings({ displayMode: 'advanced' });

      await page.goto('/settings');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="protein-goal-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="carbs-goal-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="fat-goal-input"]')).toBeVisible();

      // Screenshot: Goal editor
      await ScreenshotPoints.settings.goalEditor(page);
    });

    test('should hide macro goals in simple mode', async ({ authenticatedPage: page, setUserSettings }) => {
      await setUserSettings({ displayMode: 'simple' });

      await page.goto('/settings');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="protein-goal-input"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="carbs-goal-input"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="fat-goal-input"]')).not.toBeVisible();
    });

    test('should display current macro goals', async ({ authenticatedPage: page, setUserSettings }) => {
      await setUserSettings({
        displayMode: 'advanced',
        proteinGoal: 150,
        carbsGoal: 200,
        fatGoal: 65,
      });

      await page.goto('/settings');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="protein-goal-input"]')).toHaveValue('150');
      await expect(page.locator('[data-testid="carbs-goal-input"]')).toHaveValue('200');
      await expect(page.locator('[data-testid="fat-goal-input"]')).toHaveValue('65');
    });

    test('should update macro goals', async ({ authenticatedPage: page, setUserSettings }) => {
      await setUserSettings({ displayMode: 'advanced' });

      let savedSettings: any = null;
      await page.route('**/api/settings**', async (route) => {
        if (route.request().method() === 'PUT') {
          savedSettings = JSON.parse(route.request().postData() || '{}');
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(savedSettings),
          });
        } else {
          await route.continue();
        }
      });

      await page.goto('/settings');
      await settings.setProteinGoal(page, 180);
      await settings.setCarbsGoal(page, 220);
      await settings.setFatGoal(page, 70);
      await settings.saveSettings(page);

      expect(savedSettings.protein_goal).toBe(180);
      expect(savedSettings.carbs_goal).toBe(220);
      expect(savedSettings.fat_goal).toBe(70);
    });

    test('should validate macro goals', async ({ authenticatedPage: page, setUserSettings }) => {
      await setUserSettings({ displayMode: 'advanced' });

      await page.goto('/settings');
      await waitForStableState(page);

      // Negative value
      await settings.setProteinGoal(page, -10);
      await settings.saveSettings(page);
      await expect(page.locator('[data-testid="protein-goal-error"]')).toBeVisible();
    });

    test('should show macro percentage breakdown', async ({ authenticatedPage: page, setUserSettings }) => {
      await setUserSettings({
        displayMode: 'advanced',
        calorieGoal: 2000,
        proteinGoal: 150,
        carbsGoal: 200,
        fatGoal: 65,
      });

      await page.goto('/settings');
      await waitForStableState(page);

      // Protein: 150g * 4 = 600 cal = 30%
      // Carbs: 200g * 4 = 800 cal = 40%
      // Fat: 65g * 9 = 585 cal = 29.25%
      await expect(page.locator('[data-testid="macro-percentage-protein"]')).toContainText('30%');
      await expect(page.locator('[data-testid="macro-percentage-carbs"]')).toContainText('40%');
      await expect(page.locator('[data-testid="macro-percentage-fat"]')).toContainText('29%');
    });
  });

  test.describe('Display Mode Toggle', () => {
    test('should show display mode toggle', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="display-mode-toggle"]')).toBeVisible();
    });

    test('should display current mode', async ({ authenticatedPage: page, setUserSettings }) => {
      await setUserSettings({ displayMode: 'simple' });

      await page.goto('/settings');
      await waitForStableState(page);

      const toggle = page.locator('[data-testid="display-mode-toggle"]');
      await expect(toggle).toHaveAttribute('data-mode', 'simple');

      // Screenshot: Simple mode
      await ScreenshotPoints.settings.simpleMode(page);
    });

    test('should toggle from simple to advanced', async ({ authenticatedPage: page, setUserSettings }) => {
      await setUserSettings({ displayMode: 'simple' });

      let savedSettings: any = null;
      await page.route('**/api/settings**', async (route) => {
        if (route.request().method() === 'PUT') {
          savedSettings = JSON.parse(route.request().postData() || '{}');
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(savedSettings),
          });
        } else {
          await route.continue();
        }
      });

      await page.goto('/settings');
      await settings.toggleDisplayMode(page);
      await settings.saveSettings(page);

      expect(savedSettings.display_mode).toBe('advanced');

      // Screenshot: Advanced mode
      await ScreenshotPoints.settings.advancedMode(page);
    });

    test('should toggle from advanced to simple', async ({ authenticatedPage: page, setUserSettings }) => {
      await setUserSettings({ displayMode: 'advanced' });

      let savedSettings: any = null;
      await page.route('**/api/settings**', async (route) => {
        if (route.request().method() === 'PUT') {
          savedSettings = JSON.parse(route.request().postData() || '{}');
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(savedSettings),
          });
        } else {
          await route.continue();
        }
      });

      await page.goto('/settings');
      await settings.toggleDisplayMode(page);
      await settings.saveSettings(page);

      expect(savedSettings.display_mode).toBe('simple');
    });

    test('should show/hide macro inputs when mode changes', async ({ authenticatedPage: page, setUserSettings }) => {
      await setUserSettings({ displayMode: 'simple' });

      await page.goto('/settings');
      await waitForStableState(page);

      // Initially hidden
      await expect(page.locator('[data-testid="protein-goal-input"]')).not.toBeVisible();

      // Toggle to advanced
      await settings.toggleDisplayMode(page);

      // Should now be visible
      await expect(page.locator('[data-testid="protein-goal-input"]')).toBeVisible();
    });

    test('should explain mode differences', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="mode-explanation"]')).toBeVisible();
      await expect(page.locator('[data-testid="mode-explanation"]')).toContainText('Simple');
      await expect(page.locator('[data-testid="mode-explanation"]')).toContainText('Advanced');
    });
  });

  test.describe('Account Information', () => {
    test('should display user email', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="user-email"]')).toContainText(TEST_USER.email);

      // Screenshot: Account info
      await ScreenshotPoints.settings.accountInfo(page);
    });

    test('should show sign out button', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="sign-out-button"]')).toBeVisible();
    });

    test('should sign out user', async ({ authenticatedPage: page }) => {
      await page.route('**/auth/v1/logout', async (route) => {
        await route.fulfill({ status: 200, body: '{}' });
      });

      await page.goto('/settings');
      await page.click('[data-testid="sign-out-button"]');

      // Should redirect to login page
      await expect(page).toHaveURL(/\/login|\/auth/);
    });
  });

  test.describe('Data Management', () => {
    test('should show export data option', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="export-data-button"]')).toBeVisible();
    });

    test('should export data as JSON', async ({ authenticatedPage: page }) => {
      await page.route('**/api/export**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: {
            'Content-Disposition': 'attachment; filename="fittrack-export.json"',
          },
          body: JSON.stringify({
            settings: DEFAULT_SETTINGS,
            foodLog: [],
            weightLog: [],
          }),
        });
      });

      await page.goto('/settings');

      // Set up download promise
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-data-button"]');
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toContain('fittrack');
    });

    test('should show clear data option', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="clear-data-button"]')).toBeVisible();
    });

    test('should confirm before clearing data', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
      await page.click('[data-testid="clear-data-button"]');

      await expect(page.locator('[data-testid="confirm-clear-dialog"]')).toBeVisible();
      await expect(page.locator('[data-testid="confirm-clear-dialog"]')).toContainText('Are you sure');
    });

    test('should clear data on confirmation', async ({ authenticatedPage: page }) => {
      await page.route('**/api/clear-data**', async (route) => {
        await route.fulfill({ status: 200, body: '{}' });
      });

      await page.goto('/settings');
      await page.click('[data-testid="clear-data-button"]');
      await page.click('[data-testid="confirm-clear-button"]');

      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-toast"]')).toContainText('cleared');
    });
  });

  test.describe('Weight Goal', () => {
    test('should show weight goal input', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="weight-goal-input"]')).toBeVisible();
    });

    test('should update weight goal', async ({ authenticatedPage: page }) => {
      let savedSettings: any = null;
      await page.route('**/api/settings**', async (route) => {
        if (route.request().method() === 'PUT') {
          savedSettings = JSON.parse(route.request().postData() || '{}');
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(savedSettings),
          });
        } else {
          await route.continue();
        }
      });

      await page.goto('/settings');
      await page.fill('[data-testid="weight-goal-input"]', '75');
      await settings.saveSettings(page);

      expect(savedSettings.weight_goal).toBe(75);
    });

    test('should allow clearing weight goal', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
      await page.fill('[data-testid="weight-goal-input"]', '');
      await settings.saveSettings(page);

      // Should save without error
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    });
  });

  test.describe('Save/Cancel', () => {
    test('should show save button', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="save-settings"]')).toBeVisible();
    });

    test('should show success message on save', async ({ authenticatedPage: page }) => {
      await page.route('**/api/settings**', async (route) => {
        if (route.request().method() === 'PUT') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(DEFAULT_SETTINGS),
          });
        }
      });

      await page.goto('/settings');
      await settings.saveSettings(page);

      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-toast"]')).toContainText('saved');

      // Screenshot: Save success
      await ScreenshotPoints.settings.saveSuccess(page);
    });

    test('should show error on save failure', async ({ authenticatedPage: page }) => {
      await page.route('**/api/settings**', async (route) => {
        if (route.request().method() === 'PUT') {
          await route.fulfill({
            status: 500,
            body: JSON.stringify({ error: 'Server error' }),
          });
        }
      });

      await page.goto('/settings');
      await settings.saveSettings(page);

      await expect(page.locator('[data-testid="error-toast"]')).toBeVisible();
    });

    test('should warn on unsaved changes', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
      await settings.setCalorieGoal(page, 1800);

      // Try to navigate away
      await page.click('[data-testid="nav-diary"]');

      // Should show unsaved changes warning
      await expect(page.locator('[data-testid="unsaved-changes-dialog"]')).toBeVisible();
    });

    test('should discard changes on confirm', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
      await settings.setCalorieGoal(page, 1800);

      await page.click('[data-testid="nav-diary"]');
      await page.click('[data-testid="discard-changes-button"]');

      await expect(page).toHaveURL(/\/diary/);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper form labels', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
      await waitForStableState(page);

      const calorieInput = page.locator('[data-testid="calorie-goal-input"]');
      await expect(calorieInput).toHaveAttribute('aria-label');
    });

    test('should support keyboard navigation', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
      await waitForStableState(page);

      // Tab through form elements
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="calorie-goal-input"]')).toBeFocused();
    });

    test('should announce save results to screen readers', async ({ authenticatedPage: page }) => {
      await page.route('**/api/settings**', async (route) => {
        await route.fulfill({ status: 200, body: JSON.stringify(DEFAULT_SETTINGS) });
      });

      await page.goto('/settings');
      await settings.saveSettings(page);

      // Toast should have aria-live
      await expect(page.locator('[data-testid="success-toast"]')).toHaveAttribute('aria-live');
    });
  });

  test.describe('App Info', () => {
    test('should show app version', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="app-version"]')).toBeVisible();
    });

    test('should show privacy policy link', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="privacy-policy-link"]')).toBeVisible();
    });

    test('should show terms of service link', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="terms-link"]')).toBeVisible();
    });
  });
});
