"use client";

import { useState } from "react";
import RecentFoods from "@/components/food/RecentFoods";
import FoodSearch from "@/components/food/FoodSearch";
import BarcodeScanner from "@/components/food/BarcodeScanner";
import NutritionLabelScanner from "@/components/food/NutritionLabelScanner";
import ManualEntryForm from "@/components/food/ManualEntryForm";

type Tab = "recent" | "search" | "scan" | "label" | "manual";

export default function AddFoodPage() {
  const [activeTab, setActiveTab] = useState<Tab>("recent");

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Add Food</h1>

      {/* Tab Navigation - scrollable on mobile */}
      <div className="flex border-b border-slate-200 mb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab("recent")}
          className={`flex-shrink-0 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "recent"
              ? "border-teal-500 text-teal-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Recent
        </button>
        <button
          onClick={() => setActiveTab("search")}
          className={`flex-shrink-0 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "search"
              ? "border-teal-500 text-teal-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Search
        </button>
        <button
          onClick={() => setActiveTab("scan")}
          className={`flex-shrink-0 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "scan"
              ? "border-teal-500 text-teal-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Barcode
        </button>
        <button
          onClick={() => setActiveTab("label")}
          className={`flex-shrink-0 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "label"
              ? "border-teal-500 text-teal-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          AI Label
        </button>
        <button
          onClick={() => setActiveTab("manual")}
          className={`flex-shrink-0 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "manual"
              ? "border-teal-500 text-teal-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Manual
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "recent" && <RecentFoods />}
      {activeTab === "search" && <FoodSearch />}
      {activeTab === "scan" && <BarcodeScanner />}
      {activeTab === "label" && <NutritionLabelScanner />}
      {activeTab === "manual" && <ManualEntryForm />}
    </div>
  );
}
