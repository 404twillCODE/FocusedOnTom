# WORKOUT SYSTEM AUDIT

## 1. Overview

The `/workout` feature is a members-only workout mini‑app embedded in the main Next.js site. It is implemented as a client‑side experience under the `app/workout` route, backed by Supabase for authentication, relational workout data, and a community feed, plus a local‑first JSON store for rich per‑set history and recovery/progress analytics.

Entry to the mini‑app is gated in three layers:
- **Passcode gate** (`WorkoutPasscodeGate` + `/api/workout/gate`) that requires a shared password and caches success in `localStorage` for 30 days.
- **Supabase Auth** (`WorkoutAuth`) for email/password sign‑in.
- **Tab shell** (`WorkoutAppTabs`) that exposes five sections: **Feed**, **Recovery**, **Workout** (log tab), **Stats**, and **Profile`, with a separate `/workout/chat` page for experimental chat.

The workout system persists data in two complementary forms:
- **Relational Supabase tables** (`workout_settings`, `workout_templates`, `template_exercises`, `workout_sessions`, `workout_exercises`, `workout_sets`, `exercise_history`, `workout_logs`, `workout_log_reactions`, `profiles`) that provide canonical per‑user configuration, optional session‑based logging, community feed entries, reactions, and profile/leaderboard data.
- **Local‑first AppData JSON** (`AppData` stored in `localStorage` and mirrored to `workout_getfit_sync`) that powers the “GetFit” workout tracker (`GetFitWorkoutTracker`), including saved day plans, detailed per‑set history (`workoutHistory`), and recovery/progress analytics. This store is the primary source of truth for the visible Workout, Recovery, Progress, and part of Stats tabs.

The core logging UX today is the **GetFit‑style local‑first tracker** in `GetFitWorkoutTracker`. There is also a **session‑based logging path** (`WorkoutHome` → `ActiveSession` → `finishWorkoutSession`) that writes into normalized session tables and mirrors into `workout_logs`; the UI for this path is present but not currently wired into `WorkoutTab` in the latest code, so it should be treated as an alternate/legacy implementation that still influences feed/stats through shared helpers.

Streaks are currently **computed on the fly** in two places (Stats tab and Progress tab) from log dates or local history; there is **no persisted XP or explicit ranking table**, but a weekly leaderboard can be computed at runtime from `workout_logs` via `getCommunityLeaderboard`. Any XP system would be layered on top of these existing aggregates.

## 2. Database Schema

This section documents the Supabase tables and JSON shapes used by the `/workout` feature. Schemas are reconstructed from TypeScript types and SQL files in the repo; names and types are accurate for application usage, even if the exact SQL in your project may differ slightly.

### 2.1 Core workout configuration tables

#### `workout_settings`

Per‑user workout configuration and setup state.

```sql
create table public.workout_settings (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  tracking_style   text not null,          -- 'schedule' | 'sequence'
  selected_days    integer[] null,         -- weekdays 0..6 for 'schedule' style
  schedule_map     jsonb null,             -- { "0": "<template_id>", ..., "6": "<template_id>" }
  rotation         jsonb null,             -- array of { index, template_id, label } objects
  modes            jsonb not null,         -- WorkoutModes (see below)
  preferences      jsonb not null,         -- WorkoutPreferences (see below)
  setup_completed  boolean not null default false,
  updated_at       timestamptz not null default now()
);
```

Application‑level shapes:
- `WorkoutModes`:
  - `progressiveOverload: boolean`
  - `dropSets: boolean`
  - `rpe: boolean`
  - `supersets: boolean`
  - `amrap: boolean`
- `WorkoutPreferences`:
  - `timer_enabled: boolean`
  - `timer_default_sec: number | null`
  - `units: 'lbs' | 'kg'`
  - `show_suggestions: boolean`

RLS (inferred):
- All application reads/writes filter by `user_id`, and admin APIs use the service role; the typical RLS pattern is “user can only read/write their own row”. Exact policies live in `supabase/rls.sql`, which is not in this repo, but all access is of the form `.eq("user_id", userId)`.

#### `workout_templates`

Named templates representing workout days (e.g. Push, Pull, Legs).

```sql
create table public.workout_templates (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_workout_templates_user
  on public.workout_templates (user_id, created_at);
```

Used via:
- `getUserTemplates(userId)`
- `createTemplateWithExercises(userId, name, exercises)`

#### `template_exercises`

Per‑template default exercise definitions.

```sql
create table public.template_exercises (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  template_id      uuid not null references workout_templates(id) on delete cascade,
  name             text not null,
  sort_order       integer not null,
  default_sets     integer null,
  default_reps     integer null,
  default_rest_sec integer null,
  mode             jsonb null               -- arbitrary per‑exercise mode/config
);
create index if not exists idx_template_exercises_template
  on public.template_exercises (template_id, sort_order);
```

Used to preload session exercises when `startWorkoutSession` is called with a `templateId`.

### 2.2 Session‑based logging tables

These tables represent normalized workout sessions and are used by:
- The `finishWorkoutSession` family of helpers.
- Stats helpers such as `getWorkoutStatsSummary` and `backfillExerciseDetailsForLogs`.

#### `workout_sessions`

```sql
create table public.workout_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  started_at   timestamptz not null,
  ended_at     timestamptz null,
  day_label    text null,          -- e.g. 'Push', 'Legs', or 'Workout'
  template_id  uuid null references workout_templates(id),
  notes        text null,
  duration_min integer null
);
create index if not exists idx_workout_sessions_user_started
  on public.workout_sessions (user_id, started_at desc);
create index if not exists idx_workout_sessions_user_ended
  on public.workout_sessions (user_id, ended_at desc);
```

Shape in TypeScript: `WorkoutSession`.

#### `workout_exercises`

```sql
create table public.workout_exercises (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references workout_sessions(id) on delete cascade,
  name        text not null,
  sort_order  integer not null
);
create index if not exists idx_workout_exercises_session
  on public.workout_exercises (session_id, sort_order);
```

TypeScript shape: `WorkoutExerciseRow`.

#### `workout_sets`

```sql
create table public.workout_sets (
  id             uuid primary key default gen_random_uuid(),
  exercise_id    uuid not null references workout_exercises(id) on delete cascade,
  set_number     integer not null,
  reps           integer null,
  weight         numeric null,
  is_done        boolean not null default false,
  is_drop_set    boolean not null default false,
  drop_set_level integer null,
  rpe            integer null
);
create index if not exists idx_workout_sets_exercise
  on public.workout_sets (exercise_id, set_number);
```

TypeScript shape: `WorkoutSetRow`.

These tables are populated exclusively by `finishWorkoutSession` and its helpers, not by the local‑first GetFit tracker.

### 2.3 Exercise history

#### `exercise_history`

Per‑user per‑exercise auto‑progression hints for progressive overload.

```sql
create table public.exercise_history (
  user_id      uuid not null references auth.users(id) on delete cascade,
  exercise_name text not null,
  last_weight   numeric null,
  last_reps     integer null,
  last_sets     integer null,
  last_done_at  timestamptz null,
  next_weight   numeric null,
  next_reps     integer null,
  next_sets     integer null,
  updated_at    timestamptz not null default now(),
  primary key (user_id, exercise_name)
);
create index if not exists idx_exercise_history_user
  on public.exercise_history (user_id);
