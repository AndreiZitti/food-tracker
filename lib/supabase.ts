/**
 * Supabase Client Configuration
 *
 * This module provides the Supabase client for database operations.
 * The client connects to the existing Supabase instance at zitti.ro.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Supabase configuration
// These should be set in environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Create Supabase client only if credentials are provided
// This allows the app to work in demo mode without Supabase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let supabase: SupabaseClient<any, 'food-tracker', any> | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    db: {
      schema: 'food-tracker'
    }
  });
}

// Check if Supabase is configured
export const isSupabaseConfigured = () => supabase !== null;

// Types for database tables
export interface UserSettings {
  id: string;
  user_id: string;
  calorie_goal: number;
  protein_goal: number;
  carbs_goal: number;
  fat_goal: number;
  display_mode: "simple" | "advanced";
  created_at: string;
  updated_at: string;
}

export interface CustomFood {
  id: string;
  user_id: string;
  name: string;
  brand?: string;
  serving_size: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  barcode?: string;
  created_at: string;
}

export interface FoodLog {
  id: string;
  user_id: string;
  date: string;
  meal: "breakfast" | "lunch" | "dinner" | "snack";
  food_name: string;
  brand?: string;
  serving_size: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: "openfoodfacts" | "custom" | "manual";
  source_id?: string;
  created_at: string;
}

export interface WeightLog {
  id: string;
  user_id: string;
  date: string;
  weight: number;
  unit: "kg" | "lbs";
  created_at: string;
}

// Database helper functions
export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  if (!supabase) {
    console.log("Supabase not configured, returning null");
    return null;
  }

  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching user settings:", error);
    return null;
  }

  return data;
}

export async function updateUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from("user_settings")
    .upsert({
      user_id: userId,
      ...settings,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error("Error updating user settings:", error);
    return false;
  }

  return true;
}

export async function getFoodLog(userId: string, date: string): Promise<FoodLog[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("food_log")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching food log:", error);
    return [];
  }

  return data || [];
}

export async function addFoodLogEntry(entry: Omit<FoodLog, "id" | "created_at">): Promise<FoodLog | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("food_log")
    .insert(entry)
    .select()
    .single();

  if (error) {
    console.error("Error adding food log entry:", error);
    return null;
  }

  return data;
}

export async function deleteFoodLogEntry(id: string): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from("food_log")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting food log entry:", error);
    return false;
  }

  return true;
}

export async function getWeightLog(
  userId: string,
  days: number = 30
): Promise<WeightLog[]> {
  if (!supabase) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from("weight_log")
    .select("*")
    .eq("user_id", userId)
    .gte("date", startDate.toISOString().split("T")[0])
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching weight log:", error);
    return [];
  }

  return data || [];
}

export async function addWeightLogEntry(
  entry: Omit<WeightLog, "id" | "created_at">
): Promise<WeightLog | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("weight_log")
    .insert(entry)
    .select()
    .single();

  if (error) {
    console.error("Error adding weight log entry:", error);
    return null;
  }

  return data;
}

export async function getCustomFoods(userId: string): Promise<CustomFood[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("custom_foods")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching custom foods:", error);
    return [];
  }

  return data || [];
}

export async function addCustomFood(
  food: Omit<CustomFood, "id" | "created_at">
): Promise<CustomFood | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("custom_foods")
    .insert(food)
    .select()
    .single();

  if (error) {
    console.error("Error adding custom food:", error);
    return null;
  }

  return data;
}

// Get recent/frequent foods for quick re-adding
export interface RecentFood {
  food_name: string;
  brand?: string;
  serving_size: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: string;
  source_id?: string;
  count: number;
  last_used: string;
}

export async function getRecentFoods(userId: string, limit: number = 20): Promise<RecentFood[]> {
  if (!supabase) return [];

  // Get unique foods ordered by most recently used
  // We group by food_name + brand to deduplicate
  const { data, error } = await supabase
    .from("food_log")
    .select("food_name, brand, serving_size, calories, protein, carbs, fat, source, source_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100); // Get more to allow for deduplication

  if (error) {
    console.error("Error fetching recent foods:", error);
    return [];
  }

  if (!data) return [];

  // Deduplicate by food_name + brand, keeping count and most recent
  const foodMap = new Map<string, RecentFood>();

  for (const entry of data) {
    const key = `${entry.food_name}|${entry.brand || ""}`;

    if (foodMap.has(key)) {
      const existing = foodMap.get(key)!;
      existing.count += 1;
    } else {
      foodMap.set(key, {
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

  // Sort by count (most frequent first), then by recency
  const sortedFoods = Array.from(foodMap.values())
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return new Date(b.last_used).getTime() - new Date(a.last_used).getTime();
    })
    .slice(0, limit);

  return sortedFoods;
}
