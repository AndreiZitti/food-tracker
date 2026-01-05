import { useState, useEffect, useCallback } from "react";
import { type FoodLogEntry, type MealType } from "@/types/food";

// API response uses snake_case
interface ApiFoodLog {
  id: string;
  user_id: string;
  date: string;
  meal: MealType;
  food_name: string;
  brand?: string;
  serving_size: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: string;
  source_id?: string;
  created_at: string;
}

// Map API response to FoodLogEntry
function mapToFoodLogEntry(entry: ApiFoodLog): FoodLogEntry {
  return {
    id: entry.id,
    userId: entry.user_id,
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
    source: entry.source as FoodLogEntry["source"],
    sourceId: entry.source_id,
    createdAt: entry.created_at,
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
      const response = await fetch(`/api/log?date=${dateString}`);
      if (!response.ok) {
        throw new Error("Failed to fetch food log");
      }
      const data: ApiFoodLog[] = await response.json();
      // Handle both array response and empty state, map to camelCase
      const mappedEntries = Array.isArray(data)
        ? data.map(mapToFoodLogEntry)
        : [];
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

  const deleteEntry = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/log?id=${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setEntries((prev) => prev.filter((entry) => entry.id !== id));
        return true;
      }
      return false;
    } catch {
      return false;
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
    deleteEntry,
  };
}
