"use client";

import { useState, useEffect, useRef } from "react";

export default function BarcodeScanner() {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
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

  const startScanning = async () => {
    setError(null);
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
        (decodedText) => {
          setResult(decodedText);
          html5QrCode.stop().catch(() => {});
          setScanning(false);
          // TODO: Look up product by barcode
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

  return (
    <div>
      {/* Scanner Container */}
      <div
        id="barcode-scanner"
        ref={scannerRef}
        className={`w-full aspect-[4/3] bg-gray-900 rounded-xl overflow-hidden mb-4 ${
          scanning ? "" : "hidden"
        }`}
      />

      {/* Controls */}
      {!scanning ? (
        <div className="text-center">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm">
              Barcode found: {result}
            </div>
          )}

          <button
            onClick={startScanning}
            className="w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
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
            Start Scanning
          </button>

          <p className="mt-3 text-sm text-gray-500">
            Point your camera at a barcode to scan
          </p>
        </div>
      ) : (
        <button
          onClick={stopScanning}
          className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
        >
          Stop Scanning
        </button>
      )}
    </div>
  );
}
