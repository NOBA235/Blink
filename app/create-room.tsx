import { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { router } from "expo-router";
import { CreateRoomScreen } from "../src/screens/CreateRoomScreen";
import { HostLobbyScreen, type RoomInfo } from "../src/screens/HostLobbyScreen";
import { supabase } from "../src/lib/supabase";
import { theme } from "../src/theme";

export default function CreateRoomRoute() {
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) return;
    let cancelled = false;
    const refreshParticipants = async () => {
      const { data } = await supabase
        .from("room_participants")
        .select("profile_id, joined_at, profile:profiles(name, age, photo_url)")
        .eq("room_id", room.id)
        .order("joined_at", { ascending: true });
      if (!cancelled && data) {
        setParticipants(data.map((row: any) => ({
          id: row.profile_id,
          name: row.profile?.name || "Player",
          age: row.profile?.age || 0,
          photo: row.profile?.photo_url || "",
          joinedAt: row.joined_at,
        })));
      }
    };
    void refreshParticipants();
    const channel = supabase.channel(`host-room:${room.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_participants", filter: `room_id=eq.${room.id}` }, () => {
        void refreshParticipants();
      })
      .subscribe();
    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [room?.id]);

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

    setRoom({
      id: data.id,
      title: data.title || title.trim() || "Untitled Room",
      vibe: data.vibe || vibe,
      maxParticipants: data.max_participants || maxParticipants,
    });
  }

  async function cancelRoom() {
    if (!room) return;
    const { error: closeError } = await supabase.rpc("close_hosted_room", { p_room_id: room.id });
    if (closeError) {
      Alert.alert("Could not close room", closeError.message);
      return;
    }
    router.replace("/(tabs)/home");
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
      participants={participants}
      compatibilityScores={{}}
      onStart={() => {}}
      onCancel={() => { void cancelRoom(); }}
    />
  );
}
