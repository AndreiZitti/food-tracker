"use client";

import { useState, useEffect, useRef } from "react";
import { type FoodItem } from "@/types/food";
import FoodDetail from "./FoodDetail";

export default function BarcodeScanner() {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [foundFood, setFoundFood] = useState<FoodItem | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<unknown>(null);

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (html5QrCodeRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (html5QrCodeRef.current as any).stop?.().catch(() => {});
      }
    };
  }, []);

  const lookupBarcode = async (barcode: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/food/barcode?code=${encodeURIComponent(barcode)}`
      );

      if (response.ok) {
        const food: FoodItem = await response.json();
        setFoundFood(food);
      } else if (response.status === 404) {
        setError(
          `Product not found for barcode: ${barcode}. Try searching manually.`
        );
      } else {
        setError("Failed to look up barcode. Please try again.");
      }
    } catch (err) {
      console.error("Barcode lookup error:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const startScanning = async () => {
    setError(null);
    setScannedCode(null);
    setFoundFood(null);
    setScanning(true);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const html5QrCode = new Html5Qrcode("barcode-scanner");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
        },
        async (decodedText) => {
          setScannedCode(decodedText);
          await html5QrCode.stop().catch(() => {});
          setScanning(false);
          // Look up the product
          await lookupBarcode(decodedText);
        },
        () => {
          // Ignore scanning errors (no QR code found)
        }
      );
    } catch (err) {
      setError("Failed to start camera. Please check permissions.");
      setScanning(false);
      console.error(err);
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (html5QrCodeRef.current as any).stop();
      } catch {
        // Ignore stop errors
      }
    }
    setScanning(false);
  };

  const resetScanner = () => {
    setError(null);
    setScannedCode(null);
    setFoundFood(null);
  };

  // Show food detail view when product is found
  if (foundFood) {
    return <FoodDetail food={foundFood} onBack={resetScanner} />;
  }

  return (
    <div>
      {/* Scanner Container */}
      <div
        id="barcode-scanner"
        ref={scannerRef}
        className={`w-full aspect-[4/3] bg-slate-900 rounded-xl overflow-hidden mb-4 ${
          scanning ? "" : "hidden"
        }`}
      />

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <svg
            className="animate-spin h-8 w-8 mx-auto mb-3 text-teal-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-slate-600">Looking up barcode: {scannedCode}</p>
        </div>
      )}

      {/* Controls */}
      {!scanning && !loading && (
        <div className="text-center">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 text-rose-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {scannedCode && !error && (
            <div className="mb-4 p-3 bg-teal-50 text-teal-600 rounded-lg text-sm">
              Barcode scanned: {scannedCode}
            </div>
          )}

          <button
            onClick={startScanning}
            className="w-full py-3 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 transition-colors flex items-center justify-center gap-2"
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
                d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
              />
            </svg>
            {scannedCode ? "Scan Another" : "Start Scanning"}
          </button>

          <p className="mt-3 text-sm text-slate-500">
            Point your camera at a barcode to scan
          </p>

          {/* Manual barcode entry */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-500 mb-3">
              Or enter barcode manually:
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const input = e.currentTarget.elements.namedItem(
                  "barcode"
                ) as HTMLInputElement;
                const code = input.value.trim();
                if (code) {
                  setScannedCode(code);
                  await lookupBarcode(code);
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                name="barcode"
                placeholder="Enter barcode number"
                pattern="[0-9]{8,14}"
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
              >
                Look up
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Scanning controls */}
      {scanning && (
        <button
          onClick={stopScanning}
          className="w-full py-3 bg-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-300 transition-colors"
        >
          Stop Scanning
        </button>
      )}
    </div>
  );
}
