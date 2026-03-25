import { getDB, type WeightLogRecord } from './local-db';

// =============================================================================
// Weight Log Data Access Layer (pure IndexedDB, no network)
// =============================================================================

type NewWeightEntry = Omit<WeightLogRecord, 'id' | 'synced' | 'created_at'>;

/**
 * Get weight entries for the last N days, sorted by date ascending.
 */
export async function getLocalWeightLog(
  days: number
): Promise<WeightLogRecord[]> {
  const dbPromise = getDB();
  if (!dbPromise) return [];
  const db = await dbPromise;

  // Calculate the cutoff date (N days ago)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10); // YYYY-MM-DD

  // Use the date index with a range
  const range = IDBKeyRange.lowerBound(cutoffStr);
  const entries = await db.getAllFromIndex('weight_log', 'by-date', range);

  // Sort by date ascending
  return entries.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Add a new weight entry with auto-generated ID and metadata.
 */
export async function addLocalWeightEntry(
  entry: NewWeightEntry
): Promise<WeightLogRecord> {
  const dbPromise = getDB();
  if (!dbPromise) throw new Error('IndexedDB not available');
  const db = await dbPromise;

  const record: WeightLogRecord = {
    ...entry,
    id: crypto.randomUUID(),
    synced: false,
    created_at: new Date().toISOString(),
  };

  await db.put('weight_log', record);
  return record;
}

/**
 * Get all weight entries that haven't been synced to the server.
 */
export async function getUnsyncedWeightEntries(): Promise<WeightLogRecord[]> {
  const dbPromise = getDB();
  if (!dbPromise) return [];
  const db = await dbPromise;
  return db.getAllFromIndex('weight_log', 'by-synced', 0 as unknown as number);
}

/**
 * Mark a single weight entry as synced.
 */
export async function markWeightSynced(id: string): Promise<void> {
  const dbPromise = getDB();
  if (!dbPromise) return;
  const db = await dbPromise;

  const entry = await db.get('weight_log', id);
  if (entry) {
    entry.synced = true;
    await db.put('weight_log', entry);
  }
}

/**
 * Upsert multiple weight log entries (used by sync to store server data).
 */
export async function bulkPutWeightLog(entries: WeightLogRecord[]): Promise<void> {
  const dbPromise = getDB();
  if (!dbPromise) return;
  const db = await dbPromise;

  const tx = db.transaction('weight_log', 'readwrite');
  for (const entry of entries) {
    tx.store.put(entry);
  }
  await tx.done;
}
