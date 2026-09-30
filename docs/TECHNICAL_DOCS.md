# Blink — Technical Documentation & Architecture Specification

> **Version**: 1.0.0 (Production Release)  
> **Repository**: [github.com/NOBA235/Blink](https://github.com/NOBA235/Blink)  
> **Target Track**: RevenueCat Shipaton 2026 (Next Gen Track)

---

## 1. System Overview

**Blink** is a real-time, synchronous dating platform that replaces the asynchronous swipe-deck paradigm with live, interactive matchmaking rooms. 

The application is built on a client-server architecture powered by **React Native / Expo 57**, a **Supabase PostgreSQL & Realtime cluster**, **Google Gemini 3.5 Flash serverless edge functions**, and the **RevenueCat Native SDK** for subscription management.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BLINK CLIENT (EXPO / RN)                        │
│                                                                        │
│   Expo Router (File-based Navigation)                                  │
│   ├── (tabs)/home ──── Host CTA / Join Room / Date Preferences         │
│   ├── (tabs)/rooms ─── Browse Live Rooms (Supabase Realtime)           │
│   ├── (tabs)/matches ─ Active Matches & 1:1 Instant Chat               │
│   ├── create-room ──── Room Vibe & Participant Configuration           │
│   ├── room ─────────── Dispatcher: RealRoom / LocalRoom / Queue        │
│   ├── date-special ─── Date Concierge Onboarding                       │
│   └── date-preferences Curation: Activities, Cuisines & Drinks         │
└─────────────────────────────────────┬──────────────────────────────────┘
                                      │
         WebSockets (Realtime)        │        PostgREST / RPCs
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          SUPABASE BACKEND                              │
│                                                                        │
│   ├── PostgreSQL: profiles, rooms, room_participants, room_events,     │
│   │               compatibility_scores, matches, messages               │
│   ├── Transactional RPCs: create_hosted_room, join_room,               │
│   │                       submit_decision, submit_personality_answer   │
│   ├── Row Level Security (RLS): Deterministic tenant access            │
│   └── Deno Edge Functions: analyze-compatibility, generate-host-line   │
└─────────────────────────────────────┬──────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         GEMINI 3.5 FLASH ENGINE                        │
│   - Multi-vector similarity scoring & private host whisper insights    │
│   - Context-aware late-night dating show host lines & icebreakers      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Technical Architecture

### 2.1 Frontend Stack
* **Framework**: React Native 0.86 running on **Expo SDK 57** with strict TypeScript (`tsc --noEmit` clean).
* **Navigation**: File-based routing via `expo-router` (v57).
* **Tactile Multi-Sensory Feedback**:
  * Audio effects via `expo-audio` (tick, pop, keep, match celebration).
  * Haptic feedback via `expo-haptics` (impact styles calibrated to room eliminations and button presses).
* **Design System**: Editorial serif typography hierarchy (`Georgia`/`serif`) paired with a deep plum brand palette (`#4E214E`), blush lavender canvas (`#FAF4F8`), and accessible ≥ 44×44 dp touch targets.

### 2.2 Real-Time State Machine (Supabase)
Room gameplay operates as a synchronized finite state machine:
```
[lobby] ──> [round1] ──> [round2] ──> [reveal] ──> [final] ──> [matched] ──> [chat]
```
1. **Atomic RPCs**: Stored procedures (`0004_hosted_rooms.sql`) prevent race conditions during concurrent participant joins, eliminations, and phase advancement.
2. **Realtime Channels**: The client hook `useRealtimeRoom.ts` binds WebSocket listeners to Postgres change events on `rooms`, `room_participants`, and `room_events`, instantly reflecting updates across all connected devices.
3. **Dual-Path Resiliency**: If multiplayer matchmaking does not form a room within 12 seconds, the client gracefully routes into an interactive local simulation engine (`LocalRoomScreen.tsx`), allowing the app to be fully demonstrated offline or without concurrent testers.

### 2.3 The AI Whisper Engine (Gemini 3.5 Flash)
* Deployed via Supabase Deno Edge Functions (`analyze-compatibility` and `generate-host-line`).
* **Vector Similarity Engine**: Calculates Jaccard similarity across interest vectors (40%), food preferences (20%), activity alignment (30%), and drink choices (10%).
* **Private Whisper Insights**: Generates 2–3 concise, high-value compatibility summaries visible exclusively to the room host.
* **Resilient Fallback Banks**: If external LLM calls experience latency, local categorized script banks trigger immediately to prevent gameplay stutter.

### 2.4 Monetization Engine (RevenueCat)
* Built natively on `react-native-purchases` (SDK v10.10).
* **Entitlement Model**: Managed under the `premium` entitlement identifier.
  * **Free Tier**: 5 live room visits per calendar day and up to 3 saved matches.
  * **Blink+ Tier ($4.99/mo or $29.99/yr)**: Unlimited room visits, unlimited saved matches, priority lobby placement, and deep Gemini compatibility breakdowns.
* **Developer Simulation Mode**: Includes an instant `[DEV] Simulate Premium` toggle in Settings (`src/hooks/usePremium.tsx`) to exercise all paywall and subscription flows without store credentials.

### 2.5 AI-Assisted Engineering Workflow
As a solo developer building a full-stack real-time mobile application, I embraced modern AI-assisted pair programming tools—including **Claude Code**, **Replit**, and **Codex**—to accelerate scaffolding, debug complex PostgreSQL Row Level Security (RLS) policies, and iterate rapidly on React Native animation and audio mechanics. All architectural design decisions, schema planning, and system integration were directed and vetted by me.

---

## 3. How to Run the App (Judge & Developer Guide)

### Prerequisites
* **Node.js** ≥ 18.x
* **npm** or **yarn**
* **Expo Go** app on your physical iOS/Android device, or an active simulator/emulator.

### 1. Clone & Install
```bash
git clone https://github.com/NOBA235/Blink.git
cd Blink/blink
npm install --legacy-peer-deps
```

### 2. Environment Configuration
Create a `.env` file in the `blink/` root directory:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
```
*(A pre-configured `.env` is included in the project for seamless testing).*

### 3. Launch the Development Server
```bash
# Option A: Local Wi-Fi Network
npx expo start

# Option B: Tunnel Mode (Recommended for Expo Go on cellular/separate networks)
npx expo start --tunnel
```
* **To view on your phone**: Open **Expo Go** and scan the displayed QR code.
* **To view on an emulator**: Press `a` for Android Emulator or `i` for iOS Simulator.
* **To view in browser**: Press `w` for Web preview.

### 4. Testing Subscription & Premium Features (Judge Quick-Pass)
1. Open the app on your phone or emulator.
2. Tap your profile picture in the top-right corner to open **Settings**.
3. Tap **[DEV] Simulate Premium** to immediately toggle the full `Blink+` entitlement on or off.
4. Alternatively, visit 5 rooms in a row or fill your 3 match slots to trigger the live native **RevenueCat Paywall** modal.

---

## 4. Future Product & Technical Roadmap

With proper seed funding and team expansion, Blink will evolve across four strategic vectors:

### 1. Multimodal WebRTC Live Audio & Video Rooms
* **Technology**: WebRTC via LiveKit or Agora integration.
* **Mechanic**: Transitioning from synchronous avatars to 6-way live video. Video feeds remain blurred during Round 1 (First Impressions), reveal voice/audio in Round 2 (Icebreakers), and unmask video during Round 3 (The Reveal).
* **Gemini Multimodal Live Voice Host**: An autonomous conversational agent that monitors speech cadence, interjects witty late-night commentary, and moderates room safety in real time.

### 2. Closed-Loop Agentic Date Commerce
* **Mechanism**: Closing the loop between an online match and the real-world date.
* **Integration**: When two users match, Blink's agentic concierge cross-references their mutual Date Preferences (e.g., both love Japanese cuisine and craft cocktails) and uses the OpenTable, Resy, and Uber APIs to generate an executable date reservation.
* **Monetization**: 8–15% booking referral commissions on local venue spend.

### 3. Synchronous Prime-Time Drops ("The 8 PM Thursday Drop")
* **Mechanism**: Cultivating a recurring cultural habit by launching city-wide synchronized matching hours every Thursday and Sunday at 8:00 PM local time.
* **Impact**: Concentrates thousands of singles in the same metro area at the exact same moment, driving ultra-high concurrent liquidity and viral campus adoption.

### 4. Audience Spectator Mode & Creator Rooms
* **Mechanism**: Allowing friends or public audiences to join rooms as "Audience Judges" to upvote responses, send virtual gifts, and react with live audio soundboards. Local creators and campus ambassadors can host verified rooms with hundreds of spectators.
