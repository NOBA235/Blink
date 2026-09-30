import { useLocalSearchParams, router } from "expo-router";
import { HostedRoomScreen } from "../src/screens/HostedRoomScreen";

export default function HostedRoomRoute() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  if (!roomId) return null;
  return <HostedRoomScreen roomId={roomId} onExit={() => router.back()} />;
}
