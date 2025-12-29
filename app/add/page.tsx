"use client";

import { useState } from "react";
import FoodSearch from "@/components/food/FoodSearch";
import BarcodeScanner from "@/components/food/BarcodeScanner";
import ManualEntryForm from "@/components/food/ManualEntryForm";

type Tab = "search" | "scan" | "manual";

export default function AddFoodPage() {
  const [activeTab, setActiveTab] = useState<Tab>("search");

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Add Food</h1>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setActiveTab("search")}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "search"
              ? "border-green-500 text-green-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Search
        </button>
        <button
          onClick={() => setActiveTab("scan")}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "scan"
              ? "border-green-500 text-green-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Scan Barcode
        </button>
        <button
          onClick={() => setActiveTab("manual")}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "manual"
              ? "border-green-500 text-green-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Manual
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "search" && <FoodSearch />}
      {activeTab === "scan" && <BarcodeScanner />}
      {activeTab === "manual" && <ManualEntryForm />}
    </div>
  );
}
