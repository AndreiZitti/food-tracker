import { NextRequest, NextResponse } from "next/server";
import { getUserSettings, updateUserSettings } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (auth instanceof NextResponse) return auth;

  try {
    const settings = await getUserSettings(auth.user.id);
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
  const auth = await getAuthenticatedUser();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();

    const success = await updateUserSettings(auth.user.id, {
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
