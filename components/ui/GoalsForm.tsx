"use client";

import { useState, useEffect } from "react";

interface UserSettings {
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  displayMode: "simple" | "advanced";
}

interface GoalsFormProps {
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
  showMacros: boolean;
}

export default function GoalsForm({ settings, onSave, showMacros }: GoalsFormProps) {
  const [form, setForm] = useState(settings);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleChange = (field: keyof UserSettings, value: string) => {
    const numValue = parseInt(value) || 0;
    setForm((prev) => ({ ...prev, [field]: numValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="goal-editor">
      {/* Calorie Goal */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Daily Calorie Goal
        </label>
        <input
          type="number"
          value={form.calorieGoal}
          onChange={(e) => handleChange("calorieGoal", e.target.value)}
          className="w-full px-4 py-2 bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Macro Goals (Advanced Mode Only) */}
      {showMacros && (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Protein Goal (g)
            </label>
            <input
              type="number"
              value={form.proteinGoal}
              onChange={(e) => handleChange("proteinGoal", e.target.value)}
              className="w-full px-4 py-2 bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Carbs Goal (g)
            </label>
            <input
              type="number"
              value={form.carbsGoal}
              onChange={(e) => handleChange("carbsGoal", e.target.value)}
              className="w-full px-4 py-2 bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Fat Goal (g)
            </label>
            <input
              type="number"
              value={form.fatGoal}
              onChange={(e) => handleChange("fatGoal", e.target.value)}
              className="w-full px-4 py-2 bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </>
      )}

      <button
        type="submit"
        className="w-full py-2 bg-teal-500 text-white font-medium rounded-lg hover:bg-teal-600 transition-colors"
      >
        Save Goals
      </button>
    </form>
  );
}
