"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import GoalsForm from "@/components/ui/GoalsForm";
import { useAuthContext } from "@/lib/auth/auth-context";
import {
  getLocalSettings,
  getDefaultSettings,
  saveLocalSettings,
} from "@/lib/db/settings-dal";
import { getDB } from "@/lib/db/local-db";
import { fullSync, getLastSyncTime } from "@/lib/db/sync-service";

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

function formatSyncTime(isoString: string): string {
  const syncDate = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - syncDate.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const { mode, user, loading: authLoading, signOut } = useAuthContext();

  // Load settings from IndexedDB
  useEffect(() => {
    async function loadSettings() {
      try {
        const local = await getLocalSettings();
        const s = local ?? getDefaultSettings();
        setSettings({
          calorieGoal: s.calorie_goal,
          proteinGoal: s.protein_goal,
          carbsGoal: s.carbs_goal,
          fatGoal: s.fat_goal,
          displayMode: s.display_mode,
        });
      } catch {
        // Use defaults on error
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadSettings();
    }
  }, [authLoading]);

  // Load last sync time for authenticated users
  useEffect(() => {
    if (mode === "authenticated") {
      getLastSyncTime().then(setLastSynced).catch(() => {});
    }
  }, [mode]);

  const handleSave = async (newSettings: UserSettings) => {
    setSettings(newSettings);

    // Save to IndexedDB first (local-first)
    try {
      await saveLocalSettings({
        calorie_goal: newSettings.calorieGoal,
        protein_goal: newSettings.proteinGoal,
        carbs_goal: newSettings.carbsGoal,
        fat_goal: newSettings.fatGoal,
        display_mode: newSettings.displayMode,
      });
    } catch {
      // IndexedDB save failed, continue with in-memory state
    }

    // If authenticated, also push to API in background
    if (mode === "authenticated") {
      fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      }).catch(() => {
        // Background sync will catch it later
      });
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleDisplayMode = () => {
    const newMode = settings.displayMode === "simple" ? "advanced" : "simple";
    handleSave({ ...settings, displayMode: newMode });
  };

  const handleSyncNow = useCallback(async () => {
    setSyncing(true);
    try {
      const result = await fullSync();
      setLastSynced(result.lastSynced);
    } catch {
      // Sync failed silently
    } finally {
      setSyncing(false);
    }
  }, []);

  const handleExportData = useCallback(async () => {
    try {
      const dbPromise = getDB();
      if (!dbPromise) return;
      const db = await dbPromise;

      const [foodLog, settingsData, weightLog] = await Promise.all([
        db.getAll("food_log"),
        db.getAll("settings"),
        db.getAll("weight_log"),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        app: "Z-Fit",
        version: "1.0.0",
        data: {
          food_log: foodLog,
          settings: settingsData,
          weight_log: weightLog,
        },
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zfit-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Export failed
    }
  }, []);

  return (
    <div className="max-w-lg mx-auto px-5 py-4">
      <h1 className="text-[26px] font-semibold text-[var(--foreground)] tracking-tight mb-5">Settings</h1>

      {/* Account Section */}
      <div className="bg-white rounded-2xl shadow-warm p-5 mb-4">
        <h2 className="text-base font-semibold text-[var(--foreground)] mb-3">Account</h2>
        {authLoading ? (
          <div className="animate-pulse h-12 bg-[var(--zfit-gray-200)] rounded-xl" />
        ) : mode === "authenticated" && user ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--zfit-gray-500)]">Signed in as</p>
                <p className="font-medium text-[var(--foreground)]">{user.email}</p>
              </div>
              <div className="w-10 h-10 bg-[var(--zfit-primary)] rounded-full flex items-center justify-center text-white font-semibold">
                {user.email?.substring(0, 2).toUpperCase()}
              </div>
            </div>

            {/* Sync status */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[var(--zfit-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-sm text-[var(--zfit-gray-500)]">
                  {lastSynced ? `Last synced: ${formatSyncTime(lastSynced)}` : "Not synced yet"}
                </span>
              </div>
              <button
                onClick={handleSyncNow}
                disabled={syncing}
                className="px-3 py-1.5 text-sm font-medium text-[var(--zfit-primary)] bg-[var(--zfit-primary)]/10 rounded-lg hover:bg-[var(--zfit-primary)]/20 transition-colors disabled:opacity-50"
              >
                {syncing ? "Syncing..." : "Sync now"}
              </button>
            </div>

            {/* Sign out */}
            <div className="pt-2 border-t border-[var(--border-color)]">
              <button
                onClick={async () => {
                  await signOut();
                  window.location.href = "/login";
                }}
                className="flex items-center gap-2 text-sm text-[var(--zfit-gray-500)] hover:text-red-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[var(--zfit-gray-500)]">
              You&apos;re using Z-Fit as a guest. Your data is stored on this device.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--zfit-primary)] text-white rounded-xl hover:bg-[var(--zfit-primary-dark)] transition-colors text-sm font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                Sign in to sync
              </Link>
              <button
                onClick={handleExportData}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--zfit-gray-100)] text-[var(--zfit-gray-600)] rounded-xl hover:bg-[var(--zfit-gray-200)] transition-colors text-sm font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Export data
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Display Mode Toggle */}
      <div className="bg-white rounded-2xl shadow-warm p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--foreground)]">Display Mode</h2>
            <p className="text-sm text-[var(--zfit-gray-500)]">
              {settings.displayMode === "simple"
                ? "Showing calories only"
                : "Showing all macros"}
            </p>
          </div>
          <button
            onClick={toggleDisplayMode}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              settings.displayMode === "advanced"
                ? "bg-[var(--zfit-primary)]"
                : "bg-[var(--zfit-gray-300)]"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                settings.displayMode === "advanced"
                  ? "translate-x-6"
                  : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Goals Form */}
      <div className="bg-white rounded-2xl shadow-warm p-5 mb-4">
        <h2 className="text-base font-semibold text-[var(--foreground)] mb-4">Daily Goals</h2>
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-10 bg-[var(--zfit-gray-200)] rounded-xl" />
            <div className="h-10 bg-[var(--zfit-gray-200)] rounded-xl" />
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
        <div className="fixed bottom-28 left-1/2 transform -translate-x-1/2 bg-[var(--zfit-primary)] text-white px-4 py-2 rounded-xl shadow-warm-lg text-sm font-medium">
          Settings saved!
        </div>
      )}

      {/* App Info */}
      <div className="bg-white rounded-2xl shadow-warm p-5">
        <h2 className="text-base font-semibold text-[var(--foreground)] mb-2">About</h2>
        <p className="text-sm text-[var(--zfit-gray-500)]">Z-Fit v1.0.0</p>
        <p className="text-sm text-[var(--zfit-gray-500)]">Calorie & Macro Tracker</p>
        <a
          href="https://zitti.ro"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[var(--zfit-primary)] hover:text-[var(--zfit-primary-dark)] mt-2 inline-block"
        >
          zitti.ro
        </a>
      </div>
    </div>
  );
}
