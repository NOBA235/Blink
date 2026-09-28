import { View, Text, Image, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Users } from "lucide-react-native";
import { theme } from "../theme";
import { EmptyState } from "../components/ui";
import type { Contestant } from "../data/contestants";

const c = theme.color;
const ROOM_LABELS = ["Live now", "Starting soon", "New tonight", "Popular room"];

export function RoomsScreen({
  contestants, onEnterRoom, onRefreshPool,
}: { contestants: Contestant[]; onEnterRoom: (c: Contestant) => void; onRefreshPool: () => void }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={["top"]}>
      <Text style={{ color: c.text, fontSize: theme.font.h1, fontWeight: "700", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
        Rooms
      </Text>
      {contestants.length === 0 ? (
        <EmptyState
          icon={<Users size={22} color={c.text2} />}
          title="No rooms right now"
          subtitle="You've made it through tonight's lineup. New rooms open soon."
          actionLabel="Notify me when one starts"
          onAction={onRefreshPool}
        />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 16 }}>
          {contestants.map((contestant, i) => (
            <Pressable
              key={contestant.id}
              onPress={() => onEnterRoom(contestant)}
              style={{ borderRadius: theme.radius.xl, overflow: "hidden", aspectRatio: 16 / 10 }}
            >
              <Image source={{ uri: contestant.photo }} style={{ width: "100%", height: "100%" }} blurRadius={18} />
              <BlurView intensity={35} tint="dark" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.8)"]}
                style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "70%" }}
              />
              <View style={{ position: "absolute", top: 16, left: 16, flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.danger }} />
                <Text style={{ color: c.white, fontSize: theme.font.caption, fontWeight: "700" }}>
                  {ROOM_LABELS[i % ROOM_LABELS.length]}
                </Text>
              </View>
              <View style={{ position: "absolute", left: 20, right: 20, bottom: 20 }}>
                <Text style={{ color: c.white, fontSize: theme.font.h2, fontWeight: "700", marginBottom: 4 }}>
                  Blind first impression
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: theme.font.secondary }}>5 judges waiting</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
