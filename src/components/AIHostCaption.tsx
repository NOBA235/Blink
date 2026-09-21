import { View, Text } from "react-native";
import { Sparkles } from "lucide-react-native";
import { theme } from "../theme";

export function AIHostCaption({ line }: { line: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20 }}>
      <Sparkles size={14} color={theme.color.accent} />
      <Text style={{ flex: 1, fontSize: theme.font.secondary, fontWeight: "500", color: theme.color.text2 }}>
        {line}
      </Text>
    </View>
  );
}
