import { test, expect, SAMPLE_FOODS, DEFAULT_SETTINGS, TEST_USER } from './fixtures/test-fixtures';
import { navigate, progress } from './utils/test-helpers';
import { ScreenshotPoints, waitForStableState } from './utils/screenshot-utils';

/**
 * Progress View E2E Tests
 *
 * Tests for the progress tracking feature including:
 * - Calorie consumption charts (7-day and 30-day)
 * - Weight logging and tracking
 * - Goal progress visualization
 * - Time range selection
 */

// Sample weight log data
const SAMPLE_WEIGHT_LOG = [
  { date: '2024-01-01', weight: 80.0, unit: 'kg' },
  { date: '2024-01-03', weight: 79.5, unit: 'kg' },
  { date: '2024-01-05', weight: 79.2, unit: 'kg' },
  { date: '2024-01-07', weight: 78.8, unit: 'kg' },
];

// Sample calorie history
const SAMPLE_CALORIE_HISTORY = [
  { date: '2024-01-01', calories: 1850, goal: 2000 },
  { date: '2024-01-02', calories: 2100, goal: 2000 },
  { date: '2024-01-03', calories: 1950, goal: 2000 },
  { date: '2024-01-04', calories: 2200, goal: 2000 },
  { date: '2024-01-05', calories: 1800, goal: 2000 },
  { date: '2024-01-06', calories: 2050, goal: 2000 },
  { date: '2024-01-07', calories: 1900, goal: 2000 },
];

