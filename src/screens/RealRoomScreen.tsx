// DEPRECATED: This screen has been replaced by HostRoomScreen and ParticipantRoomScreen.
// Kept as a stub to avoid breaking any remaining imports.

import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../theme";

const c = theme.color;

export function RealRoomScreen(_props: Record<string, unknown>) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: c.text, fontSize: theme.font.body }}>
        This screen has been replaced. Please use the new room flow.
      </Text>
    </SafeAreaView>
  );
}
