import { router } from "expo-router";
import { MatchesScreen } from "../../src/screens/MatchesScreen";
import { useAppState } from "../../src/hooks/useAppState";

export default function Matches() {
  const { matches, openChat } = useAppState();

  return (
    <MatchesScreen
      matches={matches}
      onOpenChat={(m) => { openChat(m.id); router.push("/chat"); }}
      onEnterRoom={() => router.push("/(tabs)/rooms")}
    />
  );
}
