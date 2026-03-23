import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAuthenticatedUser } from "@/lib/auth";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface AiEstimateRequest {
  images: string[];
  context?: string;
  followUpAnswer?: string;
  previousEstimate?: object;
}

interface NutritionEstimate {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  confidence: "high" | "medium" | "low";
}

interface AiEstimateResponse {
  status: "estimated" | "need_info";
  imageType: "nutrition_label" | "menu" | "food_photo" | "delivery_app" | "text_description" | "multiple";
  estimate?: NutritionEstimate;
  followUpQuestion?: string;
  followUpOptions?: string[];
  reasoning?: string;
}

const ESTIMATE_PROMPT = `You are a nutrition estimation expert. You may receive food image(s), a text description, or both. Respond with JSON only (no markdown fences).

First, classify the input:
- "nutrition_label" — a nutrition facts panel (image)
- "menu" — a restaurant menu or menu board (image)
- "food_photo" — a photo of actual food/dish (image)
- "delivery_app" — a screenshot from a food delivery app (image)
- "text_description" — no image, just a text description of what was eaten
- "multiple" — if multiple image types or image + text description are provided together

Then, estimate the nutritional content:

IF "nutrition_label": Extract the exact values from the label.

FOR ALL OTHER TYPES (including text descriptions): Estimate the total nutritional values. Consider:
- Typical restaurant/homemade portion sizes
- Visible ingredients and cooking method (if photo provided)
- Sauce, oil, butter, cheese that may not be obvious
- Side dishes visible in the photo or mentioned in text
- Any specific details the user mentions (ingredients, preparation, restaurant)

ALWAYS return this JSON structure:
{
  "status": "estimated",
  "imageType": "nutrition_label" | "menu" | "food_photo" | "delivery_app" | "text_description" | "multiple",
  "estimate": {
    "name": "descriptive name of the food item",
    "calories": integer,
    "protein": grams as number,
    "carbs": grams as number,
    "fat": grams as number,
    "servingSize": "description of what this estimate covers (e.g. '1 whole schnitzel with fries', '1 slice')",
    "confidence": "high" | "medium" | "low"
  },
  "reasoning": "1-2 sentences explaining your estimate (e.g. 'Based on a typical 200g breaded pork schnitzel with 150g of fries')"
}

ONLY if the image is too unclear, unrecognizable, or not food-related, return:
{
  "status": "need_info",
  "imageType": "food_photo",
  "followUpQuestion": "specific question (e.g. 'I can see a bowl but can't tell what's in it. Is this soup, pasta, or something else?')",
  "followUpOptions": ["Soup", "Pasta", "Rice bowl", "Other"]
}

Rules:
- ALWAYS try to estimate. Only ask a follow-up if you truly cannot identify the food.
- For nutrition labels, confidence should be "high" and values should be exact.
- Be specific in the name (e.g. "Wiener Schnitzel with French Fries" not "Meat with sides")
- Round calories to nearest 10, macros to nearest 1g
- If multiple photos are provided, use ALL of them together for a better estimate (e.g. menu name + food photo = better estimate than either alone)
- Err on the side of slightly overestimating calories (people tend to underestimate)`;

const REFINE_PROMPT_SUFFIX = `

The user previously received this estimate and has provided additional information.
Previous estimate: {previousEstimate}
User's answer: {followUpAnswer}

Refine the estimate based on this new information. Return the same JSON structure with updated values.`;

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if (auth instanceof NextResponse) return auth;

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Gemini API key not configured" },
      { status: 500 }
    );
  }

  try {
    const body: AiEstimateRequest = await request.json();
    const { images, context, followUpAnswer, previousEstimate } = body;

    const hasImages = images && images.length > 0;
    const hasContext = context && context.trim().length > 0;

    if (!hasImages && !hasContext) {
      return NextResponse.json(
        { error: "Provide a photo or describe what you ate" },
        { status: 400 }
      );
    }

    if (images && images.length > 5) {
      return NextResponse.json(
        { error: "Maximum 5 images allowed" },
        { status: 400 }
      );
    }

    // Build prompt
    let prompt = ESTIMATE_PROMPT;

    if (context) {
      prompt += `\n\nAdditional context from user: "${context}"`;
    }

    if (followUpAnswer && previousEstimate) {
      prompt += REFINE_PROMPT_SUFFIX
        .replace("{previousEstimate}", JSON.stringify(previousEstimate))
        .replace("{followUpAnswer}", followUpAnswer);
    }

    // Build content parts: prompt + all images
    const parts: Array<string | { inlineData: { mimeType: string; data: string } }> = [prompt];

    for (const image of (images || [])) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      let mimeType = "image/jpeg";
      if (image.startsWith("data:image/png")) mimeType = "image/png";
      else if (image.startsWith("data:image/webp")) mimeType = "image/webp";

      parts.push({
        inlineData: { mimeType, data: base64Data },
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(parts);
    const response = await result.response;
    const text = response.text();

    // Parse response
    const cleanedText = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const analysis: AiEstimateResponse = JSON.parse(cleanedText);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("AI estimate error:", error);
    return NextResponse.json(
      { error: "Failed to analyze food image" },
      { status: 500 }
    );
  }
}
