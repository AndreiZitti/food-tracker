"use client";

import UserMenu from "@/components/UserMenu";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border-color)]">
      <div className="max-w-lg mx-auto px-5 h-14 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-[var(--zfit-primary)]">Z-Fit</h1>
        <UserMenu />
      </div>
    </header>
  );
}
