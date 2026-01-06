import { useState, useEffect, useCallback } from "react";
import { type FoodLogEntry, type MealType } from "@/types/food";
import {
  getFoodLogEntries,
  addFoodLogEntry as addEntry,
  deleteFoodLogEntry as deleteEntry,
  type StoredFoodEntry,
} from "@/lib/localStorage";

// Map stored entry to FoodLogEntry format
function mapToFoodLogEntry(entry: StoredFoodEntry): FoodLogEntry {
  return {
    id: entry.id,
    userId: "local",
    date: entry.date,
    meal: entry.meal,
    foodName: entry.foodName,
    brand: entry.brand,
    servingSize: entry.servingSize,
    servings: entry.servings,
    calories: entry.calories,
    protein: entry.protein,
    carbs: entry.carbs,
    fat: entry.fat,
    source: entry.source as FoodLogEntry["source"],
    sourceId: entry.sourceId,
    createdAt: entry.createdAt,
  };
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
  addEntry: (entry: Omit<StoredFoodEntry, "id" | "createdAt">) => FoodLogEntry;
}

export function useFoodLog(date: Date): FoodLogData {
  const [entries, setEntries] = useState<FoodLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dateString = date.toISOString().split("T")[0];

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);

    try {
      const storedEntries = getFoodLogEntries(dateString);
      const mappedEntries = storedEntries.map(mapToFoodLogEntry);
      setEntries(mappedEntries);
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
    const success = deleteEntry(id);
    if (success) {
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    }
    return success;
  };

  const handleAdd = (entry: Omit<StoredFoodEntry, "id" | "createdAt">): FoodLogEntry => {
    const newEntry = addEntry(entry);
    const mappedEntry = mapToFoodLogEntry(newEntry);

    // Only add to state if it's for the current date
    if (entry.date === dateString) {
      setEntries((prev) => [...prev, mappedEntry]);
    }

    return mappedEntry;
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
