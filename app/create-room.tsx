import { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { CreateRoomScreen } from "../src/screens/CreateRoomScreen";
import { HostLobbyScreen, type RoomInfo } from "../src/screens/HostLobbyScreen";
import { supabase } from "../src/lib/supabase";
import { theme } from "../src/theme";

export default function CreateRoomRoute() {
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createRoom(title: string, vibe: string, maxParticipants: number) {
    setError(null);
    const { data, error: createError } = await supabase.rpc("create_hosted_room", {
      p_title: title.trim() || "Untitled Room",
      p_vibe: vibe,
      p_max_participants: maxParticipants,
    });

    if (createError || !data) {
      setError(createError?.message || "Could not create your room. Please try again.");
      return;
    }

    setRoom({
      id: data.id,
      title: data.title || title.trim() || "Untitled Room",
      vibe: data.vibe || vibe,
      maxParticipants: data.max_participants || maxParticipants,
    });
  }

  if (!room) {
    return (
      <View style={{ flex: 1 }}>
        <CreateRoomScreen onCreateRoom={createRoom} onBack={() => router.back()} />
        {error ? (
          <Text style={{ color: theme.color.danger, textAlign: "center", padding: 12 }}>{error}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <HostLobbyScreen
      room={room}
      participants={[]}
      compatibilityScores={{}}
      onStart={() => {}}
      onCancel={() => router.replace("/(tabs)/home")}
    />
  );
}
