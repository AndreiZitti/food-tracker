import { Page, expect } from '@playwright/test';

/**
 * Screenshot Utilities for Visual Verification
 *
 * Provides consistent screenshot capture at key verification points
 * throughout the FitTrack application.
 */

// Screenshot categories for organization
export type ScreenshotCategory =
  | 'diary'
  | 'add-food'
  | 'progress'
  | 'settings'
  | 'navigation'
  | 'modals'
  | 'errors';

/**
 * Screenshot capture configuration
 */
interface ScreenshotOptions {
  name: string;
  category: ScreenshotCategory;
  fullPage?: boolean;
  mask?: string[]; // Selectors to mask (for dynamic content)
  waitForSelector?: string;
  delay?: number;
}

/**
 * Capture a screenshot with consistent naming and organization
 */
export async function captureScreenshot(
  page: Page,
  options: ScreenshotOptions
): Promise<void> {
  const { name, category, fullPage = false, mask = [], waitForSelector, delay = 0 } = options;

  // Wait for selector if specified
  if (waitForSelector) {
    await page.waitForSelector(waitForSelector, { state: 'visible' });
  }

  // Apply delay if needed (for animations)
  if (delay > 0) {
    await page.waitForTimeout(delay);
  }

  // Build mask locators
  const maskLocators = mask.map(selector => page.locator(selector));

  // Capture screenshot with consistent naming
  const screenshotName = `${category}/${name}`;

  await expect(page).toHaveScreenshot(`${screenshotName}.png`, {
    fullPage,
    mask: maskLocators,
    maxDiffPixels: 100,
    threshold: 0.2,
  });
}

/**
 * Screenshot capture points for each feature area
 */
