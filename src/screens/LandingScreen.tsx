import { Pressable, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowRight, Users } from "lucide-react-native";
import { theme } from "../theme";
import { LogoMark } from "../components/LogoMark";
import { PrimaryButton } from "../components/ui";
import { AvatarCluster } from "../components/AvatarCluster";

const c = theme.color;

export function LandingScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={c.bg} />
      <View style={{ flex: 1, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 12 }}>
        <View style={{ height: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}><LogoMark size={30} /><Text style={{ color: c.text, fontSize: 21, fontWeight: "800", letterSpacing: -0.6 }}>blink</Text></View>
          <Pressable onPress={() => router.push({ pathname: "/auth", params: { mode: "signin" } })} hitSlop={10} style={{ paddingHorizontal: 15, paddingVertical: 9, borderRadius: 999, backgroundColor: c.surface2 }}>
            <Text style={{ color: c.primary, fontSize: 13, fontWeight: "700" }}>Sign in</Text>
          </Pressable>
        </View>

        <AvatarCluster style={{ minHeight: 250, maxHeight: 390 }} />

        <View style={{ alignItems: "center", paddingHorizontal: 4, marginBottom: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: c.surface2, marginBottom: 12 }}>
            <Users size={14} color={c.primary} /><Text style={{ color: c.primary, fontSize: 12, fontWeight: "700" }}>Meet people on your wavelength</Text>
          </View>
          <Text style={{ color: c.text, fontSize: 32, lineHeight: 38, fontWeight: "800", letterSpacing: -1.1, textAlign: "center" }}>Good connections{ "\n" }start with a blink.</Text>
          <Text style={{ color: c.text2, fontSize: 15, lineHeight: 22, textAlign: "center", maxWidth: 310, marginTop: 10 }}>Join live rooms, share your vibe, and meet people who feel like your kind of people.</Text>
        </View>

        <View>
          <PrimaryButton onPress={() => router.push("/auth")} style={{ width: "100%", minHeight: 54, borderRadius: 18, backgroundColor: c.primary, flexDirection: "row", gap: 8 }}>
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>Get started</Text><ArrowRight size={18} color="#FFFFFF" />
          </PrimaryButton>
        </View>
      </View>
    </SafeAreaView>
  );
}
