'use client';

/**
 * React Hook for Food Search functionality
 *
 * Provides debounced search with loading states, error handling,
 * and automatic rate limit awareness.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  searchFoods,
  getFoodByBarcode,
  getRateLimitStatus,
  OpenFoodFactsError,
  RateLimitError,
} from '@/lib/openfoodfacts';
import type { FoodItem, FoodSearchResult } from '@/types/food';

// =============================================================================
// Types
// =============================================================================

export interface UseFoodSearchState {
  // Search results
  results: FoodItem[];
  totalCount: number;
  hasMore: boolean;

  // Loading states
  isLoading: boolean;
  isLoadingMore: boolean;

  // Error state
  error: string | null;

  // Rate limit info
  rateLimitWarning: boolean;
}

export interface UseFoodSearchActions {
  search: (query: string) => Promise<void>;
  loadMore: () => Promise<void>;
  searchByBarcode: (barcode: string) => Promise<FoodItem | null>;
  clear: () => void;
}

export interface UseFoodSearchOptions {
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number;
  /** Results per page (default: 20) */
  pageSize?: number;
  /** Minimum query length to trigger search (default: 2) */
  minQueryLength?: number;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useFoodSearch(
  options: UseFoodSearchOptions = {}
): UseFoodSearchState & UseFoodSearchActions {
  const { debounceMs = 300, pageSize = 20, minQueryLength = 2 } = options;

  // State
  const [results, setResults] = useState<FoodItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitWarning, setRateLimitWarning] = useState(false);

  // Refs for tracking current state
  const currentQuery = useRef('');
  const currentPage = useRef(1);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const abortController = useRef<AbortController | null>(null);

  // Check rate limit status
  const checkRateLimit = useCallback(() => {
    const status = getRateLimitStatus();
    setRateLimitWarning(status.search.remaining < 3);
  }, []);

  // Search function
  const search = useCallback(
    async (query: string) => {
      // Clear any pending debounce
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Reset state for new search
      currentQuery.current = query;
      currentPage.current = 1;

      // Handle empty or short queries
      if (!query || query.length < minQueryLength) {
        setResults([]);
        setTotalCount(0);
        setHasMore(false);
        setError(null);
        setIsLoading(false);
        return;
      }

      // Debounce the search
      return new Promise<void>((resolve) => {
        debounceTimer.current = setTimeout(async () => {
          // Cancel any in-flight request
          if (abortController.current) {
            abortController.current.abort();
          }
          abortController.current = new AbortController();

          setIsLoading(true);
          setError(null);

          try {
            checkRateLimit();

            const searchResult = await searchFoods(query, {
              page: 1,
              pageSize,
            });

            // Only update if this is still the current query
            if (currentQuery.current === query) {
              setResults(searchResult.items);
              setTotalCount(searchResult.totalCount);
              setHasMore(searchResult.hasMore);
            }
          } catch (err) {
            if (currentQuery.current === query) {
              if (err instanceof RateLimitError) {
                setError(
                  `Rate limit reached. Please wait ${Math.ceil(err.retryAfterMs / 1000)} seconds.`
                );
                setRateLimitWarning(true);
              } else if (err instanceof OpenFoodFactsError) {
                setError(err.message);
              } else {
                setError('Failed to search foods. Please try again.');
              }
            }
          } finally {
            if (currentQuery.current === query) {
              setIsLoading(false);
            }
          }

          resolve();
        }, debounceMs);
      });
    },
    [debounceMs, pageSize, minQueryLength, checkRateLimit]
  );

  // Load more results
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !currentQuery.current) {
      return;
    }

    setIsLoadingMore(true);
    setError(null);

    try {
      checkRateLimit();

      const nextPage = currentPage.current + 1;
      const searchResult = await searchFoods(currentQuery.current, {
        page: nextPage,
        pageSize,
      });

      currentPage.current = nextPage;
      setResults((prev) => [...prev, ...searchResult.items]);
      setHasMore(searchResult.hasMore);
    } catch (err) {
      if (err instanceof RateLimitError) {
        setError(
          `Rate limit reached. Please wait ${Math.ceil(err.retryAfterMs / 1000)} seconds.`
        );
        setRateLimitWarning(true);
      } else if (err instanceof OpenFoodFactsError) {
        setError(err.message);
      } else {
        setError('Failed to load more results. Please try again.');
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, pageSize, checkRateLimit]);

  // Barcode search
  const searchByBarcode = useCallback(
    async (barcode: string): Promise<FoodItem | null> => {
      setIsLoading(true);
      setError(null);

      try {
        checkRateLimit();
        const food = await getFoodByBarcode(barcode);

        if (food) {
          // Add to results for display
          setResults([food]);
          setTotalCount(1);
          setHasMore(false);
        } else {
          setError('Product not found. Try searching by name instead.');
          setResults([]);
        }

        return food;
      } catch (err) {
        if (err instanceof RateLimitError) {
          setError(
            `Rate limit reached. Please wait ${Math.ceil(err.retryAfterMs / 1000)} seconds.`
          );
        } else if (err instanceof OpenFoodFactsError) {
          setError(err.message);
        } else {
          setError('Failed to look up barcode. Please try again.');
        }
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [checkRateLimit]
  );

  // Clear all results
  const clear = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    if (abortController.current) {
      abortController.current.abort();
    }

    currentQuery.current = '';
    currentPage.current = 1;
    setResults([]);
    setTotalCount(0);
    setHasMore(false);
    setIsLoading(false);
    setIsLoadingMore(false);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  return {
    // State
    results,
    totalCount,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    rateLimitWarning,

    // Actions
    search,
    loadMore,
    searchByBarcode,
    clear,
  };
}

// =============================================================================
// Simplified Hook for Single Food Lookup
// =============================================================================

export interface UseFoodLookupState {
  food: FoodItem | null;
  isLoading: boolean;
  error: string | null;
}

export function useFoodLookup(): UseFoodLookupState & {
  lookupByBarcode: (barcode: string) => Promise<FoodItem | null>;
  reset: () => void;
} {
  const [food, setFood] = useState<FoodItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupByBarcode = useCallback(
    async (barcode: string): Promise<FoodItem | null> => {
      setIsLoading(true);
      setError(null);
      setFood(null);

      try {
        const result = await getFoodByBarcode(barcode);

        if (result) {
          setFood(result);
        } else {
          setError('Product not found');
        }

        return result;
      } catch (err) {
        if (err instanceof OpenFoodFactsError) {
          setError(err.message);
        } else {
          setError('Failed to look up product');
        }
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setFood(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    food,
    isLoading,
    error,
    lookupByBarcode,
    reset,
  };
}

export default useFoodSearch;
