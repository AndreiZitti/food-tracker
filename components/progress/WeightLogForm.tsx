"use client";

import { useState } from "react";

export default function WeightLogForm() {
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;

    // Here we would save to the database
    console.log("Logging weight:", { weight: parseFloat(weight), unit });

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setWeight("");
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
          className="flex-1 px-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as "kg" | "lbs")}
          className="px-3 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="kg">kg</option>
          <option value="lbs">lbs</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={!weight}
        className="w-full py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Log Weight
      </button>

      {saved && (
        <div className="mt-3 p-2 bg-green-50 text-green-600 rounded-lg text-sm text-center">
          Weight logged successfully!
        </div>
      )}
    </form>
  );
}
