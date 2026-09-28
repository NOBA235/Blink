import { router } from "expo-router";
import { HomeScreen } from "../../src/screens/HomeScreen";
import { useAppState } from "../../src/hooks/useAppState";

export default function Home() {
  const { profile, availableContestants, attemptRealRoom } = useAppState();
  if (!profile) return null;

  const profileCompletion = Math.min(
    100,
    40 + profile.interests.length * 6 + profile.prompts.length * 12 + (profile.hasVideo ? 8 : 0)
  );

  return (
    <HomeScreen
      roomsAvailable={Math.max(1, availableContestants.length)}
      onEnterRoom={() => { attemptRealRoom(); router.push("/room"); }}
      onOpenRooms={() => router.push("/(tabs)/rooms")}
      onOpenProfile={() => router.push("/(tabs)/profile")}
      profileCompletion={profileCompletion}
    />
  );
}
