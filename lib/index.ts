/**
 * Central library exports for FitTrack application
 */

// Open Food Facts API integration
export {
  searchFoods,
  getFoodByBarcode,
  recalculateServing,
  calculateTotalNutrition,
  getRateLimitStatus,
  OpenFoodFactsError,
  RateLimitError,
  ProductNotFoundError,
  NetworkError,
} from './openfoodfacts';

// Utility functions
export * from './utils';