export const ScreenshotPoints = {
  // Diary View Screenshots
  diary: {
    emptyState: async (page: Page) => {
      await captureScreenshot(page, {
        name: 'empty-diary',
        category: 'diary',
        waitForSelector: '[data-testid="diary-container"]',
      });
    },

    withMeals: async (page: Page) => {
      await captureScreenshot(page, {
        name: 'diary-with-meals',
        category: 'diary',
        waitForSelector: '[data-testid="meal-section"]',
      });
    },

    dateNavigation: async (page: Page, direction: 'prev' | 'next') => {
      await captureScreenshot(page, {
        name: `date-nav-${direction}`,
        category: 'diary',
        mask: ['[data-testid="current-date"]'], // Mask dynamic date
      });
    },

    mealExpanded: async (page: Page, meal: string) => {
      await captureScreenshot(page, {
        name: `meal-${meal}-expanded`,
        category: 'diary',
        waitForSelector: `[data-testid="meal-${meal}"]`,
      });
    },

    dailyTotals: async (page: Page) => {
      await captureScreenshot(page, {
        name: 'daily-totals',
        category: 'diary',
        waitForSelector: '[data-testid="daily-totals"]',
      });
    },

    advancedMode: async (page: Page) => {
      await captureScreenshot(page, {
        name: 'advanced-mode-macros',
        category: 'diary',
        waitForSelector: '[data-testid="macro-breakdown"]',
      });
    },
  },

  // Add Food Screenshots
  addFood: {
    searchEmpty: async (page: Page) => {
      await captureScreenshot(page, {
        name: 'search-empty',
        category: 'add-food',
        waitForSelector: '[data-testid="food-search"]',
      });
    },

    searchResults: async (page: Page) => {
      await captureScreenshot(page, {
        name: 'search-results',
        category: 'add-food',
        waitForSelector: '[data-testid="search-results"]',
      });
    },

    noResults: async (page: Page) => {
      await captureScreenshot(page, {
        name: 'no-results',
        category: 'add-food',
        waitForSelector: '[data-testid="no-results"]',
      });
    },

    barcodeScanner: async (page: Page) => {
      await captureScreenshot(page, {
        name: 'barcode-scanner',
        category: 'add-food',
        waitForSelector: '[data-testid="barcode-scanner"]',
      });
    },

    manualEntry: async (page: Page) => {
      await captureScreenshot(page, {
        name: 'manual-entry-form',
        category: 'add-food',
        waitForSelector: '[data-testid="manual-entry-form"]',
      });
    },

    foodDetail: async (page: Page) => {
      await captureScreenshot(page, {
        name: 'food-detail',
        category: 'add-food',
        waitForSelector: '[data-testid="food-detail"]',
      });
    },

    servingAdjuster: async (page: Page) => {
      await captureScreenshot(page, {
        name: 'serving-adjuster',
        category: 'add-food',
        waitForSelector: '[data-testid="serving-adjuster"]',
      });
    },

    mealSelector: async (page: Page) => {
      await captureScreenshot(page, {
        name: 'meal-selector',
        category: 'add-food',
        waitForSelector: '[data-testid="meal-selector"]',
      });
    },

    addSuccess: async (page: Page) => {
      await captureScreenshot(page, {
        name: 'add-success',
        category: 'add-food',
        waitForSelector: '[data-testid="success-toast"]',
        delay: 300, // Wait for animation
      });
    },
  },

  // Progress Screenshots
  progress: {
    overview: async (page: Page) => {
      await captureScreenshot(page, {
        name: 'progress-overview',
        category: 'progress',
        waitForSelector: '[data-testid="progress-container"]',
      });
    },

    calorieChart: async (page: Page) => {
      await captureScreenshot(page, {
        name: 'calorie-chart',
        category: 'progress',
        waitForSelector: '[data-testid="calorie-chart"]',
        delay: 500, // Wait for chart animation
      });
    },

    weightChart: async (page: Page) => {
      await captureScreenshot(page, {
        name: 'weight-chart',
        category: 'progress',
        waitForSelector: '[data-testid="weight-chart"]',
        delay: 500,
      });
    },

    weightLogModal: async (page: Page) => {
      await captureScreenshot(page, {
        name: 'weight-log-modal',
        category: 'progress',
        waitForSelector: '[data-testid="weight-log-modal"]',
      });
    },

    timeRangeSelector: async (page: Page, range: '7d' | '30d') => {
      await captureScreenshot(page, {
        name: `time-range-${range}`,
        category: 'progress',
        waitForSelector: `[data-testid="range-${range}"]`,
      });
    },

    noData: async (page: Page) => {
      await captureScreenshot(page, {
        name: 'no-progress-data',
        category: 'progress',
        waitForSelector: '[data-testid="no-data-message"]',
      });
    },
  },

  // Settings Screenshots
  settings: {
    overview: async (page: Page) => {
      await captureScreenshot(page, {
        name: 'settings-overview',
        category: 'settings',
        fullPage: true,
        waitForSelector: '[data-testid="settings-container"]',
      });
    },

    goalEditor: async (page: Page) => {
      await captureScreenshot(page, {
        name: 'goal-editor',
        category: 'settings',
        waitForSelector: '[data-testid="goal-editor"]',
      });
    },

    simpleMode: async (page: Page) => {
      await captureScreenshot(page, {
        name: 'simple-mode',
        category: 'settings',
        waitForSelector: '[data-testid="display-mode-toggle"]',
      });
    },

    advancedMode: async (page: Page) => {
      await captureScreenshot(page, {
        name: 'advanced-mode',
        category: 'settings',
        waitForSelector: '[data-testid="display-mode-toggle"]',
      });
    },

    accountInfo: async (page: Page) => {
      await captureScreenshot(page, {
        name: 'account-info',
        category: 'settings',
        waitForSelector: '[data-testid="account-info"]',
        mask: ['[data-testid="user-email"]'], // Mask user email
      });
    },

    saveSuccess: async (page: Page) => {
      await captureScreenshot(page, {
        name: 'save-success',
        category: 'settings',
        waitForSelector: '[data-testid="success-toast"]',
        delay: 300,
      });
    },
  },

  // Navigation Screenshots
  navigation: {
    bottomNav: async (page: Page) => {
      await captureScreenshot(page, {
        name: 'bottom-navigation',
        category: 'navigation',
        waitForSelector: '[data-testid="bottom-nav"]',
      });
    },

    activeTab: async (page: Page, tab: string) => {
      await captureScreenshot(page, {
        name: `nav-active-${tab}`,
        category: 'navigation',
        waitForSelector: `[data-testid="nav-${tab}"].active`,
      });
    },
  },

  // Error State Screenshots
  errors: {
    networkError: async (page: Page) => {
      await captureScreenshot(page, {
        name: 'network-error',
        category: 'errors',
        waitForSelector: '[data-testid="error-message"]',
      });
    },

    notFound: async (page: Page) => {
      await captureScreenshot(page, {
        name: 'not-found',
        category: 'errors',
        waitForSelector: '[data-testid="not-found"]',
      });
    },

    validationError: async (page: Page) => {
      await captureScreenshot(page, {
        name: 'validation-error',
        category: 'errors',
        waitForSelector: '[data-testid="validation-error"]',
      });
    },
  },
};

/**
 * Helper to wait for network idle before screenshot
 */
export async function waitForStableState(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(100); // Small buffer for animations
}

/**
 * Compare current state with baseline screenshot
 */
export async function compareWithBaseline(
  page: Page,
  baselineName: string,
  options?: { threshold?: number; maxDiffPixels?: number }
): Promise<void> {
  await waitForStableState(page);

  await expect(page).toHaveScreenshot(`${baselineName}.png`, {
    maxDiffPixels: options?.maxDiffPixels ?? 100,
    threshold: options?.threshold ?? 0.2,
  });
}
