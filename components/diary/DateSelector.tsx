"use client";

interface DateSelectorProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

export default function DateSelector({ date, onDateChange }: DateSelectorProps) {
  const formatDate = (d: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return "Today";
    } else if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const goToPreviousDay = () => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  const isToday = date.toDateString() === new Date().toDateString();

  return (
    <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-4 mb-4">
      <button
        onClick={goToPreviousDay}
        className="p-2 rounded-full hover:bg-slate-100 transition-colors"
        aria-label="Previous day"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5 text-slate-600"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
      </button>

      <span className="text-lg font-semibold text-slate-900">
        {formatDate(date)}
      </span>

      <button
        onClick={goToNextDay}
        disabled={isToday}
        className={`p-2 rounded-full transition-colors ${
          isToday
            ? "text-slate-300 cursor-not-allowed"
            : "hover:bg-slate-100 text-slate-600"
        }`}
        aria-label="Next day"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </button>
    </div>
  );
}
