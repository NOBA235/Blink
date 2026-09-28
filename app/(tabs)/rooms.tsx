import { router } from "expo-router";
import { RoomsScreen } from "../../src/screens/RoomsScreen";
import { useAppState } from "../../src/hooks/useAppState";

export default function Rooms() {
  const { joinRoom, myProfileId } = useAppState();

  return (
    <RoomsScreen
      onJoinRoom={async (room) => {
        if (!myProfileId) {
          router.push("/auth");
          return;
        }
        try {
          await joinRoom(room.id, room.title, room.vibe, room.max_participants);
          router.push("/room");
        } catch (e) {
          console.error("Failed to join room:", e);
        }
      }}
      onCreateRoom={() => {
        if (!myProfileId) {
          router.push("/auth");
          return;
        }
        router.push("/create-room");
      }}
    />
  );
}
