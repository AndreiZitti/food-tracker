import { getDB, type FoodLogRecord } from './local-db';

// =============================================================================
// Food Log Data Access Layer (pure IndexedDB, no network)
// =============================================================================

type NewFoodLogEntry = Omit<FoodLogRecord, 'id' | 'synced' | 'created_at'>;

export interface RecentFood {
  food_name: string;
  brand?: string;
  serving_size: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: FoodLogRecord['source'];
  source_id?: string;
  count: number;
  last_used: string;
}

/**
 * Get all food log entries for a specific date.
 */
export async function getLocalFoodLog(date: string): Promise<FoodLogRecord[]> {
  const dbPromise = getDB();
  if (!dbPromise) return [];
  const db = await dbPromise;
  return db.getAllFromIndex('food_log', 'by-date', date);
}

/**
 * Add a new food log entry with auto-generated ID and metadata.
 */
export async function addLocalFoodLogEntry(
  entry: NewFoodLogEntry
): Promise<FoodLogRecord> {
  const dbPromise = getDB();
  if (!dbPromise) throw new Error('IndexedDB not available');
  const db = await dbPromise;

  const record: FoodLogRecord = {
    ...entry,
    id: crypto.randomUUID(),
    synced: false,
    created_at: new Date().toISOString(),
  };

  await db.put('food_log', record);
  return record;
}

/**
 * Delete a food log entry by ID.
 */
export async function deleteLocalFoodLogEntry(id: string): Promise<void> {
  const dbPromise = getDB();
  if (!dbPromise) return;
  const db = await dbPromise;
  await db.delete('food_log', id);
}

/**
 * Get the most recently used foods, aggregated by food_name + brand.
 */
export async function getRecentFoods(limit = 20): Promise<RecentFood[]> {
  const dbPromise = getDB();
  if (!dbPromise) return [];
  const db = await dbPromise;

  const allEntries = await db.getAll('food_log');

  // Aggregate by food_name + brand combo
  const map = new Map<string, RecentFood>();

  for (const entry of allEntries) {
    const key = `${entry.food_name}||${entry.brand ?? ''}`;
    const existing = map.get(key);

    if (existing) {
      existing.count += 1;
      if (entry.created_at > existing.last_used) {
        existing.last_used = entry.created_at;
      }
    } else {
      map.set(key, {
        food_name: entry.food_name,
        brand: entry.brand,
        serving_size: entry.serving_size,
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat,
        source: entry.source,
        source_id: entry.source_id,
        count: 1,
        last_used: entry.created_at,
      });
    }
  }

  // Sort by last_used descending, take top N
  return Array.from(map.values())
    .sort((a, b) => b.last_used.localeCompare(a.last_used))
    .slice(0, limit);
}

/**
 * Get all entries that haven't been synced to the server.
 */
export async function getUnsyncedEntries(): Promise<FoodLogRecord[]> {
  const dbPromise = getDB();
  if (!dbPromise) return [];
  const db = await dbPromise;
  // IndexedDB stores booleans; the index uses 0/1
  return db.getAllFromIndex('food_log', 'by-synced', 0 as unknown as number);
}

/**
 * Mark a single entry as synced.
 */
export async function markSynced(id: string): Promise<void> {
  const dbPromise = getDB();
  if (!dbPromise) return;
  const db = await dbPromise;

  const entry = await db.get('food_log', id);
  if (entry) {
    entry.synced = true;
    await db.put('food_log', entry);
  }
}

/**
 * Upsert multiple food log entries (used by sync to store server data).
 */
export async function bulkPutFoodLog(entries: FoodLogRecord[]): Promise<void> {
  const dbPromise = getDB();
  if (!dbPromise) return;
  const db = await dbPromise;

  const tx = db.transaction('food_log', 'readwrite');
  for (const entry of entries) {
    tx.store.put(entry);
  }
  await tx.done;
}
