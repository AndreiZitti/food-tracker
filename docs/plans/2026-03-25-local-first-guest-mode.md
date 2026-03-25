# Local-First Architecture + Guest Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the app work without an account (guest mode with local-only storage), with optional Supabase sync for signed-in users. Data loads instantly from device, syncs in background.

**Architecture:** IndexedDB is the primary data store for all users. Hooks read/write to IndexedDB first (instant). For signed-in users, a background sync layer pushes changes to Supabase and pulls remote updates. Guest users get the full app experience with zero signup.

**Tech Stack:** `idb` (IndexedDB wrapper), existing Supabase client, React context for auth state

---

### Task 1: Install idb and create the local database

**Files:**
- Create: `lib/db/local-db.ts`
- Modify: `package.json` (add `idb` dependency)

**Step 1: Install idb**
```bash
npm install idb
```

**Step 2: Create local database module**

Create `lib/db/local-db.ts` — defines the IndexedDB schema and provides typed access:

```typescript
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface FitTrackDB extends DBSchema {
  food_log: {
    key: string; // id
    value: {
      id: string;
      date: string;
      meal: string;
      food_name: string;
      brand?: string;
      serving_size: string;
      servings: number;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      source: string;
      source_id?: string;
      created_at: string;
      synced: boolean; // false = needs sync to server
    };
    indexes: { 'by-date': string; 'by-synced': number };
  };
  settings: {
    key: string; // 'user_settings'
    value: {
      id: string;
      calorie_goal: number;
      protein_goal: number;
      carbs_goal: number;
      fat_goal: number;
      display_mode: string;
      synced: boolean;
    };
  };
  weight_log: {
    key: string;
    value: {
      id: string;
      date: string;
      weight: number;
      unit: string;
      created_at: string;
      synced: boolean;
    };
    indexes: { 'by-date': string };
  };
  meta: {
    key: string;
    value: { key: string; value: string };
  };
}

const DB_NAME = 'fittrack';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<FitTrackDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<FitTrackDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Food log store
        const foodLog = db.createObjectStore('food_log', { keyPath: 'id' });
        foodLog.createIndex('by-date', 'date');
        foodLog.createIndex('by-synced', 'synced');

        // Settings store
        db.createObjectStore('settings', { keyPath: 'id' });

        // Weight log store
        const weightLog = db.createObjectStore('weight_log', { keyPath: 'id' });
        weightLog.createIndex('by-date', 'date');

        // Meta store (for sync timestamps, auth state, etc.)
        db.createObjectStore('meta', { keyPath: 'key' });
      },
    });
  }
  return dbPromise;
}
```

**Step 3: Verify** — no test needed, this is a schema definition. Will be tested via Task 2.

**Step 4: Commit**
```bash
git add lib/db/local-db.ts package.json package-lock.json
git commit -m "feat: add IndexedDB schema for local-first storage"
```

---

### Task 2: Create the data access layer (DAL)

**Files:**
- Create: `lib/db/food-log-dal.ts`
- Create: `lib/db/settings-dal.ts`
- Create: `lib/db/weight-dal.ts`

These are pure IndexedDB CRUD operations. No network calls. Each function generates UUIDs client-side.

`lib/db/food-log-dal.ts`:
```typescript
import { getDB } from './local-db';

export async function getLocalFoodLog(date: string) {
  const db = await getDB();
  return db.getAllFromIndex('food_log', 'by-date', date);
}

export async function addLocalFoodLogEntry(entry: Omit<...>) {
  const db = await getDB();
  const id = crypto.randomUUID();
  const record = { ...entry, id, synced: false, created_at: new Date().toISOString() };
  await db.put('food_log', record);
  return record;
}

export async function deleteLocalFoodLogEntry(id: string) {
  const db = await getDB();
  await db.delete('food_log', id);
}

export async function getRecentFoods(limit = 20) {
  const db = await getDB();
  const all = await db.getAll('food_log');
  // Group by food_name, count, sort by last used
  // ... (aggregate logic)
}

export async function getUnsyncedEntries() {
  const db = await getDB();
  return db.getAllFromIndex('food_log', 'by-synced', 0); // synced: false = 0
}

export async function markSynced(id: string) {
  const db = await getDB();
  const entry = await db.get('food_log', id);
  if (entry) {
    entry.synced = true;
    await db.put('food_log', entry);
  }
}
```

Similar patterns for `settings-dal.ts` and `weight-dal.ts`.

**Commit:**
```bash
git add lib/db/
git commit -m "feat: add data access layer for IndexedDB stores"
```

---

### Task 3: Create auth context with guest mode

**Files:**
- Create: `lib/auth/auth-context.tsx`
- Modify: `app/layout.tsx` (wrap with provider)
- Modify: `hooks/useAuth.ts` (use new context)

The auth context tracks: `{ mode: 'guest' | 'authenticated', user: User | null }`.

On app load:
1. Check IndexedDB meta store for saved auth state
2. If no auth → guest mode (app works fully with local data)
3. If auth found → try Supabase session, fall back to guest if expired

The login page becomes optional — shown in settings as "Sign in to sync".

**Key changes:**
- Remove auth requirement from all API routes (they become sync-only endpoints)
- Hooks read from IndexedDB first, not API routes
- API routes are only called for background sync when authenticated

