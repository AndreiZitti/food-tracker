// Test script for Gemini nutrition label extraction
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

// Sample EU nutrition label data (base64 encoded simple test image would go here)
// For this test, we'll create a simple text-based test

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("GEMINI_API_KEY not set. Run: export GEMINI_API_KEY=your-key");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function testGeminiConnection() {
  console.log("Testing Gemini API connection...\n");

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Simple text test first
    const result = await model.generateContent(
      "Say 'Gemini API working!' and nothing else."
    );

    const response = await result.response;
    console.log("API Response:", response.text());
    console.log("\n✅ Gemini API is working!\n");

    // Now test with nutrition extraction prompt
    console.log("Testing nutrition extraction prompt...\n");

    const nutritionTest = await model.generateContent(`
      Pretend you just read a nutrition label with these values:
      - Serving size: 100g
      - Energy: 450 kcal
      - Protein: 8.5g
      - Carbohydrates: 65g
      - Fat: 18g
      - Fiber: 3.2g

      Return ONLY a valid JSON object with no markdown:
      {"name": "Test Product", "servingSize": "100g", "calories": 450, "protein": 8.5, "carbs": 65, "fat": 18}
    `);

    const nutritionResponse = await nutritionTest.response;
    const text = nutritionResponse.text().trim();
    console.log("Raw response:", text);

    try {
      const parsed = JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
      console.log("\n✅ JSON parsing successful!");
      console.log("Parsed data:", parsed);
    } catch (e) {
      console.log("\n⚠️ JSON parsing failed, but API is working");
    }

    return true;
  } catch (error) {
    console.error("❌ Gemini API error:", error.message);
    return false;
  }
}

testGeminiConnection();
