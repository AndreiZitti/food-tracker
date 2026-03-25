import { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "@/lib/auth/auth-context";
import { getLocalFoodLog } from "@/lib/db/food-log-dal";
import {
  getLocalSettings,
  getDefaultSettings,
} from "@/lib/db/settings-dal";
import {
  getLocalWeightLog,
  addLocalWeightEntry,
} from "@/lib/db/weight-dal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CalorieData {
  date: string;
  dateFormatted: string;
  calories: number;
  goal: number;
}

interface WeightData {
  date: string;
  dateFormatted: string;
  weight: number;
  unit: string;
}

interface ProgressData {
  calorieData: CalorieData[];
  weightData: WeightData[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build an array of date strings for the last N days (inclusive of today). */
function buildDateRange(days: number): { dateStr: string; dateFormatted: string }[] {
  const result: { dateStr: string; dateFormatted: string }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push({
      dateStr: d.toISOString().split("T")[0],
      dateFormatted: d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    });
  }
  return result;
}

// ---------------------------------------------------------------------------
// useProgressData
// ---------------------------------------------------------------------------

export function useProgressData(days: number = 7): ProgressData {
  const [calorieData, setCalorieData] = useState<CalorieData[]>([]);
  const [weightData, setWeightData] = useState<WeightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { mode } = useAuthContext();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Settings (local)
      const settings = (await getLocalSettings()) ?? getDefaultSettings();
      const goal = settings.calorie_goal;

      // 2. Calorie data — read each day from IndexedDB
      const dateRange = buildDateRange(days);
      const calorieResults: CalorieData[] = await Promise.all(
        dateRange.map(async ({ dateStr, dateFormatted }) => {
          const records = await getLocalFoodLog(dateStr);
          const totalCalories = records.reduce(
            (sum, r) => sum + (r.calories || 0),
            0
          );
          return { date: dateStr, dateFormatted, calories: totalCalories, goal };
        })
      );
      calorieResults.sort((a, b) => a.date.localeCompare(b.date));
      setCalorieData(calorieResults);

      // 3. Weight data (local)
      const weightRecords = await getLocalWeightLog(days);
      const processedWeight: WeightData[] = weightRecords.map((r) => {
        const d = new Date(r.date);
        return {
          date: r.date,
          dateFormatted: d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          weight: r.weight,
          unit: r.unit,
        };
      });
      setWeightData(processedWeight);
    } catch (err) {
      console.error("Error loading progress data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }

    // Background server sync (authenticated only)
    if (mode === "authenticated") {
      try {
        const [settingsRes, weightRes] = await Promise.all([
          fetch("/api/settings"),
          fetch(`/api/weight?days=${days}`),
        ]);

        let serverGoal = 2000;
        if (settingsRes.ok) {
          const sd = await settingsRes.json();
          serverGoal = sd.calorie_goal ?? 2000;
        }

        // Fetch per-day calorie data from server
        const dateRange = buildDateRange(days);
        const serverCalories: CalorieData[] = await Promise.all(
          dateRange.map(async ({ dateStr, dateFormatted }) => {
            try {
              const res = await fetch(`/api/log?date=${dateStr}`);
              const entries: { calories?: number }[] = res.ok
                ? await res.json()
                : [];
              const totalCalories = entries.reduce(
                (sum, e) => sum + (e.calories || 0),
                0
              );
              return {
                date: dateStr,
                dateFormatted,
                calories: totalCalories,
                goal: serverGoal,
              };
            } catch {
              return { date: dateStr, dateFormatted, calories: 0, goal: serverGoal };
            }
          })
        );
        serverCalories.sort((a, b) => a.date.localeCompare(b.date));
        setCalorieData(serverCalories);

        if (weightRes.ok) {
          const weightEntries = await weightRes.json();
          const processed: WeightData[] = weightEntries.map(
            (entry: { date: string; weight: number; unit: string }) => {
              const d = new Date(entry.date);
              return {
                date: entry.date,
                dateFormatted: d.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                }),
                weight: entry.weight,
                unit: entry.unit,
              };
            }
          );
          setWeightData(processed);
        }
      } catch {
        // Server errors are silent — local data is already displayed
      }
    }
  }, [days, mode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    calorieData,
    weightData,
    loading,
    error,
    refetch: fetchData,
  };
}

// ---------------------------------------------------------------------------
// useWeightLog
// ---------------------------------------------------------------------------

export function useWeightLog() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mode } = useAuthContext();

  const logWeight = async (
    weight: number,
    unit: "kg" | "lbs"
  ): Promise<boolean> => {
    setSaving(true);
    setError(null);

    try {
      const today = new Date().toISOString().split("T")[0];
      await addLocalWeightEntry({
        user_id: "",
        date: today,
        weight,
        unit,
      });

      // Background server write
      if (mode === "authenticated") {
        fetch("/api/weight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ weight, unit }),
        }).catch(() => {});
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save weight");
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { logWeight, saving, error };
}

// ---------------------------------------------------------------------------
// useCalorieHistory
// ---------------------------------------------------------------------------

export function useCalorieHistory(days: number = 30) {
  const [data, setData] = useState<CalorieData[]>([]);
  const [loading, setLoading] = useState(true);
  const { mode } = useAuthContext();

  useEffect(() => {
    async function load() {
      try {
        // Settings (local)
        const settings = (await getLocalSettings()) ?? getDefaultSettings();
        const goal = settings.calorie_goal;

        // Read from IndexedDB
        const dateRange = buildDateRange(days);
        const results: CalorieData[] = await Promise.all(
          dateRange.map(async ({ dateStr, dateFormatted }) => {
            const records = await getLocalFoodLog(dateStr);
            const totalCalories = records.reduce(
              (sum, r) => sum + (r.calories || 0),
              0
            );
            return { date: dateStr, dateFormatted, calories: totalCalories, goal };
          })
        );
        results.sort((a, b) => a.date.localeCompare(b.date));
        setData(results);
      } catch (err) {
        console.error("Error fetching calorie history:", err);
      } finally {
        setLoading(false);
      }

      // Background server sync
      if (mode === "authenticated") {
        try {
          const settingsRes = await fetch("/api/settings");
          let serverGoal = 2000;
          if (settingsRes.ok) {
            const sd = await settingsRes.json();
            serverGoal = sd.calorie_goal ?? 2000;
          }

          const dateRange = buildDateRange(days);
          const serverResults: CalorieData[] = await Promise.all(
            dateRange.map(async ({ dateStr, dateFormatted }) => {
              try {
                const res = await fetch(`/api/log?date=${dateStr}`);
                const entries: { calories?: number }[] = res.ok
                  ? await res.json()
                  : [];
                const totalCalories = entries.reduce(
                  (sum, e) => sum + (e.calories || 0),
                  0
                );
                return {
                  date: dateStr,
                  dateFormatted,
                  calories: totalCalories,
                  goal: serverGoal,
                };
              } catch {
                return { date: dateStr, dateFormatted, calories: 0, goal: serverGoal };
              }
            })
          );
          serverResults.sort((a, b) => a.date.localeCompare(b.date));
          setData(serverResults);
        } catch {
          // Silent — local data already shown
        }
      }
    }
    load();
  }, [days, mode]);

  return { data, loading };
}
