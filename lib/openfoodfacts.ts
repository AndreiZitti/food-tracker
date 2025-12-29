/**
 * Open Food Facts API Integration Module
 *
 * Provides functions for searching foods and looking up products by barcode
 * from the Open Food Facts database.
 *
 * API Rate Limits (as of 2025):
 * - Search queries: 10 requests/minute
 * - Product lookups: 100 requests/minute
 * - Write queries: No limit
 *
 * @see https://openfoodfacts.github.io/openfoodfacts-server/api/
 */

import type {
  FoodItem,
  FoodSearchResult,
  OpenFoodFactsProduct,
  OpenFoodFactsSearchResponse,
  OpenFoodFactsProductResponse,
  OpenFoodFactsNutriments,
} from '@/types/food';

// =============================================================================
// Configuration
// =============================================================================

const API_BASE_URL = 'https://world.openfoodfacts.org';

// Custom User-Agent as required by Open Food Facts API
const USER_AGENT = 'FitTrack/1.0 (fittracker.zitti.ro)';

// Default search parameters
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

// Rate limiting configuration
const RATE_LIMIT = {
  search: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  product: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
};

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

// =============================================================================
// Rate Limiter Implementation
// =============================================================================

interface RateLimitBucket {
  requests: number[];
  maxRequests: number;
  windowMs: number;
}

const rateLimitBuckets: Record<string, RateLimitBucket> = {
  search: { requests: [], ...RATE_LIMIT.search },
  product: { requests: [], ...RATE_LIMIT.product },
};

/**
 * Check if a request can be made within rate limits
 * Returns true if request is allowed, false if rate limited
 */
function checkRateLimit(bucket: RateLimitBucket): boolean {
  const now = Date.now();
  // Remove requests outside the window
  bucket.requests = bucket.requests.filter(
    (time) => now - time < bucket.windowMs
  );
  return bucket.requests.length < bucket.maxRequests;
}

/**
 * Record a request for rate limiting purposes
 */
function recordRequest(bucket: RateLimitBucket): void {
  bucket.requests.push(Date.now());
}

/**
 * Calculate wait time until next request is allowed
 */
function getWaitTime(bucket: RateLimitBucket): number {
  if (bucket.requests.length === 0) return 0;
  const oldestRequest = Math.min(...bucket.requests);
  const waitTime = bucket.windowMs - (Date.now() - oldestRequest);
  return Math.max(0, waitTime);
}

// =============================================================================
// Error Classes
// =============================================================================

export class OpenFoodFactsError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'OpenFoodFactsError';
  }
}

export class RateLimitError extends OpenFoodFactsError {
  constructor(
    public readonly retryAfterMs: number
  ) {
    super(
      `Rate limit exceeded. Retry after ${Math.ceil(retryAfterMs / 1000)} seconds.`,
      'RATE_LIMIT_EXCEEDED'
    );
    this.name = 'RateLimitError';
  }
}

export class ProductNotFoundError extends OpenFoodFactsError {
  constructor(barcode: string) {
    super(
      `Product not found for barcode: ${barcode}`,
      'PRODUCT_NOT_FOUND'
    );
    this.name = 'ProductNotFoundError';
  }
}

export class NetworkError extends OpenFoodFactsError {
  constructor(message: string, originalError?: Error) {
    super(message, 'NETWORK_ERROR', undefined, {
      originalError: originalError?.message,
    });
    this.name = 'NetworkError';
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay with jitter
 */
function calculateBackoff(attempt: number): number {
  const delay = Math.min(
    RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt),
    RETRY_CONFIG.maxDelayMs
  );
  // Add jitter (0-25% of delay)
  return delay + Math.random() * delay * 0.25;
}

/**
 * Make an HTTP request with retry logic
 */
async function fetchWithRetry(
  url: string,
  bucketKey: 'search' | 'product',
  options: RequestInit = {}
): Promise<Response> {
  const bucket = rateLimitBuckets[bucketKey];

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    // Check rate limit
    if (!checkRateLimit(bucket)) {
      const waitTime = getWaitTime(bucket);
      if (attempt === RETRY_CONFIG.maxRetries) {
        throw new RateLimitError(waitTime);
      }
      await sleep(waitTime);
    }

    try {
      recordRequest(bucket);

      const response = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'application/json',
          ...options.headers,
        },
      });

      // Handle rate limit response from server
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 60000;
        if (attempt === RETRY_CONFIG.maxRetries) {
          throw new RateLimitError(waitTime);
        }
        await sleep(waitTime);
        continue;
      }

      // Handle other HTTP errors
      if (!response.ok && response.status !== 404) {
        if (attempt < RETRY_CONFIG.maxRetries && response.status >= 500) {
          await sleep(calculateBackoff(attempt));
          continue;
        }
        throw new OpenFoodFactsError(
          `HTTP error ${response.status}: ${response.statusText}`,
          'HTTP_ERROR',
          response.status
        );
      }

      return response;
    } catch (error) {
      if (
        error instanceof OpenFoodFactsError ||
        error instanceof RateLimitError
      ) {
        throw error;
      }

      // Network or fetch errors
      if (attempt < RETRY_CONFIG.maxRetries) {
        await sleep(calculateBackoff(attempt));
        continue;
      }

      throw new NetworkError(
        'Failed to connect to Open Food Facts API',
        error instanceof Error ? error : undefined
      );
    }
  }

  throw new NetworkError('Maximum retries exceeded');
}

