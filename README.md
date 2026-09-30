# Blink

**License: MIT** — see [LICENSE](./LICENSE).

<div align="center">

**Find your perfect match. Connect with people who match your vibe.**  
*Real-time rooms. AI-powered compatibility. Meaningful connections.*

[![Expo SDK](https://img.shields.io/badge/Expo_SDK-57.0.0-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime_%26_Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Gemini](https://img.shields.io/badge/AI_Engine-Gemini_3.5_Flash-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)

</div>

---

## What is Blink?

**Blink** is a next-generation mobile app for finding people who truly match your vibe. Instead of endless swiping through profiles, Blink puts you in live rooms where real connections happen in real time.

**Host a room** and let people come to you — or **join someone's room** and compete to be their perfect match. An AI-powered **Whisper Engine** analyzes compatibility behind the scenes, helping hosts make better decisions based on shared interests, food preferences, and lifestyle alignment.

The result? Faster, more intentional connections with people you'll actually vibe with.

---

## How It Works

### 🎤 Host a Room
Create a live room, set the vibe (Casual, Romantic, Adventurous...), and wait for participants to join. You're in control.

### 🎯 Join a Room
Browse live rooms, see the host's vibe and profile, and jump in. Compete across three rounds to be their pick.

### 🤖 AI Whisper Engine
As participants join, Blink's AI analyzes their profile against yours — shared interests, food & drink preferences, activity alignment — and whispers compatibility insights only you can see: *"She shares 4 interests with you"*, *"His food preferences align 90%"*.

### 🔄 Three Rounds
1. **First Impressions** — Host sees participants with AI compatibility scores. Eliminate who doesn't fit.
2. **Icebreakers** — AI suggests personalized questions. Participants answer live. Host narrows down.
3. **The Reveal** — Full profiles unlocked. AI shows detailed compatibility breakdown. Host picks their match.

### 💬 Real Chat
Matched? Enter real-time private messaging powered by Supabase Realtime. No bots, no delays — just real conversation.

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Live Rooms** | Real-time multiplayer rooms with WebSocket sync via Supabase Realtime |
| **Host & Participant Roles** | Choose to host (you pick) or compete (get picked) |
| **AI Compatibility Engine** | Gemini 3.5 Flash analyzes profiles and generates whisper insights |
| **Date Preferences** | Curate your ideal date — activities, cuisines, drinks — powered by a Hinge-inspired UI |
| **Real-Time Chat** | Instant messaging with your matches via Supabase Realtime |
| **Tactile Audio & Haptics** | Native sound effects and device vibrations for immersive feedback |
| **Warm Editorial Design** | Hinge-grade aesthetics with deep plum branding and serif typography |

---

## Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        BLINK CLIENT (EXPO / RN)                        │
│                                                                        │
│   Expo Router (Stack + Tabs)                                           │
│   ├── (tabs)/home ──── Host a Room / Join a Room / Date Preferences    │
│   ├── (tabs)/rooms ─── Browse Live Rooms (real-time from Supabase)     │
│   ├── (tabs)/matches ─ Your Matches & Real-Time Chat                   │
│   ├── create-room ──── Room Setup (title, vibe, max participants)       │
│   ├── room ──────────── Host Room View / Participant Room View          │
│   ├── date-special ─── Date Concierge Onboarding                       │
│   └── date-preferences Activities, Foods, Drinks & Summary Card        │
└─────────────────────────────────────┬──────────────────────────────────┘
                                      │
         WebSockets (Realtime)        │        PostgREST API
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          SUPABASE CLUSTER                              │
│                                                                        │
│   ├── Postgres: profiles, rooms, room_participants, room_events,       │
│   │             compatibility_scores, matches, messages                 │
│   ├── RPCs: create_hosted_room, join_room, eliminate_participant,       │
│   │         pick_match, advance_hosted_room, get_open_rooms            │
│   ├── Realtime Channels: room state, participant joins, chat messages  │
│   └── Edge Functions: analyze-compatibility, generate-host-line        │
└─────────────────────────────────────┬──────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         GEMINI 3.5 FLASH ENGINE                        │
│   Analyzes profile compatibility & generates whisper insights          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```text
blink/
├── app/                              # Expo Router file-based navigation
│   ├── _layout.tsx                   # Root navigation, theme & audio providers
│   ├── (tabs)/                       # Tab navigator: Home, Rooms, Matches, Profile
│   ├── create-room.tsx               # Host room setup screen
│   ├── room.tsx                      # Live room dispatcher (Host/Participant views)
│   ├── date-special.tsx              # Date Concierge onboarding
│   ├── date-preferences.tsx          # Date Preferences editor
│   ├── chat.tsx                      # Real-time 1:1 messaging
│   └── auth.tsx                      # Authentication flow
├── src/
│   ├── screens/
│   │   ├── CreateRoomScreen.tsx      # Room creation with vibe & participant settings
│   │   ├── HostLobbyScreen.tsx       # Host waiting room with AI compatibility badges
│   │   ├── HostRoomScreen.tsx        # 3-round game from host's perspective
│   │   ├── ParticipantRoomScreen.tsx # Participant view with live question answering
│   │   ├── HomeScreen.tsx            # Host/Join CTAs & Date Preferences banner
│   │   ├── RoomsScreen.tsx           # Browse real live rooms from Supabase
│   │   ├── ChatScreen.tsx            # Real-time chat with matches
│   │   └── ProfileScreen.tsx         # User profile & preferences showcase
│   ├── components/
│   │   ├── dating/                   # Hinge-inspired dating UI components
│   │   └── ui.tsx                    # Shared atomic UI primitives
│   ├── hooks/
│   │   └── useAppState.tsx           # Global state with host/participant room flows
│   ├── lib/
│   │   ├── roomActions.ts            # Supabase RPCs for room management
│   │   ├── useRealtimeRoom.ts        # Real-time hooks for rooms, browsing & chat
│   │   ├── supabase.ts               # Supabase client initialization
│   │   └── sound.tsx                 # Audio & haptic feedback system
│   ├── types/
│   │   └── dating.ts                 # Domain models for dating preferences
│   └── theme.ts                      # Design tokens, color palette & typography
└── supabase/
    ├── functions/
    │   ├── analyze-compatibility/     # AI compatibility scoring (Gemini 3.5 Flash)
    │   └── generate-host-line/        # AI host commentary
    └── migrations/
        ├── 0001_init.sql              # Core schema: profiles, rooms, messages, RLS
        ├── 0002_phase_engine.sql      # Room phase state machine
        ├── 0003_host_trigger.sql      # Event notifications for AI
        ├── 0004_hosted_rooms.sql      # Hosted rooms, compatibility scores, new RPCs
        ├── 0007_hosted_room_join_leave.sql # Hosted-room join and leave RPCs
        ├── 0008_room_rls_no_recursion.sql # Room policies without recursive RLS
        ├── 0009_hosted_room_gameplay.sql # Like/pass, icebreakers, match pick, safe leave
        └── 0010_chat_access.sql         # Match-scoped chat reads and writes
```

---

## Design System

| Token | Value | Purpose |
|:------|:------|:--------|
| **Background** | `#FAF4F8` | Warm blush lavender-gray canvas |
| **Surface** | `#FFFFFF` | Crisp white cards and containers |
| **Primary** | `#4E214E` | Deep plum brand accent |
| **Active Selection** | `#F4EBF4` | Selected chip & tab background |
| **Border** | `#EFE8EF` | Subtle card and control borders |
| **Editorial Serif** | `Georgia` / `serif` | High-impact editorial headlines |
| **Touch Targets** | ≥ 44 × 44 dp | Accessible touch geometry on all controls |

---

## Quickstart

### Prerequisites
* Node.js ≥ 18
* Expo CLI (`npm install -g expo-cli`)
* [Expo Go](https://expo.dev/go) on your phone, or iOS/Android emulator

### 1. Clone & Install
```bash
git clone https://github.com/NOBA235/Blink.git
cd Blink/blink
npm install --legacy-peer-deps
```

### 2. Configure Environment
```bash
cp .env.example .env
```
Fill in your Supabase credentials:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
```

### 3. Launch Development Server

#### Option A: Local Network (Same Wi-Fi)
```bash
npx expo start
```

#### Option B: Tunnel Mode (Recommended for Expo Go)
```bash
npx expo start --tunnel
```
* `@expo/ngrok` is pre-configured in `devDependencies` for seamless tunnel connections.
* Scan the QR code with **Expo Go** to test on your phone.
* Press `w` for Web, `i` for iOS Simulator, `a` for Android Emulator.

---

## RevenueCat Setup

1. Create a project named **Blink** at https://app.revenuecat.com and add the iOS and/or Android app.
2. Create an entitlement with identifier `premium`.
3. Create store products `blink_premium_monthly` ($4.99/month) and `blink_premium_annual` ($29.99/year).
4. Attach both products to the entitlement and add monthly and annual packages to the `default` offering.
5. In RevenueCat, open **Project settings → API keys**. Copy the **public SDK key** for each platform into `src/lib/revenuecat.ts`, replacing the placeholders:

   ```ts
   const RC_API_KEY_IOS = "appl_your_public_ios_sdk_key";
   const RC_API_KEY_ANDROID = "goog_your_public_android_sdk_key";
   ```

   Use the platform-specific key. Do not use a RevenueCat secret API key in the app.
6. Rebuild and reinstall the native development app after adding the SDK and keys. RevenueCat purchases are not available in Expo Go or web.
7. For the hackathon demo, open Settings and use **[DEV] Simulate Premium** in a development build to exercise premium screens without a store purchase.

The free tier includes five completed room visits per local calendar day and three saved matches. Room visit counts persist under `blink_room_visits` in AsyncStorage. Expo autolinks the native module; rebuild the native development client after adding the SDK.

## Backend Setup

### 1. Apply Migrations
Run the SQL scripts in `supabase/migrations/` sequentially in your Supabase SQL editor:
* `0001_init.sql` — Core schema, profiles, rooms, RLS policies
* `0002_phase_engine.sql` — Room phase state machine
* `0003_host_trigger.sql` — Event notifications for AI host
* `0004_hosted_rooms.sql` — Hosted rooms, compatibility scores, new RPCs
* `0005_repair_host_profile.sql` — Ensure existing users have profiles before hosting
* `0006_close_hosted_room.sql` — Allow hosts to close cancelled rooms
* `0007_hosted_room_join_leave.sql` — Guard hosted-room joins and participant exits
* `0008_room_rls_no_recursion.sql` — Fix recursive room visibility policies

### 2. Deploy Edge Functions
```bash
supabase functions deploy analyze-compatibility
supabase functions deploy generate-host-line
supabase secrets set GEMINI_API_KEY=your_gemini_api_key
```

---

## Code Quality

```bash
# Type check all routes, components, and hooks
npx tsc --noEmit
```

---

## Engineering Standards

* **Real-Time First**: All room interactions, chat, and browsing powered by Supabase Realtime WebSockets.
* **AI-Assisted, Human-Decided**: AI provides compatibility insights; the host makes the final call.
* **No Fake Data**: Every room, participant, match, and message is real.
* **Strict TypeScript**: Zero `any` types. Full type safety across the codebase.
* **Offline-First Persistence**: Profile and preferences sync to AsyncStorage for instant app launches.
* **Responsive Design**: Flex-based layouts ensure flawless rendering across all screen sizes.

---

<div align="center">
Made with care by the Noba;
</div>
