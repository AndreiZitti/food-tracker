import { NextRequest, NextResponse } from "next/server";
import { getWeightLog, addWeightLogEntry } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId") || "demo-user";
  const days = parseInt(searchParams.get("days") || "30");

  try {
    const entries = await getWeightLog(userId, days);
    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching weight log:", error);
    return NextResponse.json(
      { error: "Failed to fetch weight log" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body.userId || "demo-user";

    const entry = await addWeightLogEntry({
      user_id: userId,
      date: body.date || new Date().toISOString().split("T")[0],
      weight: body.weight,
      unit: body.unit || "kg",
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error adding weight entry:", error);
    return NextResponse.json(
      { error: "Failed to add weight entry" },
      { status: 500 }
    );
  }
}