**Commit:**
```bash
git commit -m "feat: add auth context with guest mode support"
```

---

### Task 4: Rewrite hooks to be local-first

**Files:**
- Modify: `lib/hooks/useFoodLog.ts`
- Modify: `lib/hooks/useProgressData.ts`

**Current flow:** Hook → API route → Supabase → response → state
**New flow:** Hook → IndexedDB (instant) → state → background sync if authenticated

`useFoodLog.ts` new pattern:
```typescript
export function useFoodLog(date: Date) {
  const { mode } = useAuthContext();

  // 1. Read from IndexedDB immediately
  useEffect(() => {
    const localData = await getLocalFoodLog(dateString);
    setEntries(localData.map(mapLocalEntry));
    setLoading(false);

    // 2. If authenticated, fetch from server in background to merge updates
    if (mode === 'authenticated') {
      try {
        const res = await fetch(`/api/log?date=${dateString}`);
        const serverData = await res.json();
        // Merge: server wins for conflicts, local wins for unsynced
        await mergeWithLocal(dateString, serverData);
        // Re-read from IndexedDB after merge
        const merged = await getLocalFoodLog(dateString);
        setEntries(merged.map(mapLocalEntry));
      } catch { /* offline, use local only */ }
    }
  }, [dateString, mode]);

  // 3. Writes go to IndexedDB first, then sync
  const handleAdd = async (entry) => {
    const local = await addLocalFoodLogEntry(entry);
    setEntries(prev => [...prev, mapLocalEntry(local)]);

    if (mode === 'authenticated') {
      // Background sync — don't await, don't block UI
      syncEntryToServer(local).catch(() => {});
    }
    return mapLocalEntry(local);
  };
}
```

**Commit:**
```bash
git commit -m "feat: rewrite hooks for local-first data access"
```

---

### Task 5: Create background sync service

**Files:**
- Create: `lib/db/sync-service.ts`

Handles pushing unsynced local changes to Supabase and pulling server updates.

```typescript
export async function syncToServer() {
  // 1. Push unsynced food_log entries
  const unsynced = await getUnsyncedEntries();
  for (const entry of unsynced) {
    try {
      await fetch('/api/log', { method: 'POST', body: JSON.stringify(entry) });
      await markSynced(entry.id);
    } catch { break; } // stop on first failure (offline)
  }

  // 2. Pull full data from server for recent dates
  // Compare timestamps, merge intelligently
}

export async function pullFromServer(dates: string[]) {
  // Fetch server data for given dates
  // Upsert into IndexedDB (server wins for same-id conflicts)
}
```

Called on:
- App load (if authenticated)
- After any local write (debounced)
- On network reconnect (via `navigator.onLine` event)

**Commit:**
```bash
git commit -m "feat: add background sync service for Supabase"
```

---

### Task 6: Update login flow and settings page

**Files:**
- Modify: `app/login/page.tsx` (optional, accessible from settings)
- Modify: `app/settings/page.tsx` (show sync status, sign in/out)
- Modify: `components/layout/Header.tsx` (show guest vs signed-in indicator)

Settings page changes:
- If guest: show "Sign in to sync your data across devices" with sign-in button
- If authenticated: show email, sync status ("Last synced: 2 min ago"), sign-out button
- Add "Export data" option (JSON download from IndexedDB) for guests

**Commit:**
```bash
git commit -m "feat: update settings with sync status and guest mode UI"
```

---

### Task 7: Remove mock data fallback and clean up

**Files:**
- Modify: `app/diary/page.tsx` (remove MOCK_DATA, error fallback)
- Modify: API routes (make auth optional — return 401 gracefully, hooks handle it)

Since data comes from IndexedDB now, the diary page never needs mock data. The error state only shows if IndexedDB itself fails (extremely rare).

**Commit:**
```bash
git commit -m "feat: remove mock data, hooks are now local-first"
```

---

## Summary of Architecture

```
┌─────────────────────────────────────┐
│           React Components          │
│   (diary, add, progress, settings)  │
└──────────────┬──────────────────────┘
               │ hooks (useFoodLog, etc.)
               ▼
┌─────────────────────────────────────┐
│      Data Access Layer (DAL)        │
│   food-log-dal, settings-dal, etc.  │
└──────────┬──────────────────────────┘
           │ read/write
           ▼
┌─────────────────────────────────────┐
│          IndexedDB (idb)            │
│  food_log, settings, weight_log     │
│  ← PRIMARY SOURCE OF TRUTH →       │
└──────────────────────────────────────┘
           │ background sync (if authenticated)
           ▼
┌─────────────────────────────────────┐
│     API Routes → Supabase           │
│  (sync only, not blocking UI)       │
└─────────────────────────────────────┘
```

**Guest mode:** Components → DAL → IndexedDB. Done.
**Authenticated:** Same, plus background sync to Supabase.

## Verification

1. Open app without signing in → should work fully (add food, view diary, set goals)
2. Sign in → existing Supabase data should sync to IndexedDB
3. Add food while signed in → appears instantly, syncs in background
4. Go offline → app still works, changes queue for sync
5. Come back online → queued changes sync automatically
