import { NextRequest, NextResponse } from "next/server";
import { getRecentFoods } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId") || "demo-user"; // TODO: Get from auth
  const limit = parseInt(searchParams.get("limit") || "20");

  try {
    const recentFoods = await getRecentFoods(userId, limit);
    return NextResponse.json(recentFoods);
  } catch (error) {
    console.error("Error fetching recent foods:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent foods" },
      { status: 500 }
    );
  }
}
