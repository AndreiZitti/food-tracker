import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

// =============================================================================
// IndexedDB Schema Definition
// =============================================================================

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type FoodSource = 'openfoodfacts' | 'custom' | 'manual' | 'label_scan';

export interface FoodLogRecord {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  meal: MealType;
  food_name: string;
  brand?: string;
  serving_size: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: FoodSource;
  source_id?: string;
  created_at: string;
  synced: boolean;
}

export interface SettingsRecord {
  id: string;
  user_id: string;
  calorie_goal: number;
  protein_goal: number;
  carbs_goal: number;
  fat_goal: number;
  display_mode: 'simple' | 'advanced';
  created_at: string;
  updated_at: string;
  synced: boolean;
}

export interface WeightLogRecord {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  weight: number;
  unit: 'kg' | 'lbs';
  created_at: string;
  synced: boolean;
}

export interface MetaRecord {
  key: string;
  value: string;
}

// =============================================================================
// Database Schema (for idb typing)
// =============================================================================

export interface FitTrackDB extends DBSchema {
  food_log: {
    key: string;
    value: FoodLogRecord;
    indexes: {
      'by-date': string;
      'by-synced': number; // 0 or 1 (IndexedDB doesn't index booleans)
    };
  };
  settings: {
    key: string;
    value: SettingsRecord;
  };
  weight_log: {
    key: string;
    value: WeightLogRecord;
    indexes: {
      'by-date': string;
      'by-synced': number;
    };
  };
  meta: {
    key: string;
    value: MetaRecord;
  };
}

// =============================================================================
// Database Connection (singleton)
// =============================================================================

const DB_NAME = 'fittrack';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<FitTrackDB>> | null = null;

/**
 * Get (or create) the singleton IndexedDB connection.
 * Returns null when called server-side (SSR).
 */
export function getDB(): Promise<IDBPDatabase<FitTrackDB>> | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!dbPromise) {
    dbPromise = openDB<FitTrackDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // food_log store
        const foodLogStore = db.createObjectStore('food_log', { keyPath: 'id' });
        foodLogStore.createIndex('by-date', 'date');
        foodLogStore.createIndex('by-synced', 'synced');

        // settings store
        db.createObjectStore('settings', { keyPath: 'id' });

        // weight_log store
        const weightLogStore = db.createObjectStore('weight_log', { keyPath: 'id' });
        weightLogStore.createIndex('by-date', 'date');
        weightLogStore.createIndex('by-synced', 'synced');

        // meta store (key-value)
        db.createObjectStore('meta', { keyPath: 'key' });
      },
    });
  }

  return dbPromise;
}
