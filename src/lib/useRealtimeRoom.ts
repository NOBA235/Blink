import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";
import { OpenRoom, getOpenRooms } from "./roomActions";

export type RoomParticipant = {
  room_id: string;
  profile_id: string;
  role: "contestant" | "host";
  status: "active" | "eliminated" | "matched" | "left";
  joined_at: string;
  profile?: {
    name?: string;
    age?: number;
    photo_url?: string;
    location?: string;
    interests?: string[];
    prompts?: { q: string; a: string }[];
  };
};

export type HostedRoom = {
  id: string;
  host_id: string;
  title: string;
  vibe: string;
  max_participants: number;
  phase: string;
  created_at: string;
  closed_at: string | null;
  host?: {
    name?: string;
    age?: number;
    photo_url?: string;
  };
};

export type RoomEvent = {
  id: number;
  room_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  sender_id?: string;
  created_at: string;
};

export type OpenRoomListing = OpenRoom;

export type ChatMessage = {
  id: number;
  match_id: string;
  sender_id: string;
  text: string;
  created_at: string;
};

export function useHostedRoom(roomId: string | null) {
  const [room, setRoom] = useState<HostedRoom | null>(null);
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
        supabase.from("rooms").select("*, host:host_id(*)").eq("id", roomId).single(),
        supabase.from("room_participants").select("*, profile:profile_id(*)").eq("room_id", roomId),
        supabase.from("room_events").select("*").eq("room_id", roomId).order("created_at", { ascending: true }),
      ]);
      if (cancelled) return;
      if (roomRes.error) { setError(roomRes.error as Error); setLoading(false); return; }
      setRoom(roomRes.data as HostedRoom);
      setParticipants((participantsRes.data as RoomParticipant[]) || []);
      setEvents((eventsRes.data as RoomEvent[]) || []);
      if (eventsRes.data?.length) lastEventId.current = eventsRes.data[eventsRes.data.length - 1].id;
      setLoading(false);
    }
    loadInitial();

    const channel = supabase
      .channel(`hosted-room:${roomId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload: any) => setRoom((cur) => (cur ? { ...cur, ...payload.new } : cur))
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "room_participants", filter: `room_id=eq.${roomId}` },
        async (payload: any) => {
          const { data } = await supabase.from("profiles").select("*").eq("id", payload.new.profile_id).single();
          setParticipants((cur) => {
            if (cur.some(p => p.profile_id === payload.new.profile_id)) return cur;
            return [...cur, { ...payload.new, profile: data }];
          });
        }
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

  const activeParticipants = participants.filter((p) => p.status === "active" && p.role === "contestant");
  const eliminatedParticipants = participants.filter((p) => p.status === "eliminated" && p.role === "contestant");
  const hostQuestion = events.filter((e) => e.event_type === "host_question").pop() || null;
  const participantAnswers = events.filter((e) => e.event_type === "participant_answer");

  return { room, participants, activeParticipants, eliminatedParticipants, events, hostQuestion, participantAnswers, loading, error };
}

export function useOpenRooms(enabled: boolean) {
  const [rooms, setRooms] = useState<OpenRoomListing[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      setLoading(true);
      const data = await getOpenRooms();
      setRooms(data);
    } catch (err) {
      console.error("Failed to fetch open rooms:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!enabled) return;
    refresh();

    const channel = supabase
      .channel("public-rooms")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "rooms" }, refresh)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms" }, refresh)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled]);

  return { rooms, loading, refresh };
}

export function useRealtimeMessages(matchId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matchId) return;
    let cancelled = false;
    setLoading(true);

    supabase
      .from("messages")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (!cancelled) { setMessages((data as ChatMessage[]) || []); setLoading(false); }
      });

    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload: any) =>
          setMessages((cur) => (cur.some((m) => m.id === payload.new.id) ? cur : [...cur, payload.new]))
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  return { messages, loading };
}
