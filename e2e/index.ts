/**
 * FitTrack E2E Test Suite Index
 *
 * This module exports all test fixtures, utilities, and helpers
 * for use across the test suite.
 */

// Test fixtures
export { test, expect, TEST_USER, DEFAULT_SETTINGS, SAMPLE_FOODS } from './fixtures/test-fixtures';
export type { MealType } from './fixtures/test-fixtures';

// Test utilities
export {
  navigate,
  dateNavigation,
  foodSearch,
  foodLogging,
  manualEntry,
  settings,
  progress,
  assertions,
  mockApi,
  pwa,
} from './utils/test-helpers';

// Screenshot utilities
export {
  captureScreenshot,
  ScreenshotPoints,
  waitForStableState,
  compareWithBaseline,
} from './utils/screenshot-utils';
export type { ScreenshotCategory } from './utils/screenshot-utils';
