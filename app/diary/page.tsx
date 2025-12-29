"use client";

import { useState } from "react";
import DateSelector from "@/components/diary/DateSelector";
import DailyTotals from "@/components/diary/DailyTotals";
import MealSection from "@/components/diary/MealSection";

const meals = ["breakfast", "lunch", "dinner", "snack"] as const;

export default function DiaryPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      <DateSelector date={selectedDate} onDateChange={setSelectedDate} />
      <DailyTotals date={selectedDate} />
      <div className="space-y-4 mt-4">
        {meals.map((meal) => (
          <MealSection key={meal} meal={meal} date={selectedDate} />
        ))}
      </div>
    </div>
  );
}
