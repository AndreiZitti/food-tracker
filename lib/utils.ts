/**
 * Utility functions for FitTrack application
 */

import type { MealType, MacroTotals, FoodLogEntry, DailySummary } from '@/types/food';

// =============================================================================
// Date Utilities
// =============================================================================

/**
 * Format a Date to ISO date string (YYYY-MM-DD)
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get today's date as ISO string
 */
export function getToday(): string {
  return formatDate(new Date());
}

/**
 * Parse an ISO date string to Date object
 */
export function parseDate(dateString: string): Date {
  return new Date(dateString + 'T00:00:00');
}

/**
 * Get relative date label (Today, Yesterday, or formatted date)
 */
export function getRelativeDateLabel(dateString: string): string {
  const today = getToday();
  const yesterday = formatDate(new Date(Date.now() - 86400000));

  if (dateString === today) return 'Today';
  if (dateString === yesterday) return 'Yesterday';

  const date = parseDate(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Navigate to previous/next date
 */
export function navigateDate(
  currentDate: string,
  direction: 'prev' | 'next'
): string {
  const date = parseDate(currentDate);
  const delta = direction === 'next' ? 1 : -1;
  date.setDate(date.getDate() + delta);
  return formatDate(date);
}

// =============================================================================
// Nutrition Calculations
// =============================================================================

/**
 * Create empty macro totals
 */
export function emptyMacros(): MacroTotals {
  return { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

/**
 * Add two macro totals together
 */
export function addMacros(a: MacroTotals, b: MacroTotals): MacroTotals {
  return {
    calories: a.calories + b.calories,
    protein: Math.round((a.protein + b.protein) * 10) / 10,
    carbs: Math.round((a.carbs + b.carbs) * 10) / 10,
    fat: Math.round((a.fat + b.fat) * 10) / 10,
  };
}

/**
 * Calculate daily summary from food log entries
 */
export function calculateDailySummary(
  entries: FoodLogEntry[],
  date: string
): DailySummary {
  const byMeal: Record<MealType, MacroTotals> = {
    breakfast: emptyMacros(),
    lunch: emptyMacros(),
    dinner: emptyMacros(),
    snack: emptyMacros(),
  };

  for (const entry of entries) {
    if (entry.date !== date) continue;

    const mealTotals = byMeal[entry.meal];
    byMeal[entry.meal] = addMacros(mealTotals, {
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
    });
  }

  const totals = Object.values(byMeal).reduce(addMacros, emptyMacros());

  return {
    date,
    totalCalories: totals.calories,
    totalProtein: totals.protein,
    totalCarbs: totals.carbs,
    totalFat: totals.fat,
    byMeal,
  };
}

/**
 * Calculate percentage of goal achieved
 */
export function calculateProgress(current: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.round((current / goal) * 100);
}

/**
 * Format calorie display with appropriate unit
 */
export function formatCalories(calories: number): string {
  return `${Math.round(calories)} cal`;
}

/**
 * Format macro display with unit
 */
export function formatMacro(value: number, unit: string = 'g'): string {
  return `${Math.round(value * 10) / 10}${unit}`;
}

// =============================================================================
// Serving Size Utilities
// =============================================================================

/**
 * Parse serving size string to extract numeric value and unit
 */
export function parseServingSize(
  servingSize: string
): { value: number; unit: string } | null {
  const match = servingSize.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  if (!match) return null;

  return {
    value: parseFloat(match[1]),
    unit: match[2].trim() || 'g',
  };
}

/**
 * Format serving size for display
 */
export function formatServingSize(value: number, unit: string = 'g'): string {
  if (value === Math.floor(value)) {
    return `${value}${unit}`;
  }
  return `${value.toFixed(1)}${unit}`;
}

// =============================================================================
// Validation Utilities
// =============================================================================

/**
 * Validate barcode format
 */
export function isValidBarcode(barcode: string): boolean {
  const digits = barcode.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 14;
}

/**
 * Validate meal type
 */
export function isValidMealType(meal: string): meal is MealType {
  return ['breakfast', 'lunch', 'dinner', 'snack'].includes(meal);
}

// =============================================================================
// String Utilities
// =============================================================================

/**
 * Capitalize first letter of string
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Format food name with brand
 */
export function formatFoodName(name: string, brand?: string): string {
  if (!brand) return name;
  return `${name} (${brand})`;
}

// =============================================================================
// Array Utilities
// =============================================================================

/**
 * Group array items by key
 */
export function groupBy<T>(
  items: T[],
  keyFn: (item: T) => string
): Record<string, T[]> {
  return items.reduce(
    (groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    },
    {} as Record<string, T[]>
  );
}

// =============================================================================
// Debounce Utility
// =============================================================================

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn(...args), delayMs);
  };
}

// =============================================================================
// Local Storage Utilities
// =============================================================================

/**
 * Safe localStorage get with JSON parsing
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;

  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Safe localStorage set with JSON stringify
 */
export function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or disabled - fail silently
  }
}

/**
 * Remove item from localStorage
 */
export function removeStorageItem(key: string): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(key);
  } catch {
    // Fail silently
  }
}
