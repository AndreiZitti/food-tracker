import { NextRequest, NextResponse } from "next/server";
import { getFoodLog, addFoodLogEntry, deleteFoodLogEntry } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if (auth instanceof NextResponse) return auth;

  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json(
      { error: "Date parameter is required" },
      { status: 400 }
    );
  }

  try {
    const entries = await getFoodLog(auth.user.id, date);
    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching food log:", error);
    return NextResponse.json(
      { error: "Failed to fetch food log" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();

    const entry = await addFoodLogEntry({
      user_id: auth.user.id,
      date: body.date,
      meal: body.meal,
      food_name: body.foodName,
      brand: body.brand,
      serving_size: body.servingSize,
      servings: body.servings || 1,
      calories: body.calories,
      protein: body.protein || 0,
      carbs: body.carbs || 0,
      fat: body.fat || 0,
      source: body.source || "manual",
      source_id: body.sourceId,
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error adding food log entry:", error);
    return NextResponse.json(
      { error: "Failed to add food log entry" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if (auth instanceof NextResponse) return auth;

  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Entry ID is required" },
      { status: 400 }
    );
  }

  try {
    const success = await deleteFoodLogEntry(id);
    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete entry" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting food log entry:", error);
    return NextResponse.json(
      { error: "Failed to delete entry" },
      { status: 500 }
    );
  }
}
