import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { theme } from "../theme";
import { LogoMark } from "../components/LogoMark";
import { PrimaryButton } from "../components/ui";

export function LandingScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.bg }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 28 }}>
        <LogoMark size={64} />
        <View style={{ gap: 12, alignItems: "center" }}>
          <Text style={{ fontSize: 30, fontWeight: "700", color: theme.color.text, textAlign: "center", lineHeight: 36 }}>
            Dating, but{"\n"}make it a game.
          </Text>
          <Text style={{ fontSize: theme.font.secondary, color: theme.color.text2, textAlign: "center", maxWidth: 280 }}>
            Blind first impressions. A live host. Real chemistry.
          </Text>
        </View>
        <PrimaryButton onPress={() => router.push("/auth")} style={{ width: "100%", paddingVertical: 18 }}>
          <Text style={{ color: theme.color.white, fontSize: 18, fontWeight: "700" }}>Let's play</Text>
        </PrimaryButton>
      </View>
    </SafeAreaView>
  );
}
