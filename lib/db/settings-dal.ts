import { getDB, type SettingsRecord } from './local-db';

// =============================================================================
// Settings Data Access Layer (pure IndexedDB, no network)
// =============================================================================

const SETTINGS_KEY = 'user_settings';

/**
 * Return default settings values.
 */
export function getDefaultSettings(): SettingsRecord {
  return {
    id: SETTINGS_KEY,
    user_id: '',
    calorie_goal: 2000,
    protein_goal: 150,
    carbs_goal: 200,
    fat_goal: 65,
    display_mode: 'simple',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    synced: false,
  };
}

/**
 * Get settings from IndexedDB (fixed key 'user_settings').
 */
export async function getLocalSettings(): Promise<SettingsRecord | undefined> {
  const dbPromise = getDB();
  if (!dbPromise) return undefined;
  const db = await dbPromise;
  return db.get('settings', SETTINGS_KEY);
}

/**
 * Upsert settings with synced: false.
 */
export async function saveLocalSettings(
  settings: Partial<Omit<SettingsRecord, 'id' | 'synced'>>
): Promise<SettingsRecord> {
  const dbPromise = getDB();
  if (!dbPromise) throw new Error('IndexedDB not available');
  const db = await dbPromise;

  const existing = await db.get('settings', SETTINGS_KEY);
  const now = new Date().toISOString();

  const record: SettingsRecord = {
    ...getDefaultSettings(),
    ...existing,
    ...settings,
    id: SETTINGS_KEY,
    synced: false,
    updated_at: now,
  };

  await db.put('settings', record);
  return record;
}
