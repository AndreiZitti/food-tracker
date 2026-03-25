import { getDB, type FoodLogRecord, type WeightLogRecord } from './local-db';
import { getUnsyncedEntries, markSynced, bulkPutFoodLog } from './food-log-dal';
import {
  getUnsyncedWeightEntries,
  markWeightSynced,
  bulkPutWeightLog,
} from './weight-dal';
import { getLocalSettings, saveLocalSettings } from './settings-dal';

// =============================================================================
// Background Sync Service
// =============================================================================

interface PushResult {
  pushed: number;
  failed: boolean;
}

interface PullResult {
  pulled: number;
}

interface SyncResult {
  pushed: number;
  pulled: number;
  lastSynced: string;
}

// -----------------------------------------------------------------------------
// Push: local unsynced data → server
// -----------------------------------------------------------------------------

export async function pushUnsyncedToServer(): Promise<PushResult> {
  let pushed = 0;

  // --- Food log entries ---
  try {
    const unsyncedFood = await getUnsyncedEntries();
    for (const entry of unsyncedFood) {
      try {
        const res = await fetch('/api/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: entry.date,
            meal: entry.meal,
            foodName: entry.food_name,
            brand: entry.brand,
            servingSize: entry.serving_size,
            servings: entry.servings,
            calories: entry.calories,
            protein: entry.protein,
            carbs: entry.carbs,
            fat: entry.fat,
            source: entry.source,
            sourceId: entry.source_id,
          }),
        });

        if (!res.ok) {
          // If the server returned an error, stop pushing
          return { pushed, failed: true };
        }

        await markSynced(entry.id);
        pushed++;
      } catch {
        // Network failure — stop immediately
        return { pushed, failed: true };
      }
    }
  } catch {
    return { pushed, failed: true };
  }

  // --- Weight log entries ---
  try {
    const unsyncedWeight = await getUnsyncedWeightEntries();
    for (const entry of unsyncedWeight) {
      try {
        const res = await fetch('/api/weight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: entry.date,
            weight: entry.weight,
            unit: entry.unit,
          }),
        });

        if (!res.ok) {
          return { pushed, failed: true };
        }

        await markWeightSynced(entry.id);
        pushed++;
      } catch {
        return { pushed, failed: true };
      }
    }
  } catch {
    return { pushed, failed: true };
  }

  // --- Settings ---
  try {
    const settings = await getLocalSettings();
    if (settings && !settings.synced) {
      try {
        const res = await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            calorieGoal: settings.calorie_goal,
            proteinGoal: settings.protein_goal,
            carbsGoal: settings.carbs_goal,
            fatGoal: settings.fat_goal,
            displayMode: settings.display_mode,
          }),
        });

        if (!res.ok) {
          return { pushed, failed: true };
        }

        // Mark settings as synced (re-save with synced flag would reset it,
        // so we do a direct put)
        const dbPromise = getDB();
        if (dbPromise) {
          const db = await dbPromise;
          const current = await db.get('settings', settings.id);
          if (current) {
            current.synced = true;
            await db.put('settings', current);
          }
        }
        pushed++;
      } catch {
        return { pushed, failed: true };
      }
    }
  } catch {
    return { pushed, failed: true };
  }

  return { pushed, failed: false };
}

// -----------------------------------------------------------------------------
// Pull: server data → local IndexedDB
// -----------------------------------------------------------------------------

