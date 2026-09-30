import { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { CreateRoomScreen } from "../src/screens/CreateRoomScreen";
import { HostedRoomScreen } from "../src/screens/HostedRoomScreen";
import { supabase } from "../src/lib/supabase";
import { theme } from "../src/theme";

export default function CreateRoomRoute() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createRoom(title: string, vibe: string, maxParticipants: number) {
    setError(null);
    const { data, error: createError } = await supabase.rpc("create_hosted_room", {
      p_title: title.trim() || "Untitled Room",
      p_vibe: vibe,
      p_max_participants: maxParticipants,
    });

    if (createError || !data) {
      const profileMissing = createError?.code === "23503" &&
        createError.message.includes("rooms_host_id_fkey");
      setError(profileMissing
        ? "Your profile needs a server update before you can host. Apply the latest Supabase migration, then try again."
        : createError?.message || "Could not create your room. Please try again.");
      return;
    }

    setRoomId(data.id);
  }

  if (!roomId) {
    return (
      <View style={{ flex: 1 }}>
        <CreateRoomScreen onCreateRoom={createRoom} onBack={() => router.back()} />
        {error ? (
          <Text style={{ color: theme.color.danger, textAlign: "center", padding: 12 }}>{error}</Text>
        ) : null}
      </View>
    );
  }

  return <HostedRoomScreen roomId={roomId} onExit={() => router.replace("/(tabs)/home")} />;
}
