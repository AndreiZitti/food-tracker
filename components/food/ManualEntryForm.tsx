"use client";

import { useState } from "react";

interface FormData {
  name: string;
  brand: string;
  servingSize: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

export default function ManualEntryForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    brand: "",
    servingSize: "100g",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // TODO: Save to database and add to diary
      console.log("Saving food:", formData);
      // Reset form after saving
      setFormData({
        name: "",
        brand: "",
        servingSize: "100g",
        calories: "",
        protein: "",
        carbs: "",
        fat: "",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Food Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-1"
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
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="e.g., Chicken Breast"
        />
      </div>

      {/* Brand (Optional) */}
      <div>
        <label
          htmlFor="brand"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Brand (optional)
        </label>
        <input
          type="text"
          id="brand"
          name="brand"
          value={formData.brand}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="e.g., Tyson"
        />
      </div>

      {/* Serving Size */}
      <div>
        <label
          htmlFor="servingSize"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Serving Size
        </label>
        <input
          type="text"
          id="servingSize"
          name="servingSize"
          value={formData.servingSize}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="e.g., 100g, 1 cup, 1 piece"
        />
      </div>

      {/* Calories */}
      <div>
        <label
          htmlFor="calories"
          className="block text-sm font-medium text-gray-700 mb-1"
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
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="0"
        />
      </div>

      {/* Macros Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label
            htmlFor="protein"
            className="block text-sm font-medium text-gray-700 mb-1"
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
            className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="0"
          />
        </div>
        <div>
          <label
            htmlFor="carbs"
            className="block text-sm font-medium text-gray-700 mb-1"
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
            className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="0"
          />
        </div>
        <div>
          <label
            htmlFor="fat"
            className="block text-sm font-medium text-gray-700 mb-1"
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
            className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="0"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={saving || !formData.name || !formData.calories}
        className="w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? "Saving..." : "Add Food"}
      </button>
    </form>
  );
}
