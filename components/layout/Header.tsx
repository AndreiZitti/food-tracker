"use client";

import UserMenu from "@/components/UserMenu";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-teal-600">Z-Fit</h1>
        <UserMenu />
      </div>
    </header>
  );
}