// =============================================================================
// Data Transformation Functions
// =============================================================================

/**
 * Get the best available product name from various locale fields
 */
function getProductName(product: OpenFoodFactsProduct): string {
  return (
    product.product_name ||
    product.product_name_en ||
    product.product_name_fr ||
    product.product_name_de ||
    product.generic_name ||
    'Unknown Product'
  );
}

/**
 * Get the brand name, cleaning up any formatting issues
 */
function getBrand(product: OpenFoodFactsProduct): string | undefined {
  if (!product.brands) return undefined;
  // Take first brand if multiple are comma-separated
  const brand = product.brands.split(',')[0].trim();
  return brand || undefined;
}

/**
 * Parse serving size string to extract numeric value in grams
 * Examples: "100g" -> 100, "1 cup (240ml)" -> null, "30 g" -> 30
 */
function parseServingQuantity(servingSize: string): number | undefined {
  if (!servingSize) return undefined;

  // Try to find a gram value
  const gramMatch = servingSize.match(/(\d+(?:\.\d+)?)\s*g(?:ram)?s?/i);
  if (gramMatch) {
    return parseFloat(gramMatch[1]);
  }

  // Try to find ml (assume 1ml = 1g for liquids as approximation)
  const mlMatch = servingSize.match(/(\d+(?:\.\d+)?)\s*ml/i);
  if (mlMatch) {
    return parseFloat(mlMatch[1]);
  }

  return undefined;
}

/**
 * Extract calories from nutriments object
 * Handles various field names used by Open Food Facts
 */
function getCalories(
  nutriments: OpenFoodFactsNutriments | undefined,
  per100g: boolean = true
): number {
  if (!nutriments) return 0;

  if (per100g) {
    // Prefer kcal values
    if (nutriments['energy-kcal_100g'] !== undefined) {
      return Math.round(nutriments['energy-kcal_100g']);
    }
    // Convert from kJ if needed
    if (nutriments['energy_100g'] !== undefined) {
      return Math.round(nutriments['energy_100g'] / 4.184);
    }
    // Fallback to generic fields
    if (nutriments['energy-kcal'] !== undefined) {
      return Math.round(nutriments['energy-kcal']);
    }
    if (nutriments.energy !== undefined) {
      // Assume kJ if value is high
      const energy = nutriments.energy;
      return energy > 400 ? Math.round(energy / 4.184) : Math.round(energy);
    }
  } else {
    if (nutriments['energy-kcal_serving'] !== undefined) {
      return Math.round(nutriments['energy-kcal_serving']);
    }
    if (nutriments['energy_serving'] !== undefined) {
      return Math.round(nutriments['energy_serving'] / 4.184);
    }
  }

  return 0;
}

/**
 * Get a nutrient value, preferring per 100g or per serving
 */
function getNutrient(
  nutriments: OpenFoodFactsNutriments | undefined,
  nutrientName: string,
  per100g: boolean = true
): number {
  if (!nutriments) return 0;

  const suffix = per100g ? '_100g' : '_serving';
  const key = `${nutrientName}${suffix}` as keyof OpenFoodFactsNutriments;

  const value = nutriments[key];
  if (typeof value === 'number') {
    return Math.round(value * 10) / 10; // Round to 1 decimal
  }

  // Fallback to base field if no suffix version
  const baseValue = nutriments[nutrientName as keyof OpenFoodFactsNutriments];
  if (typeof baseValue === 'number') {
    return Math.round(baseValue * 10) / 10;
  }

  return 0;
}

