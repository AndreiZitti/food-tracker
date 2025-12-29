# FitTrack - Calorie & Macro Tracker

## Project Overview
A Progressive Web App (PWA) calorie and macro tracker similar to MyFitnessPal. Simple, fast, mobile-friendly.

## Tech Stack
- **Frontend**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **Database**: Supabase (existing instance at zitti.ro)
- **Food API**: Open Food Facts API (free, includes barcode)
- **PWA**: next-pwa package
- **Charts**: Recharts (for progress visualization)

## Domain
Will be deployed at: fittracker.zitti.ro

## Core Features (MVP)

### 1. Daily Food Diary
- View by date (today default, can navigate to past days)
- Meals: Breakfast, Lunch, Dinner, Snacks
- Add food to any meal
- Daily totals at top

### 2. Food Search & Logging
- Search Open Food Facts database
- Barcode scanner using device camera
- Manual entry for custom foods
- Adjust serving size/portions
- Save custom foods for reuse

### 3. Macro Tracking (Two Modes)
**Simple Mode (default):**
- Shows only calories
- Clean, uncluttered UI

**Advanced Mode (toggle in settings):**
- Calories, Protein, Carbs, Fat
- Daily goals for each macro
- Progress bars

### 4. Goals & Progress
- Set daily calorie goal
- Set macro goals (advanced mode)
- Weight logging
- Simple progress chart (last 7/30 days)

### 5. PWA Features
- Installable on home screen
- Works offline (cached recent data)
- Full screen, no browser UI
- Fast loading

## Database Schema (Supabase)
```sql
-- User goals and settings (extends existing auth)
create table user_settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  calorie_goal int default 2000,
  protein_goal int default 150,
  carbs_goal int default 200,
  fat_goal int default 65,
  display_mode text default 'simple', -- 'simple' or 'advanced'
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Custom foods created by user
create table custom_foods (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  name text not null,
  brand text,
  serving_size text,
  calories int,
  protein numeric(5,1),
  carbs numeric(5,1),
  fat numeric(5,1),
  barcode text,
  created_at timestamp default now()
);

-- Daily food log entries
create table food_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  date date not null,
  meal text not null, -- 'breakfast', 'lunch', 'dinner', 'snack'
  food_name text not null,
  brand text,
  serving_size text,
  servings numeric(4,2) default 1,
  calories int,
  protein numeric(5,1),
  carbs numeric(5,1),
  fat numeric(5,1),
  source text, -- 'openfoodfacts', 'custom', 'manual'
  source_id text, -- barcode or custom_food id
  created_at timestamp default now()
);

-- Weight log
create table weight_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  date date not null,
  weight numeric(5,2) not null,
  unit text default 'kg',
  created_at timestamp default now()
);
```

## API Routes Needed
```
GET    /api/food/search?q=chicken     - Search Open Food Facts
GET    /api/food/barcode/[code]       - Get food by barcode
POST   /api/food/custom               - Create custom food
GET    /api/food/custom               - List user's custom foods

GET    /api/log?date=2024-01-15       - Get food log for date
POST   /api/log                       - Add food log entry
DELETE /api/log/[id]                  - Delete log entry

GET    /api/settings                  - Get user settings
PUT    /api/settings                  - Update settings

GET    /api/weight                    - Get weight history
POST   /api/weight                    - Log weight
```

## Open Food Facts API

Base URL: https://world.openfoodfacts.org
```
Search: /cgi/search.pl?search_terms=chicken&json=true
Barcode: /api/v0/product/[barcode].json
```

Key fields from response:
- product_name
- brands  
- serving_size
- nutriments.energy-kcal_100g
- nutriments.proteins_100g
- nutriments.carbohydrates_100g
- nutriments.fat_100g

## UI Components Needed

1. **Layout**: Bottom navigation (Diary, Add, Progress, Settings)
2. **DiaryView**: Date selector, meal sections, daily totals
3. **AddFood**: Search bar, barcode button, results list, manual entry form
4. **FoodDetail**: Serving adjuster, add to meal selector
5. **BarcodeScanner**: Camera view, scan overlay
6. **ProgressView**: Calorie chart, weight chart
7. **Settings**: Goals, display mode toggle, account info

## Design Guidelines

- Mobile-first (375px base width)
- Large touch targets (min 44px)
- Bottom navigation (thumb-friendly)
- Green primary color (#22c55e)
- Clean white background
- Card-based UI for food items
- Subtle shadows, rounded corners

## File Structure
```
fittrack/
├── app/
│   ├── layout.tsx
│   ├── page.tsx (redirects to /diary)
│   ├── diary/
│   │   └── page.tsx
│   ├── add/
│   │   └── page.tsx
│   ├── progress/
│   │   └── page.tsx
│   ├── settings/
│   │   └── page.tsx
│   └── api/
│       ├── food/
│       ├── log/
│       ├── settings/
│       └── weight/
├── components/
│   ├── layout/
│   ├── diary/
│   ├── food/
│   ├── progress/
│   └── ui/
├── lib/
│   ├── supabase.ts
│   ├── openfoodfacts.ts
│   └── utils.ts
├── public/
│   ├── manifest.json
│   └── icons/
└── package.json
```

## Auth Note
Authentication is handled by existing Supabase setup at zitti.ro. 
For now, assume user is authenticated. User ID will come from Supabase auth session.

## Priority Order for Building

1. Project setup (Next.js, Tailwind, Supabase client)
2. PWA configuration
3. Database schema (run in Supabase)
4. Basic layout with navigation
5. Diary view (read-only first)
6. Add food - manual entry
7. Add food - Open Food Facts search
8. Add food - barcode scanner
9. Food logging (write to database)
10. Daily totals calculation
11. Settings page with goals
12. Progress charts
13. Simple/Advanced mode toggle
14. Polish and testing

## What NOT to Build (Out of Scope)

- Social features
- Exercise tracking
- Recipe creation
- Meal planning
- Premium features
- User registration (use existing)

## Visual Testing with Playwright

Use Playwright MCP to verify every UI feature:

1. Start dev server: `npm run dev`
2. Open browser to the page
3. Take screenshot as proof
4. Click through the main flow
5. Verify it works visually

Do NOT mark UI features complete without browser verification.
