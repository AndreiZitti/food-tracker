"use client";

import { useState } from "react";
import DateSelector from "@/components/diary/DateSelector";
import DailyTotals from "@/components/diary/DailyTotals";
import MealSection from "@/components/diary/MealSection";
import { useFoodLog } from "@/lib/hooks/useFoodLog";

const meals = ["breakfast", "lunch", "dinner", "snack"] as const;

export default function DiaryPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { byMeal, totals, loading, error, deleteEntry } =
    useFoodLog(selectedDate);

  return (
    <div className="max-w-lg mx-auto px-5 py-4">
      <DateSelector date={selectedDate} onDateChange={setSelectedDate} />
      <DailyTotals totals={totals} loading={loading} />

      {error && (
        <div className="text-center py-4 text-sm text-[var(--zfit-gray-400)]">
          Could not load food log. Please try again.
        </div>
      )}

      <div className="space-y-3 mt-5">
        {meals.map((meal) => (
          <MealSection
            key={meal}
            meal={meal}
            date={selectedDate}
            foods={byMeal[meal]}
            loading={loading}
            onDelete={deleteEntry}
          />
        ))}
      </div>
    </div>
  );
}
