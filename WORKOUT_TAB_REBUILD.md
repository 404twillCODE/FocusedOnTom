# Workout Tab Rebuild

This document describes the v1 rebuild of the **Workout** tab (third tab in `/workout`). The rest of the app (gate, auth, tabs, Feed, Chat, Stats, Profile) is unchanged.

## What changed

- **Removed:** `app/workout/WorkoutLogTab.tsx` (single large file for the old Workout tab).
- **Added:** Isolated module `app/workout/workout-tab/`:
  - `index.tsx` – main `WorkoutTab` (loading, setup vs home vs active vs detail).
  - `SetupWizard.tsx` – 5-step first-time setup.
  - `WorkoutHome.tsx` – suggested today, “Start workout”, “Log workout anyway”, recent 10 sessions.
  - `ActiveSession.tsx` – session timer, exercises/sets, add exercise, drop sets, RPE, rest timer, finish.
  - `SessionDetail.tsx` – view past session, delete.
  - `types.ts` – local UI types.
- **Updated:** `app/workout/WorkoutAppTabs.tsx` – third tab now renders `WorkoutTab` from `./workout-tab`.
- **Updated:** `lib/supabase/workout.ts`:
  - `getSuggestedToday(settings)` – returns suggested workout for today (schedule or rotation).
  - `finishWorkoutSession` now requires `userId` in the payload; `updateExerciseHistoryFromSession` uses it so exercise_history upsert is correct under RLS.

## Schema and RLS

No new tables. Existing schema and RLS are sufficient:

- **Tables:** `workout_settings`, `workout_templates`, `template_exercises`, `exercise_history`, `workout_sessions`, `workout_exercises`, `workout_sets`.
- **Apply:** Run `supabase/schema.sql` and `supabase/rls.sql` as before (e.g. in Supabase SQL editor). No changes were made to those files for this rebuild.

## Breaking changes

- **Old Workout tab data:** Resetting is acceptable. Users who had incomplete setup or old wizard state will see the new wizard. Existing `workout_sessions`, `workout_exercises`, `workout_sets`, `exercise_history`, and `workout_settings` remain valid.
- **API:** Callers of `finishWorkoutSession` must now pass `userId` in the payload (only the new Workout tab calls it).

## How to test end-to-end

1. **Setup**
   - Open the app, sign in, go to the **Workout** tab (3rd tab).
   - If no settings or `setup_completed = false`, the setup wizard should appear.
   - Complete all 5 steps: tracking style → split → training options → preferences → Finish.
   - You should land on Workout Home.

2. **Workout Home**
   - “Suggested today” (if schedule/rotation set) and “Log workout anyway” both start a session.
   - Recent workouts list shows last 10 completed sessions; tap one to open Session Detail.

3. **Active session**
   - Header shows workout name and elapsed timer.
   - Add exercises, add sets; optional reps/weight, done checkbox, RPE (if enabled), rest timer (if enabled).
   - If “Drop sets” is on, “+ Drop set” adds a set with suggested weight reduction (~15%).
   - Progressive overload: “Last” / “Suggested” appears when history exists.
   - Finish workout: sets notes/duration, then “Finish workout”. Session is saved and you return to Workout Home.

4. **Session detail**
   - From Recent, open a session: view exercises/sets, optional “Delete workout”.

5. **Profile**
   - “Edit workout setup” resets `setup_completed` so the wizard shows again on next Workout tab open.
   - “Reset everything (Workout tab)” wipes workout data and resets setup.

## Files summary

| Action   | Path |
|----------|------|
| Deleted  | `app/workout/WorkoutLogTab.tsx` |
| Added    | `app/workout/workout-tab/index.tsx` |
| Added    | `app/workout/workout-tab/SetupWizard.tsx` |
| Added    | `app/workout/workout-tab/WorkoutHome.tsx` |
| Added    | `app/workout/workout-tab/ActiveSession.tsx` |
| Added    | `app/workout/workout-tab/SessionDetail.tsx` |
| Added    | `app/workout/workout-tab/types.ts` |
| Modified | `app/workout/WorkoutAppTabs.tsx` (import + render WorkoutTab for 3rd tab) |
| Modified | `lib/supabase/workout.ts` (getSuggestedToday, FinishSessionPayload.userId, exercise_history upsert) |
| Added    | `WORKOUT_TAB_REBUILD.md` (this file) |
