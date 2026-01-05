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
    <div className="max-w-lg mx-auto px-4 py-4">
      <DateSelector date={selectedDate} onDateChange={setSelectedDate} />
      <DailyTotals totals={totals} loading={loading} />

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4 mt-4">
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
