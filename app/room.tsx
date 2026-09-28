import { router } from "expo-router";
import { View, Text, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HostLobbyScreen } from "../src/screens/HostLobbyScreen";
import { HostRoomScreen } from "../src/screens/HostRoomScreen";
import { ParticipantRoomScreen } from "../src/screens/ParticipantRoomScreen";
import type { CompatibilityScore } from "../src/screens/HostLobbyScreen";
import type { GamePhase } from "../src/screens/HostRoomScreen";
import { useAppState } from "../src/hooks/useAppState";
import { useHostedRoom } from "../src/lib/useRealtimeRoom";
import {
  advanceHostedRoom,
  eliminateParticipant,
  pickMatch,
  sendHostQuestion,
  submitAnswer,
  leaveRoom,
} from "../src/lib/roomActions";
import { theme, datingTheme } from "../src/theme";

const c = theme.color;

const VALID_GAME_PHASES: GamePhase[] = ["round1", "round2", "reveal", "final", "matched"];

export default function Room() {
  const {
    activeRoom,
    exitRoom,
    handleMatch,
    requestCompatibility,
    compatibilityScores,
    profile,
    myProfileId,
  } = useAppState();

  const roomId = activeRoom?.id || null;
  const {
    room,
    participants,
    activeParticipants,
    events,
    hostQuestion,
    participantAnswers,
    loading,
  } = useHostedRoom(roomId);

  // No active room — go back
  if (!activeRoom || !profile) {
    return null;
  }

  // Loading state
  if (loading || !room) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: c.bg,
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <ActivityIndicator color={datingTheme.color.primary} size="large" />
        <Text style={{ color: c.text2, fontSize: theme.font.secondary }}>
          {activeRoom.role === "host"
            ? "Setting up your room..."
            : "Joining room..."}
        </Text>
      </SafeAreaView>
    );
  }

  // ─── Host View ──────────────────────────────────────────────────────────

  if (activeRoom.role === "host") {
    // Request compatibility for each new participant
    const participantsForScoring = activeParticipants.filter(
      (p) => !compatibilityScores.has(p.profile_id)
    );
    if (participantsForScoring.length > 0 && myProfileId) {
      participantsForScoring.forEach((p) => {
        requestCompatibility(activeRoom.id, p.profile_id);
      });
    }

    // Convert compatibility scores to Record<string, CompatibilityScore>
    const scoresRecord: Record<string, CompatibilityScore> = {};
    activeParticipants.forEach((p) => {
      const score = compatibilityScores.get(p.profile_id);
      scoresRecord[p.profile_id] = {
        participantId: p.profile_id,
        overallScore: score?.overallScore || 0,
        interestOverlap: score?.interestOverlap || [],
        aiInsights: score?.aiInsights || [],
      };
    });

    const roomInfo = {
      id: room.id,
      title: room.title || activeRoom.title,
      vibe: room.vibe || activeRoom.vibe,
      maxParticipants: room.max_participants || activeRoom.maxParticipants,
    };

    const participantInfos = activeParticipants.map((p) => ({
      id: p.profile_id,
      name: p.profile?.name || "Anonymous",
      age: p.profile?.age || 0,
      photo: p.profile?.photo_url || "https://i.pravatar.cc/100",
      joinedAt: p.joined_at,
    }));

    // Lobby phase
    if (room.phase === "lobby") {
      return (
        <HostLobbyScreen
          room={roomInfo}
          participants={participantInfos}
          compatibilityScores={scoresRecord}
          onStart={async () => {
            try {
              await advanceHostedRoom(room.id, "round1");
            } catch (e) {
              console.error("Failed to start room:", e);
            }
          }}
          onCancel={() => {
            exitRoom();
            router.back();
          }}
        />
      );
    }

    // Game phases
    const gamePhase: GamePhase = VALID_GAME_PHASES.includes(room.phase as GamePhase)
      ? (room.phase as GamePhase)
      : "round1";

    const answersRecord: Record<string, string> = {};
    participantAnswers
      .filter((e) => e.sender_id)
      .forEach((e) => {
        answersRecord[e.sender_id as string] = (e.payload?.answer as string) || "";
      });

    return (
      <HostRoomScreen
        room={roomInfo}
        phase={gamePhase}
        participants={participantInfos}
        compatibilityScores={scoresRecord}
        aiQuestion="What's the most spontaneous thing you've ever done?"
        participantAnswers={answersRecord}
        onEliminate={async (participantId: string) => {
          try {
            await eliminateParticipant(room.id, participantId);
          } catch (e) {
            console.error("Failed to eliminate:", e);
          }
        }}
        onAdvancePhase={async () => {
          const phaseOrder: GamePhase[] = ["round1", "round2", "reveal", "final"];
          const currentIdx = phaseOrder.indexOf(gamePhase);
          const nextPhase = currentIdx < phaseOrder.length - 1 ? phaseOrder[currentIdx + 1] : "final";
          try {
            await advanceHostedRoom(room.id, nextPhase);
          } catch (e) {
            console.error("Failed to advance phase:", e);
          }
        }}
        onSendQuestion={async (question: string) => {
          try {
            await sendHostQuestion(room.id, question);
          } catch (e) {
            console.error("Failed to send question:", e);
          }
        }}
        onPickMatch={async (participantId: string) => {
          try {
            const matchId = await pickMatch(room.id, participantId);
            const picked = activeParticipants.find(
              (p) => p.profile_id === participantId
            );
            handleMatch(
              matchId,
              picked?.profile?.name || "Your match",
              picked?.profile?.photo_url || ""
            );
          } catch (e) {
            console.error("Failed to pick match:", e);
          }
        }}
        onStartChat={() => {
          exitRoom();
          router.replace("/chat");
        }}
      />
    );
  }

  // ─── Participant View ───────────────────────────────────────────────────

  const hostParticipant = participants.find((p) => p.role === "host");
  const myParticipant = participants.find(
    (p) => p.profile_id === myProfileId
  );

  const isEliminated = myParticipant?.status === "eliminated";
  const isMatched = myParticipant?.status === "matched";
  const currentQ = hostQuestion?.payload?.question as string | undefined;

  // Map room.phase to ParticipantPhase
  type ParticipantPhase = GamePhase | "lobby" | "eliminated";
  let participantPhase: ParticipantPhase = "lobby";
  if (isEliminated) {
    participantPhase = "eliminated";
  } else if (VALID_GAME_PHASES.includes(room.phase as GamePhase)) {
    participantPhase = room.phase as GamePhase;
  } else if (room.phase === "lobby") {
    participantPhase = "lobby";
  }

  return (
    <ParticipantRoomScreen
      room={{
        id: room.id,
        title: room.title || activeRoom.title,
        vibe: room.vibe || activeRoom.vibe,
        maxParticipants: room.max_participants || activeRoom.maxParticipants,
      }}
      hostProfile={{
        name: hostParticipant?.profile?.name || "Host",
        photo: hostParticipant?.profile?.photo_url || "https://i.pravatar.cc/100",
      }}
      phase={participantPhase}
      question={currentQ}
      isEliminated={isEliminated}
      isMatched={isMatched}
      onSubmitAnswer={async (answer: string) => {
        try {
          await submitAnswer(room.id, answer);
        } catch (e) {
          console.error("Failed to submit answer:", e);
        }
      }}
      onStartChat={() => {
        if (isMatched) {
          const matchEvent = events.findLast(
            (e) => e.event_type === "match_created"
          );
          if (matchEvent?.payload?.match_id) {
            handleMatch(
              matchEvent.payload.match_id as string,
              hostParticipant?.profile?.name || "Host",
              hostParticipant?.profile?.photo_url || ""
            );
          }
        }
        exitRoom();
        router.replace("/chat");
      }}
      onLeave={() => {
        leaveRoom(room.id).catch(() => {});
        exitRoom();
        router.back();
      }}
    />
  );
}