```

Used by:
- `getExerciseHistoryForNames(userId, names)` – read history for exercises in an active session.
- `updateExerciseHistoryFromSession(userId, exercises)` – upserts rows after a `finishWorkoutSession` when `modes.progressiveOverload` is enabled.

### 2.4 Community feed and reactions

#### `workout_logs`

Defined in `workout_feed_sync.sql` and used by the feed and stats/leaderboard.

```sql
create table if not exists public.workout_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  date         date not null,
  workout_type text not null,
  workout_name text,
  reps         integer,
  sets         integer,
  lbs          numeric,
  duration_min integer,
  notes        text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_workout_logs_created_at
  on public.workout_logs (created_at desc);

create index if not exists idx_workout_logs_user_date
  on public.workout_logs (user_id, date desc);

alter table public.workout_logs enable row level security;

create policy "Anyone can read workout logs"
  on public.workout_logs for select
  using (auth.role() = 'authenticated');

create policy "Users can insert own logs"
  on public.workout_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own logs"
  on public.workout_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own logs"
  on public.workout_logs for delete
  using (auth.uid() = user_id);
```

Population paths:
- **From session‑based logging**: `finishWorkoutSession` calls `insertLogFromSession`, which:
  - Determines the authenticated user via `supabase.auth.getUser()`.
  - Inserts a summary row for that day’s session, with a compact JSON representation of per‑exercise sets in `notes`.
- **From the GetFit tracker**: `GetFitWorkoutTracker.completeWorkout` calls `insertLog(userId, payload)` directly, using local `workoutHistory` and day schedule to build the same summary structure.

Used by:
- `getCommunityFeed(limit)` – for the Feed tab.
- `getMyLogs(userId, limit)` – for self statistics.
- `getLogsByUser(userId, days)` – for the member profile overlay.
- `getCommunityLeaderboard(weekStart, weekEnd)` – for a per‑user weekly leaderboard (currently not wired into UI but used conceptually for rankings).

#### `workout_log_reactions`

Defined in `workout_reactions.sql`, used by the Feed tab for emoji reactions.

```sql
create table if not exists workout_log_reactions (
  id        uuid default gen_random_uuid() primary key,
  log_id    uuid not null references workout_logs(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  emoji     text not null,
  created_at timestamptz default now(),
  unique (log_id, user_id, emoji)
);

alter table workout_log_reactions enable row level security;

create policy "Anyone can read reactions"
  on workout_log_reactions for select using (true);

create policy "Users can insert own reactions"
  on workout_log_reactions for insert with check (auth.uid() = user_id);

create policy "Users can delete own reactions"
  on workout_log_reactions for delete using (auth.uid() = user_id);

create index if not exists idx_reactions_log_id
  on workout_log_reactions(log_id);

create index if not exists idx_reactions_user_id
  on workout_log_reactions(user_id);
```

Client helpers:
- `getReactionsForLogs(logIds, currentUserId)` – loads and aggregates reactions into `ReactionSummary[]` per log for the Feed.
- `toggleReaction(logId, userId, emoji)` – adds or removes one user/emoji reaction, with optimistic UI updates in `WorkoutFeedTab`.

### 2.5 Local‑first GetFit sync

#### `workout_getfit_sync`

Defined in `workout_getfit_sync.sql`, provides per‑user JSON blob sync for the GetFit tracker.

```sql
create table if not exists public.workout_getfit_sync (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists idx_workout_getfit_sync_updated_at
  on public.workout_getfit_sync (updated_at desc);

alter table public.workout_getfit_sync enable row level security;

create policy "Users can read own getfit sync"
  on public.workout_getfit_sync for select
  using (auth.uid() = user_id);

create policy "Users can insert own getfit sync"
  on public.workout_getfit_sync for insert
  with check (auth.uid() = user_id);

create policy "Users can update own getfit sync"
  on public.workout_getfit_sync for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own getfit sync"
  on public.workout_getfit_sync for delete
  using (auth.uid() = user_id);

create or replace function public.set_workout_getfit_sync_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger workout_getfit_sync_updated_at
before update on public.workout_getfit_sync
for each row execute function public.set_workout_getfit_sync_updated_at();
```

Client helpers:
- `getWorkoutGetfitSync(userId)` / `upsertWorkoutGetfitSync(userId, payload)` in `lib/supabase/workout.ts`.
- `workoutLocalFirst` uses these to push/pull `AppData` in the background; failures are treated as non‑fatal and logged to `console.warn`.

#### Local `AppData` schema

Shape stored in `localStorage` under `workout_getfit_<userId>` and mirrored to `workout_getfit_sync.data` (after normalization):

```ts
type AppData = {
  deficitEntries: {
    date: string;
    nutrition?: { calories: number; fat: number; carbs: number; protein: number };
    fitness?: { totalCalories: number };
    caloriesEaten: number;
    caloriesBurned: number;
    deficit: number;
  }[];
  savedWorkouts: unknown[][];     // per weekday (0..6) arrays of Exercise-like objects
  workoutHistory: WorkoutHistoryEntry[];
  workoutSchedule: string[];      // per weekday label, e.g. 'Push', 'Pull', 'Rest Day'
  weightHistory: { date: string; weight: number; timestamp: number }[];
  workoutSetupComplete?: boolean;
  trackingStyle?: 'scheduled' | 'inconsistent';
  weeklyGoal?: number;
  rotationOrder?: string[];       // used when trackingStyle === 'inconsistent'
  preferred_rest_sec?: number;    // global default rest in seconds
};

type WorkoutHistoryEntry = {
  date: string;           // 'YYYY-MM-DD'
  timestamp: number;      // ms since epoch
  dayOfWeek: number;      // 0..6
  workoutType?: string;   // label like 'Push'
  exercises: unknown[];   // Exercise-like objects, normalized by consumers
};
```

This JSON structure is normalized and validated by `normalizeAppData` before use.

### 2.6 Profiles and admin metadata

#### `profiles`

User profile table (used across the app but especially in `/workout`).

```sql
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text not null unique,
  display_name text null,
  avatar_url   text null,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are readable by authenticated users"
  on public.profiles for select
  using (auth.role() = 'authenticated');
```

Helpers:
- `getMyProfile`, `upsertProfile` for the current user.
- `getProfileByUsername`, `getAllProfiles` for feed and member overlays.

#### `app_admins`

Used for admin features on the feed (delete any log) and admin checks:

```sql
create table public.app_admins (
  id    uuid primary key default gen_random_uuid(),
  email text not null unique
);
```

Helpers in `lib/supabase/admin.ts`:
- `isEmailAdmin(email)` – decides whether a user can perform admin actions.

### 2.7 Chat tables (used by `/workout/chat`)

The chat feature under `/workout/chat` uses Supabase tables `chat_rooms`, `chat_members`, and `chat_messages`. Their exact schema files are not present, but the client code implies:

- `chat_rooms`:
  - `id: string` (uuid)
  - `type: 'group' | 'dm'`
  - `name: string | null`
  - likely `created_at: timestamptz`
- `chat_members`:
  - `room_id: uuid`
  - `user_id: uuid`
  - composite unique `(room_id, user_id)`
- `chat_messages`:
  - `id: uuid`
  - `room_id: uuid`
  - `user_id: uuid`
  - `body: text`
  - `created_at: timestamptz`

RLS is expected to tie membership to rooms and restrict message visibility, but is not defined in‑repo.

## 3. Data Flow

This section explains, step‑by‑step, how data moves through the system for the main user actions: logging workouts, adding sets, computing streaks and stats, and interacting with the community feed. There are two conceptual logging pipelines: **local‑first GetFit logging** (current primary flow) and **session‑based logging** (normalized relational flow).

### 3.1 Access, gating, and auth

1. **User navigates to `/workout`**:
   - Next.js renders `WorkoutPage` (client component).
   - A `ToastProvider` is mounted around the entire mini‑app to support cross‑feature toasts.
2. **Passcode gate**:
   - `WorkoutPage` checks `NEXT_PUBLIC_WORKOUT_GATE_ENABLED`.
   - If enabled and `getGateUnlocked()` is false, it shows `WorkoutPasscodeGate`.
   - On submit, `WorkoutPasscodeGate` posts to `/api/workout/gate` with `{ password }`.
   - The API:
     - Validates `WORKOUT_GATE_PASSWORD` from env.
     - Rate‑limits attempts per IP (in‑memory store, 10/minute).
     - Responds with `{ ok: true }` on success.
   - On success, `WorkoutPasscodeGate` calls `setGateUnlocked()`, which writes `workout_gate_ok` and `workout_gate_ts` to `localStorage`, and `WorkoutPage` transitions to auth.
3. **Supabase Auth**:
   - Once the gate is unlocked, `WorkoutPage` calls `supabase.auth.getSession()` and subscribes via `onAuthStateChange` to keep `user` in sync.
   - If `user` is null, `WorkoutAuth` is shown:
     - Sign‑in flow: `supabase.auth.signInWithPassword`.
     - Sign‑up flow: `supabase.auth.signUp` storing the desired username in auth user metadata (actual profile row is created later by `WorkoutProfileTab`).
4. **Tabs and shell**:
   - When a user is present, `WorkoutAppTabs` is rendered with `userId`.
   - Internal tab state (`tab`) defaults to `"log"` so users land on the Workout experience.
   - Tab mapping:
     - `feed` → `WorkoutFeedTab`
     - `recovery` → `WorkoutRecoveryTab`
     - `log` → `WorkoutTab`
     - `stats` → `WorkoutStatsTab`
     - `profile` → `WorkoutProfileTab`

### 3.2 Setup and configuration

1. When `WorkoutTab` mounts, it calls `getWorkoutSettings(userId)` via Supabase client.
2. Possible states:
   - **Loading**: `settings === undefined` → spinner.
   - **No settings or setup not completed**: `!settings || !settings.setup_completed` → `SetupWizard`.
   - **Setup completed**: `GetFitWorkoutTracker` is rendered with the fetched `WorkoutSettings`.
3. **SetupWizard flow**:
   - Holds `WizardState` with:
     - `tracking_style`: `'schedule' | 'sequence' | 'exercise_days'` (UI abstraction; `exercise_days` is stored as `'sequence'` plus labeled rotation).
     - `selected_days`: array of weekdays for scheduled style.
     - `sequence_days_count`: number of rotation days for `'sequence'` style.
     - `exercise_days_labels`: ordered list of labels for `'exercise_days'` style (e.g. `["Legs","Arms","Cardio"]`).
     - `modes` and `preferences` defaults if none exist.
   - Step 1: choose tracking style and (for schedule) workout days; or sequence day count; or exercise‑day labels.
   - Step 2: enable/disable modes (progressive overload, drop sets, RPE).
   - Step 3: configure timer and units.
   - On “Finish”, `SetupWizard`:
     1. Converts `exercise_days` into a `rotation` array of `{ index, template_id: "", label }`.
     2. Maps `'exercise_days'` back to `'sequence'` in `tracking_style`.
     3. Builds payload for `upsertWorkoutSettings(userId, payload)`:
        - `tracking_style`
        - `selected_days` or `null`
        - `schedule_map: null`
        - `rotation: null | [] | labeled rotation`
        - `modes` and `preferences`
        - `setup_completed: true`
     4. Uses `upsertWorkoutSettings` which:
        - Fills in missing fields with defaults (`ensureDefaultModes`, `ensureDefaultPreferences`).
        - `upsert`s into `workout_settings` (conflict on `user_id`) and returns the normalized row.
     5. Calls `onDone(settings)` to lift the new settings into `WorkoutTab`, which transitions to `GetFitWorkoutTracker`.

### 3.3 Logging a workout via the GetFit tracker (primary flow)

This is the main flow users see today on the **Workout** tab.

1. **Load logic**:
   1. `GetFitWorkoutTracker` receives `userId` and `settings`.
   2. On mount, it calls `loadAppData(userId)` from `getfit/dataStore`, which delegates to `workoutLocalFirst.loadAppData`:
      - If an in‑memory cache exists, returns it.
      - Otherwise:
        - Reads `localStorage["workout_getfit_<userId>"]`, parses and normalizes to `AppData`.
        - Stores it in the in‑memory cache and notifies subscribers.
        - In the background, calls `getWorkoutGetfitSync(userId)`:
          - If a remote blob exists, normalizes it and overwrites local cache and `localStorage`.
          - If no remote data but local data is “meaningful” (has history, saved workouts, weights, or deficit entries), it schedules a sync to write local data up.
   3. `GetFitWorkoutTracker` also subscribes via `subscribe(userId, listener)` to be notified when `AppData` changes elsewhere (e.g. other tabs).
   4. `AppData` drives:
      - `workoutSchedule` and `trackingStyle` (with optional `rotationOrder` for sequence‑style flows).
      - `workoutHistory` (used for stats, streaks, and recovery).
      - `preferred_rest_sec` (default rest timer).
2. **Day selection and schedule sync**:
   - `currentDayIndex` defaults to:
     - 0 if `settings.tracking_style === "sequence"` (sequence mode uses rotation index).
     - `new Date().getDay()` otherwise.
   - A `useEffect` detects the “empty schedule” case (`workoutSetupComplete === false` and all days equal `'Rest Day'`) and:
     1. Fetches `WorkoutSettings` from Supabase.
     2. Derives `workoutSchedule` and `rotationOrder` from:
        - `schedule_map` + `workout_templates` when `tracking_style === 'schedule'`.
        - `selected_days` when only simple scheduled days are provided.
        - `rotation` for `sequence` style, mapping labels into the first 7 schedule slots.
     3. Writes these into `AppData` via `updateAppData`, and marks `workoutSetupComplete: true`.
3. **Editing exercises and sets (day planner)**:
   - For the selected day:
     - `deriveDayWorkouts(AppData, currentDayIndex)`:
       - Reads `savedWorkouts[currentDayIndex]`, migrates older shapes where `category` is a single value into `categories: []`, and ensures there is at least one category per exercise.
       - Normalizes `sets` such that a zero weight is treated as `null` (meaning no weight).
       - Sanitizes exercise and notes text with `sanitizeExerciseDisplayText`.
       - De‑duplicates by `id`.
   - Users can:
     - Add new exercises via an **Exercise Modal** (see below).
     - Edit existing exercises (sets, categories, notes, selected days).
     - Mark sets as completed.
   - All modifications to the day’s exercises go through helper functions that:
     - Build an updated array of `Exercise` objects for the current day.
     - Call `saveDayWorkouts(updatedWorkouts)`:
       - Combines all saved workouts across the week into a `Map<id, Exercise>`.
       - Re‑assigns workouts to each weekday based on `selectedDays` (if present) or “all days” if `selectedDays` is empty.
       - Calls `updateAppData(userId, updater)` to write `savedWorkouts` back into `AppData`.
     - Because `updateAppData` uses `applyPatch` in `workoutLocalFirst`, this immediately:
       - Updates the in‑memory cache.
       - Notifies all subscribers, including Recovery/Progress/Stats tabs.
       - Schedules a debounced localStorage write and a debounced Supabase `workout_getfit_sync` upsert.
4. **Exercise Modal (Add/Edit)**:
   - Exposes:
     - Exercise name (with typeahead suggestions and progressive overload helper for last weight).
     - Multiple categories (subset of `ExerciseCategory`).
     - One or more `SetRow`s with reps, weight, optional rest seconds, RPE, and drop‑set flag.
     - Selected days (weekday labels or rotation days, depending on tracking style).
     - Notes.
   - On save:
     - Constructs an `Exercise` object with:
       - `id`: existing ID or `Date.now()` for new ones.
       - `categories` from selected category chips.
       - `selectedDays`: chosen days or the current day by default.
       - `sets`: each `SetRow` becomes a `WorkoutSet` with `setNumber`, `reps`, `weight`, `completed: false`, optional `breakTime`, and optional `rpe`/`isDropSet`.
     - Calls `onSave(exercise)` provided by `GetFitWorkoutTracker`, which:
       - For new exercises, appends them to all appropriate days in `savedWorkouts`.
       - For edits, removes the old version (by `id`) from all days and re‑inserts the updated version.
     - Uses a Promise race with a 10‑second timeout to surface hung writes as a UI error, though writes are local and should be effectively instantaneous.
5. **Adding/removing sets in the day planner**:
   - `addSetToExercise(exerciseId)`:
     - Clones the last set and increments `setNumber`, defaulting `breakTime` to:
       - The last set’s rest seconds if available.
       - Otherwise `preferred_rest_sec` from `AppData` or from settings (`preferences.timer_default_sec`).
     - Ensures set numbers are contiguous.
     - Writes back via `updateExerciseSets` → `saveDayWorkouts`.
     - If a non‑zero rest is used, updates `preferred_rest_sec` to that value for future defaults.
   - `removeSetFromExercise` enforces at least one set remaining.
   - Reps/weight/rest edits are stored per set via `updateSetField`/`updateSetRest`, which write to `AppData` optimistically.
6. **Per‑set completion and break timers**:
   - `toggleSetComplete(exerciseId, setIndex, breakTime?)`:
     - Toggles the `completed` flag in the day‑planner `Exercise.sets`.
     - If a set transitions to `completed` and has a `breakTime`, it:
       - Updates `AppData` and sets `activeBreakTimer` `{ exerciseId, setIndex, timeLeft }`.
       - A `useEffect` counts down every second and, when `timeLeft === 0`:
         - Vibrates via `navigator.vibrate` if available.
         - Shows a toast `("Rest timer complete!")` using `useToast`.
         - Clears the timer after a short delay.
7. **Undo and bulk operations**:
   - “Mark all done” in the exercise overflow menu:
     - Takes a snapshot of the current `sets` in `undoData`.
     - Sets all `completed: true` for that exercise’s sets and writes via `saveDayWorkouts`.
     - Shows an undo pill (`UndoAutoDissmiss`) for 5 seconds and a toast.
   - Undo:
     - Restores the previous `sets` for that `exerciseId` and clears `undoData`.
8. **Completing a workout (primary log event)**:
   - When the user taps **Finish** in the sticky bottom bar:
     1. `completeWorkout` validates that there is at least one exercise; otherwise shows an error toast.
     2. Builds a `WorkoutHistoryEntry`:
        - `date`: `formatDateKey(new Date())`
        - `timestamp`: `Date.now()`
        - `dayOfWeek`: `currentDayIndex`
        - `workoutType`: label from `workoutSchedule[currentDayIndex]`
        - `exercises`: deep clone of `workouts`.
     3. Calls `updateAppData(userId, updater)` to:
        - Append the new entry to `workoutHistory`.
        - Reset all `completed` flags for sets in the current day across `savedWorkouts`.
     4. Calls `flushWorkoutData(userId)`:
        - Immediately persists `AppData` to `localStorage`.
        - Triggers a Supabase `workout_getfit_sync` upsert for cross‑device sync.
     5. Computes summary stats:
        - `totalReps`: sum of reps across all sets of all exercises.
        - `totalSets`: total number of sets.
        - `weightedSum` and `weightedCount` to derive `avgWeight`.
        - `exerciseDetails`: compact array of `{ name, sets: [{ r, w, done }] }`.
     6. Calls `insertLog(userId, payload)`:
        - Writes a `workout_logs` row with:
          - `date`
          - `workout_type`: sanitized, lowercased `workoutType` (spaces → `_`)
          - `workout_name`: human label (e.g. `Push`, `Legs`, `Workout`)
          - `reps`, `sets`, `lbs: avgWeight`
          - `duration_min: undefined` (no duration captured in this flow)
          - `notes: JSON.stringify(exerciseDetails)`
        - Errors are thrown, but the caller doesn’t surface them beyond a `console.warn`.
     7. Shows a success toast (“Workout completed and saved to history!”).
     8. Advances `currentDayIndex`:
        - In sequence mode, cycles through the rotation length.
        - Otherwise, snaps back to `new Date().getDay()`.

This flow is **optimistic and local‑first**: user‑visible state is updated before network calls finish. Supabase writes (sync and feed insert) are best‑effort and do not block the UI.

### 3.4 Logging a workout via session tables (alternate flow)

This flow exists in code but is not currently wired into `WorkoutTab`. It is documented because it is the only place that writes into `workout_sessions`, `workout_exercises`, `workout_sets`, and `exercise_history`.

1. **Starting a session** (`startWorkoutSession`):
   1. Called with `{ userId, dayLabel, templateId? }`.
   2. Inserts into `workout_sessions`:
      - `user_id`, `day_label`, `template_id`, `started_at: now`.
   3. If `templateId` is provided:
      - Loads `template_exercises` for that template.
      - Inserts corresponding rows into `workout_exercises` (`session_id`, `name`, `sort_order`).
   4. Returns `{ session, exercises }`.
2. **Editing the session**:
   - `ActiveSession` keeps local `LocalExercise[]` state with `LocalSet[]` sets.
   - It uses `getExerciseHistoryForNames(userId, names)` to show “Last” and “Suggested” weights/reps for progressive overload, built from `exercise_history`.
   - Users can:
     - Add/rename exercises.
     - Add normal sets or drop sets (drop sets compute weight reductions using `DEFAULT_DROP_PERCENT`).
     - Toggle `is_done`, track RPE and rest timers per set.
3. **Finishing the session** (`finishWorkoutSession`):
   1. Called from `ActiveSession.handleFinish` with `FinishSessionPayload`:
      - `userId`, `sessionId`, optional notes and duration, `exercises` (name + sets), and `modes`.
   2. Steps on the server/client (Supabase JS):
      - Updates `workout_sessions` row:
        - Sets `ended_at` to now.
        - Writes `notes` and `duration_min`.
      - Inserts one `workout_exercises` row per `exercises[]`, with `sort_order` indexing.
      - For each exercise:
        - Finds its inserted row.
        - Builds `WorkoutSetRow` records and inserts them into `workout_sets` with `exercise_id`, `set_number`, `reps`, `weight`, `is_done`, `is_drop_set`, `drop_set_level`, `rpe`.
      - Mirrors a summary row into `workout_logs` via `insertLogFromSession`, similar to the GetFit flow:
        - Computes total reps, sets, and average weight across all sets.
        - Looks up `day_label` for the `sessionId`.
        - Writes a `workout_logs` row with JSON exercise details in `notes`.
      - If `modes.progressiveOverload` is true:
        - Calls `updateExerciseHistoryFromSession(userId, exercises)` to upsert `exercise_history` with `last_*` and `next_*` fields for each exercise.
   3. In the UI, `ActiveSession` shows a full‑page spinner while saving and, on success, calls `onFinish()` to navigate back to the calling view.

This flow is **not local‑first**: it relies on direct Supabase calls and awaits them, but only at finalization time. All editing happens in local React state until `finishWorkoutSession` is invoked.

### 3.5 Community Feed: read, react, and admin delete

1. **Loading the feed** (`WorkoutFeedTab`):
   1. On mount:
      - Calls `getWorkoutSettings(userId)` to read `preferences.units` and set `units` to `'lbs'` or `'kg'` (fallback `'lbs'` on error).
      - Calls `getCommunityFeed()` (Supabase) to load latest `WorkoutLogWithProfile[]`:
        - Fetches raw `workout_logs` rows ordered by `created_at desc`.
        - Backfills missing exercise JSON in `notes` by querying `workout_sessions`, `workout_exercises`, and `workout_sets` when necessary.
        - Joins `profiles` to populate `profiles: { username, display_name, avatar_url } | null`.
      - Extracts log IDs and calls `getReactionsForLogs(logIds, userId)` to populate `reactionsMap`.
   2. Format layer:
      - `parseExerciseDetails(notes)` attempts to JSON‑parse `notes` into `{ name, sets: { r, w, done }[] }[]`.
      - If JSON is valid, it drives detailed “expand to see sets” UI; otherwise notes are treated as plain text.
      - Quick stats show counts of exercises, sets, reps, and total weight (from either `sets` or `lbs`).
2. **Reactions**:
   - Clicking a reaction chip in the Feed entry:
     1. Optimistically mutates `reactionsMap` by increasing/decreasing the count and toggling the `reacted` flag across `ReactionSummary[]`.
     2. Calls `toggleReaction(logId, userId, emoji)`:
        - Checks for an existing row in `workout_log_reactions`.
        - Deletes it if present; inserts if absent.
     3. Any server errors are logged but do not roll back the optimistic UI state.
3. **Admin delete**:
   - On mount, `WorkoutFeedTab`:
     - Uses `supabase.auth.getSession()` to get the access token.
     - Calls `/api/workout/check-admin` with `Authorization: Bearer <token>`.
     - The route:
       - Resolves the user via `getUserEmailFromRequest`.
       - Calls `isEmailAdmin(email)`; returns `{ admin: boolean }`.
   - If `isAdmin` is true:
     - Each feed card shows a delete button (`Trash2`).
     - Clicking delete:
       1. Confirms in the browser.
       2. Refreshes the Supabase auth session and fetches a new access token.
       3. POSTs to `/api/workout/admin-delete-log` with `{ logId }` and `Authorization: Bearer <token>`.
       4. The API verifies admin status by email and deletes the `workout_logs` row via a service‑role Supabase client.
       5. On success, the client filters out the log locally.

### 3.6 Stats, streaks, and leaderboard

1. **Stats tab high‑level metrics** (`WorkoutStatsTab`):
   1. On mount:
      - Calls `getMyLogs(userId)`, `getWorkoutStatsSummary(userId)`, and `getWorkoutSettings(userId)` in parallel.
      - `getMyLogs` reads the user’s own `workout_logs` ordered by `date` and `created_at`.
      - `getWorkoutStatsSummary`:
        - Selects `name` and nested `workout_sets (reps, weight)` for exercises whose `session_id` is in the user’s `workout_sessions`.
        - Computes per‑exercise occurrence counts and total volume (sum of `reps * weight`).
        - Returns `{ topExercises: { exercise_name, count }[], totalVolume }`.
      - Settings provide `units` for labels.
   2. From `myLogs`:
      - `computeStreak(dates: string[])`:
        - De‑duplicates dates, sorts descending, and counts consecutive days starting from today.
      - Last 7/30 days and total minutes in last 30 days are computed by simple date difference filters and sums over `duration_min`.
   3. From `getWorkoutStatsSummary`:
      - The Top Lifts section lists `topExercises` and displays the total volume, using `units`.
2. **History and per‑exercise stats (Stats tab)**:
   - Stats tab also loads `AppData` via `loadAppData(userId)` and uses `workoutHistory`:
     - Filters history by search query and day range.
     - Computes:
       - Per‑entry totals for exercises, sets, reps, and total weight.
       - Per‑exercise PRs (`getBestSet`, `getExercisePRs`) based on all history before a given entry.
       - Delete logic that:
         - Updates `AppData` to remove the history entry.
         - Best‑effort deletes the corresponding `workout_logs` row for that date via `deleteLog` (if one exists).
3. **Progress tab analytics** (`WorkoutProgressTab` + `progressUtils`):
   1. Transforms each `WorkoutHistoryEntry` into `HistoryEntryLike`:
      - `date`, `timestamp`, `exercises`, and optional `duration_min`.
   2. Computes:
      - Overview metrics for 7 and 30 days via `computeOverview`:
        - Count of unique workout days.
        - Total sets, reps, weight (only completed sets), and minutes.
      - Weekly buckets (`computeWeeklyBuckets`) for the last 8 weeks for:
        - Workouts per week.
        - Total weight per week.
      - Streak via `computeStreak(history: HistoryEntryLike[])`, which:
        - Extracts unique dates.
        - Sorts descending and counts consecutive days from today.
   3. Per‑exercise PRs:
      - `getUniqueExerciseNames(history)` builds a sorted list of distinct exercise names.
      - `computeExerciseSeries(history, exerciseName, maxSessions)`:
        - Filters sessions that contain the named exercise.
        - For each session, calculates:
          - `bestWeight`, `bestReps`, `totalWeightInSession`, and a formatted best set.
        - Derives:
          - `prBestWeight`, `prBestTotalWeight`, `prBestReps`.
          - `bestWeightOverTime` for the sparkline.
4. **Recovery tab** (`WorkoutRecoveryTab`):
   1. Subscribes to `AppData` (`workoutHistory`) via `loadAppData` and `subscribe`.
   2. For each history entry:
      - Normalizes categories (including aliases like `'abs'` → `'core'`).
      - Spreads compound categories like `'arms'` into `[biceps, triceps, forearms]`.
      - Tracks the latest timestamp per `MuscleCategory`.
   3. For each muscle:
      - Uses `RECOVERY_HOURS` to determine required rest hours.
      - Computes `remainingMs = lastHit + hours*3600*1000 - now`.
      - Displays:
        - “No data yet” if the muscle has never been hit.
        - `formatDuration(remainingMs)` (“Recovered” or `xh ym zs`).
        - An image and metadata for the muscle group.
5. **Leaderboard / XP‑like logic**:
   - `getCommunityLeaderboard(weekStart, weekEnd)`:
     - Reads `workout_logs` for the given date range.
     - Aggregates per user:
       - `count`: number of workouts in range.
       - `minutes`: sum of `duration_min` (0 for missing durations).
     - Returns an array of `{ user_id, count, minutes }`.
   - This is the foundation for any XP or ranking system; XP could be derived from workout count, duration, or volume and exposed via a new table or computed leaderboard endpoint.

### 3.7 Chat under `/workout/chat`

1. `/workout/chat` uses `WorkoutChatPage`:
   - Requires the user to be signed in via Supabase (`supabase.auth.getSession`).
   - Shows `ChatShell(userId)` once authenticated.
2. `ChatShell`:
   - Ensures a `chat_rooms` row exists for “Gym Chat” and that the user is a member (`chat_members` upsert).
   - Loads all rooms (`chat_rooms`) and picks the first as active.
   - For the active room:
     - Loads `chat_messages` via `supabase.from("chat_messages").select("*").eq("room_id", activeRoomId).order("created_at")`.
     - Subscribes to `postgres_changes` on `chat_messages` for that room using Supabase realtime.
   - Sends messages by inserting into `chat_messages`.

Chat is explicitly marked as “work in progress and not fully functional”; it does not interact with the workout data schema beyond sharing the same user accounts.

## 4. UI Structure

### 4.1 Routing and page layout

- **`app/workout/layout.tsx`**:
  - Sets a mobile‑friendly viewport (`maximumScale: 1`, `userScalable: false`) to avoid zoom glitches in the mini‑app.
- **`app/workout/page.tsx`**:
  - Root client entry for `/workout`.
  - Orchestrates:
    - Gate vs auth vs app display.
    - Mobile “Add to home screen” install prompt (`WorkoutInstallPrompt`).
    - Global `ToastProvider`.
- **`app/workout/chat/page.tsx`**:
  - Entry for `/workout/chat`.
  - Ensures the user is signed in; otherwise displays a simple message.
  - Renders `ChatShell`.

### 4.2 Top‑level tabs and shared components

- **`WorkoutAppTabs`**:
  - Manages active tab, tab bar (with motion underline), and member profile overlay.
  - Tabs:
    - **Feed** → `WorkoutFeedTab`.
    - **Recovery** → `WorkoutRecoveryTab`.
    - **Workout** → `WorkoutTab`.
    - **Stats** → `WorkoutStatsTab`.
    - **Profile** → `WorkoutProfileTab`.
- **`WorkoutMemberProfile`**:
  - Overlay modal that shows another member’s profile and last 30 days of workouts using `getProfileByUsername` and `getLogsByUser`.
- **`WorkoutPasscodeGate`**:
  - Simple passcode form that talks to `/api/workout/gate`.
  - Stores gate success in localStorage.
- **`WorkoutAuth`**:
  - Email/password sign‑in/up UI with validation.
  - On sign‑in, calls `onSignedIn` to let `WorkoutPage` re‑query auth state.
- **`WorkoutInstallPrompt`**:
  - Bottom‑sheet style prompt on mobile after sign‑in to suggest adding `/workout` to the home screen, with platform‑specific instructions.
- **`AppToast` (ToastProvider + `useToast`)**:
  - Cross‑mini‑app toast system with variants: success, error, info, and timer.
  - Used heavily in the Workout, Stats, Profile, and Recovery tabs.

### 4.3 Workout tab stack (`app/workout/workout-tab`)

- **`index.tsx` (`WorkoutTab`)**:
  - Glue component that:
    - Loads `WorkoutSettings`.
    - Chooses between `SetupWizard` and `GetFitWorkoutTracker`.
- **`SetupWizard`**:
  - 3‑step wizard configuring:
    - Tracking style (schedule, sequence, exercise days).
    - Modes (progressive overload, drop sets, RPE).
    - Timer and units.
  - Writes to `workout_settings` via `upsertWorkoutSettings`.
- **`GetFitWorkoutTracker`**:
  - Main GetFit‑style planner and logger.
  - Integrates:
    - Local‑first `AppData` via `loadAppData`, `updateAppData`, `subscribe`.
    - `WorkoutSettings` (modes and preferences).
    - Finish flow that writes to `AppData.workoutHistory` and `workout_logs`.
  - Renders:
    - Sticky day navigator (with sequence/inconsistent support).
    - Per‑exercise cards with collapsible sets and inline editing.
    - Add Exercise modal.
    - Finish workout button.
- **`getfit/storage.ts` & `getfit/dataStore.ts`**:
  - Storage utilities for the GetFit tracker (see schema above).
  - Wrap `workoutLocalFirst` to provide simple `loadAppData` / `updateAppData` / `flushWorkoutData` API.
- **`types.ts` (Local UI types)**:
  - `LocalSet`, `LocalExercise`, `DEFAULT_DROP_PERCENT`.
  - Used by `ActiveSession` (session‑based flow).
- **`WorkoutHome`**:
  - Session‑based home view (legacy/alternate path).
  - Uses `getSuggestedToday(settings)` and `getMySessions(userId)` to:
    - Show “Suggested today” call‑to‑action.
    - Show “Start custom workout”.
    - List recent sessions with navigation to `SessionDetail`.
- **`ActiveSession`**:
  - UI for an in‑progress session using the session tables.
  - Handles:
    - Live timer from `session.started_at`.
    - Adding/removing exercises and sets (local `LocalExercise[]`).
    - Progressive overload hints via `getExerciseHistoryForNames`.
    - Per‑set rest timer and notifications.
  - On finish, calls `finishWorkoutSession`.
- **`SessionDetail`**:
  - Read‑only view backed by `getSessionWithDetails(sessionId)`.
  - Shows per‑exercise sets from `workout_exercises` and `workout_sets`.
  - Offers “Delete workout”, which calls `deleteSession(sessionId, userId)` and navigates back.
- **`WorkoutTypePicker`**:
  - Part of the session‑based flow.
  - Loads `WorkoutTemplate[]` and lets the user choose `Push`, `Pull`, `Legs`, etc., leveraging templates if they exist; otherwise, returns selected label and `null` template ID to callers.

### 4.4 Analytics and progress components

- **`components/progress/progressUtils.ts`**:
  - Pure helpers for:
    - `computeOverview`, `computeWeeklyBuckets`, `computeStreak`.
    - `computeExerciseSeries`, `getUniqueExerciseNames`.
- **`components/progress/Sparkline.tsx`**:
  - Lightweight SVG sparkline used for weekly trends and per‑exercise best‑weight‑over‑time.
- **`WorkoutProgressTab`**:
  - Local‑first progress view on top of `AppData.workoutHistory`.
  - Sections:
    - Overview metrics (7‑ and 30‑day windows, plus streak).
    - Trends (workouts/weight per week).
    - Per‑exercise progress (PR cards + sparkline + session list).
- **`WorkoutRecoveryTab`**:
  - Muscle recovery dashboard based on workout history’s categories, with configurable recovery windows per muscle group and body‑part images.
- **`WorkoutStatsTab`**:
  - Combined view using Supabase logs (`getMyLogs`, `getWorkoutStatsSummary`) and local history for:
    - Summary stats (streak, last 7/30 days, minutes).
    - Top lifts with total volume.
    - Per‑exercise mini‑stats via the `ProgressSection`.
    - Searchable/deletable workout history list backed by `AppData.workoutHistory`.

### 4.5 Feed and profile components

- **`WorkoutFeedTab`**:
  - Displays a list of `WorkoutLogWithProfile` entries with:
    - Avatar and name/username.
    - Workout type, date, and quick stats.
    - Expandable per‑exercise details (if `notes` contains JSON).
    - Emoji reactions with real‑time counts.
    - Admin delete controls when a user is an app admin.
- **`WorkoutProfileTab`**:
  - Handles:
    - Profile creation/editing (`getMyProfile`, `upsertProfile`).
    - Default rest time (persists via `upsertWorkoutSettings`).
    - Import/export of `AppData` as JSON.
    - Reset setup (calls `/api/workout/reset-setup`, then adjusts `AppData` to restart wizard).
    - Reset everything (calls `/api/workout/reset-all`, clears local workout storage, and navigates to the Workout tab).
    - Supabase sign‑out.

### 4.6 Theme and shared UI

- The workout mini‑app uses a shared theme based on CSS variables such as `--bg`, `--bg2`, `--bg3`, `--text`, `--textMuted`, `--ice`, and `--iceSoft`, defined in `app/globals.css` and tokenized in `tokens.ts`.
- Core UI primitives from `components/ui` (e.g. `Button`, `Input`, `Heading`) and shell components (`AppShell`, `GlassPanel`, motion helpers) are re‑used throughout the workout components but are not specific to `/workout`.
- Animations use `framer-motion` for:
  - Tab underlines.
  - Page transitions (gate/auth/app).
  - Collapsible sections (exercise cards, pickers, modals).

### 4.7 Service worker and push

- **`public/workout-sw.js`**:
  - Lightweight service worker focused on:
    - Claiming clients on install/activate.
    - Handling navigation requests under `/workout` by simply forwarding to `fetch`.
    - Handling `push` events: shows notifications with title/body/url; defaults to “Workout” and `/workout` if unspecified.
    - Handling `notificationclick` to deep‑link into `/workout` (or a custom payload URL).
- Combined with `/api/push/subscription` and `/api/push/send` (not detailed here), this enables push notifications for workout reminders or updates.

## 5. Supabase Usage

This section summarizes how Supabase is used across the `/workout` feature and distinguishes client‑side vs server‑side usage.

### 5.1 Clients

- **Browser client (`lib/supabase/client.ts`)**:
  - Created with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  - Used by all client components (`WorkoutPage`, tabs, chat, etc.) for:
    - Auth (`supabase.auth.*`).
    - CRUD operations via the `lib/supabase/workout.ts` helper functions.
- **Service‑role admin client (`lib/supabase/admin.ts`)**:
  - Created with `SUPABASE_SERVICE_ROLE_KEY`.
  - Limited to server‑side contexts (Next API routes) for:
    - Resetting workout data (`/api/workout/reset-all`, `/api/workout/reset-setup`).
    - Deleting any `workout_logs` row as an admin (`/api/workout/admin-delete-log`).
    - Checking `app_admins` membership.
- **Server‑side anon client (in admin helpers)**:
  - Created with `NEXT_PUBLIC_SUPABASE_URL` + anon key but with `persistSession: false`.
  - Used by `getUserIdFromRequest` and `getUserEmailFromRequest` to decode JWTs from `Authorization: Bearer <access_token>` in API routes.

### 5.2 Access patterns

- **Direct client usage (browser)**:
  - All `lib/supabase/workout` functions use the browser client:
    - Configuration: `getWorkoutSettings`, `upsertWorkoutSettings`, `resetWorkoutSetup`, `resetWorkoutEverything`.
    - GetFit sync: `getWorkoutGetfitSync`, `upsertWorkoutGetfitSync`.
    - Templates: `getUserTemplates`, `getTemplateExercises`, `createTemplateWithExercises`.
    - Session logging: `getActiveSession`, `getLastCompletedSession`, `getSessionWithDetails`, `getMySessions`, `updateSession`, `deleteSession`, `startWorkoutSession`, `addTemplateToSession`, `finishWorkoutSession`.
    - History/suggestions: `getExerciseHistoryForNames`, `updateExerciseHistoryFromSession` (internal).
    - Profiles: `getMyProfile`, `upsertProfile`, `getProfileByUsername`, `getAllProfiles`.
    - Feed/logs: `getCommunityFeed`, `getMyLogs`, `getLogsByUser`, `insertLog`, `updateLog`, `deleteLog`.
    - Reactions: `getReactionsForLogs`, `toggleReaction`.
    - Stats: `getWorkoutStatsSummary`, `getCommunityLeaderboard`.
  - All of these are standard Supabase client operations over HTTPS and are invoked from React `useEffect`s or event handlers.
- **Server‑side Supabase usage (API routes)**:
  - `/api/workout/gate`:
    - No Supabase; pure env and in‑memory rate‑limiting.
  - `/api/workout/reset-setup`:
    - Uses `getUserIdFromRequest` to identify the caller.
    - Uses `getSupabaseAdmin` to reset the user’s row in `workout_settings` to a default configuration, optionally inserting a new row if none existed.
  - `/api/workout/reset-all`:
    - Uses `getUserIdFromRequest` + `getSupabaseAdmin`.
    - Deletes cascade‑like rows for the user:
      - `workout_sets` → `workout_exercises` → `workout_sessions`.
      - `template_exercises`, `workout_templates`.
      - `exercise_history`, `workout_logs`, `workout_getfit_sync`, `workout_settings`.
    - Re‑inserts a default `workout_settings` row to restart setup.
  - `/api/workout/check-admin`:
    - Uses `getUserEmailFromRequest` + `isEmailAdmin` to return `{ admin }`.
  - `/api/workout/admin-delete-log`:
    - Uses `getUserEmailFromRequest` and `isEmailAdmin` to authorize the caller.
    - Uses `getSupabaseAdmin` to delete the specified `workout_logs` row.
  - `/workout/chat`:
    - `ChatShell` uses the browser client, but chat backend RLS must ensure users can only see rooms they belong to; messages themselves are not proxied through a separate API.

### 5.3 Local‑first vs direct Supabase

- **Local‑first (GetFit)**:
  - All editing is done in local React state and `AppData`.
  - Supabase `workout_getfit_sync` writes happen in the background via `workoutLocalFirst`:
    - Debounced (1.5s).
    - With exponential backoff and max retries.
    - Failures are logged but do not affect the UI.
  - The only synchronous Supabase call in this flow is `insertLog` on workout completion.
- **Direct Supabase (session‑based)**:
  - `startWorkoutSession`, `finishWorkoutSession`, and session detail APIs write directly to relational tables and must succeed for the data to exist.
  - This flow is safer for multi‑device consistency but currently less integrated into UI than the GetFit tracker.

### 5.4 Server actions

- There are **no Next.js Server Actions** in this feature.
- All server‑side operations are implemented as explicit API routes using `NextRequest`/`NextResponse` plus Supabase admin helpers.

## 6. Risks / Weaknesses

- **Dual logging pipelines**:
  - There are two different ways to represent workouts:
    - Local‑first `AppData.workoutHistory` (GetFit tracker).
    - Session‑based `workout_sessions`/`workout_exercises`/`workout_sets`.
  - Today the visible UI uses only the GetFit path; the session tables are populated only if the alternate `ActiveSession`‑based UI is used.
  - Stats and feed helpers are written to support both, which increases complexity and the risk of inconsistent behavior between users depending on which path they use.
- **Duplication and drift**:
  - Streak logic is implemented twice (in `WorkoutStatsTab` and `progressUtils`).
  - Volume and per‑exercise PR calculations exist both in local helpers and in database‑centric helpers.
  - There is an older copy of workout components under `focusedontom/app/workout/...`, which can confuse maintainers if both trees are edited.
- **Potential double‑logging / ranking inflation**:
  - In `GetFitWorkoutTracker`, the **Finish** button does not track a “saving” state; a user could theoretically tap it multiple times, causing:
    - Multiple `workoutHistory` entries for the same date.
    - Multiple `workout_logs` rows for the same workout.
  - Since `getCommunityLeaderboard` and Stats use raw `workout_logs`, this could inflate counts or rankings.
  - The session‑based `finishWorkoutSession` flow guards against double submission via a `saving` flag, but the GetFit flow does not.
- **Schema and indexing blind spots**:
  - Indexes are explicitly defined only for:
    - `workout_logs` (by `created_at` and `(user_id, date)`).
    - `workout_getfit_sync` (`updated_at`).
    - `workout_log_reactions` (`log_id`, `user_id`).
  - Indices for `workout_sessions`, `workout_exercises`, `workout_sets`, `exercise_history`, `workout_settings`, `workout_templates`, and `template_exercises` are inferred but not shown in repo SQL.
  - If those indexes are missing in production, queries like `getWorkoutStatsSummary` and `backfillExerciseDetailsForLogs` may become slow at scale.
- **JSON in `notes` field**:
  - `workout_logs.notes` is a free‑form `text` used for both textual notes and JSON arrays of exercises/sets.
  - Type detection relies on heuristic JSON parsing; corrupt or mixed formats can cause logs to display as “No exercise details recorded”.
  - Very large `notes` payloads (many sets) increase row size and could impact feed query performance.
- **Local‑first sync robustness**:
  - Errors in `getWorkoutGetfitSync`/`upsertWorkoutGetfitSync` are swallowed with `console.warn` and do not surface to users.
  - There is no conflict resolution beyond “remote overwrites local if present”; if two devices diverge offline, merging relies on the latest writer winning.
  - `AppData.savedWorkouts` and `workoutHistory` are untyped `unknown[]` at the storage boundary; normalization is defensive but cannot prevent all shape drift.
- **Admin trust model**:
  - Admin identity is based solely on the `app_admins` email list and access tokens.
  - `/api/workout/admin-delete-log` uses a service role to delete any log; a compromised admin account can silently delete arbitrary workout logs.
- **Chat feature maturity**:
  - `/workout/chat` is explicitly marked as “not fully functional”.
  - It creates a global “Gym Chat” room for all users; there is no per‑user or role‑based visibility beyond whatever RLS is configured.
  - Chat tables are not documented in SQL here, making them harder to manage/migrate.
- **XP system absent despite leaderboard helpers**:
  - There is no dedicated XP table or column; `getCommunityLeaderboard` returns per‑user aggregates on the fly.
  - Any XP computation would need to be deterministic and idempotent over `workout_logs`, or stored separately, to avoid inconsistencies.
- **Streaks not persisted**:
  - Streaks are computed from either `workout_logs` or `AppData.workoutHistory` in memory.
  - There is no persisted streak count; long‑range historical changes (e.g. back‑dated logs or deletions) can retroactively change streaks without explicit user awareness.

## 7. Upgrade Readiness Assessment

The current `/workout` architecture is well‑positioned for incremental upgrades. **Adding XP** is relatively straightforward at the application layer: XP can be computed deterministically from existing `workout_logs` fields (e.g. minutes, sets, or volume) and surfaced via a new Supabase table (e.g. `workout_xp` with `user_id`, `xp`, and breakdown fields) or on‑the‑fly leaderboard queries; the main work is choosing an XP formula and wiring it into the completion paths (`insertLogFromSession` and `GetFitWorkoutTracker.completeWorkout`). **Adding persistent streak tracking** is also tractable because streak calculations already exist in pure functions; you could either persist daily completion flags in a compact `workout_days(user_id, date)` table or add streak summary columns alongside profiles/workout stats, recalculated when logs change, while continuing to use the existing in‑memory helpers for UI. To support both XP and streaks in a robust way, the primary changes would be: (1) formalizing a single canonical source of truth for “a completed workout day” (preferably `workout_logs`), (2) tightening the logging flows to avoid duplicate or missing log rows (especially in GetFit’s Finish handler), and (3) adding well‑indexed aggregate tables or views that expose XP, streaks, and leaderboard data in O(1) or O(log n) per user for the UI to consume.

