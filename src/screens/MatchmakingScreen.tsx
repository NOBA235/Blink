import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator } from "react-native";
import { theme } from "../theme";
import { GhostButton } from "../components/ui";

const c = theme.color;

// Shown while attemptRealRoom() is waiting to see if enough real judges are
// online to form a room. Falls back to the local simulation automatically
// after ~12 seconds (see useAppState's attemptRealRoom) — this screen never
// blocks the player indefinitely.
export function MatchmakingScreen({ onCancel }: { onCancel: () => void }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 20 }}>
        <ActivityIndicator color={c.primary} size="large" />
        <View style={{ gap: 8, alignItems: "center" }}>
          <Text style={{ color: c.text, fontSize: theme.font.h2, fontWeight: "700" }}>Looking for a live room...</Text>
          <Text style={{ color: c.text2, fontSize: theme.font.secondary, textAlign: "center", maxWidth: 280 }}>
            If there aren't enough real judges online in a few seconds, you'll drop straight into a room instead.
          </Text>
        </View>
        <GhostButton onPress={onCancel}>Cancel</GhostButton>
      </View>
    </SafeAreaView>
  );
}
