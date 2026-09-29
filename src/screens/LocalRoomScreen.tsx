import { useState, useEffect, useRef } from "react";
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Heart, X, MapPin, Briefcase, GraduationCap, Coffee } from "lucide-react-native";
import { theme } from "../theme";
import { PrimaryButton, SecondaryButton, Chip, IconButton, Card } from "../components/ui";
import { JudgeRow, type JudgeForDisplay } from "../components/JudgeAvatar";
import { AIHostCaption } from "../components/AIHostCaption";
import { hostSay, shuffle, type HostCtx } from "../data/hostLines";
import { fetchHostLine } from "../lib/hostAi";
import { BOT_JUDGE_POOL, type Contestant } from "../data/contestants";
import { useSound, buzzKeep, buzzPop, buzzMatch, buzzTick } from "../lib/sound";

const c = theme.color;

type Judge = { id: string; name: string; photo: string | null; isUser: boolean; popped: boolean };

// Identical logic to the web app's buildJudges/pickFinal — see App.jsx.
function buildJudges(contestantId: string): Judge[] {
  const bots = shuffle(BOT_JUDGE_POOL).slice(0, 4).map((b, i) => ({
    id: `${contestantId}-bot-${i}`, name: b.name, photo: b.photo, isUser: false, popped: false,
  }));
  const withUser: Judge[] = [...bots];
  withUser.splice(2, 0, { id: `${contestantId}-user`, name: "You", isUser: true, popped: false, photo: null });
  return withUser;
}

function pickFinal(active: Judge[]): string | null {
  if (active.length === 0) return null;
  if (active.length === 1) return active[0].id;
  const user = active.find((j) => j.isUser);
  if (user) {
    if (Math.random() < 0.55) return user.id;
    const others = active.filter((j) => !j.isUser);
    return others[Math.floor(Math.random() * others.length)].id;
  }
  return active[Math.floor(Math.random() * active.length)].id;
}

