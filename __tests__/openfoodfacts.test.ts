/**
 * Tests for Open Food Facts API integration
 *
 * Run with: npx vitest run __tests__/openfoodfacts.test.ts
 * Or for live testing: npx tsx __tests__/openfoodfacts.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  searchFoods,
  getFoodByBarcode,
  recalculateServing,
  calculateTotalNutrition,
  getRateLimitStatus,
  OpenFoodFactsError,
  ProductNotFoundError,
} from '../lib/openfoodfacts';

describe('Open Food Facts Integration', () => {
  describe('searchFoods', () => {
    it('should return search results for valid query', async () => {
      const results = await searchFoods('chicken');

      expect(results).toBeDefined();
      expect(results.items).toBeInstanceOf(Array);
      expect(results.totalCount).toBeGreaterThanOrEqual(0);
      expect(results.page).toBe(1);
      expect(results.hasMore).toBeDefined();
    });

    it('should return normalized food items', async () => {
      const results = await searchFoods('nutella');

      if (results.items.length > 0) {
        const item = results.items[0];

        // Check required fields exist
        expect(item.id).toBeDefined();
        expect(item.name).toBeDefined();
        expect(item.source).toBe('openfoodfacts');
        expect(typeof item.calories).toBe('number');
        expect(typeof item.protein).toBe('number');
        expect(typeof item.carbs).toBe('number');
        expect(typeof item.fat).toBe('number');
      }
    });

    it('should handle pagination', async () => {
      const page1 = await searchFoods('bread', { page: 1, pageSize: 5 });
      const page2 = await searchFoods('bread', { page: 2, pageSize: 5 });

      expect(page1.page).toBe(1);
      expect(page2.page).toBe(2);
      expect(page1.pageSize).toBe(5);
    });

    it('should return empty results for nonsense query', async () => {
      const results = await searchFoods('xyznonexistentfood12345');

      expect(results.items).toHaveLength(0);
    });
  });

  describe('getFoodByBarcode', () => {
    it('should return food item for valid barcode', async () => {
      // Nutella barcode
      const food = await getFoodByBarcode('3017620422003');

      expect(food).toBeDefined();
      expect(food?.name.toLowerCase()).toContain('nutella');
      expect(food?.source).toBe('openfoodfacts');
      expect(food?.sourceId).toBe('3017620422003');
    });

    it('should return null for non-existent barcode', async () => {
      const food = await getFoodByBarcode('0000000000000');

      expect(food).toBeNull();
    });

    it('should throw error for invalid barcode format', async () => {
      await expect(getFoodByBarcode('123')).rejects.toThrow(OpenFoodFactsError);
      await expect(getFoodByBarcode('abc')).rejects.toThrow(OpenFoodFactsError);
    });

    it('should have per-100g values for recalculation', async () => {
      const food = await getFoodByBarcode('3017620422003');

      expect(food?.caloriesPer100g).toBeGreaterThan(0);
      expect(food?.proteinPer100g).toBeDefined();
      expect(food?.carbsPer100g).toBeDefined();
      expect(food?.fatPer100g).toBeDefined();
    });
  });

  describe('recalculateServing', () => {
    it('should recalculate nutrition for different serving size', async () => {
      const food = await getFoodByBarcode('3017620422003');

      if (food && food.caloriesPer100g) {
        const halfServing = recalculateServing(food, 50);

        expect(halfServing.servingSize).toBe('50g');
        expect(halfServing.servingQuantity).toBe(50);
        expect(halfServing.calories).toBeCloseTo(food.caloriesPer100g / 2, 0);
      }
    });

    it('should preserve other food properties', async () => {
      const food = await getFoodByBarcode('3017620422003');

      if (food) {
        const recalculated = recalculateServing(food, 30);

        expect(recalculated.name).toBe(food.name);
        expect(recalculated.brand).toBe(food.brand);
        expect(recalculated.source).toBe(food.source);
        expect(recalculated.caloriesPer100g).toBe(food.caloriesPer100g);
      }
    });
  });

  describe('calculateTotalNutrition', () => {
    it('should calculate totals for multiple servings', () => {
      const food = {
        id: 'test',
        source: 'openfoodfacts' as const,
        name: 'Test Food',
        servingSize: '100g',
        calories: 100,
        protein: 10,
        carbs: 20,
        fat: 5,
      };

      const totals = calculateTotalNutrition(food, 2.5);

      expect(totals.calories).toBe(250);
      expect(totals.protein).toBe(25);
      expect(totals.carbs).toBe(50);
      expect(totals.fat).toBe(12.5);
    });

    it('should handle fractional servings', () => {
      const food = {
        id: 'test',
        source: 'openfoodfacts' as const,
        name: 'Test Food',
        servingSize: '100g',
        calories: 100,
        protein: 10,
        carbs: 20,
        fat: 5,
      };

      const totals = calculateTotalNutrition(food, 0.5);

      expect(totals.calories).toBe(50);
      expect(totals.protein).toBe(5);
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return rate limit info', () => {
      const status = getRateLimitStatus();

      expect(status.search).toBeDefined();
      expect(status.product).toBeDefined();
      expect(typeof status.search.remaining).toBe('number');
      expect(typeof status.search.resetIn).toBe('number');
    });
  });
});

// =============================================================================
// Live API Test Runner (for manual testing)
// =============================================================================

async function runLiveTests() {
  console.log('Running live API tests...\n');

  try {
    // Test search
    console.log('1. Testing search...');
    const searchResults = await searchFoods('chicken breast');
    console.log(`   Found ${searchResults.totalCount} results`);
    console.log(`   First result: ${searchResults.items[0]?.name || 'None'}`);

    // Test barcode lookup
    console.log('\n2. Testing barcode lookup...');
    const food = await getFoodByBarcode('3017620422003');
    if (food) {
      console.log(`   Name: ${food.name}`);
      console.log(`   Brand: ${food.brand || 'N/A'}`);
      console.log(`   Calories: ${food.calories} per ${food.servingSize}`);
      console.log(`   Protein: ${food.protein}g`);
      console.log(`   Carbs: ${food.carbs}g`);
      console.log(`   Fat: ${food.fat}g`);
    }

    // Test recalculation
    console.log('\n3. Testing serving recalculation...');
    if (food) {
      const custom = recalculateServing(food, 30);
      console.log(`   30g serving: ${custom.calories} cal`);
    }

    // Check rate limits
    console.log('\n4. Rate limit status:');
    const limits = getRateLimitStatus();
    console.log(`   Search: ${limits.search.remaining}/10 remaining`);
    console.log(`   Product: ${limits.product.remaining}/100 remaining`);

    console.log('\nAll tests passed!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run live tests if executed directly
if (require.main === module) {
  runLiveTests();
}
