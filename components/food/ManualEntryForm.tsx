"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addFoodLogEntry } from "@/lib/localStorage";

interface FormData {
  name: string;
  brand: string;
  servingSize: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  meal: "breakfast" | "lunch" | "dinner" | "snack";
}

export default function ManualEntryForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    brand: "",
    servingSize: "100g",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    meal: "breakfast",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const today = new Date().toISOString().split("T")[0];

      addFoodLogEntry({
        date: today,
        meal: formData.meal,
        foodName: formData.name,
        brand: formData.brand || undefined,
        servingSize: formData.servingSize,
        servings: 1,
        calories: parseInt(formData.calories) || 0,
        protein: parseFloat(formData.protein) || 0,
        carbs: parseFloat(formData.carbs) || 0,
        fat: parseFloat(formData.fat) || 0,
        source: "manual",
      });

      // Success - redirect to diary
      router.push("/diary");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save food");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Meal Selector */}
      <div>
        <label
          htmlFor="meal"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Meal *
        </label>
        <select
          id="meal"
          name="meal"
          value={formData.meal}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
        >
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snack">Snack</option>
        </select>
      </div>

      {/* Food Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Food Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          placeholder="e.g., Chicken Breast"
        />
      </div>

      {/* Brand (Optional) */}
      <div>
        <label
          htmlFor="brand"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Brand (optional)
        </label>
        <input
          type="text"
          id="brand"
          name="brand"
          value={formData.brand}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          placeholder="e.g., Tyson"
        />
      </div>

      {/* Serving Size */}
      <div>
        <label
          htmlFor="servingSize"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Serving Size
        </label>
        <input
          type="text"
          id="servingSize"
          name="servingSize"
          value={formData.servingSize}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          placeholder="e.g., 100g, 1 cup, 1 piece"
        />
      </div>

      {/* Calories */}
      <div>
        <label
          htmlFor="calories"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Calories (kcal) *
        </label>
        <input
          type="number"
          id="calories"
          name="calories"
          value={formData.calories}
          onChange={handleChange}
          required
          min="0"
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          placeholder="0"
        />
      </div>

      {/* Macros Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label
            htmlFor="protein"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Protein (g)
          </label>
          <input
            type="number"
            id="protein"
            name="protein"
            value={formData.protein}
            onChange={handleChange}
            min="0"
            step="0.1"
            className="w-full px-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="0"
          />
        </div>
        <div>
          <label
            htmlFor="carbs"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Carbs (g)
          </label>
          <input
            type="number"
            id="carbs"
            name="carbs"
            value={formData.carbs}
            onChange={handleChange}
            min="0"
            step="0.1"
            className="w-full px-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="0"
          />
        </div>
        <div>
          <label
            htmlFor="fat"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Fat (g)
          </label>
          <input
            type="number"
            id="fat"
            name="fat"
            value={formData.fat}
            onChange={handleChange}
            min="0"
            step="0.1"
            className="w-full px-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="0"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={saving || !formData.name || !formData.calories}
        className="w-full py-3 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? "Saving..." : "Add Food"}
      </button>
    </form>
  );
}
