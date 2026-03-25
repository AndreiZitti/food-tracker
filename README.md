<div align="center">

![header](https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6&height=120&section=header&animation=fadeIn)

# Z-Fit

_Local-first calorie & macro tracker with AI-powered food recognition_

![Next.js](https://img.shields.io/badge/Next.js_16-black?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-38bdf8?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3fcf8e?logo=supabase&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-5a0fc8?logo=pwa&logoColor=white)

</div>

## What it does

A mobile-first PWA for tracking calories and macros. Works without an account — data lives on your device. Sign in to sync across devices.

```
[Search / Scan / Photo / Text] → [AI estimates nutrition] → [Log to meal] → [Track progress]
```

## Features

- **Guest mode** — no signup needed, full functionality with local-only storage
- **AI food scanner** — take a photo or describe what you ate, Gemini estimates calories & macros
- **Barcode scanner** — scan product barcodes via Open Food Facts
- **Search** — search the Open Food Facts database
- **Manual entry** — add custom foods when nothing else fits
- **Daily diary** — meals organized by breakfast, lunch, dinner, snacks
- **Progress charts** — calorie and weight trends over time
- **Simple/Advanced mode** — toggle between calories-only and full macro view
- **Offline-ready** — PWA with IndexedDB, works without internet
- **Background sync** — authenticated users get bi-directional Supabase sync

## Architecture

```
React Components → Hooks → IndexedDB (primary) → UI
                                ↕ (if signed in)
                          Supabase (background sync)
```

All reads and writes hit IndexedDB first for instant UI. For signed-in users, a background sync service pushes unsynced changes to Supabase and pulls remote updates.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16, React 19 |
| Styling | Tailwind CSS |
| Local storage | IndexedDB via `idb` |
| Cloud database | Supabase (optional sync) |
| Food data | Open Food Facts API |
| AI | Gemini 2.0 Flash (Vision) |
| Charts | Recharts |

## Getting Started

```bash
git clone https://github.com/AndreiZitti/food-tracker.git
cd food-tracker
npm install
npm run dev
```

Open http://localhost:3000 — the app works immediately in guest mode.

### Optional: Cloud sync & AI

To enable Supabase sync and the AI food scanner, create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-key
```

Without these, the app works fully offline with local storage. The AI scanner requires authentication and a Gemini API key.

## Project Structure

```
app/
  diary/        → Daily food diary
  add/          → Add food (search, scan, AI, manual)
  progress/     → Calorie & weight charts
  settings/     → Goals, display mode, sync status
  api/          → Server routes (sync + AI)
lib/
  db/           → IndexedDB schema, DAL, sync service
  auth/         → Auth context with guest/authenticated modes
  hooks/        → Local-first data hooks
components/     → UI components (diary, food, layout, progress)
```

---

<div align="center">

## More Projects

Check out the full collection at **[zitti.ro](https://zitti.ro)**

![footer](https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6&height=80&section=footer)

</div>
