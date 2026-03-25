"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/lib/auth/auth-context";

export default function UserMenu() {
  const { mode, user, loading, signOut } = useAuthContext();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setDropdownOpen(false);
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="w-8 h-8 bg-[var(--zfit-gray-200)] rounded-full animate-pulse" />
    );
  }

  // Guest mode: show generic person icon with dropdown linking to sign in
  if (mode === "guest" || !user) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-8 h-8 bg-[var(--zfit-gray-200)] hover:bg-[var(--zfit-gray-300)] rounded-full flex items-center justify-center text-[var(--zfit-gray-500)] transition-colors"
          title="Guest mode"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-warm border border-[var(--border-color)] py-2 z-50">
            <div className="px-4 py-2 border-b border-[var(--border-color)]">
              <p className="text-xs text-[var(--zfit-gray-500)]">Guest mode</p>
              <p className="text-sm text-[var(--zfit-gray-600)]">Data stored on device</p>
            </div>
            <Link
              href="/login"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-[var(--zfit-primary)] hover:bg-[var(--zfit-gray-100)] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign in to sync
            </Link>
            <Link
              href="/settings"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--zfit-gray-600)] hover:bg-[var(--zfit-gray-100)] transition-colors"
            >
              <svg className="w-4 h-4 text-[var(--zfit-gray-400)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Link>
          </div>
        )}
      </div>
    );
  }

  // Authenticated: show initials avatar with dropdown
  const initials = user.email
    ? user.email.substring(0, 2).toUpperCase()
    : "??";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="w-8 h-8 bg-[var(--zfit-primary)] hover:bg-[var(--zfit-primary-dark)] rounded-full flex items-center justify-center text-white text-xs font-semibold transition-colors"
        title={user.email || "User menu"}
      >
        {initials}
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-warm border border-[var(--border-color)] py-1 z-50">
          {/* User info */}
          <div className="px-4 py-3 border-b border-[var(--border-color)]">
            <p className="text-sm font-medium text-[var(--foreground)] truncate">
              {user.email}
            </p>
          </div>

          {/* Menu items */}
          <Link
            href="/settings"
            onClick={() => setDropdownOpen(false)}
            className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--zfit-gray-600)] hover:bg-[var(--zfit-gray-100)] transition-colors"
          >
            <svg
              className="w-4 h-4 text-[var(--zfit-gray-400)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Settings
          </Link>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-[var(--zfit-gray-600)] hover:bg-[var(--zfit-gray-100)] transition-colors"
          >
            <svg
              className="w-4 h-4 text-[var(--zfit-gray-400)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
