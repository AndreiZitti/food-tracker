/**
 * LocalStorage utilities for FitTrack
 *
 * All data is stored locally on the device. No account required for basic features.
 * Only AI features (nutrition label scanning) require authentication.
 */

import { type FoodLogEntry, type MealType } from "@/types/food";

// Storage keys
const STORAGE_KEYS = {
  FOOD_LOG: "fittrack-food-log",
  WEIGHT_LOG: "fittrack-weight-log",
  SETTINGS: "fittrack-settings",
  RECENT_FOODS: "fittrack-recent-foods",
} as const;

// Types
export interface StoredFoodEntry {
  id: string;
  date: string;
  meal: MealType;
  foodName: string;
  brand?: string;
  servingSize: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: "openfoodfacts" | "custom" | "manual" | "label_scan";
  sourceId?: string;
  createdAt: string;
}

export interface StoredWeightEntry {
  id: string;
  date: string;
  weight: number;
  unit: "kg" | "lbs";
  createdAt: string;
}

export interface StoredSettings {
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  displayMode: "simple" | "advanced";
}

// Helper to check if we're in browser
const isBrowser = () => typeof window !== "undefined";

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ============ Food Log ============

export function getFoodLogEntries(date: string): StoredFoodEntry[] {
  if (!isBrowser()) return [];

  try {
    const data = localStorage.getItem(STORAGE_KEYS.FOOD_LOG);
    if (!data) return [];

    const allEntries: StoredFoodEntry[] = JSON.parse(data);
    return allEntries.filter(entry => entry.date === date);
  } catch {
    return [];
  }
}

export function getAllFoodLogEntries(): StoredFoodEntry[] {
  if (!isBrowser()) return [];

  try {
    const data = localStorage.getItem(STORAGE_KEYS.FOOD_LOG);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addFoodLogEntry(entry: Omit<StoredFoodEntry, "id" | "createdAt">): StoredFoodEntry {
  const newEntry: StoredFoodEntry = {
    ...entry,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  if (!isBrowser()) return newEntry;

  try {
    const existing = getAllFoodLogEntries();
    existing.push(newEntry);
    localStorage.setItem(STORAGE_KEYS.FOOD_LOG, JSON.stringify(existing));

    // Also update recent foods
    updateRecentFoods(newEntry);
  } catch (error) {
    console.error("Error saving food entry:", error);
  }

  return newEntry;
}

export function deleteFoodLogEntry(id: string): boolean {
  if (!isBrowser()) return false;

  try {
    const existing = getAllFoodLogEntries();
    const filtered = existing.filter(entry => entry.id !== id);
    localStorage.setItem(STORAGE_KEYS.FOOD_LOG, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
}

// ============ Weight Log ============

export function getWeightLogEntries(days: number = 30): StoredWeightEntry[] {
  if (!isBrowser()) return [];

  try {
    const data = localStorage.getItem(STORAGE_KEYS.WEIGHT_LOG);
    if (!data) return [];

    const allEntries: StoredWeightEntry[] = JSON.parse(data);

    // Filter to last N days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split("T")[0];

    return allEntries
      .filter(entry => entry.date >= startDateStr)
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
}

export function addWeightLogEntry(weight: number, unit: "kg" | "lbs", date?: string): StoredWeightEntry {
  const newEntry: StoredWeightEntry = {
    id: generateId(),
    date: date || new Date().toISOString().split("T")[0],
    weight,
    unit,
    createdAt: new Date().toISOString(),
  };

  if (!isBrowser()) return newEntry;

  try {
    const data = localStorage.getItem(STORAGE_KEYS.WEIGHT_LOG);
    const existing: StoredWeightEntry[] = data ? JSON.parse(data) : [];

    // Remove existing entry for same date (replace with new)
    const filtered = existing.filter(entry => entry.date !== newEntry.date);
    filtered.push(newEntry);

    localStorage.setItem(STORAGE_KEYS.WEIGHT_LOG, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error saving weight entry:", error);
  }

  return newEntry;
}

// ============ Recent Foods ============

export interface RecentFood {
  foodName: string;
  brand?: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: string;
  sourceId?: string;
  count: number;
  lastUsed: string;
}

function updateRecentFoods(entry: StoredFoodEntry): void {
  if (!isBrowser()) return;

  try {
    const data = localStorage.getItem(STORAGE_KEYS.RECENT_FOODS);
    const recentFoods: RecentFood[] = data ? JSON.parse(data) : [];

    const key = `${entry.foodName}|${entry.brand || ""}`;
    const existingIndex = recentFoods.findIndex(
      f => `${f.foodName}|${f.brand || ""}` === key
    );

    if (existingIndex >= 0) {
      recentFoods[existingIndex].count += 1;
      recentFoods[existingIndex].lastUsed = new Date().toISOString();
    } else {
      recentFoods.push({
        foodName: entry.foodName,
        brand: entry.brand,
        servingSize: entry.servingSize,
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat,
        source: entry.source,
        sourceId: entry.sourceId,
        count: 1,
        lastUsed: new Date().toISOString(),
      });
    }

    // Keep only top 50 recent foods
    recentFoods.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
    });

    localStorage.setItem(
      STORAGE_KEYS.RECENT_FOODS,
      JSON.stringify(recentFoods.slice(0, 50))
    );
  } catch (error) {
    console.error("Error updating recent foods:", error);
  }
}

export function getRecentFoods(limit: number = 20): RecentFood[] {
  if (!isBrowser()) return [];

  try {
    const data = localStorage.getItem(STORAGE_KEYS.RECENT_FOODS);
    if (!data) return [];

    const recentFoods: RecentFood[] = JSON.parse(data);
    return recentFoods.slice(0, limit);
  } catch {
    return [];
  }
}

// ============ Settings ============

export const DEFAULT_SETTINGS: StoredSettings = {
  calorieGoal: 2000,
  proteinGoal: 150,
  carbsGoal: 200,
  fatGoal: 65,
  displayMode: "simple",
};

export function getSettings(): StoredSettings {
  if (!isBrowser()) return DEFAULT_SETTINGS;

  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Partial<StoredSettings>): StoredSettings {
  const current = getSettings();
  const updated = { ...current, ...settings };

  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  }

  return updated;
}

// ============ Data Export/Clear ============

export function exportAllData(): string {
  if (!isBrowser()) return "{}";

  return JSON.stringify({
    foodLog: getAllFoodLogEntries(),
    weightLog: getWeightLogEntries(365),
    settings: getSettings(),
    recentFoods: getRecentFoods(50),
    exportedAt: new Date().toISOString(),
  }, null, 2);
}

export function clearAllData(): void {
  if (!isBrowser()) return;

  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}
