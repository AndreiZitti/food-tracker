"use client";

import { useState, useEffect } from "react";
import GoalsForm from "@/components/ui/GoalsForm";

interface UserSettings {
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  displayMode: "simple" | "advanced";
}

const defaultSettings: UserSettings = {
  calorieGoal: 2000,
  proteinGoal: 150,
  carbsGoal: 200,
  fatGoal: 65,
  displayMode: "simple",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load settings from localStorage for now
    const savedSettings = localStorage.getItem("fittrack-settings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSave = (newSettings: UserSettings) => {
    setSettings(newSettings);
    localStorage.setItem("fittrack-settings", JSON.stringify(newSettings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleDisplayMode = () => {
    const newMode = settings.displayMode === "simple" ? "advanced" : "simple";
    handleSave({ ...settings, displayMode: newMode });
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>

      {/* Display Mode Toggle */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Display Mode</h2>
            <p className="text-sm text-slate-500">
              {settings.displayMode === "simple"
                ? "Showing calories only"
                : "Showing all macros"}
            </p>
          </div>
          <button
            onClick={toggleDisplayMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.displayMode === "advanced"
                ? "bg-teal-500"
                : "bg-slate-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.displayMode === "advanced"
                  ? "translate-x-6"
                  : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Goals Form */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Daily Goals</h2>
        <GoalsForm
          settings={settings}
          onSave={handleSave}
          showMacros={settings.displayMode === "advanced"}
        />
      </div>

      {/* Save Indicator */}
      {saved && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-teal-500 text-white px-4 py-2 rounded-lg shadow-lg">
          Settings saved!
        </div>
      )}

      {/* App Info */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">About</h2>
        <p className="text-sm text-slate-500">Z-Fit v1.0.0</p>
        <p className="text-sm text-slate-500">Calorie & Macro Tracker</p>
      </div>
    </div>
  );
}
