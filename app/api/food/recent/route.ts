import { NextRequest, NextResponse } from "next/server";
import { getRecentFoods } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if (auth instanceof NextResponse) return auth;

  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get("limit") || "20");

  try {
    const recentFoods = await getRecentFoods(auth.user.id, limit);
    return NextResponse.json(recentFoods);
  } catch (error) {
    console.error("Error fetching recent foods:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent foods" },
      { status: 500 }
    );
  }
}
