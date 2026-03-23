import { useState, useEffect, useCallback } from "react";
import { type FoodLogEntry, type MealType } from "@/types/food";

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

function mapApiEntry(entry: Record<string, unknown>): FoodLogEntry {
  return {
    id: entry.id as string,
    userId: entry.user_id as string,
    date: entry.date as string,
    meal: entry.meal as MealType,
    foodName: entry.food_name as string,
    brand: entry.brand as string | undefined,
    servingSize: entry.serving_size as string,
    servings: entry.servings as number,
    calories: entry.calories as number,
    protein: entry.protein as number,
    carbs: entry.carbs as number,
    fat: entry.fat as number,
    source: entry.source as FoodLogEntry["source"],
    sourceId: entry.source_id as string | undefined,
    createdAt: entry.created_at as string,
  };
}

export function useFoodLog(date: Date): FoodLogData {
  const [entries, setEntries] = useState<FoodLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dateString = date.toISOString().split("T")[0];

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/log?date=${dateString}`);
      if (!res.ok) {
        throw new Error("Failed to fetch food log");
      }
      const data = await res.json();
      setEntries(data.map(mapApiEntry));
    } catch (err) {
      console.error("Error fetching food log:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [dateString]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/log?id=${id}`, { method: "DELETE" });
      if (!res.ok) return false;
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
      return true;
    } catch {
      return false;
    }
  };

  const handleAdd = async (entry: AddEntryParams): Promise<FoodLogEntry | null> => {
    try {
      const res = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      if (!res.ok) throw new Error("Failed to add entry");
      const data = await res.json();
      const mapped = mapApiEntry(data);

      if (entry.date === dateString) {
        setEntries((prev) => [...prev, mapped]);
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
    refetch: fetchData,
    deleteEntry: handleDelete,
    addEntry: handleAdd,
  };
}