export async function pullFromServer(days = 7): Promise<PullResult> {
  let pulled = 0;

  // --- Food log (fetch each day individually, as the API expects a single date) ---
  try {
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);

      try {
        const res = await fetch(`/api/log?date=${dateStr}`);
        if (!res.ok) continue; // skip this day on error

        const serverEntries = await res.json();
        if (!Array.isArray(serverEntries) || serverEntries.length === 0)
          continue;

        // Map snake_case API response → FoodLogRecord
        const records: FoodLogRecord[] = serverEntries.map(
          (e: Record<string, unknown>) => ({
            id: e.id as string,
            user_id: e.user_id as string,
            date: e.date as string,
            meal: e.meal as FoodLogRecord['meal'],
            food_name: e.food_name as string,
            brand: (e.brand as string) || undefined,
            serving_size: e.serving_size as string,
            servings: Number(e.servings) || 1,
            calories: Number(e.calories) || 0,
            protein: Number(e.protein) || 0,
            carbs: Number(e.carbs) || 0,
            fat: Number(e.fat) || 0,
            source: (e.source as FoodLogRecord['source']) || 'manual',
            source_id: (e.source_id as string) || undefined,
            created_at: e.created_at as string,
            synced: true,
          })
        );

        await bulkPutFoodLog(records);
        pulled += records.length;
      } catch {
        // Skip this day on network error, continue with others
        continue;
      }
    }
  } catch {
    // Non-critical — continue with other pulls
  }

  // --- Settings ---
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const serverSettings = await res.json();
      if (serverSettings && !serverSettings.error) {
        // Store server settings locally with synced: true
        const dbPromise = getDB();
        if (dbPromise) {
          const db = await dbPromise;
          await db.put('settings', {
            id: 'user_settings',
            user_id: serverSettings.user_id || '',
            calorie_goal: serverSettings.calorie_goal ?? 2000,
            protein_goal: serverSettings.protein_goal ?? 150,
            carbs_goal: serverSettings.carbs_goal ?? 200,
            fat_goal: serverSettings.fat_goal ?? 65,
            display_mode: serverSettings.display_mode ?? 'simple',
            created_at: serverSettings.created_at || new Date().toISOString(),
            updated_at: serverSettings.updated_at || new Date().toISOString(),
            synced: true,
          });
          pulled++;
        }
      }
    }
  } catch {
    // Non-critical
  }

  // --- Weight log ---
  try {
    const res = await fetch(`/api/weight?days=${days}`);
    if (res.ok) {
      const serverEntries = await res.json();
      if (Array.isArray(serverEntries) && serverEntries.length > 0) {
        const records: WeightLogRecord[] = serverEntries.map(
          (e: Record<string, unknown>) => ({
            id: e.id as string,
            user_id: e.user_id as string,
            date: e.date as string,
            weight: Number(e.weight),
            unit: (e.unit as WeightLogRecord['unit']) || 'kg',
            created_at: e.created_at as string,
            synced: true,
          })
        );

        await bulkPutWeightLog(records);
        pulled += records.length;
      }
    }
  } catch {
    // Non-critical
  }

  return { pulled };
}

// -----------------------------------------------------------------------------
// Full bidirectional sync
// -----------------------------------------------------------------------------

export async function fullSync(days = 7): Promise<SyncResult> {
  // Push first so local changes aren't overwritten
  const pushResult = await pushUnsyncedToServer();

  // Then pull server state
  const pullResult = await pullFromServer(days);

  // Save sync timestamp
  const lastSynced = new Date().toISOString();
  try {
    const dbPromise = getDB();
    if (dbPromise) {
      const db = await dbPromise;
      await db.put('meta', { key: 'last_sync', value: lastSynced });
    }
  } catch {
    // Non-critical
  }

  return {
    pushed: pushResult.pushed,
    pulled: pullResult.pulled,
    lastSynced,
  };
}

// -----------------------------------------------------------------------------
// Last sync time
// -----------------------------------------------------------------------------

export async function getLastSyncTime(): Promise<string | null> {
  try {
    const dbPromise = getDB();
    if (!dbPromise) return null;
    const db = await dbPromise;
    const meta = await db.get('meta', 'last_sync');
    return meta?.value ?? null;
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// Auto-sync: listen for online events
// -----------------------------------------------------------------------------

export function startAutoSync(): () => void {
  const handler = () => {
    fullSync().catch(console.error);
  };

  window.addEventListener('online', handler);

  return () => {
    window.removeEventListener('online', handler);
  };
}
