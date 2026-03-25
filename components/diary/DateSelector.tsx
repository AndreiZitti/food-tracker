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

  const formatFullDate = (d: Date) => {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
  const displayDate = formatDate(date);
  const showFullDate = displayDate === "Today" || displayDate === "Yesterday";

  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        {isToday && <p className="text-sm font-medium text-[var(--zfit-gray-500)]">Good day</p>}
        <div className="flex items-center gap-2">
          <h2 className="text-[22px] font-semibold text-[var(--foreground)] tracking-tight">
            {displayDate}
          </h2>
          {showFullDate && (
            <span className="text-sm text-[var(--zfit-gray-400)]">, {formatFullDate(date)}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={goToPreviousDay}
          className="btn-sm p-2 rounded-full hover:bg-[var(--zfit-gray-200)] transition-colors"
          aria-label="Previous day"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[var(--zfit-gray-500)]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <button
          onClick={goToNextDay}
          disabled={isToday}
          className={`btn-sm p-2 rounded-full transition-colors ${
            isToday ? "text-[var(--zfit-gray-300)] cursor-not-allowed" : "hover:bg-[var(--zfit-gray-200)] text-[var(--zfit-gray-500)]"
          }`}
          aria-label="Next day"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
