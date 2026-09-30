import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, ImageBackground, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Check, Users } from "lucide-react-native";
import { supabase } from "../lib/supabase";
import { useAppState } from "../hooks/useAppState";
import { theme } from "../theme";

const c = theme.color;

type HostedRoom = {
  id: string;
  title: string;
  vibe: string;
  max_participants: number;
  host_id: string;
  phase: string;
};

type HostedParticipant = { id: string; name: string; age: number | null; photo: string | null };

export function HostedRoomScreen({ roomId, onExit }: { roomId: string; onExit: () => void }) {
  const { myProfileId } = useAppState();
  const [room, setRoom] = useState<HostedRoom | null>(null);
  const [host, setHost] = useState<{ name: string; photo: string | null } | null>(null);
  const [participants, setParticipants] = useState<HostedParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isHost = Boolean(room && room.host_id === myProfileId);
  const nextPhase = useMemo(() => ({ round1: "round2", round2: "reveal", reveal: "final" } as Record<string, string>)[room?.phase || ""], [room?.phase]);

  const refresh = useCallback(async () => {
    const { data: roomData, error: roomError } = await supabase
      .from("rooms")
      .select("id, title, vibe, max_participants, host_id, phase")
      .eq("id", roomId)
      .single();
    if (roomError) {
      setError(roomError.message);
      setLoading(false);
      return;
    }

    const [hostResult, rosterResult] = await Promise.all([
      supabase.from("profiles").select("name, photo_url").eq("id", roomData.host_id).maybeSingle(),
      supabase.from("room_participants").select("profile_id, joined_at").eq("room_id", roomId).eq("role", "contestant").order("joined_at", { ascending: true }),
    ]);
    if (rosterResult.error) {
      setError(rosterResult.error.message);
      setLoading(false);
      return;
    }
    const ids = (rosterResult.data || []).map((row) => row.profile_id);
    const peopleResult = ids.length
      ? await supabase.from("profiles").select("id, name, age, photo_url").in("id", ids)
      : { data: [], error: null };
    if (peopleResult.error) {
      setError(peopleResult.error.message);
      setLoading(false);
      return;
    }
    const peopleById = new Map((peopleResult.data || []).map((person) => [person.id, person]));
    setRoom(roomData as HostedRoom);
    setHost({ name: hostResult.data?.name || "Blink player", photo: hostResult.data?.photo_url || null });
    setParticipants(ids.map((id) => {
      const person = peopleById.get(id);
      return { id, name: person?.name || "Player", age: person?.age ?? null, photo: person?.photo_url || null };
    }));
    setError(null);
    setLoading(false);
  }, [roomId]);

  useEffect(() => {
    void refresh();
    const channel = supabase.channel(`hosted-session:${roomId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "room_participants", filter: `room_id=eq.${roomId}` }, () => void refresh())
      .subscribe();
    const timer = setInterval(() => void refresh(), 8000);
    return () => {
      clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [roomId, refresh]);

  async function perform(action: () => Promise<{ error: { message: string } | null }>) {
    setBusy(true);
    setError(null);
    try {
      const result = await action();
      if (result.error) throw new Error(result.error.message);
      await refresh();
    } catch (err: any) {
      setError(err?.message || "Room action failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function startOrAdvance() {
    if (!room) return;
    const phase = room.phase === "lobby" ? "round1" : nextPhase;
    if (!phase) return;
    void perform(() => supabase.rpc("advance_hosted_room", { p_room_id: room.id, p_next_phase: phase }));
  }

  function leaveRoom() {
    if (!room) return;
    const action = isHost
      ? supabase.rpc("close_hosted_room", { p_room_id: room.id })
      : supabase.rpc("leave_hosted_room", { p_room_id: room.id });
    setBusy(true);
    setError(null);
    void action.then(({ error: actionError }) => {
      if (actionError) throw new Error(actionError.message);
      onExit();
    }).catch((err: any) => {
      setError(err?.message || "Could not leave this room. Please try again.");
    }).finally(() => setBusy(false));
  }

  const started = room && room.phase !== "lobby";
  const phaseLabel: Record<string, string> = {
    round1: "First impressions",
    round2: "Icebreaker round",
    reveal: "Profile reveal",
    final: "Final pick",
  };

  if (loading && !room) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={c.primary} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={["top", "bottom"]}>
      <ImageBackground source={host?.photo ? { uri: host.photo } : require("../../assets/images/icon.png")} resizeMode="cover" blurRadius={14} style={{ flex: 1, backgroundColor: "#211722" }}>
        <LinearGradient colors={["rgba(12,8,15,0.34)", "rgba(12,8,15,0.54)", "rgba(12,8,15,0.96)"]} locations={[0, 0.4, 1]} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 14 }}>
          <Pressable onPress={leaveRoom} disabled={busy} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(20,12,20,0.6)", alignItems: "center", justifyContent: "center" }}><ArrowLeft color={c.white} size={20} /></Pressable>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "rgba(20,12,20,0.62)", paddingHorizontal: 12, paddingVertical: 9, borderRadius: 99 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: started ? "#57D994" : "#FF6173" }} />
            <Text style={{ color: c.white, fontSize: 11, fontWeight: "800", letterSpacing: 0.6 }}>{started ? "ROOM IN PROGRESS" : isHost ? "YOUR ROOM IS LIVE" : "LIVE ROOM"}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(20,12,20,0.62)", paddingHorizontal: 11, paddingVertical: 9, borderRadius: 99 }}>
            <Users size={14} color={c.white} /><Text style={{ color: c.white, fontSize: 12, fontWeight: "700" }}>{participants.length}/{room?.max_participants || 4}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end", paddingHorizontal: 22, paddingTop: 50, paddingBottom: 28 }}>
          <View style={{ alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.16)", borderRadius: 99, paddingHorizontal: 12, paddingVertical: 7, marginBottom: 13 }}>
            <Text style={{ color: c.white, fontSize: 12, fontWeight: "600" }}>{room?.vibe || "Open vibe"} · {host?.name || "Host"}'s room</Text>
          </View>
          <Text style={{ color: c.white, fontSize: 34, lineHeight: 40, fontWeight: "800", marginBottom: 7 }}>{room?.title || "Hosted room"}</Text>
          <Text style={{ color: "rgba(255,255,255,0.82)", fontSize: 16, lineHeight: 23, marginBottom: 20 }}>
            {started ? `${phaseLabel[room?.phase || ""] || "The room"} · follow along with the host` : isHost ? "Your room is open. Players who join will show up here." : "You’re in. The host will start when everyone is ready."}
          </Text>

          <View style={{ gap: 9, marginBottom: 20 }}>
            <Text style={{ color: c.white, fontSize: 15, fontWeight: "800" }}>In this room · {participants.length}</Text>
            {isHost && participants.length === 0 ? <Text style={{ color: "rgba(255,255,255,0.78)", fontSize: 14 }}>Waiting for the first player to join…</Text> : null}
            {participants.map((person) => (
              <View key={person.id} style={{ flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: "rgba(20,12,20,0.54)", borderRadius: 16, padding: 11 }}>
                {person.photo ? <Image source={{ uri: person.photo }} style={{ width: 42, height: 42, borderRadius: 21 }} /> : <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.22)" }} />}
                <Text style={{ color: c.white, fontSize: 14, fontWeight: "700", flex: 1 }}>{person.name}{person.age ? `, ${person.age}` : ""}</Text>
                <Check size={16} color="#57D994" />
              </View>
            ))}
          </View>

          {!!error && <Text style={{ color: "#FFD1D1", fontSize: 13, marginBottom: 12 }}>{error}</Text>}
          {isHost ? (
            <>
              {(room?.phase === "lobby" || nextPhase) && (
                <Pressable disabled={busy || (room?.phase === "lobby" && participants.length === 0)} onPress={startOrAdvance} style={{ minHeight: 54, borderRadius: 27, backgroundColor: c.white, alignItems: "center", justifyContent: "center", opacity: busy || (room?.phase === "lobby" && participants.length === 0) ? 0.55 : 1 }}>
                  {busy ? <ActivityIndicator color={c.primary} /> : <Text style={{ color: c.primary, fontSize: 15, fontWeight: "800" }}>{room?.phase === "lobby" ? "Start the room" : `Continue · ${phaseLabel[nextPhase || ""]}`}</Text>}
                </Pressable>
              )}
              <Pressable onPress={leaveRoom} disabled={busy} style={{ alignItems: "center", padding: 14 }}><Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: "600" }}>Close room</Text></Pressable>
            </>
          ) : (
            <Pressable onPress={leaveRoom} disabled={busy} style={{ minHeight: 54, borderRadius: 27, backgroundColor: c.white, alignItems: "center", justifyContent: "center" }}>
              {busy ? <ActivityIndicator color={c.primary} /> : <Text style={{ color: c.primary, fontSize: 15, fontWeight: "800" }}>Leave room</Text>}
            </Pressable>
          )}
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}
