import { useState, useEffect, useCallback, useRef } from "react";
import { type FoodLogEntry, type MealType, type FoodSource } from "@/types/food";
import { useAuthContext } from "@/lib/auth/auth-context";
import {
  getLocalFoodLog,
  addLocalFoodLogEntry,
  deleteLocalFoodLogEntry,
  bulkPutFoodLog,
} from "@/lib/db/food-log-dal";
import type { FoodLogRecord } from "@/lib/db/local-db";

interface AddEntryParams {
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
  source: string;
  sourceId?: string;
}

interface FoodLogData {
  entries: FoodLogEntry[];
  byMeal: Record<MealType, FoodLogEntry[]>;
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  loading: boolean;
  error: string | null;
  refetch: () => void;
  deleteEntry: (id: string) => Promise<boolean>;
  addEntry: (entry: AddEntryParams) => Promise<FoodLogEntry | null>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapRecordToEntry(r: FoodLogRecord): FoodLogEntry {
  return {
    id: r.id,
    userId: r.user_id,
    date: r.date,
    meal: r.meal as MealType,
    foodName: r.food_name,
    brand: r.brand,
    servingSize: r.serving_size,
    servings: r.servings,
    calories: r.calories,
    protein: r.protein,
    carbs: r.carbs,
    fat: r.fat,
    source: r.source as FoodSource,
    sourceId: r.source_id,
    createdAt: r.created_at,
  };
}

function mapApiToRecord(entry: Record<string, unknown>): FoodLogRecord {
  return {
    id: entry.id as string,
    user_id: entry.user_id as string,
    date: entry.date as string,
    meal: entry.meal as FoodLogRecord["meal"],
    food_name: entry.food_name as string,
    brand: entry.brand as string | undefined,
    serving_size: entry.serving_size as string,
    servings: entry.servings as number,
    calories: entry.calories as number,
    protein: entry.protein as number,
    carbs: entry.carbs as number,
    fat: entry.fat as number,
    source: entry.source as FoodLogRecord["source"],
    source_id: entry.source_id as string | undefined,
    created_at: entry.created_at as string,
    synced: true,
  };
}

/**
 * Merge server entries into IndexedDB (server wins for matching IDs).
 */
async function mergeServerData(
  dateString: string,
  serverEntries: Record<string, unknown>[]
) {
  const records = serverEntries.map(mapApiToRecord);
  if (records.length > 0) {
    await bulkPutFoodLog(records);
  }
  // Re-read from IndexedDB so unsynced local entries are preserved
  return getLocalFoodLog(dateString);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFoodLog(date: Date): FoodLogData {
  const [entries, setEntries] = useState<FoodLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { mode } = useAuthContext();

  const dateString = date.toISOString().split("T")[0];

  // Avoid stale closure issues when background fetches complete after date change
  const dateRef = useRef(dateString);
  dateRef.current = dateString;

  const loadLocal = useCallback(async () => {
    try {
      const records = await getLocalFoodLog(dateString);
      setEntries(records.map(mapRecordToEntry));
    } catch (err) {
      console.error("Error reading local food log:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load local data"
      );
    } finally {
      setLoading(false);
    }
  }, [dateString]);

  const syncFromServer = useCallback(async () => {
    try {
      const res = await fetch(`/api/log?date=${dateString}`);
      if (!res.ok) return;
      const data = await res.json();
      // Only apply if date hasn't changed while we were fetching
      if (dateRef.current !== dateString) return;
      const merged = await mergeServerData(dateString, data);
      if (dateRef.current === dateString) {
        setEntries(merged.map(mapRecordToEntry));
      }
    } catch {
      // Server errors are silent — local data is already shown
    }
  }, [dateString]);

  // On mount / date change: local first, then background sync
  useEffect(() => {
    setLoading(true);
    setError(null);
    loadLocal().then(() => {
      if (mode === "authenticated") {
        syncFromServer();
      }
    });
  }, [loadLocal, syncFromServer, mode]);

  const handleDelete = async (id: string): Promise<boolean> => {
    try {
      await deleteLocalFoodLogEntry(id);
      setEntries((prev) => prev.filter((entry) => entry.id !== id));

      // Background server delete
      if (mode === "authenticated") {
        fetch(`/api/log?id=${id}`, { method: "DELETE" }).catch(() => {});
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleAdd = async (
    entry: AddEntryParams
  ): Promise<FoodLogEntry | null> => {
    try {
      // Write to IndexedDB first
      const record = await addLocalFoodLogEntry({
        user_id: "",
        date: entry.date,
        meal: entry.meal as FoodLogRecord["meal"],
        food_name: entry.foodName,
        brand: entry.brand,
        serving_size: entry.servingSize,
        servings: entry.servings,
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat,
        source: entry.source as FoodLogRecord["source"],
        source_id: entry.sourceId,
      });

      const mapped = mapRecordToEntry(record);

      // Update state immediately if same date
      if (entry.date === dateRef.current) {
        setEntries((prev) => [...prev, mapped]);
      }

      // Background server write
      if (mode === "authenticated") {
        fetch("/api/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry),
        }).catch(() => {});
      }

      return mapped;
    } catch {
      return null;
    }
  };

  // Group entries by meal
  const byMeal: Record<MealType, FoodLogEntry[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  };

  entries.forEach((entry) => {
    const meal = entry.meal as MealType;
    if (byMeal[meal]) {
      byMeal[meal].push(entry);
    }
  });

  // Calculate totals
  const totals = entries.reduce(
    (acc, entry) => ({
      calories: acc.calories + (entry.calories || 0),
      protein: acc.protein + (entry.protein || 0),
      carbs: acc.carbs + (entry.carbs || 0),
      fat: acc.fat + (entry.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return {
    entries,
    byMeal,
    totals,
    loading,
    error,
    refetch: loadLocal,
    deleteEntry: handleDelete,
    addEntry: handleAdd,
  };
}
