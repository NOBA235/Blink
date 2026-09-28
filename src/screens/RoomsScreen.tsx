import { View, Text, Image, Pressable, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Users, Plus } from "lucide-react-native";
import { theme } from "../theme";
import { EmptyState } from "../components/ui";
import { useOpenRooms, type OpenRoomListing } from "../lib/useRealtimeRoom";
import { useAppState } from "../hooks/useAppState";

const c = theme.color;

export function RoomsScreen({
  onJoinRoom,
  onCreateRoom,
}: {
  onJoinRoom: (room: OpenRoomListing) => void;
  onCreateRoom: () => void;
}) {
  const { session } = useAppState();
  const { rooms, loading, refresh } = useOpenRooms(!!session);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={["top"]}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
        <Text style={{ color: c.text, fontSize: theme.font.h1, fontWeight: "700" }}>
          Rooms
        </Text>
        <Pressable onPress={onCreateRoom} style={{ padding: 8, marginRight: -8 }}>
          <Plus size={24} color={c.text} />
        </Pressable>
      </View>
      {rooms.length === 0 && !loading ? (
        <EmptyState
          icon={<Users size={22} color={c.text2} />}
          title="No rooms live right now"
          subtitle="Host your own!"
          actionLabel="Create Room"
          onAction={onCreateRoom}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 16 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={c.primary} />}
        >
          {rooms.map((room) => (
            <Pressable
              key={room.id}
              onPress={() => onJoinRoom(room)}
              style={{ borderRadius: theme.radius.xl, overflow: "hidden", aspectRatio: 16 / 10 }}
            >
              <Image source={{ uri: room.host?.photo_url || "https://i.pravatar.cc/500?img=11" }} style={{ width: "100%", height: "100%" }} blurRadius={18} />
              <BlurView intensity={35} tint="dark" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.8)"]}
                style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "70%" }}
              />
              <View style={{ position: "absolute", top: 16, left: 16, flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)" }}>
                  <Text style={{ color: c.white, fontSize: theme.font.caption, fontWeight: "700" }}>
                    {room.vibe}
                  </Text>
                </View>
              </View>
              <View style={{ position: "absolute", left: 20, right: 20, bottom: 20 }}>
                <Text style={{ color: c.white, fontSize: theme.font.h2, fontWeight: "700", marginBottom: 4 }}>
                  {room.title}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: theme.font.secondary }}>
                  Hosted by {room.host?.name || "Someone"} • {room.participant_count}/{room.max_participants} waiting
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
