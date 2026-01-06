"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import GoalsForm from "@/components/ui/GoalsForm";
import { getSettings, saveSettings, exportAllData, clearAllData, type StoredSettings } from "@/lib/localStorage";
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
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // Load settings from localStorage
    const storedSettings = getSettings();
    setSettings({
      calorieGoal: storedSettings.calorieGoal,
      proteinGoal: storedSettings.proteinGoal,
      carbsGoal: storedSettings.carbsGoal,
      fatGoal: storedSettings.fatGoal,
      displayMode: storedSettings.displayMode,
    });
  }, []);

  const handleSave = (newSettings: UserSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleDisplayMode = () => {
    const newMode = settings.displayMode === "simple" ? "advanced" : "simple";
    handleSave({ ...settings, displayMode: newMode });
  };

  const handleExportData = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zfit-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    clearAllData();
    setSettings(defaultSettings);
    setShowClearConfirm(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>

      {/* Local Storage Info Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-amber-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-amber-800 mb-1">Local Storage Only</h3>
            <p className="text-sm text-amber-700">
              All your data is saved locally on this device. If you clear your browser data or switch devices, your information will be lost.
            </p>
            <p className="text-sm text-amber-700 mt-2">
              <strong>Want cloud sync?</strong> Contact me at{" "}
              <a
                href="https://zitti.ro"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-800 underline hover:text-amber-900"
              >
                zitti.ro
              </a>{" "}
              for account access.
            </p>
          </div>
        </div>
      </div>

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
              <p className="text-xs text-teal-600 mt-1">AI features enabled</p>
            </div>
            <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
              {user.email?.substring(0, 2).toUpperCase()}
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-slate-600 mb-3">
              Sign in to unlock AI features like nutrition label scanning.
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
        <GoalsForm
          settings={settings}
          onSave={handleSave}
          showMacros={settings.displayMode === "advanced"}
        />
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Data Management</h2>
        <div className="space-y-3">
          <button
            onClick={handleExportData}
            className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 text-slate-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              <span className="font-medium text-slate-700">Export Data</span>
            </div>
            <span className="text-sm text-slate-500">Download JSON</span>
          </button>

          {!showClearConfirm ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-full flex items-center justify-between p-3 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-rose-600"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
                <span className="font-medium text-rose-700">Clear All Data</span>
              </div>
              <span className="text-sm text-rose-500">Delete everything</span>
            </button>
          ) : (
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
              <p className="text-sm text-rose-700 mb-3">
                Are you sure? This will delete all your food logs, weight data, and settings.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleClearData}
                  className="flex-1 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium"
                >
                  Yes, delete all
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
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
