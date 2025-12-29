# FitTrack E2E Testing Strategy

## Overview

This directory contains the comprehensive end-to-end testing suite for FitTrack using Playwright. The tests are designed to verify all user-facing features with visual verification through screenshots.

## Test Structure

```
e2e/
├── fixtures/
│   └── test-fixtures.ts     # Extended test fixtures with auth mocking
├── utils/
│   ├── test-helpers.ts      # Common test operations
│   └── screenshot-utils.ts  # Visual verification utilities
├── snapshots/               # Baseline screenshots (auto-generated)
├── diary.spec.ts            # Diary view tests
├── add-food.spec.ts         # Food search and logging tests
├── progress.spec.ts         # Progress and weight tracking tests
├── settings.spec.ts         # Settings and preferences tests
├── navigation.spec.ts       # Navigation and PWA tests
├── index.ts                 # Module exports
└── README.md                # This file
```

## Running Tests

### Prerequisites

1. Install dependencies:
   ```bash
   npm install
   npx playwright install
   ```

2. Ensure dev server is running (or let Playwright start it):
   ```bash
   npm run dev
   ```

### Run All Tests

```bash
# Run all tests
npx playwright test

# Run with UI mode (recommended for development)
npx playwright test --ui

# Run specific test file
npx playwright test e2e/diary.spec.ts

# Run tests in headed mode
npx playwright test --headed

# Run on specific browser
npx playwright test --project=mobile-safari
```

### Visual Testing

```bash
# Update baseline screenshots
npx playwright test --update-snapshots

# Compare against baselines
npx playwright test
```

## Test Categories

### 1. Diary View (`diary.spec.ts`)

| Test Area | Coverage |
|-----------|----------|
| Date Navigation | Today, previous, next, date picker |
| Meal Sections | All four meals, expand/collapse, add button |
| Daily Totals | Calorie sum, progress bar, goal tracking |
| Simple Mode | Calories only display |
| Advanced Mode | Full macro breakdown |
| Food Entry Management | Display, delete, swipe actions |
| Empty States | No entries message, CTA |
| Accessibility | ARIA labels, keyboard nav, touch targets |
| Error Handling | API failures, retry |

### 2. Add Food (`add-food.spec.ts`)

| Test Area | Coverage |
|-----------|----------|
| Food Search | API search, results, debounce, clear |
| Barcode Scanner | Camera, scan detection, not found |
| Manual Entry | Form, validation, save custom |
| Food Detail | Nutrition info, serving size |
| Serving Adjustment | Increment/decrement, quick buttons |
| Meal Selection | Preselect, tap to select |
| Add Confirmation | Success toast, navigate to diary |
| Custom Foods | List, search, delete |
| Accessibility | Labels, keyboard nav, screen readers |

### 3. Progress (`progress.spec.ts`)

| Test Area | Coverage |
|-----------|----------|
| Calorie Chart | Data display, goal line, tooltips |
| Time Range | 7-day, 30-day selection |
| Weight Tracking | Chart, log modal, trends |
| Statistics | Averages, streaks, summaries |
| Advanced Mode | Macro charts |
| Error Handling | Empty data, API errors |
| Accessibility | Chart alternatives, data tables |

### 4. Settings (`settings.spec.ts`)

| Test Area | Coverage |
|-----------|----------|
| Calorie Goal | Display, update, validation |
| Macro Goals | Show/hide based on mode |
| Display Mode | Toggle, persistence |
| Account Info | User email, sign out |
| Data Management | Export, clear data |
| Weight Goal | Set, clear |
| Save/Cancel | Success/error, unsaved warnings |
| App Info | Version, legal links |

### 5. Navigation (`navigation.spec.ts`)

| Test Area | Coverage |
|-----------|----------|
| Bottom Nav | Display, items, icons |
| Tab Navigation | Page transitions |
| Active State | Visual indicator |
| Deep Linking | Query params, 404 |
| Touch Targets | Size, spacing |
| Keyboard Navigation | Tab, Enter, Space |
| PWA Behavior | Standalone, back button |
| Accessibility | ARIA roles, names |

## Screenshot Capture Points

Each feature has predefined screenshot capture points for visual verification:

### Diary Screenshots
- `diary/empty-diary.png` - Empty state
- `diary/diary-with-meals.png` - With food entries
- `diary/date-nav-prev.png` - Previous day
- `diary/date-nav-next.png` - Next day
- `diary/meal-{meal}-expanded.png` - Expanded meal section
- `diary/daily-totals.png` - Totals display
- `diary/advanced-mode-macros.png` - Macro breakdown

