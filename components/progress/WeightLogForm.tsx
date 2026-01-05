"use client";

import { useState } from "react";
import { useWeightLog } from "@/lib/hooks/useProgressData";

interface WeightLogFormProps {
  onSaved?: () => void;
}

export default function WeightLogForm({ onSaved }: WeightLogFormProps) {
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");
  const [saved, setSaved] = useState(false);
  const { logWeight, saving, error } = useWeightLog();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;

    const success = await logWeight(parseFloat(weight), unit);

    if (success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setWeight("");
      onSaved?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="weight-log-form">
      <div className="flex gap-2 mb-3">
        <input
          type="number"
          step="0.1"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="Enter weight"
          disabled={saving}
          className="flex-1 px-4 py-2 bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
        />
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as "kg" | "lbs")}
          disabled={saving}
          className="px-3 py-2 bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
        >
          <option value="kg">kg</option>
          <option value="lbs">lbs</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={!weight || saving}
        className="w-full py-2 bg-teal-500 text-white font-medium rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? "Saving..." : "Log Weight"}
      </button>

      {error && (
        <div className="mt-3 p-2 bg-rose-50 text-rose-600 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      {saved && (
        <div className="mt-3 p-2 bg-teal-50 text-teal-600 rounded-lg text-sm text-center">
          Weight logged successfully!
        </div>
      )}
    </form>
  );
}
