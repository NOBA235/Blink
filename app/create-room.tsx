import { router } from "expo-router";
import { CreateRoomScreen } from "../src/screens/CreateRoomScreen";
import { useAppState } from "../src/hooks/useAppState";

export default function CreateRoom() {
  const { hostRoom } = useAppState();

  return (
    <CreateRoomScreen
      onCreateRoom={async (title: string, vibe: string, maxParticipants: number) => {
        try {
          await hostRoom(title, vibe, maxParticipants);
          router.replace("/room");
        } catch (e) {
          console.error("Failed to create room:", e);
        }
      }}
    />
  );
}