/**
 * Calculate per-serving values from per-100g values
 */
function calculatePerServing(
  per100g: number,
  servingQuantityGrams: number
): number {
  if (!servingQuantityGrams || servingQuantityGrams <= 0) {
    return per100g; // Assume 100g serving if unknown
  }
  return Math.round((per100g * servingQuantityGrams) / 100 * 10) / 10;
}

/**
 * Transform Open Food Facts product to normalized FoodItem
 */
function transformProduct(product: OpenFoodFactsProduct): FoodItem {
  const nutriments = product.nutriments;
  const servingSize = product.serving_size || '100g';
  const servingQuantity =
    product.serving_quantity || parseServingQuantity(servingSize) || 100;

  // Get per 100g values
  const caloriesPer100g = getCalories(nutriments, true);
  const proteinPer100g = getNutrient(nutriments, 'proteins', true);
  const carbsPer100g = getNutrient(nutriments, 'carbohydrates', true);
  const fatPer100g = getNutrient(nutriments, 'fat', true);

  // Calculate per serving values
  const calories = calculatePerServing(caloriesPer100g, servingQuantity);
  const protein = calculatePerServing(proteinPer100g, servingQuantity);
  const carbs = calculatePerServing(carbsPer100g, servingQuantity);
  const fat = calculatePerServing(fatPer100g, servingQuantity);

  return {
    id: product.code || product._id || crypto.randomUUID(),
    source: 'openfoodfacts',
    sourceId: product.code,

    name: getProductName(product),
    brand: getBrand(product),

    servingSize,
    servingQuantity,

    // Per serving values
    calories,
    protein,
    carbs,
    fat,

    // Per 100g values for recalculation
    caloriesPer100g,
    proteinPer100g,
    carbsPer100g,
    fatPer100g,

    // Optional nutrients
    fiber: getNutrient(nutriments, 'fiber', true),
    sugar: getNutrient(nutriments, 'sugars', true),
    saturatedFat: getNutrient(nutriments, 'saturated-fat', true),
    sodium: getNutrient(nutriments, 'sodium', true),

    // Images
    imageUrl: product.image_url || product.image_front_url,
    thumbnailUrl:
      product.image_thumb_url ||
      product.image_small_url ||
      product.image_front_small_url,

    // Quality indicators
    nutritionGrade: product.nutrition_grades,
    novaGroup: product.nova_group,
    completeness: product.completeness,
  };
}

/**
 * Filter out products with insufficient nutritional data
 */
function hasValidNutrition(product: OpenFoodFactsProduct): boolean {
  const nutriments = product.nutriments;
  if (!nutriments) return false;

  // Require at least calorie data
  const hasCalories =
    nutriments['energy-kcal_100g'] !== undefined ||
    nutriments['energy_100g'] !== undefined ||
    nutriments['energy-kcal'] !== undefined;

  // Require a product name
  const hasName = !!(
    product.product_name ||
    product.product_name_en ||
    product.generic_name
  );

  return hasCalories && hasName;
}

// =============================================================================
// Public API Functions
// =============================================================================

/**
 * Search for foods in the Open Food Facts database
 *
 * @param query - Search term
 * @param options - Optional search parameters
 * @returns Promise<FoodSearchResult> - Normalized search results
 *
 * @example
 * ```typescript
 * const results = await searchFoods('chicken breast');
 * console.log(results.items); // Array of FoodItem
 * ```
 *
 * Rate Limit: 10 requests/minute
 */
export async function searchFoods(
  query: string,
  options: {
    page?: number;
    pageSize?: number;
  } = {}
): Promise<FoodSearchResult> {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = options;
  const limitedPageSize = Math.min(pageSize, MAX_PAGE_SIZE);

  // Build search URL
  const params = new URLSearchParams({
    search_terms: query,
    json: 'true',
    page: page.toString(),
    page_size: limitedPageSize.toString(),
    // Request specific fields to reduce response size
    fields: [
      'code',
      'product_name',
      'product_name_en',
      'generic_name',
      'brands',
      'serving_size',
      'serving_quantity',
      'nutriments',
      'nutrition_grades',
      'nova_group',
      'completeness',
      'image_url',
      'image_thumb_url',
      'image_front_small_url',
    ].join(','),
  });

  const url = `${API_BASE_URL}/cgi/search.pl?${params.toString()}`;

  const response = await fetchWithRetry(url, 'search');
  const data: OpenFoodFactsSearchResponse = await response.json();

  // Filter and transform products
  const validProducts = (data.products || []).filter(hasValidNutrition);
  const items = validProducts.map(transformProduct);

  return {
    items,
    totalCount: data.count || 0,
    page: data.page || page,
    pageSize: limitedPageSize,
    hasMore: page * limitedPageSize < (data.count || 0),
  };
}

