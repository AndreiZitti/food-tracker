/**
 * Food Types for FitTrack Application
 *
 * These types define the data structures used throughout the application
 * for handling food items from various sources.
 */

// =============================================================================
// Open Food Facts API Response Types
// =============================================================================

/**
 * Nutriments object from Open Food Facts API
 * Contains nutritional values per 100g and optionally per serving
 */
export interface OpenFoodFactsNutriments {
  // Energy values
  'energy-kcal_100g'?: number;
  'energy-kcal_serving'?: number;
  'energy_100g'?: number; // in kJ
  'energy_serving'?: number;
  'energy-kcal'?: number;
  energy?: number;

  // Macronutrients per 100g
  proteins_100g?: number;
  proteins_serving?: number;
  proteins?: number;

  carbohydrates_100g?: number;
  carbohydrates_serving?: number;
  carbohydrates?: number;

  fat_100g?: number;
  fat_serving?: number;
  fat?: number;

  // Additional nutrients (optional)
  fiber_100g?: number;
  fiber_serving?: number;
  sugars_100g?: number;
  sugars_serving?: number;
  'saturated-fat_100g'?: number;
  'saturated-fat_serving'?: number;
  sodium_100g?: number;
  sodium_serving?: number;
  salt_100g?: number;
  salt_serving?: number;
}

/**
 * Single product from Open Food Facts API
 */
export interface OpenFoodFactsProduct {
  // Identifiers
  code?: string;
  _id?: string;

  // Basic info
  product_name?: string;
  product_name_en?: string;
  product_name_fr?: string;
  product_name_de?: string;
  generic_name?: string;
  brands?: string;
  brands_tags?: string[];

  // Serving information
  serving_size?: string;
  serving_quantity?: number;
  quantity?: string;

  // Categories and classification
  categories?: string;
  categories_tags?: string[];

  // Nutritional data
  nutriments?: OpenFoodFactsNutriments;
  nutrition_grades?: string; // A-E Nutri-Score
  nova_group?: number; // 1-4 processing level

  // Images
  image_url?: string;
  image_small_url?: string;
  image_thumb_url?: string;
  image_front_url?: string;
  image_front_small_url?: string;

  // Completeness
  completeness?: number;
  data_quality_tags?: string[];

  // Status
  status?: number;
  status_verbose?: string;
}

/**
 * Search response from Open Food Facts API
 */
export interface OpenFoodFactsSearchResponse {
  count: number;
  page: number;
  page_count: number;
  page_size: number;
  products: OpenFoodFactsProduct[];
  skip: number;
}

/**
 * Single product lookup response from Open Food Facts API
 */
export interface OpenFoodFactsProductResponse {
  code: string;
  product?: OpenFoodFactsProduct;
  status: 0 | 1;
  status_verbose: 'product found' | 'product not found' | string;
}

// =============================================================================
// Normalized Application Types
// =============================================================================

/**
 * Source of food data
 */
export type FoodSource = 'openfoodfacts' | 'custom' | 'manual' | 'label_scan';

/**
 * Meal type for food logging
 */
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/**
 * Normalized food item used throughout the application
 * This is the canonical format after processing from any source
 */
export interface FoodItem {
  // Identification
  id: string;
  source: FoodSource;
  sourceId?: string; // Original barcode or custom food ID

  // Basic info
  name: string;
  brand?: string;

  // Serving information
  servingSize: string;
  servingQuantity?: number; // Numeric value of serving in grams

  // Nutritional values (per serving)
  calories: number;
  protein: number;
  carbs: number;
  fat: number;

  // Optional additional nutrients
  fiber?: number;
  sugar?: number;
  saturatedFat?: number;
  sodium?: number;

  // Per 100g values for recalculation
  caloriesPer100g?: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatPer100g?: number;

  // Images
  imageUrl?: string;
  thumbnailUrl?: string;

  // Quality indicators
  nutritionGrade?: string;
  novaGroup?: number;
  completeness?: number;
}

/**
 * Food log entry for tracking daily intake
 */
export interface FoodLogEntry {
  id: string;
  userId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  meal: MealType;

  // Food details (denormalized for historical accuracy)
  foodName: string;
  brand?: string;
  servingSize: string;
  servings: number;

  // Nutritional values (total for this entry)
  calories: number;
  protein: number;
  carbs: number;
  fat: number;

  // Source tracking
  source: FoodSource;
  sourceId?: string;

  // Timestamps
  createdAt: string;
}

/**
 * Daily nutritional summary
 */
export interface DailySummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;

  byMeal: {
    breakfast: MacroTotals;
    lunch: MacroTotals;
    dinner: MacroTotals;
    snack: MacroTotals;
  };
}

/**
 * Macro totals for a meal or period
 */
export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Custom food created by user
 */
export interface CustomFood {
  id: string;
  userId: string;
  name: string;
  brand?: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  barcode?: string;
  createdAt: string;
}

/**
 * User settings and goals
 */
export interface UserSettings {
  id: string;
  userId: string;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  displayMode: 'simple' | 'advanced';
  createdAt: string;
  updatedAt: string;
}

/**
 * Weight log entry
 */
export interface WeightLogEntry {
  id: string;
  userId: string;
  date: string;
  weight: number;
  unit: 'kg' | 'lbs';
  createdAt: string;
}

// =============================================================================
// Search and Filter Types
// =============================================================================

/**
 * Options for food search
 */
export interface FoodSearchOptions {
  query: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'relevance' | 'popularity' | 'name';
}

/**
 * Search results with pagination
 */
export interface FoodSearchResult {
  items: FoodItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * API error response
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// =============================================================================
// Smart Food Scanner Types
// =============================================================================

/**
 * Confidence level for nutrition data
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Type of image detected by the scanner
 */
export type ImageType = 'nutrition_label' | 'menu' | 'food_photo' | 'delivery_app' | 'unknown';

/**
 * Detected food description from non-label images
 */
export interface DetectedFood {
  description: string;
  size?: string;
  restaurant?: string;
  context?: string;
}

/**
 * Scan result when nutrition label is detected (exact extraction)
 */
export interface ExactScanResult {
  type: 'exact';
  confidence: ConfidenceLevel;
  imageType: 'nutrition_label';
  food: FoodItem;
}

/**
 * Scan result when menu/food photo detected (needs web search)
 */
export interface NeedsSearchScanResult {
  type: 'needs_search';
  imageType: Exclude<ImageType, 'nutrition_label'>;
  detected: DetectedFood;
}

/**
 * Combined scan result type
 */
export type ScanResult = ExactScanResult | NeedsSearchScanResult;

/**
 * Single nutrition option from web search
 */
export interface NutritionOption {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  servingWeight?: number;
  source: string;
  sourceUrl?: string;
}

/**
 * Web search result with multiple nutrition options
 */
export interface SearchNutritionResult {
  type: 'estimated';
  confidence: ConfidenceLevel;
  query: string;
  options: NutritionOption[];
}

/**
 * Extended FoodSource to include web_search
 */
export type ExtendedFoodSource = FoodSource | 'web_search';
