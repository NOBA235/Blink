# Blink

<div align="center">

**Dating, but make it a game.**  
*Blind first impressions. Real-time matchmaking. Autonomous AI Host. Editorial Date Concierge.*

[![Expo SDK](https://img.shields.io/badge/Expo_SDK-57.0.0-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime_%26_Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Gemini](https://img.shields.io/badge/AI_Host-Gemini_3.5_Flash-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)

</div>

---

## Executive Overview

**Blink** is a next-generation consumer mobile dating experience built for the modern attention economy. By replacing endless, low-intent swiping with high-energy live speed dating rooms, Blink delivers authentic chemistry at scale. 

Contestants step into the hot seat before a live panel of five judges. Across rapid-fire decision rounds, an autonomous AI Host provides live commentary, witty roasts, and personality prompts. Players who survive the cut transition into private direct chats and a bespoke, **Hinge-inspired Date Preferences Engine** that curates their ideal date activities, dining spots, and drinks.

---

## Key Highlights

### ⚡ Live Speed-Dating Game Loop
* **Multi-Round Elimination**: Rapid blind first impressions where judges vote in real time (`keep` or `pop`).
* **Reveal Phase**: Unveils lifestyle, career, and photos only after chemistry is established.
* **Instant Matchmaking**: Distributed room allocation powered by Supabase Realtime with automatic local fallback to guarantee sub-10s time-to-game.

### 🎙️ Autonomous AI Host
* Powered by **Gemini 3.5 Flash** on Deno edge runtimes.
* Context-aware lines generated dynamically from contestants' real-time answers and judge voting trends.
* Zero-latency fallback cache for rock-solid stability even in low-connectivity conditions.

### 🍷 Editorial Date Concierge & Preferences
* **Hinge-Grade Aesthetics**: Warm blush/lavender-gray canvas (`#FAF4F8`), deep plum branding (`#4E214E`), and sophisticated Georgian editorial typography.
* **Responsive Category Architecture**: Tactile visual cards for date activities (`Drinks`, `Dining`, `Cinema`, `Live Music`, `Stroll`, `Arcades`) with zero overflow on any device viewport.
* **Dynamic Date Style Summary**: Real-time aggregation of food and beverage pairings (`Pizza · Sushi`, `Coffee · Cocktails`) with clean empty states.

### 🎧 Tactile Multi-Sensory UX
* **Offline PCM Audio Engine**: Zero-latency native audio synthesis for room ticks, pops, keeps, and match celebrations via `expo-audio`.
* **Physics-Driven Haptics**: Subtle, discrete tactile feedback on card taps, chip selections, and voting actions via `expo-haptics`.
* **Mobile-First Ergonomics**: Strict $\ge 44\times 44\text{dp}$ touch targets, Dynamic Island compatibility, and full bottom Safe Area insets.

---

## System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        BLINK CLIENT (EXPO / RN)                        │
│                                                                        │
│   Expo Router (Stack + Tabs)                                           │
│   ├── (tabs)/home ──── Live Rooms, Profile Health, Date Concierge      │
│   ├── (tabs)/rooms ─── Room Lineup & Blind Queues                      │
│   ├── (tabs)/matches ─ Verified Matches & Realtime Chat                │
│   ├── date-special ─── Date Concierge Onboarding                       │
│   └── date-preferences Things to Do, Foods, Drinks & Summary Card      │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │
       WebSockets (Realtime)      │      PostgREST API / Storage
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          SUPABASE CLUSTER                              │
│                                                                        │
│   ├── Postgres Engine: profiles, rooms, room_judges, room_events       │
│   ├── Database Trigger: on_room_event_notify_host                      │
│   ├── Realtime Channels: broadcast vote tallies & room state transitions│
│   └── Edge Functions: generate-host-line (Deno Runtime)               │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         GEMINI 3.5 FLASH ENGINE                        │
│   Generates contextual host banter, roasts & personality questions     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```text
blink/
├── app/                              # Expo Router file-based navigation
│   ├── _layout.tsx                   # Root navigation, theme & audio providers
│   ├── (tabs)/                       # Tab navigator: Home, Rooms, Matches, Profile
│   ├── date-special.tsx              # Screen 1: Date Special Onboarding
│   ├── date-preferences.tsx          # Screen 2: Date Preferences & Summary Card
│   ├── room.tsx                      # Live / local speed dating game room
│   ├── chat.tsx                      # High-intent 1:1 post-match messaging
│   └── auth.tsx                      # Supabase authentication flow
├── src/
│   ├── components/
│   │   ├── dating/                   # Editorial Hinge-inspired dating components
│   │   │   ├── TopTabHeader.tsx      # Multi-section category tab navigation
│   │   │   ├── PreferenceChip.tsx    # Tactile multi-select chip with checkmark
│   │   │   ├── PreferenceChipGroup.tsx # Chip groupings with dynamic counters
│   │   │   ├── DateCategoryCard.tsx  # Responsive pastel category cards
│   │   │   ├── PreferenceSummaryCard.tsx # "Your date style" dynamic summary
│   │   │   └── PrimaryCTA.tsx        # 54dp tactile plum button with safe insets
│   │   ├── ui.tsx                    # Shared atomic UI primitives
│   │   ├── JudgeAvatar.tsx           # Live contestant & judge avatar system
│   │   └── BottomSheet.tsx           # Modal presentation layer
│   ├── screens/                      # Screen views separated from routing
│   │   ├── DateSpecialScreen.tsx     # Date Special onboarding view
│   │   ├── DatePreferencesScreen.tsx # Interactive date preferences engine
│   │   ├── HomeScreen.tsx            # Live room launchpad & concierge card
│   │   ├── LocalRoomScreen.tsx       # State-machine driven speed-dating simulator
│   │   ├── RealRoomScreen.tsx        # Multi-user WebSocket live room
│   │   └── ProfileScreen.tsx         # User profile & date style showcase
│   ├── hooks/
│   │   └── useAppState.tsx           # Global state orchestrator with persistence
│   ├── types/
│   │   └── dating.ts                 # Domain models for dating preferences
│   ├── theme.ts                      # Design tokens, color palette & typography
│   └── lib/                          # Audio, storage, auth & Supabase client
└── supabase/
    ├── functions/generate-host-line/ # AI host edge function (Gemini 3.5 Flash)
    └── migrations/                   # SQL schemas, triggers, and RLS policies
```

---

## Design System

| Token | Hex / Spec | Purpose |
| :--- | :--- | :--- |
| **Background** | `#FAF4F8` | Warm blush lavender-gray background |
| **Surface** | `#FFFFFF` | Crisp card and container surface |
| **Primary** | `#4E214E` | Signature deep plum brand accent |
| **Primary Dark** | `#3D193D` | Active press state for primary CTAs |
| **Active Selection** | `#F4EBF4` | Selected chip & tab background |
| **Active Text** | `#4E214E` | Selected chip & tab label |
| **Inactive Border** | `#E2DAE2` | Unselected chip & control border |
| **Inactive Text** | `#4A4A4A` | Secondary readable body typography |
| **Editorial Serif** | `Georgia` / `serif` | High-impact headlines with editorial warmth |
| **Touch Targets** | $\ge 44\times 44\text{dp}$ | Accessible touch geometry on all interactive elements |

---

## Quickstart

### Prerequisites
* Node.js $\ge 18$
* Expo CLI (`npm install -g expo-cli`)
* iOS Simulator (macOS / Xcode) or Android Emulator (Android Studio), or [Expo Go](https://expo.dev/go)

### 1. Clone & Install
```bash
git clone https://github.com/your-org/blink.git
cd blink/blink
npm install
```

### 2. Configure Environment
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```
Fill in your Supabase credentials:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
```

### 3. Launch Development Server
```bash
npx expo start
```
* Press `i` to open in iOS Simulator.
* Press `a` to open in Android Emulator.
* Scan the terminal QR code with **Expo Go** on your physical device.

---

## Backend & AI Host Setup

Blink connects to a Supabase project for real-time room synchronization and user authentication.

1. **Apply Migrations**:
   Run the SQL scripts in `supabase/migrations/` sequentially in your Supabase SQL editor:
   * `0001_init.sql` — Profiles, rooms, messages, and RLS security policies.
   * `0002_phase_engine.sql` — State machine schema for multi-round game phases.
   * `0003_host_trigger.sql` — Real-time event notifications for the AI Host.

2. **Deploy the Gemini AI Host Function**:
   ```bash
   supabase functions deploy generate-host-line
   supabase secrets set GEMINI_API_KEY=your_gemini_api_key
   ```

---

## Code Quality & Verification

The codebase maintains 100% strict TypeScript compliance with zero compiler errors:

```bash
# Type check all routes, components, and hooks
npx tsc --noEmit
```

---

## Engineering Standards

* **No Unnecessary Dependencies**: Built with lean, native Expo and React Native primitives.
* **Offline-First Persistence**: Profile state and preferences sync to `@react-native-async-storage/async-storage` for instantaneous app launches.
* **Responsive Architecture**: Percentage and flex-based layout calculations ensure flawless rendering across phones, foldables, and tablets.
* **Accessibility**: ARIA labels, semantic roles (`button`, `tab`), and selection states baked into every custom control.

---

<div align="center">
Made with care by the Blink Team.
</div>