/**
 * Get a food item by barcode
 *
 * @param barcode - Product barcode (EAN-13, UPC-A, etc.)
 * @returns Promise<FoodItem | null> - Normalized food item or null if not found
 *
 * @example
 * ```typescript
 * const food = await getFoodByBarcode('3017620422003');
 * if (food) {
 *   console.log(food.name); // "Nutella"
 * }
 * ```
 *
 * Rate Limit: 100 requests/minute
 */
export async function getFoodByBarcode(
  barcode: string
): Promise<FoodItem | null> {
  // Validate barcode format (basic check)
  const cleanBarcode = barcode.replace(/\D/g, '');
  if (cleanBarcode.length < 8 || cleanBarcode.length > 14) {
    throw new OpenFoodFactsError(
      'Invalid barcode format. Expected 8-14 digits.',
      'INVALID_BARCODE'
    );
  }

  const url = `${API_BASE_URL}/api/v0/product/${cleanBarcode}.json`;

  const response = await fetchWithRetry(url, 'product');
  const data: OpenFoodFactsProductResponse = await response.json();

  // Check if product was found
  if (data.status !== 1 || !data.product) {
    return null;
  }

  // Validate nutrition data
  if (!hasValidNutrition(data.product)) {
    // Product exists but lacks nutrition data
    throw new OpenFoodFactsError(
      'Product found but lacks nutritional information',
      'INCOMPLETE_DATA',
      undefined,
      { barcode: cleanBarcode }
    );
  }

  return transformProduct(data.product);
}

/**
 * Recalculate nutritional values for a different serving size
 *
 * @param food - Original food item
 * @param newServingGrams - New serving size in grams
 * @returns FoodItem with recalculated values
 *
 * @example
 * ```typescript
 * const food = await getFoodByBarcode('3017620422003');
 * const customServing = recalculateServing(food, 30); // 30g serving
 * console.log(customServing.calories); // Recalculated calories
 * ```
 */
export function recalculateServing(
  food: FoodItem,
  newServingGrams: number
): FoodItem {
  if (!food.caloriesPer100g) {
    // Can't recalculate without per-100g data
    return food;
  }

  return {
    ...food,
    servingSize: `${newServingGrams}g`,
    servingQuantity: newServingGrams,
    calories: calculatePerServing(food.caloriesPer100g, newServingGrams),
    protein: calculatePerServing(food.proteinPer100g || 0, newServingGrams),
    carbs: calculatePerServing(food.carbsPer100g || 0, newServingGrams),
    fat: calculatePerServing(food.fatPer100g || 0, newServingGrams),
  };
}

/**
 * Calculate nutritional values for a given number of servings
 *
 * @param food - Food item
 * @param servings - Number of servings
 * @returns Object with total nutritional values
 */
export function calculateTotalNutrition(
  food: FoodItem,
  servings: number
): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  return {
    calories: Math.round(food.calories * servings),
    protein: Math.round(food.protein * servings * 10) / 10,
    carbs: Math.round(food.carbs * servings * 10) / 10,
    fat: Math.round(food.fat * servings * 10) / 10,
  };
}

/**
 * Check current rate limit status
 * Useful for showing warnings to users before they hit limits
 */
export function getRateLimitStatus(): {
  search: { remaining: number; resetIn: number };
  product: { remaining: number; resetIn: number };
} {
  const now = Date.now();

  const getStatus = (bucket: RateLimitBucket) => {
    const validRequests = bucket.requests.filter(
      (time) => now - time < bucket.windowMs
    );
    const remaining = Math.max(0, bucket.maxRequests - validRequests.length);
    const resetIn = validRequests.length > 0
      ? bucket.windowMs - (now - Math.min(...validRequests))
      : 0;
    return { remaining, resetIn: Math.max(0, resetIn) };
  };

  return {
    search: getStatus(rateLimitBuckets.search),
    product: getStatus(rateLimitBuckets.product),
  };
}

// =============================================================================
// Exports
// =============================================================================

export type { FoodItem, FoodSearchResult };
