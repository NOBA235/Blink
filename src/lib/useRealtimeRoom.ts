import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

export type RoomParticipant = {
  room_id: string;
  profile_id: string;
  role: "contestant" | "judge";
  round1_decision: "pending" | "keep" | "pop";
  round2_decision: "pending" | "keep" | "pop";
  joined_at: string;
  profile?: { name?: string; photo_url?: string };
};

export type Room = {
  id: string;
  contestant_id: string;
  phase: string;
  phase_deadline: string | null;
  created_at: string;
  closed_at: string | null;
  contestant?: {
    name?: string;
    age?: number;
    location?: string;
    photo_url?: string;
    interests?: string[];
  };
};

export type RoomEvent = { id: number; room_id: string; event_type: string; payload: any; created_at: string };

export type OpenHostedRoom = {
  id: string;
  title: string | null;
  vibe: string | null;
  max_participants: number | null;
  host_id: string;
  host_name: string | null;
  host_age: number | null;
  host_photo_url: string | null;
  participant_count: number;
};

// While waiting in the matchmaking queue, this is how a client finds out a
// room has formed and it's been placed in it. Relies on room_participants'
// self-referential RLS policy: a user can always see their own row, so
// Realtime is able to deliver this INSERT to them specifically.
export function useMyRoomAssignment(profileId: string | null, enabled: boolean) {
  const [roomId, setRoomId] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !profileId) return;
    const channel = supabase
      .channel(`my-assignment:${profileId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "room_participants", filter: `profile_id=eq.${profileId}` },
        (payload: any) => setRoomId(payload.new.room_id)
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profileId, enabled]);

  return roomId;
}

// Live state for a room you're already in: current phase/deadline, the
// roster with live decisions, and the append-only event feed (host lines,
// the personality question/answer, decisions, the final outcome).
export function useRealtimeRoom(roomId: string | null) {
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [events, setEvents] = useState<RoomEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const lastEventId = useRef(0);

  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function loadInitial() {
      const [roomRes, participantsRes, eventsRes] = await Promise.all([
        supabase.from("rooms").select("*, contestant:contestant_id(*)").eq("id", roomId).single(),
        supabase.from("room_participants").select("*, profile:profile_id(*)").eq("room_id", roomId),
        supabase.from("room_events").select("*").eq("room_id", roomId).order("created_at", { ascending: true }),
      ]);
      if (cancelled) return;
      if (roomRes.error) { setError(roomRes.error as Error); setLoading(false); return; }
      setRoom(roomRes.data as Room);
      setParticipants((participantsRes.data as RoomParticipant[]) || []);
      setEvents((eventsRes.data as RoomEvent[]) || []);
      if (eventsRes.data?.length) lastEventId.current = eventsRes.data[eventsRes.data.length - 1].id;
      setLoading(false);
    }
    loadInitial();

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload: any) => setRoom((cur) => (cur ? { ...cur, ...payload.new } : cur))
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "room_participants", filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          setParticipants((cur) =>
            cur.map((p) => (p.profile_id === payload.new.profile_id ? { ...p, ...payload.new } : p))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "room_events", filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          if (payload.new.id <= lastEventId.current) return;
          lastEventId.current = payload.new.id;
          setEvents((cur) => [...cur, payload.new]);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  return { room, participants, events, loading, error };
}

export type ChatMessage = { id: number; match_id: string; sender_id: string; text: string; created_at: string };

// Live messages for a real match.
export function useRealtimeMessages(matchId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) { setMessages([]); setLoading(false); return; }
    let cancelled = false;
    setMessages([]);
    setError(null);
    setLoading(true);

    async function loadMessages() {
      const { data, error: loadError } = await supabase.rpc("get_match_messages", { p_match_id: matchId });
      if (cancelled) return;
      if (loadError) setError(loadError.message);
      else {
        setError(null);
        setMessages((current) => {
          const byId = new Map(current.map((message) => [message.id, message]));
          for (const message of (data || []) as ChatMessage[]) byId.set(message.id, message);
          return [...byId.values()].sort((a, b) => a.created_at.localeCompare(b.created_at));
        });
      }
      setLoading(false);
    }
    void loadMessages();

    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload: any) => setMessages((cur) => (cur.some((m) => m.id === payload.new.id) ? cur : [...cur, payload.new].sort((a, b) => a.created_at.localeCompare(b.created_at))))
      )
      .subscribe();

    // Realtime can miss events during mobile backgrounding or a temporary
    // socket disconnect. Polling keeps both sides' conversation current.
    const timer = setInterval(() => void loadMessages(), 4000);

    return () => {
      cancelled = true;
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  return { messages, loading, error };
}
