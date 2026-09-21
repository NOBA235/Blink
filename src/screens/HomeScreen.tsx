import { View, Text, Image, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronRight } from "lucide-react-native";
import { theme } from "../theme";
import { PrimaryButton } from "../components/ui";
import { useAppState } from "../hooks/useAppState";

const c = theme.color;

export function HomeScreen({
  roomsAvailable, onEnterRoom, onOpenRooms, onOpenProfile, profileCompletion,
}: { roomsAvailable: number; onEnterRoom: () => void; onOpenRooms: () => void; onOpenProfile: () => void; profileCompletion: number }) {
  const { profile } = useAppState();
  if (!profile) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, gap: 32 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={{ color: c.text2, fontSize: theme.font.secondary }}>Good evening</Text>
            <Text style={{ color: c.text, fontSize: theme.font.h1, fontWeight: "700" }}>{profile.name}</Text>
          </View>
          <Pressable onPress={onOpenProfile} style={{ width: 44, height: 44, borderRadius: 22, overflow: "hidden", backgroundColor: c.surface2 }}>
            <Image source={{ uri: profile.photo }} style={{ width: "100%", height: "100%" }} />
          </Pressable>
        </View>

        <View style={{ backgroundColor: c.surface2, borderRadius: theme.radius.xl, padding: 28 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.danger }} />
            <Text style={{ color: c.text2, fontSize: theme.font.caption, fontWeight: "600" }}>
              {roomsAvailable} room{roomsAvailable === 1 ? "" : "s"} live now
            </Text>
          </View>
          <Text style={{ color: c.text, fontSize: 30, fontWeight: "700", lineHeight: 34, marginBottom: 8 }}>
            Ready for your{"\n"}next date?
          </Text>
          <Text style={{ color: c.text2, fontSize: theme.font.secondary, marginBottom: 28 }}>
            Five judges. One first impression. Your call.
          </Text>
          <PrimaryButton onPress={onEnterRoom} style={{ paddingVertical: 18 }}>
            <Text style={{ color: c.white, fontSize: 18, fontWeight: "700" }}>Enter a room</Text>
          </PrimaryButton>
        </View>

        <View>
          {profileCompletion < 100 && (
            <Pressable onPress={onOpenProfile} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.surface2, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: c.primary, fontSize: theme.font.caption, fontWeight: "700" }}>{profileCompletion}%</Text>
                </View>
                <Text style={{ color: c.text, fontSize: theme.font.secondary, fontWeight: "500" }}>Finish your profile</Text>
              </View>
              <ChevronRight size={16} color={c.text3} />
            </Pressable>
          )}
          <Pressable onPress={onOpenRooms} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 }}>
            <Text style={{ color: c.text2, fontSize: theme.font.secondary, fontWeight: "500" }}>Browse tonight's rooms</Text>
            <ChevronRight size={16} color={c.text3} />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
