import { router } from "expo-router";
import { MatchmakingScreen } from "../src/screens/MatchmakingScreen";
import { RealRoomScreen } from "../src/screens/RealRoomScreen";
import { LocalRoomScreen } from "../src/screens/LocalRoomScreen";
import { useAppState } from "../src/hooks/useAppState";

// Dispatches between the three states a "room" can be in: waiting on real
// matchmaking, inside a real live room, or inside the local-simulation
// room. All the actual state lives in AppStateProvider (see useAppState)
// so it survives whichever of these three screens is currently showing.
export default function Room() {
  const {
    queueWaiting, cancelMatchmaking,
    activeRealRoomId, handleRealRoomExit,
    activeRoomContestant, handleLocalRoomExit,
    profile, myProfileId, soundEnabled,
  } = useAppState();

  if (queueWaiting) {
    return <MatchmakingScreen onCancel={() => { cancelMatchmaking(); router.back(); }} />;
  }

  if (activeRealRoomId && myProfileId && profile) {
    return (
      <RealRoomScreen
        roomId={activeRealRoomId}
        myProfileId={myProfileId}
        myPhoto={profile.photo}
        soundEnabled={soundEnabled}
        onExit={(result: { matched: boolean; matchId?: string; otherProfile?: any }) => {
          handleRealRoomExit(result);
          if (result.matched) router.replace("/chat");
          else router.back();
        }}
      />
    );
  }

  if (activeRoomContestant && profile) {
    return (
      <LocalRoomScreen
        contestant={activeRoomContestant}
        userPhoto={profile.photo}
        soundEnabled={soundEnabled}
        onExit={(result) => {
          const saved = handleLocalRoomExit(result);
          if (result.openChat && saved) router.replace("/chat");
          else if (!result.nextRoom) router.back();
          // else: nextRoom — stay on this route, a new contestant is now active
        }}
      />
    );
  }

  // Defensive fallback — reachable only if something navigated here with no
  // active room state at all (e.g. a stale deep link).
  return null;
}