export function LocalRoomScreen({
  contestant, userPhoto, soundEnabled, onExit,
}: {
  contestant: Contestant;
  userPhoto: string;
  soundEnabled: boolean;
  onExit: (result: { matched: boolean; contestant: Contestant; nextRoom?: boolean; openChat?: boolean; completed?: boolean }) => void;
}) {
  const { playSound } = useSound();
  const [phase, setPhase] = useState("connecting");
  const [judges, setJudges] = useState<Judge[]>(() => buildJudges(contestant.id));
  const [countdown, setCountdown] = useState(3);
  const [hostLine, setHostLine] = useState("");
  const [revealStep, setRevealStep] = useState(0);
  const [finalPickId, setFinalPickId] = useState<string | null>(null);
  const [userLocked, setUserLocked] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const hostSeq = useRef(0);

  function speak(event: string, ctx: HostCtx = {}) {
    const token = ++hostSeq.current;
    setHostLine(hostSay(event, ctx));
    void fetchHostLine(event, ctx).then((line) => {
      if (line && token === hostSeq.current) setHostLine(line);
    });
  }

  function after(ms: number, fn: () => void) {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }
  function clearAllTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  useEffect(() => () => clearAllTimers(), []);

  const userJudge = judges.find((j) => j.isUser);

  function popJudge(id: string, botDisplayName: string) {
    setJudges((cur) => {
      const updated = cur.map((j) => (j.id === id ? { ...j, popped: true } : j));
      const remaining = updated.filter((j) => !j.popped).length;
      const target = cur.find((j) => j.id === id);
      playSound("pop", soundEnabled);
      buzzPop();
      speak(target?.isUser ? "USER_POPPED" : "PLAYER_POPPED", { remaining, name: botDisplayName });
      return updated;
    });
  }

  function scheduleBotDecisions(popChance: number) {
    judges.forEach((j) => {
      if (j.isUser || j.popped) return;
      const delay = 1300 + Math.random() * 2600;
      after(delay, () => {
        if (Math.random() < popChance) popJudge(j.id, j.name);
      });
    });
  }

  // Phase engine — identical timings/logic to the web app's RoomScreen.
  useEffect(() => {
    if (phase === "connecting") {
      after(750, () => setPhase("intro"));
    } else if (phase === "intro") {
      speak("CONTESTANT_ENTERED", { name: contestant.name });
      after(2200, () => setPhase("countdown1"));
    } else if (phase === "countdown1") {
      speak("COUNTDOWN_STARTED");
      setCountdown(3);
      playSound("tick", soundEnabled); buzzTick();
      after(650, () => { setCountdown(2); playSound("tick", soundEnabled); buzzTick(); });
      after(1300, () => { setCountdown(1); playSound("tick", soundEnabled); buzzTick(); });
      after(1950, () => setPhase("decision1"));
    } else if (phase === "decision1") {
      speak("DECISION_PROMPT");
      setUserLocked(false);
      scheduleBotDecisions(0.3);
      after(6500, () => resolveRound(1));
    } else if (phase === "results1") {
      const remaining = judges.filter((j) => !j.popped).length;
      speak("ROUND1_COMPLETE", { remaining });
      after(2000, () => setPhase("question2"));
    } else if (phase === "question2") {
      speak("PERSONALITY_ASKED");
      after(2600, () => setPhase("answer2"));
    } else if (phase === "answer2") {
      speak("PERSONALITY_ANSWERED");
      after(500, () => setPhase("decision2"));
    } else if (phase === "decision2") {
      speak("DECISION_PROMPT");
      setUserLocked(false);
      scheduleBotDecisions(0.22);
      after(5500, () => resolveRound(2));
    } else if (phase === "results2") {
      const remaining = judges.filter((j) => !j.popped).length;
      speak("ROUND2_COMPLETE", { remaining });
      after(1800, () => setPhase("reveal3"));
    } else if (phase === "reveal3") {
      speak("REVEAL_STARTED");
      setRevealStep(0);
    } else if (phase === "final") {
      speak("FINAL_CHOICE");
      const pick = pickFinal(judges.filter((j) => !j.popped));
      after(1300, () => { setFinalPickId(pick); playSound("tick", soundEnabled); buzzTick(); });
      after(3200, () => setPhase("outcome"));
    } else if (phase === "outcome") {
      const matched = Boolean(finalPickId && userJudge && finalPickId === userJudge.id);
      speak(matched ? "MATCH_CREATED" : "NO_MATCH");
      if (matched) { playSound("match", soundEnabled); buzzMatch(); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function resolveRound(n: 1 | 2) {
    setJudges((cur) => {
      const user = cur.find((j) => j.isUser);
      if (user?.popped) {
        setPhase("out");
        return cur;
      }
      setPhase(n === 1 ? "results1" : "results2");
      return cur;
    });
  }

  function handleUserDecision(willPop: boolean) {
    if (userLocked || !userJudge) return;
    setUserLocked(true);
    if (willPop) {
      clearAllTimers();
      popJudge(userJudge.id, "You");
      after(900, () => setPhase("out"));
    } else {
      playSound("keep", soundEnabled);
      buzzKeep();
    }
  }

  function advanceReveal() {
    if (revealStep >= 2) setPhase("final");
    else setRevealStep((s) => s + 1);
  }

  const matched = phase === "outcome" && Boolean(finalPickId && userJudge && finalPickId === userJudge.id);
  const finalPickJudge = judges.find((j) => j.id === finalPickId);
  const roundNumber = ({ intro: 1, countdown1: 1, decision1: 1, results1: 1, question2: 2, answer2: 2, decision2: 2, reveal3: 3, final: 4, outcome: 4, out: 1 } as Record<string, number>)[phase] || 1;

  const judgesForDisplay: JudgeForDisplay[] = judges.map((j) => ({
    id: j.id, name: j.name, photo: j.isUser ? userPhoto : j.photo, isUser: j.isUser, popped: j.popped,
  }));

  function DecisionButtons({ keepLabel = "Keep", popLabel = "Pop" }: { keepLabel?: string; popLabel?: string }) {
    if (userLocked) {
      return <Text style={{ textAlign: "center", color: c.text2, fontSize: theme.font.secondary, paddingVertical: 12 }}>You're locked in. Waiting on the room...</Text>;
    }
    return (
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24 }}>
        <View style={{ alignItems: "center", gap: 8 }}>
          <Pressable onPress={() => handleUserDecision(true)} style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: c.surface2, borderWidth: 1, borderColor: c.border, alignItems: "center", justifyContent: "center" }}>
            <X size={24} color={c.text2} />
          </Pressable>
          <Text style={{ color: c.text3, fontSize: theme.font.caption, fontWeight: "500" }}>{popLabel}</Text>
        </View>
        <View style={{ alignItems: "center", gap: 8 }}>
          <Pressable onPress={() => handleUserDecision(false)} style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: c.primary, alignItems: "center", justifyContent: "center" }}>
            <Heart size={28} color={c.white} fill={c.white} />
          </Pressable>
          <Text style={{ color: c.primary, fontSize: theme.font.caption, fontWeight: "500" }}>{keepLabel}</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8 }}>
        {!["outcome", "out"].includes(phase) ? (
          <IconButton icon={<X size={16} color={c.text} />} onPress={() => onExit({ matched: false, contestant })} size={36} />
        ) : <View style={{ width: 36 }} />}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.danger }} />
          <Text style={{ color: c.text2, fontSize: theme.font.caption, fontWeight: "600" }}>Round {roundNumber} of 4</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {!["out", "outcome", "connecting"].includes(phase) && <JudgeRow judges={judgesForDisplay} />}

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 20, paddingBottom: 20 }}>
        {phase === "connecting" && (
          <View style={{ alignItems: "center", gap: 12, paddingVertical: 64 }}>
            <ActivityIndicator color={c.primary} size="large" />
            <Text style={{ color: c.text, fontWeight: "600" }}>Finding your room...</Text>
            <Text style={{ color: c.text2, fontSize: theme.font.secondary }}>Five judges, one contestant. Locking you in.</Text>
          </View>
        )}

        {["intro", "countdown1", "decision1", "results1"].includes(phase) && (
          <View style={{ gap: 20 }}>
            <View style={{ borderRadius: theme.radius.xl, overflow: "hidden", aspectRatio: 4 / 5, backgroundColor: c.surface2 }}>
              <Image source={{ uri: contestant.photo }} style={{ width: "100%", height: "100%" }} />
              <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 20, backgroundColor: "rgba(0,0,0,0.55)" }}>
                <Text style={{ color: c.white, fontSize: 24, fontWeight: "700" }}>{contestant.name}, {contestant.age}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <MapPin size={13} color="rgba(255,255,255,0.7)" />
                  <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: theme.font.secondary }}>{contestant.location}</Text>
                </View>
              </View>
              {phase === "countdown1" && (
                <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.55)" }}>
                  <Text style={{ fontSize: 72, fontWeight: "700", color: c.white }}>{countdown || "Go"}</Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {contestant.interests.map((i) => <Chip key={i}>{i}</Chip>)}
            </View>
            {phase === "decision1" && <DecisionButtons />}
          </View>
        )}

        {["question2", "answer2", "decision2"].includes(phase) && (
          <View style={{ gap: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Image source={{ uri: contestant.photo }} style={{ width: 48, height: 48, borderRadius: 24 }} />
              <View>
                <Text style={{ color: c.text, fontWeight: "600" }}>{contestant.name}</Text>
                <Text style={{ color: c.text3, fontSize: theme.font.caption }}>Answering live</Text>
              </View>
            </View>
            <Card elevated>
              <Text style={{ color: c.text, fontSize: theme.font.secondary, fontWeight: "600", marginBottom: 12 }}>{contestant.personalityQuestion}</Text>
              {phase === "question2" ? (
                <ActivityIndicator color={c.text3} style={{ alignSelf: "flex-start" }} />
              ) : (
                <Text style={{ color: c.text2, fontSize: theme.font.secondary, lineHeight: 21 }}>{contestant.personalityAnswer}</Text>
              )}
            </Card>
            {phase === "decision2" && <DecisionButtons keepLabel="Still into it" popLabel="Pop" />}
          </View>
        )}

        {phase === "reveal3" && (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <Image source={{ uri: contestant.photo }} style={{ width: 48, height: 48, borderRadius: 24 }} />
              <View>
                <Text style={{ color: c.text, fontWeight: "600" }}>{contestant.name}</Text>
                <Text style={{ color: c.text3, fontSize: theme.font.caption }}>The reveal</Text>
              </View>
            </View>
            {[
              { icon: <Briefcase size={16} color={c.accent} />, label: "Profession", value: contestant.reveal.profession },
              { icon: <GraduationCap size={16} color={c.accent} />, label: "Education", value: contestant.reveal.education },
              { icon: <Coffee size={16} color={c.accent} />, label: "Lifestyle", value: contestant.reveal.lifestyle.join(", ") },
            ].slice(0, revealStep + 1).map((it) => (
              <View key={it.label} style={{ flexDirection: "row", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.surface2, alignItems: "center", justifyContent: "center" }}>{it.icon}</View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text3, fontSize: theme.font.caption, fontWeight: "600" }}>{it.label}</Text>
                  <Text style={{ color: c.text, fontSize: theme.font.secondary, fontWeight: "500" }}>{it.value}</Text>
                </View>
              </View>
            ))}
            <PrimaryButton onPress={advanceReveal} style={{ marginTop: 8 }}>
              {revealStep >= 2 ? "See the final choice" : "Continue"}
            </PrimaryButton>
          </View>
        )}

        {phase === "final" && (
          <View style={{ alignItems: "center", gap: 28, paddingVertical: 32 }}>
            <Text style={{ color: c.text, fontSize: theme.font.h2, fontWeight: "700", textAlign: "center" }}>{contestant.name} is choosing...</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
              {judges.filter((j) => !j.popped).map((j) => {
                const isPicked = finalPickId === j.id;
                const dimmed = Boolean(finalPickId) && !isPicked;
                return (
                  <View key={j.id} style={{ alignItems: "center", gap: 6, opacity: dimmed ? 0.35 : 1, transform: [{ scale: isPicked ? 1.1 : 1 }] }}>
                    <View style={{ width: 64, height: 64, borderRadius: 32, overflow: "hidden", borderWidth: isPicked ? 3 : 1.5, borderColor: isPicked ? c.primary : c.borderStrong }}>
                      <Image source={{ uri: j.isUser ? userPhoto : j.photo || undefined }} style={{ width: "100%", height: "100%" }} />
                    </View>
                    <Text style={{ color: c.text2, fontSize: theme.font.caption, fontWeight: "500" }}>{j.isUser ? "You" : j.name}</Text>
                  </View>
                );
              })}
            </View>
            {!finalPickId ? (
              <ActivityIndicator color={c.primary} />
            ) : (
              <Text style={{ color: c.text, fontSize: theme.font.h2, fontWeight: "700" }}>
                {judges.find((j) => j.id === finalPickId)?.isUser ? "They picked you." : `They picked ${judges.find((j) => j.id === finalPickId)?.name}.`}
              </Text>
            )}
          </View>
        )}

        {phase === "outcome" && (
          matched ? (
            <View style={{ alignItems: "center", gap: 20, paddingVertical: 16 }}>
              <Text style={{ color: c.text, fontSize: 28, fontWeight: "700" }}>It's a match</Text>
              <View style={{ flexDirection: "row" }}>
                <Image source={{ uri: userPhoto }} style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: c.bg, marginRight: -16, zIndex: 1 }} />
                <Image source={{ uri: contestant.photo }} style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: c.bg }} />
              </View>
              <Text style={{ color: c.text2, fontSize: theme.font.secondary, textAlign: "center", maxWidth: 260 }}>
                You and {contestant.name} picked each other.
              </Text>
              <View style={{ width: "100%", maxWidth: 280, gap: 10, marginTop: 4 }}>
                <PrimaryButton onPress={() => onExit({ matched: true, contestant, openChat: true, completed: true })}>Start talking</PrimaryButton>
                <SecondaryButton onPress={() => onExit({ matched: true, contestant, nextRoom: true, completed: true })}>Keep playing</SecondaryButton>
              </View>
            </View>
          ) : (
            <View style={{ alignItems: "center", gap: 16, paddingVertical: 32 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.surface2, alignItems: "center", justifyContent: "center" }}>
                <Heart size={22} color={c.text3} />
              </View>
              <Text style={{ color: c.text, fontSize: theme.font.h1, fontWeight: "700" }}>Not your match this time</Text>
              <Text style={{ color: c.text2, fontSize: theme.font.secondary, textAlign: "center", maxWidth: 260 }}>
                {finalPickJudge && !finalPickJudge.isUser ? `${contestant.name} picked ${finalPickJudge.name} tonight.` : `${contestant.name} didn't pick anyone tonight.`} On to the next room.
              </Text>
              <PrimaryButton onPress={() => onExit({ matched: false, contestant, nextRoom: true, completed: true })} style={{ width: "100%", maxWidth: 260, marginTop: 8 }}>
                Enter next room
              </PrimaryButton>
            </View>
          )
        )}

        {phase === "out" && (
          <View style={{ alignItems: "center", gap: 16, paddingVertical: 48 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.surface2, alignItems: "center", justifyContent: "center" }}>
              <X size={20} color={c.text3} />
            </View>
            <Text style={{ color: c.text, fontSize: theme.font.h1, fontWeight: "700" }}>Not your match</Text>
            <Text style={{ color: c.text2, fontSize: theme.font.secondary, textAlign: "center", maxWidth: 240 }}>
              You passed on {contestant.name}. The room keeps going without you tonight.
            </Text>
            <View style={{ width: "100%", maxWidth: 260, gap: 10, marginTop: 8 }}>
              <PrimaryButton onPress={() => onExit({ matched: false, contestant, nextRoom: true, completed: true })}>Enter next room</PrimaryButton>
              <SecondaryButton onPress={() => onExit({ matched: false, contestant })}>Back to home</SecondaryButton>
            </View>
          </View>
        )}
      </ScrollView>

      {!["outcome", "out", "connecting"].includes(phase) && (
        <View style={{ paddingBottom: 24 }}>
          <AIHostCaption line={hostLine} />
        </View>
      )}
    </SafeAreaView>
  );
}