test.describe('Progress View', () => {
  test.beforeEach(async ({ authenticatedPage, mockAuth, setUserSettings }) => {
    await mockAuth();
    await setUserSettings(DEFAULT_SETTINGS);
  });

  test.describe('Overview', () => {
    test('should display progress page with main sections', async ({ authenticatedPage: page }) => {
      await page.goto('/progress');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="progress-container"]')).toBeVisible();
      await expect(page.locator('[data-testid="calorie-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="weight-section"]')).toBeVisible();

      // Screenshot: Progress overview
      await ScreenshotPoints.progress.overview(page);
    });

    test('should show time range selector', async ({ authenticatedPage: page }) => {
      await page.goto('/progress');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="range-7d"]')).toBeVisible();
      await expect(page.locator('[data-testid="range-30d"]')).toBeVisible();
    });

    test('should default to 7-day view', async ({ authenticatedPage: page }) => {
      await page.goto('/progress');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="range-7d"]')).toHaveClass(/selected/);
    });
  });

  test.describe('Calorie Chart', () => {
    test('should display calorie chart with data', async ({ authenticatedPage: page }) => {
      await page.route('**/api/log/history**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(SAMPLE_CALORIE_HISTORY),
        });
      });

      await page.goto('/progress');
      await waitForStableState(page);

      const chart = page.locator('[data-testid="calorie-chart"]');
      await expect(chart).toBeVisible();

      // Wait for chart to render
      await page.waitForTimeout(500);

      // Screenshot: Calorie chart
      await ScreenshotPoints.progress.calorieChart(page);
    });

    test('should show goal line on calorie chart', async ({ authenticatedPage: page }) => {
      await page.route('**/api/log/history**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(SAMPLE_CALORIE_HISTORY),
        });
      });

      await page.goto('/progress');
      await waitForStableState(page);

      // Should have goal reference line
      await expect(page.locator('[data-testid="goal-line"]')).toBeVisible();
    });

    test('should show average calories for the period', async ({ authenticatedPage: page }) => {
      await page.route('**/api/log/history**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(SAMPLE_CALORIE_HISTORY),
        });
      });

      await page.goto('/progress');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="average-calories"]')).toBeVisible();
      // Average of sample data: (1850+2100+1950+2200+1800+2050+1900)/7 = ~1978
      const avgText = await page.locator('[data-testid="average-calories"]').textContent();
      const avg = parseInt(avgText?.replace(/[^\d]/g, '') || '0');
      expect(avg).toBeGreaterThan(1900);
      expect(avg).toBeLessThan(2100);
    });

    test('should show days on/under goal', async ({ authenticatedPage: page }) => {
      await page.route('**/api/log/history**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(SAMPLE_CALORIE_HISTORY),
        });
      });

      await page.goto('/progress');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="days-under-goal"]')).toBeVisible();
      await expect(page.locator('[data-testid="days-over-goal"]')).toBeVisible();
    });

    test('should update chart when time range changes', async ({ authenticatedPage: page }) => {
      let requestedRange = '';
      await page.route('**/api/log/history**', async (route) => {
        const url = new URL(route.request().url());
        requestedRange = url.searchParams.get('range') || '';
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(SAMPLE_CALORIE_HISTORY),
        });
      });

      await page.goto('/progress');
      await waitForStableState(page);

      await progress.selectTimeRange(page, '30d');

      expect(requestedRange).toBe('30d');

      // Screenshot: 30-day view
      await ScreenshotPoints.progress.timeRangeSelector(page, '30d');
    });

    test('should show tooltip on chart hover', async ({ authenticatedPage: page }) => {
      await page.route('**/api/log/history**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(SAMPLE_CALORIE_HISTORY),
        });
      });

      await page.goto('/progress');
      await waitForStableState(page);

      // Hover over chart
      const chart = page.locator('[data-testid="calorie-chart"]');
      const box = await chart.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(300);
      }

      await expect(page.locator('[data-testid="chart-tooltip"]')).toBeVisible();
    });

    test('should handle empty calorie data', async ({ authenticatedPage: page }) => {
      await page.route('**/api/log/history**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      });

      await page.goto('/progress');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="no-calorie-data"]')).toBeVisible();
      await expect(page.locator('[data-testid="no-calorie-data"]')).toContainText('No data');
    });
  });

  test.describe('Weight Tracking', () => {
    test('should display weight chart with data', async ({ authenticatedPage: page }) => {
      await page.route('**/api/weight**', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(SAMPLE_WEIGHT_LOG),
          });
        }
      });

      await page.goto('/progress');
      await waitForStableState(page);

      const weightChart = page.locator('[data-testid="weight-chart"]');
      await expect(weightChart).toBeVisible();

      // Screenshot: Weight chart
      await ScreenshotPoints.progress.weightChart(page);
    });

    test('should show current weight and change', async ({ authenticatedPage: page }) => {
      await page.route('**/api/weight**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(SAMPLE_WEIGHT_LOG),
        });
      });

      await page.goto('/progress');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="current-weight"]')).toContainText('78.8');
      await expect(page.locator('[data-testid="weight-change"]')).toBeVisible();
      // Change should be -1.2 kg (80.0 - 78.8)
      await expect(page.locator('[data-testid="weight-change"]')).toContainText('-1.2');
    });

    test('should show weight goal if set', async ({ authenticatedPage: page, setUserSettings }) => {
      await setUserSettings({ ...DEFAULT_SETTINGS, weightGoal: 75 });

      await page.route('**/api/weight**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(SAMPLE_WEIGHT_LOG),
        });
      });

      await page.goto('/progress');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="weight-goal"]')).toContainText('75');
      await expect(page.locator('[data-testid="weight-remaining"]')).toContainText('3.8');
    });

    test('should open weight log modal', async ({ authenticatedPage: page }) => {
      await page.goto('/progress');
      await waitForStableState(page);

      await page.click('[data-testid="log-weight-button"]');

      await expect(page.locator('[data-testid="weight-log-modal"]')).toBeVisible();

      // Screenshot: Weight log modal
      await ScreenshotPoints.progress.weightLogModal(page);
    });

    test('should log weight successfully', async ({ authenticatedPage: page }) => {
      let loggedWeight: any = null;
      await page.route('**/api/weight**', async (route) => {
        if (route.request().method() === 'POST') {
          loggedWeight = JSON.parse(route.request().postData() || '{}');
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'weight-1',
              user_id: TEST_USER.id,
              ...loggedWeight,
            }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(SAMPLE_WEIGHT_LOG),
          });
        }
      });

      await page.goto('/progress');
      await progress.logWeight(page, 78.5, 'kg');

      expect(loggedWeight).toBeTruthy();
      expect(loggedWeight.weight).toBe(78.5);
      expect(loggedWeight.unit).toBe('kg');
    });

    test('should validate weight input', async ({ authenticatedPage: page }) => {
      await page.goto('/progress');
      await page.click('[data-testid="log-weight-button"]');

      // Try to save without entering weight
      await page.click('[data-testid="save-weight"]');

      await expect(page.locator('[data-testid="weight-error"]')).toBeVisible();
    });

    test('should support weight in lbs', async ({ authenticatedPage: page }) => {
      await page.route('**/api/weight**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { date: '2024-01-07', weight: 173, unit: 'lb' },
          ]),
        });
      });

      await page.goto('/progress');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="current-weight"]')).toContainText('173');
      await expect(page.locator('[data-testid="weight-unit"]')).toContainText('lb');
    });

    test('should toggle weight unit', async ({ authenticatedPage: page }) => {
      await page.goto('/progress');
      await page.click('[data-testid="log-weight-button"]');

      // Default should be kg
      await expect(page.locator('[data-testid="unit-kg"]')).toHaveClass(/selected/);

      // Toggle to lbs
      await page.click('[data-testid="unit-lb"]');
      await expect(page.locator('[data-testid="unit-lb"]')).toHaveClass(/selected/);
      await expect(page.locator('[data-testid="unit-kg"]')).not.toHaveClass(/selected/);
    });

    test('should handle empty weight data', async ({ authenticatedPage: page }) => {
      await page.route('**/api/weight**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      });

      await page.goto('/progress');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="no-weight-data"]')).toBeVisible();
      await expect(page.locator('[data-testid="log-first-weight-button"]')).toBeVisible();
    });

    test('should show weight trend indicator', async ({ authenticatedPage: page }) => {
      await page.route('**/api/weight**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(SAMPLE_WEIGHT_LOG),
        });
      });

      await page.goto('/progress');
      await waitForStableState(page);

      // Trend should be down (losing weight)
      await expect(page.locator('[data-testid="weight-trend"]')).toHaveClass(/trend-down/);
    });
  });

  test.describe('Advanced Mode (Macros)', () => {
    test('should show macro progress in advanced mode', async ({ authenticatedPage: page, setUserSettings }) => {
      await setUserSettings({ displayMode: 'advanced' });

      await page.route('**/api/log/history**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              date: '2024-01-07',
              calories: 1900,
              protein: 140,
              carbs: 180,
              fat: 60,
            },
          ]),
        });
      });

      await page.goto('/progress');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="macro-charts"]')).toBeVisible();
      await expect(page.locator('[data-testid="protein-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="carbs-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="fat-chart"]')).toBeVisible();
    });

    test('should show macro averages', async ({ authenticatedPage: page, setUserSettings }) => {
      await setUserSettings({ displayMode: 'advanced' });

      await page.route('**/api/log/history**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { date: '2024-01-01', protein: 140, carbs: 180, fat: 60 },
            { date: '2024-01-02', protein: 160, carbs: 200, fat: 70 },
          ]),
        });
      });

      await page.goto('/progress');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="average-protein"]')).toBeVisible();
      await expect(page.locator('[data-testid="average-carbs"]')).toBeVisible();
      await expect(page.locator('[data-testid="average-fat"]')).toBeVisible();
    });

    test('should hide macro section in simple mode', async ({ authenticatedPage: page, setUserSettings }) => {
      await setUserSettings({ displayMode: 'simple' });

      await page.goto('/progress');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="macro-charts"]')).not.toBeVisible();
    });
  });

  test.describe('Summary Statistics', () => {
    test('should show weekly summary', async ({ authenticatedPage: page }) => {
      await page.route('**/api/log/history**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(SAMPLE_CALORIE_HISTORY),
        });
      });

      await page.goto('/progress');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="weekly-summary"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-calories"]')).toBeVisible();
      await expect(page.locator('[data-testid="days-logged"]')).toBeVisible();
    });

    test('should show streak information', async ({ authenticatedPage: page }) => {
      await page.route('**/api/log/history**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(SAMPLE_CALORIE_HISTORY),
        });
      });

      await page.goto('/progress');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="logging-streak"]')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should show error message on API failure', async ({ authenticatedPage: page }) => {
      await page.route('**/api/log/history**', async (route) => {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Server error' }),
        });
      });

      await page.goto('/progress');
      await waitForStableState(page);

      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    });

    test('should allow retry on error', async ({ authenticatedPage: page }) => {
      let attempts = 0;
      await page.route('**/api/log/history**', async (route) => {
        attempts++;
        if (attempts === 1) {
          await route.fulfill({ status: 500, body: '{}' });
        } else {
          await route.fulfill({
            status: 200,
            body: JSON.stringify(SAMPLE_CALORIE_HISTORY),
          });
        }
      });

      await page.goto('/progress');
      await page.click('[data-testid="retry-button"]');

      await expect(page.locator('[data-testid="calorie-chart"]')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have accessible chart alternatives', async ({ authenticatedPage: page }) => {
      await page.route('**/api/log/history**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(SAMPLE_CALORIE_HISTORY),
        });
      });

      await page.goto('/progress');
      await waitForStableState(page);

      // Charts should have aria-label
      await expect(page.locator('[data-testid="calorie-chart"]')).toHaveAttribute('aria-label');

      // Should have data table as accessible alternative
      await expect(page.locator('[data-testid="data-table-toggle"]')).toBeVisible();
    });

    test('should show data in table format for accessibility', async ({ authenticatedPage: page }) => {
      await page.route('**/api/log/history**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(SAMPLE_CALORIE_HISTORY),
        });
      });

      await page.goto('/progress');
      await page.click('[data-testid="data-table-toggle"]');

      await expect(page.locator('[data-testid="calorie-data-table"]')).toBeVisible();
      await expect(page.locator('[data-testid="calorie-data-table"] table')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should stack charts vertically on mobile', async ({ authenticatedPage: page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.route('**/api/log/history**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(SAMPLE_CALORIE_HISTORY),
        });
      });

      await page.goto('/progress');
      await waitForStableState(page);

      const calorieChart = page.locator('[data-testid="calorie-chart"]');
      const weightSection = page.locator('[data-testid="weight-section"]');

      const calorieBox = await calorieChart.boundingBox();
      const weightBox = await weightSection.boundingBox();

      // Weight section should be below calorie chart on mobile
      if (calorieBox && weightBox) {
        expect(weightBox.y).toBeGreaterThan(calorieBox.y + calorieBox.height - 10);
      }
    });
  });
});
