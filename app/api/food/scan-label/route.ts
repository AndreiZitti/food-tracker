import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface ScannedNutrition {
  name?: string;
  brand?: string;
  servingSize: string;
  servingQuantity?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  caloriesPer100g?: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatPer100g?: number;
}

const EXTRACTION_PROMPT = `You are a nutrition label reader. Extract nutritional information from this food package label image.

Return ONLY a valid JSON object with these fields (no markdown, no explanation):
{
  "name": "product name if visible",
  "brand": "brand name if visible",
  "servingSize": "serving size as shown (e.g. '100g', '1 cup (240ml)', '30g')",
  "servingQuantity": numeric serving size in grams if determinable,
  "calories": calories per serving as integer,
  "protein": protein in grams per serving as number,
  "carbs": carbohydrates in grams per serving as number,
  "fat": fat in grams per serving as number,
  "fiber": fiber in grams if shown,
  "sugar": sugar in grams if shown,
  "sodium": sodium in mg if shown,
  "caloriesPer100g": calories per 100g if shown separately,
  "proteinPer100g": protein per 100g if shown,
  "carbsPer100g": carbs per 100g if shown,
  "fatPer100g": fat per 100g if shown
}

Important:
- EU labels often show both "per 100g" and "per serving" - extract both if available
- If only per 100g is shown, use those values for the main fields and set servingSize to "100g"
- Use 0 for any missing required numeric fields (calories, protein, carbs, fat)
- Return null for optional fields if not visible
- Numbers only, no units in numeric fields
- If the image is not a nutrition label or is unreadable, return: {"error": "Could not read nutrition label"}`;

export async function POST(request: NextRequest) {
  try {
    // Check for API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    // Get image data from request
    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Remove data URL prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    // Determine mime type
    let mimeType = "image/jpeg";
    if (image.startsWith("data:image/png")) {
      mimeType = "image/png";
    } else if (image.startsWith("data:image/webp")) {
      mimeType = "image/webp";
    }

    // Call Gemini Vision
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent([
      EXTRACTION_PROMPT,
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    let nutrition: ScannedNutrition;
    try {
      // Clean up response - remove markdown code blocks if present
      const cleanedText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const parsed = JSON.parse(cleanedText);

      // Check for error response
      if (parsed.error) {
        return NextResponse.json(
          { error: parsed.error },
          { status: 422 }
        );
      }

      nutrition = parsed;
    } catch {
      console.error("Failed to parse Gemini response:", text);
      return NextResponse.json(
        { error: "Failed to parse nutrition data from image" },
        { status: 422 }
      );
    }

    // Validate required fields
    if (
      nutrition.calories === undefined ||
      nutrition.protein === undefined ||
      nutrition.carbs === undefined ||
      nutrition.fat === undefined
    ) {
      return NextResponse.json(
        { error: "Could not extract required nutrition values" },
        { status: 422 }
      );
    }

    // Build response in FoodItem format
    const foodItem = {
      id: `label-${Date.now()}`,
      source: "label_scan" as const,
      name: nutrition.name || "Scanned Food",
      brand: nutrition.brand,
      servingSize: nutrition.servingSize || "100g",
      servingQuantity: nutrition.servingQuantity,
      calories: Math.round(nutrition.calories),
      protein: Math.round(nutrition.protein * 10) / 10,
      carbs: Math.round(nutrition.carbs * 10) / 10,
      fat: Math.round(nutrition.fat * 10) / 10,
      fiber: nutrition.fiber,
      sugar: nutrition.sugar,
      sodium: nutrition.sodium,
      caloriesPer100g: nutrition.caloriesPer100g,
      proteinPer100g: nutrition.proteinPer100g,
      carbsPer100g: nutrition.carbsPer100g,
      fatPer100g: nutrition.fatPer100g,
    };

    return NextResponse.json(foodItem);

  } catch (error) {
    console.error("Label scan error:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}
