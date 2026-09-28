import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { storage } from "../lib/storage";
import { supabase } from "../lib/supabase";
import { onAuthChange, signOut as supabaseSignOut } from "../lib/auth";
import { createHostedRoom, joinRoom as joinRoomAction, analyzeCompatibility, CompatibilityResult } from "../lib/roomActions";
import {
  type DatePreferencesState,
  DEFAULT_DATE_PREFERENCES,
} from "../types/dating";

const STORAGE_KEY = "pop-state";

export type LocalProfile = {
  name: string;
  age: string;
  lookingFor: string;
  location: string;
  photo: string;
  hasVideo: boolean;
  interests: string[];
  prompts: { q: string; a: string }[];
  datePreferences?: DatePreferencesState;
};

export type LocalMatch = {
  id: string;
  contestant: { name: string; photo: string };
  messages: { from: "user" | "them"; text: string }[];
  isReal?: boolean;
};

export type ActiveRoomState = {
  id: string;
  role: "host" | "participant";
  title: string;
  vibe: string;
  maxParticipants: number;
};

function supabaseProfileToLocal(row: any): LocalProfile {
  return {
    name: row?.name || "You",
    age: row?.age ? String(row.age) : "—",
    lookingFor: row?.looking_for || "Everyone",
    location: row?.location || "Nearby",
    photo: row?.photo_url || "https://i.pravatar.cc/500?img=11",
    hasVideo: false,
    interests: row?.interests || [],
    prompts: row?.prompts || [],
  };
}

export function profileNeedsOnboarding(row: any): boolean {
  return !row || (!row.age && (row.interests || []).length === 0);
}

