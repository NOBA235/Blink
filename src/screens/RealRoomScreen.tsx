import { useState, useEffect, useMemo } from "react";
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Heart, X, MapPin, Briefcase, GraduationCap, Coffee } from "lucide-react-native";
import { theme } from "../theme";
import { PrimaryButton, IconButton, Card, Chip } from "../components/ui";
import { JudgeRow, type JudgeForDisplay } from "../components/JudgeAvatar";
import { AIHostCaption } from "../components/AIHostCaption";
import { useRealtimeRoom } from "../lib/useRealtimeRoom";
import { submitDecision as submitRealDecision, submitPersonalityAnswer } from "../lib/roomActions";
import { supabase } from "../lib/supabase";
import { useSound, buzzKeep, buzzPop, buzzTick, buzzMatch } from "../lib/sound";

const c = theme.color;

const REAL_PHASE_ROUND: Record<string, number> = {
  waiting_room: 0, intro: 1, countdown: 1, round1: 1, round1_results: 1,
  round2_question: 2, round2_answer: 2, round2_decision: 2, round2_results: 2,
  reveal: 3, final: 4, closed: 4,
};

type Outcome = { matched: boolean; matchId?: string; otherProfile?: any };

export function RealRoomScreen({
  roomId, myProfileId, myPhoto, soundEnabled, onExit,
}: {
  roomId: string;
  myProfileId: string;
  myPhoto: string;
  soundEnabled: boolean;
  onExit: (result: { matched: boolean; matchId?: string; otherProfile?: any }) => void;
}) {
  const { playSound } = useSound();
  const { room, participants, events, loading, error } = useRealtimeRoom(roomId);
  const [now, setNow] = useState(() => Date.now());
  const [answerDraft, setAnswerDraft] = useState("");
  const [decisionBusy, setDecisionBusy] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [reveal, setReveal] = useState<any>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!room || !["reveal", "final", "closed"].includes(room.phase)) return;
    let cancelled = false;
    supabase.from("profile_reveal").select("*").eq("profile_id", room.contestant_id).single()
      .then(({ data }) => { if (!cancelled) setReveal(data); });
    return () => { cancelled = true; };
  }, [room?.phase, room?.contestant_id]);

  useEffect(() => {
    if (room?.phase !== "closed" || outcome) return;
    let cancelled = false;
    supabase.from("matches").select("*, a:profile_id_a(*), b:profile_id_b(*)").eq("room_id", roomId).maybeSingle()
      .then(({ data }: any) => {
        if (cancelled) return;
        if (!data) { setOutcome({ matched: false }); return; }
        const iAmA = data.profile_id_a === myProfileId;
        const iAmB = data.profile_id_b === myProfileId;
        if (!iAmA && !iAmB) { setOutcome({ matched: false }); return; }
        const otherProfile = iAmA ? data.b : data.a;
        setOutcome({ matched: true, matchId: data.id, otherProfile });
      });
    return () => { cancelled = true; };
  }, [room?.phase, roomId, myProfileId, outcome]);

  const hostLine = useMemo(() => {
    const line = [...events].reverse().find((e) => e.event_type === "host_line");
    return line?.payload?.line || "";
  }, [events]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center", gap: 12 }}>
        <ActivityIndicator color={c.primary} size="large" />
        <Text style={{ color: c.text2, fontSize: theme.font.secondary }}>Connecting to your room...</Text>
      </SafeAreaView>
    );
  }
  if (error || !room) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 32 }}>
        <Text style={{ color: c.text, fontWeight: "600" }}>Couldn't load this room.</Text>
        <Text style={{ color: c.text2, fontSize: theme.font.secondary, textAlign: "center" }}>{error?.message || "It may have already ended."}</Text>
        <PrimaryButton onPress={() => onExit({ matched: false })} style={{ paddingHorizontal: 24, paddingVertical: 12 }}>Back home</PrimaryButton>
      </SafeAreaView>
    );
  }

  const isContestant = room.contestant_id === myProfileId;
  const judges: JudgeForDisplay[] = participants
    .filter((p) => p.role === "judge")
    .map((p) => ({
      id: p.profile_id,
      name: p.profile?.name || "Judge",
      photo: p.profile?.photo_url,
      isUser: p.profile_id === myProfileId,
      popped: p.round1_decision === "pop" || p.round2_decision === "pop",
    }));
  const myParticipant = participants.find((p) => p.profile_id === myProfileId);
  const deadlineMs = room.phase_deadline ? new Date(room.phase_deadline).getTime() : null;
  const secondsLeft = deadlineMs ? Math.max(0, Math.ceil((deadlineMs - now) / 1000)) : null;
  const roundNumber = REAL_PHASE_ROUND[room.phase] || 1;
  const contestantName = room.contestant?.name || "Someone";
  const latestQuestion = [...events].reverse().find((e) => e.event_type === "personality_question")?.payload?.question;
  const latestAnswer = [...events].reverse().find((e) => e.event_type === "personality_answer")?.payload;

  async function handleDecision(round: 1 | 2, decision: "keep" | "pop") {
    setDecisionError(null);
    setDecisionBusy(true);
    try {
      await submitRealDecision(roomId, round, decision);
      playSound(decision === "pop" ? "pop" : "keep", soundEnabled);
      decision === "pop" ? buzzPop() : buzzKeep();
    } catch (err: any) {
      setDecisionError(err?.message || "Couldn't submit that — try again.");
    } finally {
      setDecisionBusy(false);
    }
  }

  async function handleSubmitAnswer() {
    if (!answerDraft.trim()) return;
    try {
      await submitPersonalityAnswer(roomId, answerDraft.trim());
    } catch (err: any) {
      setDecisionError(err?.message || "Couldn't submit your answer — try again.");
    }
  }

  const myDecisionForRound = room.phase === "round1" ? myParticipant?.round1_decision : myParticipant?.round2_decision;
  const canDecide = !isContestant && myDecisionForRound === "pending" && !decisionBusy;

  function DecisionRow() {
    if (isContestant) return <Text style={{ textAlign: "center", color: c.text2, fontSize: theme.font.secondary, paddingVertical: 12 }}>The judges are deciding...</Text>;
    if (!canDecide) return <Text style={{ textAlign: "center", color: c.text2, fontSize: theme.font.secondary, paddingVertical: 12 }}>You're locked in. Waiting on the room...</Text>;
    return (
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24 }}>
        <View style={{ alignItems: "center", gap: 8 }}>
          <Pressable onPress={() => handleDecision(roundNumber as 1 | 2, "pop")} style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: c.surface2, borderWidth: 1, borderColor: c.border, alignItems: "center", justifyContent: "center" }}>
            <X size={24} color={c.text2} />
          </Pressable>
          <Text style={{ color: c.text3, fontSize: theme.font.caption }}>Pop</Text>
        </View>
        <View style={{ alignItems: "center", gap: 8 }}>
          <Pressable onPress={() => handleDecision(roundNumber as 1 | 2, "keep")} style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: c.primary, alignItems: "center", justifyContent: "center" }}>
            <Heart size={28} color={c.white} fill={c.white} />
          </Pressable>
          <Text style={{ color: c.primary, fontSize: theme.font.caption }}>Keep</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8 }}>
        {room.phase !== "closed" ? (
          <IconButton icon={<X size={16} color={c.text} />} onPress={() => onExit({ matched: false })} size={36} />
        ) : <View style={{ width: 36 }} />}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.danger }} />
          <Text style={{ color: c.text2, fontSize: theme.font.caption, fontWeight: "600" }}>
            Round {roundNumber} of 4{secondsLeft !== null ? ` · ${secondsLeft}s` : ""}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {room.phase !== "closed" && <JudgeRow judges={judges} />}

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 20, paddingBottom: 20 }}>
        {["waiting_room", "intro", "countdown"].includes(room.phase) && (
          <View style={{ gap: 20 }}>
            <View style={{ borderRadius: theme.radius.xl, overflow: "hidden", aspectRatio: 4 / 5, backgroundColor: c.surface2 }}>
              {room.contestant?.photo_url && <Image source={{ uri: room.contestant.photo_url }} style={{ width: "100%", height: "100%" }} />}
              <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 20, backgroundColor: "rgba(0,0,0,0.55)" }}>
                <Text style={{ color: c.white, fontSize: 24, fontWeight: "700" }}>{contestantName}{room.contestant?.age ? `, ${room.contestant.age}` : ""}</Text>
                {room.contestant?.location && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <MapPin size={13} color="rgba(255,255,255,0.7)" />
                    <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: theme.font.secondary }}>{room.contestant.location}</Text>
                  </View>
                )}
              </View>
              {room.phase === "countdown" && secondsLeft !== null && (
                <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.55)" }}>
                  <Text style={{ fontSize: 72, fontWeight: "700", color: c.white }}>{secondsLeft || "Go"}</Text>
                </View>
              )}
            </View>
            {(room.contestant?.interests?.length ?? 0) > 0 && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {room.contestant!.interests!.map((i) => <Chip key={i}>{i}</Chip>)}
              </View>
            )}
          </View>
        )}

        {room.phase === "round1" && (
          <View style={{ gap: 20 }}>
            <Text style={{ textAlign: "center", color: c.text2, fontSize: theme.font.secondary }}>First impressions — {contestantName}</Text>
            <DecisionRow />
          </View>
        )}

        {room.phase === "round1_results" && (
          <Text style={{ textAlign: "center", color: c.text2, fontSize: theme.font.secondary, paddingVertical: 32 }}>Round one is in. Moving to the personality round...</Text>
        )}

        {room.phase === "round2_question" && (
          <Card elevated>
            <Text style={{ color: c.text, fontSize: theme.font.secondary, fontWeight: "600", marginBottom: 8 }}>{latestQuestion || "Getting the question ready..."}</Text>
            {isContestant ? (
              <View style={{ gap: 12, marginTop: 12 }}>
                <TextInput
                  style={{ backgroundColor: c.surface3, borderRadius: theme.radius.md, padding: 14, color: c.text, minHeight: 72, textAlignVertical: "top" }}
                  multiline
                  maxLength={280}
                  placeholder="Answer live — everyone sees this the moment you submit it."
                  placeholderTextColor={c.text3}
                  value={answerDraft}
                  onChangeText={setAnswerDraft}
                />
                <PrimaryButton onPress={handleSubmitAnswer} disabled={!answerDraft.trim()}>Submit answer</PrimaryButton>
              </View>
            ) : (
              <Text style={{ color: c.text3, fontSize: theme.font.caption, marginTop: 8 }}>Waiting for {contestantName} to answer live...</Text>
            )}
          </Card>
        )}

        {room.phase === "round2_answer" && (
          <Card elevated>
            <Text style={{ color: c.text3, fontSize: theme.font.caption, fontWeight: "600", marginBottom: 8 }}>{latestQuestion}</Text>
            <Text style={{ color: c.text, fontSize: theme.font.secondary, lineHeight: 21 }}>
              {latestAnswer?.timed_out ? `${contestantName} didn't answer in time.` : (latestAnswer?.answer || "...")}
            </Text>
          </Card>
        )}

        {room.phase === "round2_decision" && (
          <View style={{ gap: 20 }}>
            <Text style={{ textAlign: "center", color: c.text2, fontSize: theme.font.secondary }}>Still feeling it?</Text>
            <DecisionRow />
          </View>
        )}

        {room.phase === "round2_results" && (
          <Text style={{ textAlign: "center", color: c.text2, fontSize: theme.font.secondary, paddingVertical: 32 }}>Time for the reveal...</Text>
        )}

        {room.phase === "reveal" && (
          <View style={{ gap: 4 }}>
            <Text style={{ textAlign: "center", color: c.text, fontWeight: "600", marginBottom: 8 }}>The reveal</Text>
            {reveal ? (
              [
                { icon: <Briefcase size={16} color={c.accent} />, label: "Profession", value: reveal.profession },
                { icon: <GraduationCap size={16} color={c.accent} />, label: "Education", value: reveal.education },
                { icon: <Coffee size={16} color={c.accent} />, label: "Lifestyle", value: (reveal.lifestyle || []).join(", ") },
              ].filter((it) => it.value).map((it) => (
                <View key={it.label} style={{ flexDirection: "row", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.surface2, alignItems: "center", justifyContent: "center" }}>{it.icon}</View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text3, fontSize: theme.font.caption, fontWeight: "600" }}>{it.label}</Text>
                    <Text style={{ color: c.text, fontSize: theme.font.secondary, fontWeight: "500" }}>{it.value}</Text>
                  </View>
                </View>
              ))
            ) : (
              <ActivityIndicator color={c.primary} style={{ marginTop: 12 }} />
            )}
          </View>
        )}

        {room.phase === "final" && (
          <View style={{ alignItems: "center", gap: 16, paddingVertical: 48 }}>
            <ActivityIndicator color={c.primary} size="large" />
            <Text style={{ color: c.text, fontWeight: "600" }}>{contestantName} is choosing...</Text>
          </View>
        )}

        {room.phase === "closed" && (
          outcome === null ? (
            <ActivityIndicator color={c.primary} size="large" style={{ marginTop: 48 }} />
          ) : outcome.matched ? (
            <View style={{ alignItems: "center", gap: 20, paddingVertical: 16 }}>
              <Text style={{ color: c.text, fontSize: 28, fontWeight: "700" }}>It's a match</Text>
              <View style={{ flexDirection: "row" }}>
                <Image source={{ uri: myPhoto }} style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: c.bg, marginRight: -16, zIndex: 1 }} />
                <Image source={{ uri: outcome.otherProfile?.photo_url }} style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: c.bg }} />
              </View>
              <Text style={{ color: c.text2, fontSize: theme.font.secondary, textAlign: "center", maxWidth: 260 }}>
                You and {outcome.otherProfile?.name} picked each other. This one's real.
              </Text>
              <PrimaryButton onPress={() => onExit({ matched: true, matchId: outcome.matchId, otherProfile: outcome.otherProfile })} style={{ width: "100%", maxWidth: 280 }}>
                Start talking
              </PrimaryButton>
            </View>
          ) : (
            <View style={{ alignItems: "center", gap: 16, paddingVertical: 32 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.surface2, alignItems: "center", justifyContent: "center" }}>
                <Heart size={22} color={c.text3} />
              </View>
              <Text style={{ color: c.text, fontSize: theme.font.h1, fontWeight: "700" }}>Not this time</Text>
              <Text style={{ color: c.text2, fontSize: theme.font.secondary, textAlign: "center", maxWidth: 260 }}>{contestantName} didn't pick you tonight. On to the next room.</Text>
              <PrimaryButton onPress={() => onExit({ matched: false })} style={{ width: "100%", maxWidth: 260, marginTop: 8 }}>Back home</PrimaryButton>
            </View>
          )
        )}

        {decisionError && <Text style={{ color: c.danger, fontSize: theme.font.caption, textAlign: "center", marginTop: 12 }}>{decisionError}</Text>}
      </ScrollView>

      {room.phase !== "closed" && (
        <View style={{ paddingBottom: 24 }}>
          <AIHostCaption line={hostLine} />
        </View>
      )}
    </SafeAreaView>
  );
}
