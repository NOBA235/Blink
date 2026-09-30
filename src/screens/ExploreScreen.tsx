import { View, Text, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowRight, Sparkles } from "lucide-react-native";
import { theme } from "../theme";
import { LogoMark } from "../components/LogoMark";
import { AvatarCluster } from "../components/AvatarCluster";
import { PrimaryButton } from "../components/ui";

const c = theme.color;

export function ExploreScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={c.bg} />
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 9, height: 42 }}>
          <LogoMark size={30} />
          <Text style={{ color: c.text, fontSize: 21, fontWeight: "800", letterSpacing: -0.6 }}>blink</Text>
        </View>

        <AvatarCluster style={{ flex: 1, minHeight: 220, maxHeight: 340, alignSelf: "center", width: "100%" }} />

        <View style={{ alignItems: "center", paddingHorizontal: 4, marginBottom: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: c.surface2, marginBottom: 12 }}>
            <Sparkles size={14} color={c.primary} />
            <Text style={{ color: c.primary, fontSize: 12, fontWeight: "700" }}>Your next chapter starts here</Text>
          </View>
          <Text style={{ color: c.text, fontSize: 30, lineHeight: 37, fontWeight: "800", letterSpacing: -0.8, textAlign: "center" }}>Let's make Blink{ "\n" }feel like you.</Text>
          <Text style={{ color: c.text2, fontSize: 15, lineHeight: 22, textAlign: "center", maxWidth: 320, marginTop: 10 }}>
            Add a few details to your profile so people can get a sense of your vibe before you meet.
          </Text>
        </View>

        <PrimaryButton onPress={() => router.replace("/onboarding")} style={{ width: "100%", minHeight: 54, borderRadius: 18, backgroundColor: c.primary, flexDirection: "row", gap: 8 }}>
          <Text style={{ color: c.white, fontSize: 16, fontWeight: "700" }}>Explore Blink</Text>
          <ArrowRight size={18} color={c.white} />
        </PrimaryButton>
      </View>
    </SafeAreaView>
  );
}
