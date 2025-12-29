import { test, expect } from '@playwright/test';

test.describe('FitTrack Visual Verification', () => {
  test('diary page loads correctly', async ({ page }) => {
    await page.goto('http://localhost:3000/diary');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the page has loaded with key elements
    await expect(page.locator('nav')).toBeVisible();
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/diary-page.png', fullPage: true });
    
    // Verify date selector is visible
    const dateSelectorText = await page.locator('text=Today').or(page.locator('span').filter({ hasText: /\w+, \w+ \d+/ }));
    await expect(dateSelectorText.first()).toBeVisible();
  });

  test('add food page loads with tabs', async ({ page }) => {
    await page.goto('http://localhost:3000/add');

    await page.waitForLoadState('networkidle');

    // Check tabs are visible - use role selectors to be more specific
    await expect(page.getByRole('button', { name: 'Search' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Scan Barcode' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Manual' })).toBeVisible();

    // Take a screenshot
    await page.screenshot({ path: 'test-results/add-food-page.png', fullPage: true });
  });

  test('progress page loads with charts', async ({ page }) => {
    await page.goto('http://localhost:3000/progress');
    
    await page.waitForLoadState('networkidle');
    
    // Check time range buttons
    await expect(page.locator('text=Last 7 Days')).toBeVisible();
    await expect(page.locator('text=Last 30 Days')).toBeVisible();
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/progress-page.png', fullPage: true });
  });

  test('settings page loads with toggle', async ({ page }) => {
    await page.goto('http://localhost:3000/settings');
    
    await page.waitForLoadState('networkidle');
    
    // Check display mode section
    await expect(page.locator('text=Display Mode')).toBeVisible();
    
    // Check goals section
    await expect(page.locator('text=Daily Goals')).toBeVisible();
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/settings-page.png', fullPage: true });
  });

  test('bottom navigation works', async ({ page }) => {
    await page.goto('http://localhost:3000/diary');
    
    await page.waitForLoadState('networkidle');
    
    // Click on Add tab
    await page.click('text=Add');
    await expect(page).toHaveURL(/\/add/);
    
    // Click on Progress tab
    await page.click('text=Progress');
    await expect(page).toHaveURL(/\/progress/);
    
    // Click on Settings tab  
    await page.click('text=Settings');
    await expect(page).toHaveURL(/\/settings/);
    
    // Click back to Diary
    await page.click('text=Diary');
    await expect(page).toHaveURL(/\/diary/);
    
    // Take a final screenshot
    await page.screenshot({ path: 'test-results/navigation-complete.png', fullPage: true });
  });
});
