"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import GoalsForm from "@/components/ui/GoalsForm";
import { useAuth } from "@/hooks/useAuth";

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
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setSettings({
          calorieGoal: data.calorie_goal ?? 2000,
          proteinGoal: data.protein_goal ?? 150,
          carbsGoal: data.carbs_goal ?? 200,
          fatGoal: data.fat_goal ?? 65,
          displayMode: data.display_mode ?? "simple",
        });
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading && user) {
      loadSettings();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, user]);

  const handleSave = async (newSettings: UserSettings) => {
    setSettings(newSettings);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      if (!res.ok) throw new Error("Failed to save");
    } catch {
      // Silently fail - settings are at least updated in state
    }
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

      {/* Account Status */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Account</h2>
        {authLoading ? (
          <div className="animate-pulse h-12 bg-slate-100 rounded-lg" />
        ) : user ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Signed in as</p>
              <p className="font-medium text-slate-800">{user.email}</p>
              <p className="text-xs text-teal-600 mt-1">All features enabled</p>
            </div>
            <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
              {user.email?.substring(0, 2).toUpperCase()}
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-slate-600 mb-3">
              Sign in to save your data and sync across devices.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
              Sign in
            </Link>
          </div>
        )}
      </div>

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
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-10 bg-slate-100 rounded" />
            <div className="h-10 bg-slate-100 rounded" />
          </div>
        ) : (
          <GoalsForm
            settings={settings}
            onSave={handleSave}
            showMacros={settings.displayMode === "advanced"}
          />
        )}
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
        <a
          href="https://zitti.ro"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-teal-600 hover:text-teal-700 mt-2 inline-block"
        >
          zitti.ro
        </a>
      </div>
    </div>
  );
}