### Add Food Screenshots
- `add-food/search-empty.png` - Empty search
- `add-food/search-results.png` - Search results
- `add-food/no-results.png` - No results found
- `add-food/barcode-scanner.png` - Scanner active
- `add-food/manual-entry-form.png` - Manual entry
- `add-food/food-detail.png` - Selected food
- `add-food/serving-adjuster.png` - Adjust servings
- `add-food/meal-selector.png` - Meal selection
- `add-food/add-success.png` - Success toast

### Progress Screenshots
- `progress/progress-overview.png` - Main view
- `progress/calorie-chart.png` - Calorie chart
- `progress/weight-chart.png` - Weight chart
- `progress/weight-log-modal.png` - Log weight
- `progress/time-range-7d.png` - 7-day view
- `progress/time-range-30d.png` - 30-day view
- `progress/no-progress-data.png` - Empty state

### Settings Screenshots
- `settings/settings-overview.png` - Full page
- `settings/goal-editor.png` - Goal inputs
- `settings/simple-mode.png` - Simple toggle
- `settings/advanced-mode.png` - Advanced toggle
- `settings/account-info.png` - Account section
- `settings/save-success.png` - Save confirmation

### Navigation Screenshots
- `navigation/bottom-navigation.png` - Nav bar
- `navigation/nav-active-{tab}.png` - Active states

## Test Fixtures

### `test` - Extended Playwright Test

Includes custom fixtures:
- `authenticatedPage` - Page with mocked auth
- `mockAuth` - Function to mock Supabase auth
- `seedFoodLog` - Function to seed food log data
- `clearFoodLog` - Function to clear food log
- `setUserSettings` - Function to set user preferences

### Test Data

```typescript
// Sample user
TEST_USER = {
  id: 'test-user-123',
  email: 'test@fittrack.zitti.ro',
  name: 'Test User',
}

// Default settings
DEFAULT_SETTINGS = {
  calorieGoal: 2000,
  proteinGoal: 150,
  carbsGoal: 200,
  fatGoal: 65,
  displayMode: 'simple',
}

// Sample foods
SAMPLE_FOODS = {
  chickenBreast: { ... },
  banana: { ... },
  customMeal: { ... },
}
```

## Test Helpers

### Navigation
```typescript
await navigate.toDiary(page);
await navigate.toAddFood(page);
await navigate.toProgress(page);
await navigate.toSettings(page);
```

### Date Navigation
```typescript
await dateNavigation.goToPreviousDay(page);
await dateNavigation.goToNextDay(page);
await dateNavigation.goToToday(page);
```

### Food Operations
```typescript
await foodSearch.search(page, 'chicken');
await foodSearch.selectResult(page, 0);
await foodLogging.adjustServings(page, 1.5);
await foodLogging.selectMeal(page, 'lunch');
await foodLogging.confirmAdd(page);
```

### Settings
```typescript
await settings.setCalorieGoal(page, 1800);
await settings.toggleDisplayMode(page);
await settings.saveSettings(page);
```

### Assertions
```typescript
await assertions.dailyTotals(page, { calories: 270 });
await assertions.mealCount(page, 'breakfast', 2);
```

### API Mocking
```typescript
await mockApi.foodSearch(page, [SAMPLE_FOODS.chickenBreast]);
await mockApi.barcodeLookup(page, SAMPLE_FOODS.banana);
await mockApi.networkError(page, '**/api/log**');
```

## CI/CD Integration

The test suite is configured to run in CI with:
- Retries on failure (2 retries in CI)
- Single worker for stability
- HTML and JSON reporters
- Screenshot/video on failure

Example GitHub Actions workflow:
```yaml
- name: Run Playwright tests
  run: npx playwright test

- name: Upload test results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

## Best Practices

1. **Use data-testid attributes** - All interactive elements should have unique testids
2. **Wait for stable state** - Use `waitForStableState()` before screenshots
3. **Mock external APIs** - Always mock Open Food Facts and Supabase
4. **Isolate tests** - Each test should be independent
5. **Use fixtures** - Prefer fixtures over setup/teardown
6. **Visual verification** - Capture screenshots at key points
7. **Mobile-first** - Default viewport is mobile (375x667)

## Troubleshooting

### Tests timing out
- Increase timeout in config or per-test
- Check if dev server is running
- Verify network mocks are set up

### Screenshot mismatches
- Update baselines with `--update-snapshots`
- Check for dynamic content (mask with `mask` option)
- Verify viewport sizes match

### Flaky tests
- Add proper wait conditions
- Use `waitForLoadState('networkidle')`
- Increase timeout for slow operations
