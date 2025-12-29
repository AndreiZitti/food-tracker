import { NextRequest, NextResponse } from "next/server";
import { getUserSettings, updateUserSettings } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId") || "demo-user";

  try {
    const settings = await getUserSettings(userId);
    return NextResponse.json(settings || {
      calorie_goal: 2000,
      protein_goal: 150,
      carbs_goal: 200,
      fat_goal: 65,
      display_mode: "simple",
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body.userId || "demo-user";

    const success = await updateUserSettings(userId, {
      calorie_goal: body.calorieGoal,
      protein_goal: body.proteinGoal,
      carbs_goal: body.carbsGoal,
      fat_goal: body.fatGoal,
      display_mode: body.displayMode,
    });

    if (!success) {
      return NextResponse.json(
        { error: "Failed to update settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
