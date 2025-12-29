import { NextRequest, NextResponse } from "next/server";
import { getFoodByBarcode } from "@/lib/openfoodfacts";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "Barcode parameter 'code' is required" },
      { status: 400 }
    );
  }

  try {
    const food = await getFoodByBarcode(code);
    if (!food) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(food);
  } catch (error) {
    console.error("Barcode lookup error:", error);
    return NextResponse.json(
      { error: "Failed to lookup barcode" },
      { status: 500 }
    );
  }
}
