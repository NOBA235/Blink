import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ActivityIndicator, Image, ImageBackground, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Heart, MessageCircle, Users, X } from "lucide-react-native";
import { supabase } from "../lib/supabase";
import { useAppState } from "../hooks/useAppState";
import { theme } from "../theme";

const c = theme.color;
type Person = { id: string; name: string; age: number | null; photo: string | null; interests: string[]; prompts: { q: string; a: string }[] };
type EventRow = { id: number; event_type: string; payload: Record<string, any> };
type MatchRow = { id: string; profile_id_a: string; profile_id_b: string };

export function HostedRoomScreen({ roomId, onExit, onOpenChat }: { roomId: string; onExit: () => void; onOpenChat: () => void }) {
  const { myProfileId, openRealChat } = useAppState();
  const [room, setRoom] = useState<any>(null);
  const [host, setHost] = useState<any>(null);
  const [participants, setParticipants] = useState<Person[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [match, setMatch] = useState<MatchRow | null>(null);
  const [matchPerson, setMatchPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionDraft, setQuestionDraft] = useState("");
  const [answerDraft, setAnswerDraft] = useState("");

  const isHost = Boolean(room && room.host_id === myProfileId);
  const activePeople = participants.filter((p: any) => p.status === "active");
  const question = events.find((e) => e.event_type === "personality_question")?.payload?.question || "";
  const myAnswer = events.find((e) => e.event_type === "personality_answer" && e.payload.profile_id === myProfileId);
  const matchId = match?.id;
  const otherId = match ? (match.profile_id_a === myProfileId ? match.profile_id_b : match.profile_id_a) : null;

  const refresh = useCallback(async () => {
    const roomResult = await supabase.from("rooms").select("id,title,vibe,max_participants,host_id,phase").eq("id", roomId).maybeSingle();
    if (roomResult.error || !roomResult.data) { setError(roomResult.error?.message || "Room not found."); setLoading(false); return; }
    const [hostResult, rosterResult, eventResult, matchResult] = await Promise.all([
      supabase.from("profiles").select("id,name,age,photo_url,interests,prompts").eq("id", roomResult.data.host_id).maybeSingle(),
      supabase.from("room_participants").select("profile_id,joined_at,status").eq("room_id", roomId).eq("role", "contestant").order("joined_at", { ascending: true }),
      supabase.from("room_events").select("id,event_type,payload").eq("room_id", roomId).order("created_at", { ascending: true }),
      supabase.from("matches").select("id,profile_id_a,profile_id_b").eq("room_id", roomId).maybeSingle(),
    ]);
    const roster = rosterResult.data || [];
    const ids = roster.map((r) => r.profile_id);
    const peopleResult = ids.length ? await supabase.from("profiles").select("id,name,age,photo_url,interests,prompts").in("id", ids) : { data: [], error: null };
    if (rosterResult.error || eventResult.error || peopleResult.error) {
      setError(rosterResult.error?.message || eventResult.error?.message || peopleResult.error?.message || "Could not load the room.");
      setLoading(false); return;
    }
    const byId = new Map((peopleResult.data || []).map((p: any) => [p.id, p]));
    setRoom(roomResult.data);
    setHost(hostResult.data || { name: "Blink player" });
    setParticipants(roster.map((r: any) => {
      const p: any = byId.get(r.profile_id);
      return { id: r.profile_id, name: p?.name || "Player", age: p?.age ?? null, photo: p?.photo_url || null, interests: p?.interests || [], prompts: p?.prompts || [], status: r.status };
    }));
    setEvents(eventResult.data || []);
    const nextMatch = matchResult.data || null;
    setMatch(nextMatch);
    const selectedId = nextMatch ? (nextMatch.profile_id_a === roomResult.data.host_id ? nextMatch.profile_id_b : nextMatch.profile_id_a) : null;
    if (selectedId) {
      const selected = selectedId === roomResult.data.host_id ? hostResult.data : byId.get(selectedId);
      if (selected) setMatchPerson({ id: selected.id, name: selected.name || "Player", age: selected.age ?? null, photo: selected.photo_url || null, interests: selected.interests || [], prompts: selected.prompts || [] });
    }
    setError(null); setLoading(false);
  }, [roomId]);

  useEffect(() => {
    void refresh();
    const channel = supabase.channel(`hosted-game:${roomId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "room_participants", filter: `room_id=eq.${roomId}` }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "room_events", filter: `room_id=eq.${roomId}` }, () => void refresh())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "matches", filter: `room_id=eq.${roomId}` }, () => void refresh())
      .subscribe();
    const timer = setInterval(() => void refresh(), 6000);
    return () => { clearInterval(timer); void supabase.removeChannel(channel); };
  }, [roomId, refresh]);

  async function run(action: () => Promise<any>) {
    setBusy(true); setError(null);
    try { const result = await action(); if (result?.error) throw new Error(result.error.message); await refresh(); }
    catch (e: any) { setError(e?.message || "Room action failed."); }
    finally { setBusy(false); }
  }
  function advance(phase: string) { if (!room) return; void run(() => supabase.rpc("advance_hosted_room", { p_room_id: room.id, p_next_phase: phase })); }
  function vote(personId: string, decision: "keep" | "pop", round: number) { void run(() => supabase.rpc("record_hosted_room_vote", { p_room_id: roomId, p_participant_id: personId, p_round: round, p_decision: decision })); }
  function leave() {
    if (!room) return;
    void run(async () => {
      const result = isHost
        ? await supabase.rpc("close_hosted_room", { p_room_id: room.id })
        : await supabase.from("room_participants").delete().eq("room_id", room.id).eq("profile_id", myProfileId).eq("role", "contestant");
      if (!result.error) onExit();
      return result;
    });
  }
  function openChat() {
    if (!matchId || !matchPerson) return;
    openRealChat(matchId, { name: matchPerson.name, photo: matchPerson.photo || "https://i.pravatar.cc/500?img=11" });
    onOpenChat();
  }
  function voted(id: string, round: number) { return events.some((e) => e.event_type === "host_vote" && e.payload.profile_id === id && Number(e.payload.round) === round); }

  if (loading && !room) return <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={c.primary} /></SafeAreaView>;
  const phase = room?.phase || "lobby";
  const phaseTitle: Record<string, string> = { lobby: "Your room is live", round1: "First impressions", round2_question: "The icebreaker", round2_decision: "Second impressions", reveal: "The reveal", final: "Make your pick", closed: "Room complete" };

  function personCard(person: Person, actions?: ReactNode) {
    return <View key={person.id} style={{ overflow: "hidden", borderRadius: 20, backgroundColor: "rgba(255,255,255,0.12)", marginBottom: 12 }}>
      {person.photo ? <Image source={{ uri: person.photo }} style={{ width: "100%", height: 210 }} resizeMode="cover" /> : <View style={{ height: 150, backgroundColor: "rgba(255,255,255,0.12)" }} />}
      <View style={{ padding: 14 }}>
        <Text style={{ color: c.white, fontSize: 20, fontWeight: "800" }}>{person.name}{person.age ? `, ${person.age}` : ""}</Text>
        {phase === "reveal" || phase === "final" ? <>
          {!!person.interests.length && <Text style={{ color: "rgba(255,255,255,0.84)", marginTop: 7 }}>{person.interests.join(" · ")}</Text>}
          {person.prompts?.slice(0, 1).map((p, i) => <Text key={i} style={{ color: "rgba(255,255,255,0.86)", marginTop: 9 }}>{p.q}{p.a ? `\n${p.a}` : ""}</Text>)}
        </> : null}
        {actions}
      </View>
    </View>;
  }

  return <SafeAreaView style={{ flex: 1, backgroundColor: "#211722" }} edges={["top", "bottom"]}>
    <ImageBackground source={host?.photo_url ? { uri: host.photo_url } : require("../../assets/images/icon.png")} resizeMode="cover" blurRadius={18} style={{ flex: 1 }}>
      <LinearGradient colors={["rgba(12,8,15,0.42)", "rgba(12,8,15,0.68)", "rgba(12,8,15,0.97)"]} locations={[0, 0.38, 1]} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingTop: 10 }}>
        <Pressable onPress={leave} disabled={busy} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(20,12,20,0.65)", alignItems: "center", justifyContent: "center" }}><ArrowLeft color={c.white} size={20} /></Pressable>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "rgba(20,12,20,0.65)", paddingHorizontal: 12, paddingVertical: 9, borderRadius: 99 }}><View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: phase === "closed" ? "#AAA" : "#57D994" }} /><Text style={{ color: c.white, fontSize: 11, fontWeight: "800" }}>{phase === "lobby" ? "LIVE ROOM" : phase.toUpperCase().replaceAll("_", " ")}</Text></View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(20,12,20,0.65)", paddingHorizontal: 11, paddingVertical: 9, borderRadius: 99 }}><Users size={14} color={c.white} /><Text style={{ color: c.white, fontSize: 12, fontWeight: "700" }}>{participants.length}/{room?.max_participants || 4}</Text></View>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 36, paddingBottom: 32 }}>
        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "700", marginBottom: 8 }}>{room?.vibe || "Open vibe"} · {host?.name || "Host"}'s room</Text>
        <Text style={{ color: c.white, fontSize: 32, lineHeight: 38, fontWeight: "800" }}>{room?.title || "Hosted room"}</Text>
        <Text style={{ color: "rgba(255,255,255,0.82)", fontSize: 18, fontWeight: "700", marginTop: 25, marginBottom: 12 }}>{phaseTitle[phase] || "Room"}</Text>

        {phase === "lobby" && <>
          <Text style={{ color: "rgba(255,255,255,0.82)", marginBottom: 14 }}>{isHost ? "Players appear here as they join. Start when you are ready." : `You're in ${host?.name || "the host"}'s room. The host will start when ready.`}</Text>
          {participants.map((p) => <View key={p.id} style={{ flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 15, padding: 10, marginBottom: 8 }}>{p.photo ? <Image source={{ uri: p.photo }} style={{ width: 44, height: 44, borderRadius: 22 }} /> : <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)" }} />}<Text style={{ color: c.white, fontSize: 15, fontWeight: "700" }}>{p.name}{p.age ? `, ${p.age}` : ""}</Text></View>)}
          {isHost && <Button label="Start the room" disabled={!activePeople.length || busy} onPress={() => advance("round1")} />}
        </>}

        {phase === "round1" && (isHost ? <>
          <Text style={{ color: "rgba(255,255,255,0.8)", marginBottom: 14 }}>Like the people you want to keep. Pass eliminates them from this room.</Text>
          {activePeople.map((p) => personCard(p, <VoteActions disabled={busy || voted(p.id, 1)} onKeep={() => vote(p.id, "keep", 1)} onPop={() => vote(p.id, "pop", 1)} done={voted(p.id, 1)} />))}
          <Button label="Continue to icebreaker" disabled={busy || !activePeople.length || activePeople.some((p) => !voted(p.id, 1))} onPress={() => advance("round2_question")} />
        </> : <Wait message="The host is looking through first impressions. Hang tight." />)}

        {phase === "round2_question" && (isHost ? <>
          <Text style={{ color: "rgba(255,255,255,0.82)", marginBottom: 12 }}>Ask everyone who made it through a question. Their answers appear here live.</Text>
          <TextInput value={questionDraft} onChangeText={setQuestionDraft} placeholder="Ask an icebreaker question…" placeholderTextColor="#d2c6d3" style={inputStyle} multiline />
          <Button label={question ? "Update question" : "Send question"} disabled={busy || !questionDraft.trim()} onPress={() => void run(() => supabase.rpc("set_hosted_room_question", { p_room_id: roomId, p_question: questionDraft.trim() }).then((r) => { if (!r.error) setQuestionDraft(""); return r; }))} />
          {!!question && <Text style={{ color: c.white, fontSize: 17, fontWeight: "700", marginTop: 20 }}>{question}</Text>}
          {activePeople.map((p) => { const a = events.find((e) => e.event_type === "personality_answer" && e.payload.profile_id === p.id); return <View key={p.id} style={{ padding: 14, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 15, marginTop: 10 }}><Text style={{ color: c.white, fontWeight: "800" }}>{p.name}</Text><Text style={{ color: "rgba(255,255,255,0.86)", marginTop: 5 }}>{a?.payload.answer || "Waiting for their answer…"}</Text></View>; })}
          {!!question && <Button label="Review answers" disabled={busy || activePeople.some((p) => !events.some((e) => e.event_type === "personality_answer" && e.payload.profile_id === p.id))} onPress={() => advance("round2_decision")} />}
        </> : <>
          {question ? <><Text style={{ color: c.white, fontSize: 18, lineHeight: 25, fontWeight: "700" }}>{question}</Text>{myAnswer ? <Wait message="Your answer is in. The host will review it shortly." /> : <><TextInput value={answerDraft} onChangeText={setAnswerDraft} placeholder="Type your answer…" placeholderTextColor="#d2c6d3" style={[inputStyle, { minHeight: 110 }]} multiline maxLength={500} /><Button label="Send answer" disabled={busy || !answerDraft.trim()} onPress={() => void run(() => supabase.rpc("submit_hosted_room_answer", { p_room_id: roomId, p_answer: answerDraft.trim() }).then((r) => { if (!r.error) setAnswerDraft(""); return r; }))} /></>}</> : <Wait message="The host is preparing an icebreaker question." />}
        </>)}

        {phase === "round2_decision" && (isHost ? <>
          <Text style={{ color: "rgba(255,255,255,0.82)", marginBottom: 14 }}>Use their answer to decide who moves forward.</Text>
          {activePeople.map((p) => { const a = events.find((e) => e.event_type === "personality_answer" && e.payload.profile_id === p.id); return personCard(p, <><Text style={{ color: "rgba(255,255,255,0.86)", marginTop: 8 }}>{a?.payload.answer || "No answer submitted"}</Text><VoteActions disabled={busy || voted(p.id, 2)} onKeep={() => vote(p.id, "keep", 2)} onPop={() => vote(p.id, "pop", 2)} done={voted(p.id, 2)} /></>); })}
          <Button label="Reveal profiles" disabled={busy || !activePeople.length || activePeople.some((p) => !voted(p.id, 2))} onPress={() => advance("reveal")} />
        </> : <Wait message="The host is reviewing everyone's answer." />)}

        {phase === "reveal" && (isHost ? <>
          <Text style={{ color: "rgba(255,255,255,0.82)", marginBottom: 14 }}>Full profiles are unlocked. Choose who you want to take to the final round.</Text>
          {activePeople.map((p) => personCard(p))}
          <Button label="Make the final pick" disabled={busy || !activePeople.length} onPress={() => advance("final")} />
        </> : <Wait message="Profiles are being revealed. The host will make a final pick soon." />)}

        {phase === "final" && (isHost ? <>
          <Text style={{ color: "rgba(255,255,255,0.82)", marginBottom: 14 }}>Pick the person you want to match with and start chatting.</Text>
          {activePeople.map((p) => personCard(p, <Pressable disabled={busy} onPress={() => void run(() => supabase.rpc("pick_match", { p_room_id: roomId, p_participant_id: p.id }))} style={pickStyle}><Heart size={17} color={c.white} fill={c.white} /><Text style={{ color: c.white, fontWeight: "800" }}>Pick {p.name}</Text></Pressable>))}
        </> : <Wait message="The host is choosing their match. We'll let you know here." />)}

        {phase === "closed" && (match && (isHost || otherId === myProfileId) ? <>
          <Text style={{ color: c.white, fontSize: 18, marginBottom: 16 }}>It's a match! Start your conversation.</Text>
          {!!matchPerson && <View style={{ alignItems: "center", marginBottom: 18 }}>{matchPerson.photo && <Image source={{ uri: matchPerson.photo }} style={{ width: 120, height: 120, borderRadius: 60, marginBottom: 12 }} />}<Text style={{ color: c.white, fontSize: 22, fontWeight: "800" }}>{matchPerson.name}</Text></View>}
          <Button label="Open your chat" onPress={openChat} icon={<MessageCircle size={18} color={c.white} />} />
        </> : <Wait message={match ? "The host picked someone else this time." : "This room has closed."} />)}

        {!!error && <Text style={{ color: "#FFD1D1", fontSize: 13, marginTop: 16 }}>{error}</Text>}
        {!isHost && phase !== "closed" && <Pressable onPress={leave} disabled={busy} style={{ alignItems: "center", padding: 16 }}><Text style={{ color: "rgba(255,255,255,0.78)", fontWeight: "700" }}>Leave room</Text></Pressable>}
        {isHost && phase !== "closed" && <Pressable onPress={leave} disabled={busy} style={{ alignItems: "center", padding: 16 }}><Text style={{ color: "rgba(255,255,255,0.78)", fontWeight: "700" }}>Close room</Text></Pressable>}
      </ScrollView>
    </ImageBackground>
  </SafeAreaView>;
}

const inputStyle: any = { minHeight: 56, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.32)", padding: 15, color: "#fff", backgroundColor: "rgba(255,255,255,0.13)", fontSize: 15, marginBottom: 12, textAlignVertical: "top" };
const pickStyle: any = { flexDirection: "row", gap: 9, alignItems: "center", justifyContent: "center", backgroundColor: c.primary, padding: 13, borderRadius: 13, marginTop: 12 };
function Button({ label, onPress, disabled, icon }: { label: string; onPress: () => void; disabled?: boolean; icon?: ReactNode }) {
  return <Pressable onPress={onPress} disabled={disabled} style={{ minHeight: 54, borderRadius: 27, backgroundColor: c.primary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, paddingHorizontal: 18, marginTop: 8, opacity: disabled ? 0.5 : 1 }}>{icon}{<Text style={{ color: c.white, fontSize: 15, fontWeight: "800" }}>{label}</Text>}</Pressable>;
}
function Wait({ message }: { message: string }) { return <View style={{ backgroundColor: "rgba(255,255,255,0.12)", padding: 18, borderRadius: 16 }}><Text style={{ color: c.white, fontSize: 15, lineHeight: 22 }}>{message}</Text></View>; }
function VoteActions({ disabled, done, onKeep, onPop }: { disabled: boolean; done: boolean; onKeep: () => void; onPop: () => void }) {
  return <View style={{ flexDirection: "row", gap: 10, marginTop: 13 }}>{done ? <Text style={{ color: "#9ce5bd", fontWeight: "700", padding: 10 }}>Decision saved</Text> : <><Pressable disabled={disabled} onPress={onKeep} style={{ flex: 1, flexDirection: "row", gap: 7, alignItems: "center", justifyContent: "center", backgroundColor: "#32845D", padding: 12, borderRadius: 13, opacity: disabled ? 0.5 : 1 }}><Heart size={16} color={c.white} /><Text style={{ color: c.white, fontWeight: "800" }}>Like · Keep</Text></Pressable><Pressable disabled={disabled} onPress={onPop} style={{ flex: 1, flexDirection: "row", gap: 7, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.18)", padding: 12, borderRadius: 13, opacity: disabled ? 0.5 : 1 }}><X size={16} color={c.white} /><Text style={{ color: c.white, fontWeight: "800" }}>Pass</Text></Pressable></>}</View>;
}
