# Smart Food Scanner Design

## Overview

Enhance the AI Label Scanner to handle multiple image types (nutrition labels, menus, food delivery screenshots) and automatically search the web for nutrition estimates when exact data isn't available.

## User Flow

```
User uploads/captures image
         ↓
Gemini analyzes image type
         ↓
┌────────────────────────────────────────────┐
│ Nutrition Label?          Menu/Food Photo? │
│ ↓                         ↓                │
│ Extract directly          Extract description
│ Show with "✓ Exact"       ↓                │
│                           User confirms/edits
│                           ↓                │
│                           Gemini + Google Search
│                           ↓                │
│                           Show 3 options   │
│                           + manual fallback│
│                           "≈ Estimated"    │
└────────────────────────────────────────────┘
```

## API Design

### Modified: `POST /api/food/scan-label`

Request unchanged:
```typescript
{ image: string } // base64
```

Response now has two shapes:

```typescript
// 1. Direct extraction (nutrition label)
{
  type: "exact",
  confidence: "high",
  food: FoodItem
}

// 2. Needs search (menu/food photo)
{
  type: "needs_search",
  detected: {
    description: string,    // "California Pizza 26cm"
    context?: string        // "Italian restaurant menu"
  }
}
```

### New: `POST /api/food/search-nutrition`

Request:
```typescript
{
  query: string,      // "California Pizza 26cm diameter"
  context?: string    // "Italian restaurant menu"
}
```

Response:
```typescript
{
  type: "estimated",
  confidence: "medium",
  options: [
    {
      name: string,           // "California Pizza (whole, 26cm)"
      calories: number,       // 1850
      protein: number,        // 72
      carbs: number,          // 198
      fat: number,            // 82
      servingSize: string,    // "1 pizza (450g)"
      servingWeight?: number, // 450
      source: "web_search",
      sourceUrl?: string
    }
    // ... 2 more options
  ]
}
```

## Gemini Prompts

### Prompt 1: Image Analysis

```
Analyze this food-related image and respond with JSON only.

Determine if this is:
1. A nutrition facts label → extract values directly
2. A menu, food delivery screenshot, or food photo → extract description

Response format:
{
  "imageType": "nutrition_label" | "menu" | "food_photo" | "delivery_app",
  "nutritionData": { ... },  // only if nutrition_label
  "foodDescription": {       // only if NOT nutrition_label
    "name": "item name",
    "size": "portion/size if visible",
    "restaurant": "restaurant name if visible",
    "context": "any helpful context"
  }
}
```

### Prompt 2: Web Search (with Google Search grounding)

```
Find nutrition information for: "{description}"

Search for calorie and macro content. Return 3 different estimates
from different sources if available (e.g., different restaurants,
homemade vs commercial).

Return JSON:
{
  "options": [
    {
      "name": "descriptive name with source",
      "calories": number,
      "protein": number (grams),
      "carbs": number (grams),
      "fat": number (grams),
      "servingSize": "description",
      "servingWeight": number (grams, estimated),
      "source": "where this data came from"
    }
  ]
}
```

## UI States

### State 1: Analyzing
```
🔄 Analyzing image...
[progress bar]
```

### State 2: Detection Complete (non-label)
```
📸 Detected from image:
┌──────────────────────────┐
│ California Pizza 26cm    │  ← editable
│ Italian restaurant menu  │
└──────────────────────────┘
[Search Nutrition]  [Cancel]
```

### State 3: Searching
```
🔍 Searching web for:
"California Pizza 26cm"
[progress bar]
```

### State 4: Results
```
≈ Estimated from web          ← amber badge

○ California Pizza (whole)
  1850 kcal • 72p 198c 82f

○ California Pizza (1 slice)
  230 kcal • 9p 25c 10f

○ Homemade California Pizza
  1650 kcal • 68p 180c 70f

○ None of these → manual

[Add Selected]
```

## Confidence Badges

| Badge | Color | Meaning |
|-------|-------|---------|
| ✓ Exact | Green | From nutrition label |
| ≈ Estimated | Amber | From web search |

## File Changes

### Modify
- `app/api/food/scan-label/route.ts` - dual-mode analysis
- `components/food/NutritionLabelScanner.tsx` - progressive UI, search flow
- `types/food.ts` - new types for scan/search results

### Create
- `app/api/food/search-nutrition/route.ts` - Gemini + grounding endpoint

### No Changes
- `FoodDetail.tsx` - works with any FoodItem
- Database schema - add "web_search" to source enum
- PWA config

## Technical Notes

- Gemini grounding requires `gemini-1.5-pro` or `gemini-1.5-flash`
- Current setup uses `gemini-2.0-flash` - verify grounding support
- Single API key (GEMINI_API_KEY) handles both analysis and search
