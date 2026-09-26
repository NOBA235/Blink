# Pop (React Native / Expo)

The real Expo Router app — same product, same Supabase backend as the web
version, built against actual native primitives (no DOM, no CSS, no Web
Audio API) instead of running inside a browser.

## Run it locally

You'll need the Expo CLI and, for a real device/simulator, Xcode (iOS) or
Android Studio (Android) — or just use Expo Go on your phone for the
fastest path to actually seeing this run.

```bash
npm install
cp .env.example .env   # fill in your Supabase project's values
npx expo start
```

Scan the QR code with Expo Go, or press `i` / `a` for a simulator.

**On package versions:** `package.json` lists reasonable versions for Expo
SDK 57, but the single most reliable way to get versions that are actually
compatible with each other is to let Expo's own tooling resolve them:

```bash
npx expo install --fix
```

Run that after `npm install` if you hit any dependency-mismatch warnings.

## This shares its backend with the web app

Same Supabase project, same schema, same AI host. A real judge on the
web app and a real judge on this native app can end up in the same live
room together.

The host is **not** Gemini inside the React Native bundle. Live rooms
subscribe to `room_events` rows with `event_type = 'host_line'`. Those
rows are written by `supabase/functions/generate-host-line`, which calls
**Gemini 3.5 Flash** (`gemini-3.5-flash`) using `GEMINI_API_KEY` stored
as a Supabase secret. Local (bot) rooms invoke that same function and
fall back to canned lines if it isn't deployed yet.

You need to:

1. Run the three migrations in `supabase/migrations/` against your project.
2. Fill in `.env` with `EXPO_PUBLIC_SUPABASE_URL` and
   `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Deploy the host function and set the Gemini secret (see `.env.example`).
4. Run the two `alter database` statements in `.env.example` so the
   `on_room_event_notify_host` trigger can POST into the function.

## What's different from the web version, and why

Every one of these is a real platform constraint, not a shortcut:

- **Sound**: the web app synthesized tones live with the Web Audio API —
  React Native has no equivalent synthesis primitive. `assets/sounds/*.wav`
  are real short audio files, generated offline by directly computing PCM
  sample data (not downloaded from anywhere), mirroring the web version's
  exact tones. `src/lib/sound.tsx` bridges `expo-audio`'s hook-only
  `useAudioPlayer` API with a plain `playSound()` function any screen can
  call, via a provider at the root of the app.
- **Haptics**: `navigator.vibrate()` doesn't exist on this platform —
  `expo-haptics` gives discrete impact/notification types instead of
  arbitrary millisecond patterns, so the web app's vibration patterns were
  mapped to the closest matching haptic per moment rather than replicated
  literally.
- **Storage**: `localStorage` doesn't exist here — `src/lib/storage.ts`
  wraps `@react-native-async-storage/async-storage` behind the same
  get/set/delete shape the web version uses, and Supabase's auth session
  itself persists through the same AsyncStorage adapter (see
  `src/lib/supabase.ts`) so "stay signed in" survives an app restart.
- **Photo picking**: there's no `<input type="file">` — `expo-image-picker`
  requests a real permission and returns a real picked image, converted to
  a base64 data URI (same corner-cut as the web app: no real Supabase
  Storage upload yet, flagged there too).
- **Styling**: no CSS. Every screen is built with React Native's
  `StyleSheet` / inline style objects against the shared tokens in
  `src/theme.ts`, which hold the same color values as the web app's CSS
  custom properties.

## A note on how this was actually built — read this before trusting it

Everything here was written the same careful way as the web app and the
Supabase backend: I traced the room state machine by hand line-by-line
against the already-debugged web version rather than reimplementing it
from memory, and syntax-checked all 38 TypeScript/TSX files plus
cross-verified every import resolves to a real file. But I want to be
specific about what that validation can and can't tell you:

**What I could verify:** syntax correctness, that every file's structure
parses, that every import path is real, and — by re-tracing the exact
timer/decision logic against the web version line-by-line — that the local
room's game logic matches what was already debugged and confirmed working
there.

**What I could not verify, at all:** I have no React Native renderer, no
Metro bundler, no simulator, and no device in the environment I wrote this
in. Every render test I ran for the *web* version of this app (dozens of
them, across every screen and every room phase) used `react-dom/server` —
which doesn't exist for React Native. There is no equivalent tool available
to me here. So while I'm confident the *logic* is right, I have not seen a
single one of these screens actually render, and layout issues, native API
surface mistakes, or Expo/RN version-specific quirks are realistically
where the first real bugs will be. Some specific things I'd genuinely watch
for the first time you run this: the `expo-audio`/`expo-haptics` API shape
(I verified `mediaTypes` for `expo-image-picker` against current docs
directly, but did not do the same for every single API call), the Metro
asset pipeline actually picking up the `.wav` files via the config I wrote,
and general RN styling gotchas (flexbox defaults differ subtly from CSS).

Run it, and send me whatever breaks first.