type AppStateValue = {
  booting: boolean;
  session: Session | null;
  myProfileId: string | null;
  profile: LocalProfile | null;
  setProfile: (p: LocalProfile) => void;
  matches: LocalMatch[];
  setMatches: React.Dispatch<React.SetStateAction<LocalMatch[]>>;
  soundEnabled: boolean;
  toggleSound: () => void;
  resetEverything: () => Promise<void>;
  signOut: () => Promise<void>;
  afterAuth: () => Promise<"onboarding" | "app">;
  handleOnboardingComplete: (p: LocalProfile) => Promise<void>;
  updatePhoto: (uri: string) => void;
  // Date Preferences
  datePreferences: DatePreferencesState;
  updateDatePreferences: (prefs: Partial<DatePreferencesState>) => void;
  resetDatePreferences: () => void;
  // Room state
  activeRoom: ActiveRoomState | null;
  compatibilityScores: Map<string, CompatibilityResult>;
  hostRoom: (title: string, vibe: string, max: number) => Promise<void>;
  joinRoom: (roomId: string, title: string, vibe: string, max: number) => Promise<void>;
  requestCompatibility: (roomId: string, participantId: string) => Promise<void>;
  exitRoom: () => void;
  handleMatch: (matchId: string, name: string, photo: string) => void;
  // Chat
  activeChat: LocalMatch | null;
  openChat: (matchId: string) => void;
  closeChat: () => void;
};

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [matches, setMatches] = useState<LocalMatch[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [datePreferences, setDatePreferences] = useState<DatePreferencesState>(DEFAULT_DATE_PREFERENCES);
  const [activeRoom, setActiveRoom] = useState<ActiveRoomState | null>(null);
  const [compatibilityScores, setCompatibilityScores] = useState<Map<string, CompatibilityResult>>(new Map());
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const hasRestored = useRef(false);

  const myProfileId = session?.user?.id || null;

  useEffect(() => onAuthChange(setSession), []);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      const minSplash = new Promise((r) => setTimeout(r, 700));
      let restored: any = null;
      try {
        const result = await storage.get(STORAGE_KEY);
        if (result?.value) restored = JSON.parse(result.value);
      } catch {
        restored = null;
      }
      await minSplash;
      if (cancelled) return;
      if (restored?.profile) {
        setProfile(restored.profile);
        setMatches(restored.matches || []);
        setSoundEnabled(restored.soundEnabled !== false);
      }
      if (restored?.datePreferences) {
        setDatePreferences(restored.datePreferences);
      } else if (restored?.profile?.datePreferences) {
        setDatePreferences(restored.profile.datePreferences);
      }
      hasRestored.current = true;
      setBooting(false);
    }
    boot();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!hasRestored.current || booting) return;
    const snapshot = { profile, matches, soundEnabled, datePreferences };
    storage.set(STORAGE_KEY, JSON.stringify(snapshot)).catch(() => {});
  }, [profile, matches, soundEnabled, datePreferences, booting]);

  function updateDatePreferences(next: Partial<DatePreferencesState>) {
    setDatePreferences((prev) => {
      const updated = { ...prev, ...next };
      setProfile((p) => (p ? { ...p, datePreferences: updated } : p));
      return updated;
    });
  }

  function resetDatePreferences() {
    setDatePreferences(DEFAULT_DATE_PREFERENCES);
    setProfile((p) => (p ? { ...p, datePreferences: DEFAULT_DATE_PREFERENCES } : p));
  }

  async function resetEverything() {
    try { await storage.delete(STORAGE_KEY); } catch {}
    setProfile(null);
    setMatches([]);
    setDatePreferences(DEFAULT_DATE_PREFERENCES);
  }

  async function signOut() {
    try { await supabaseSignOut(); } catch {}
  }

  async function afterAuth(): Promise<"onboarding" | "app"> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "onboarding";
    const { data: row } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (profileNeedsOnboarding(row)) return "onboarding";
    setProfile(supabaseProfileToLocal(row));
    return "app";
  }

  async function handleOnboardingComplete(p: LocalProfile) {
    setProfile(p);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ageNum = parseInt(p.age, 10);
      await supabase.from("profiles").update({
        name: p.name,
        age: Number.isFinite(ageNum) && ageNum >= 18 && ageNum <= 100 ? ageNum : null,
        looking_for: p.lookingFor,
        location: p.location,
        photo_url: p.photo,
        interests: p.interests,
        prompts: p.prompts,
        updated_at: new Date().toISOString(),
      }).eq("id", user.id);
    } catch {}
  }

  function updatePhoto(uri: string) {
    setProfile((p) => (p ? { ...p, photo: uri } : p));
    if (myProfileId) {
      supabase.from("profiles").update({ photo_url: uri }).eq("id", myProfileId).then(() => {}, () => {});
    }
  }

  async function hostRoom(title: string, vibe: string, max: number) {
    const id = await createHostedRoom(title, vibe, max);
    setActiveRoom({ id, role: "host", title, vibe, maxParticipants: max });
  }

  async function joinRoom(roomId: string, title: string, vibe: string, max: number) {
    await joinRoomAction(roomId);
    setActiveRoom({ id: roomId, role: "participant", title, vibe, maxParticipants: max });
  }

  async function requestCompatibility(roomId: string, participantId: string) {
    if (!myProfileId) return;
    try {
      const result = await analyzeCompatibility(roomId, myProfileId, participantId);
      setCompatibilityScores((prev) => {
        const next = new Map(prev);
        next.set(participantId, result);
        return next;
      });
    } catch (e) {
      console.error("Failed to analyze compatibility", e);
    }
  }

  function exitRoom() {
    setActiveRoom(null);
    setCompatibilityScores(new Map());
  }

  function handleMatch(matchId: string, name: string, photo: string) {
    const match: LocalMatch = {
      id: matchId,
      contestant: { name, photo },
      messages: [],
      isReal: true,
    };
    setMatches((m) => [...m, match]);
    setActiveChatId(matchId);
  }

  function openChat(matchId: string) { setActiveChatId(matchId); }
  function closeChat() { setActiveChatId(null); }

  const activeChat = matches.find((m) => m.id === activeChatId) || null;

  const value: AppStateValue = {
    booting, session, myProfileId, profile, setProfile, matches, setMatches,
    soundEnabled, toggleSound: () => setSoundEnabled((s) => !s),
    resetEverything, signOut, afterAuth, handleOnboardingComplete, updatePhoto,
    datePreferences, updateDatePreferences, resetDatePreferences,
    activeRoom, compatibilityScores, hostRoom, joinRoom, requestCompatibility, exitRoom, handleMatch,
    openChat, closeChat, activeChat,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
