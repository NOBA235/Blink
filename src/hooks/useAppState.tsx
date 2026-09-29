import { createContext, useContext, useState, useEffect, useRef, useMemo, ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { storage } from "../lib/storage";
import { supabase } from "../lib/supabase";
import { onAuthChange, signOut as supabaseSignOut } from "../lib/auth";
import { joinQueue, leaveQueue } from "../lib/roomActions";
import { useMyRoomAssignment } from "../lib/useRealtimeRoom";
import { pick } from "../data/hostLines";
import { CONTESTANT_POOL, type Contestant } from "../data/contestants";
import {
  type DatePreferencesState,
  DEFAULT_DATE_PREFERENCES,
} from "../types/dating";
import { usePremium } from "./usePremium";

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
  playedIds: string[];
  setPlayedIds: React.Dispatch<React.SetStateAction<string[]>>;
  soundEnabled: boolean;
  toggleSound: () => void;
  availableContestants: Contestant[];
  nextContestant: (excludeId?: string) => Contestant;
  resetEverything: () => Promise<void>;
  signOut: () => Promise<void>;
  afterAuth: () => Promise<"onboarding" | "app">;
  handleOnboardingComplete: (p: LocalProfile) => Promise<void>;
  updatePhoto: (uri: string) => void;
  // Date Preferences
  datePreferences: DatePreferencesState;
  updateDatePreferences: (prefs: Partial<DatePreferencesState>) => void;
  resetDatePreferences: () => void;
  // Room flow
  activeRoomContestant: Contestant | null;
  activeRealRoomId: string | null;
  queueWaiting: boolean;
  activeChat: LocalMatch | null;
  enterLocalRoom: (contestant?: Contestant) => void;
  attemptRealRoom: () => Promise<void>;
  cancelMatchmaking: () => void;
  handleLocalRoomExit: (result: { matched: boolean; contestant: Contestant; nextRoom?: boolean; openChat?: boolean; completed?: boolean }) => boolean;
  handleRealRoomExit: (result: { matched: boolean; matchId?: string; otherProfile?: any }) => void;
  openChat: (matchId: string) => void;
  closeChat: () => void;
  sendMockMessage: (matchId: string, text: string) => void;
};

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const premium = usePremium();
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [matches, setMatches] = useState<LocalMatch[]>([]);
  const [playedIds, setPlayedIds] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [datePreferences, setDatePreferences] = useState<DatePreferencesState>(DEFAULT_DATE_PREFERENCES);
  const [activeRoomContestant, setActiveRoomContestant] = useState<Contestant | null>(null);
  const [activeRealRoomId, setActiveRealRoomId] = useState<string | null>(null);
  const [queueWaiting, setQueueWaiting] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [pendingPremiumMatch, setPendingPremiumMatch] = useState<LocalMatch | null>(null);
  const hasRestored = useRef(false);
  const queueTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const myProfileId = session?.user?.id || null;

  useEffect(() => {
    if (!premium.isPremium || !pendingPremiumMatch) return;
    setMatches((current) => current.some((match) => match.id === pendingPremiumMatch.id) ? current : [...current, pendingPremiumMatch]);
    setPendingPremiumMatch(null);
  }, [premium.isPremium, pendingPremiumMatch]);

  useEffect(() => onAuthChange(setSession), []);

  const assignedRoomId = useMyRoomAssignment(myProfileId, queueWaiting);
  useEffect(() => {
    if (assignedRoomId && queueWaiting) {
      if (queueTimeoutRef.current) clearTimeout(queueTimeoutRef.current);
      setQueueWaiting(false);
      setActiveRealRoomId(assignedRoomId);
    }
  }, [assignedRoomId, queueWaiting]);

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
      // Resolve Supabase's persisted session before exposing the home screen.
      // Otherwise a fast tap on Host/Join can see a null user and send a
      // returning signed-in user back through auth.
      try {
        const { data } = await supabase.auth.getSession();
        if (!cancelled) setSession(data.session);
      } catch {
        // Auth errors are handled by the normal sign-in flow.
      }
      await minSplash;
      if (cancelled) return;
      if (restored?.profile) {
        setProfile(restored.profile);
        setMatches(restored.matches || []);
        setPlayedIds(restored.playedIds || []);
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
    const snapshot = { profile, matches, playedIds, soundEnabled, datePreferences };
    storage.set(STORAGE_KEY, JSON.stringify(snapshot)).catch(() => {});
  }, [profile, matches, playedIds, soundEnabled, datePreferences, booting]);

  const availableContestants = useMemo(
    () => CONTESTANT_POOL.filter((c) => !playedIds.includes(c.id)),
    [playedIds]
  );

  function nextContestant(excludeId?: string): Contestant {
    const fresh = CONTESTANT_POOL.filter((c) => c.id !== excludeId && !playedIds.includes(c.id));
    if (fresh.length) return fresh[Math.floor(Math.random() * fresh.length)];
    const anyOther = CONTESTANT_POOL.filter((c) => c.id !== excludeId);
    const pool = anyOther.length ? anyOther : CONTESTANT_POOL;
    return pool[Math.floor(Math.random() * pool.length)];
  }

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
    setPlayedIds([]);
    setDatePreferences(DEFAULT_DATE_PREFERENCES);
  }

  async function signOut() {
    try { await supabaseSignOut(); } catch {}
  }

  // Fires after a successful sign-up or sign-in: decides whether this
  // account still needs Onboarding, or already has a full profile.
  async function afterAuth(): Promise<"onboarding" | "app"> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Your session could not be restored. Please sign in again.");
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
    } catch {
      // Local profile is already set above — a failed sync just means this
      // account's server-side profile stays incomplete until next edit.
    }
  }

  function updatePhoto(uri: string) {
    setProfile((p) => (p ? { ...p, photo: uri } : p));
    if (myProfileId) {
      supabase.from("profiles").update({ photo_url: uri }).eq("id", myProfileId).then(() => {}, () => {});
    }
  }

  function enterLocalRoom(contestant?: Contestant) {
    if (!premium.canEnterRoom()) { premium.triggerPaywall(); return; }
    setActiveRoomContestant(contestant || nextContestant());
  }

  // Tries real matchmaking first; if it doesn't fill within ~12 seconds,
  // falls back to the local simulation rather than leaving the player
  // stuck in an empty queue. Mirrors the web app's attemptRealRoom exactly.
  async function attemptRealRoom() {
    if (!premium.canEnterRoom()) { premium.triggerPaywall(); return; }
    if (!myProfileId) { enterLocalRoom(); return; }
    setQueueWaiting(true);
    let immediateRoomId: string | null = null;
    try {
      immediateRoomId = await joinQueue("judge");
    } catch {
      setQueueWaiting(false);
      enterLocalRoom();
      return;
    }
    if (immediateRoomId) {
      setQueueWaiting(false);
      setActiveRealRoomId(immediateRoomId);
      return;
    }
    queueTimeoutRef.current = setTimeout(() => {
      setQueueWaiting((cur) => {
        if (!cur) return cur; // already resolved by the room-assignment effect
        leaveQueue().catch(() => {});
        enterLocalRoom();
        return false;
      });
    }, 12000);
  }

  function cancelMatchmaking() {
    if (queueTimeoutRef.current) clearTimeout(queueTimeoutRef.current);
    setQueueWaiting(false);
    leaveQueue().catch(() => {});
  }

  function handleLocalRoomExit(result: { matched: boolean; contestant: Contestant; nextRoom?: boolean; openChat?: boolean; completed?: boolean }): boolean {
    if (result.completed) premium.recordRoomVisit();
    setPlayedIds((ids) => (ids.includes(result.contestant.id) ? ids : [...ids, result.contestant.id]));
    let saved = false;
    if (result.matched) {
      const match: LocalMatch = { id: `${result.contestant.id}-${Date.now()}`, contestant: result.contestant, messages: [] };
      if (premium.canSaveMoreMatches(matches.length)) {
        saved = true;
        setMatches((m) => [...m, match]);
      } else {
        setPendingPremiumMatch(match);
        premium.triggerPaywall("It's a match! Upgrade Blink+ to keep this match.");
      }
      if (result.openChat && saved) setActiveChatId(match.id);
    }
    if (result.nextRoom) {
      setActiveRoomContestant(nextContestant(result.contestant.id));
    } else {
      setActiveRoomContestant(null);
    }
    return saved;
  }

  function handleRealRoomExit(result: { matched: boolean; matchId?: string; otherProfile?: any }) {
    premium.recordRoomVisit();
    setActiveRealRoomId(null);
    if (result.matched && result.matchId && premium.canSaveMoreMatches(matches.length)) {
      const match: LocalMatch = {
        id: result.matchId,
        contestant: { name: result.otherProfile?.name, photo: result.otherProfile?.photo_url },
        messages: [],
        isReal: true,
      };
      setMatches((m) => {
        setActiveChatId(match.id); return [...m, match];
      });
    } else if (result.matched && !premium.canSaveMoreMatches(matches.length)) {
      setPendingPremiumMatch({ id: result.matchId || `real-${Date.now()}`, contestant: { name: result.otherProfile?.name, photo: result.otherProfile?.photo_url }, messages: [], isReal: true });
      premium.triggerPaywall("It's a match! Upgrade Blink+ to keep this match.");
    }
  }

  function openChat(matchId: string) { setActiveChatId(matchId); }
  function closeChat() { setActiveChatId(null); }

  function sendMockMessage(matchId: string, text: string) {
    setMatches((cur) => cur.map((m) => (m.id === matchId ? { ...m, messages: [...m.messages, { from: "user" as const, text }] } : m)));
    setTimeout(() => {
      setMatches((cur) => cur.map((m) => {
        if (m.id !== matchId) return m;
        const replies = [
          "Ha, I like that. What made you say keep instead of pop?",
          "Okay you're funnier than your profile let on.",
          "Honestly wasn't sure I'd survive round one. Glad I did.",
        ];
        return { ...m, messages: [...m.messages, { from: "them" as const, text: pick(replies) }] };
      }));
    }, 1400 + Math.random() * 900);
  }

  const activeChat = matches.find((m) => m.id === activeChatId) || null;

  const value: AppStateValue = {
    booting, session, myProfileId, profile, setProfile, matches, setMatches,
    playedIds, setPlayedIds, soundEnabled, toggleSound: () => setSoundEnabled((s) => !s),
    availableContestants, nextContestant, resetEverything, signOut, afterAuth,
    handleOnboardingComplete, updatePhoto,
    datePreferences, updateDatePreferences, resetDatePreferences,
    activeRoomContestant, activeRealRoomId, queueWaiting, activeChat,
    enterLocalRoom, attemptRealRoom, cancelMatchmaking, handleLocalRoomExit, handleRealRoomExit,
    openChat, closeChat, sendMockMessage,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
