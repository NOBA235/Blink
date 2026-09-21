import { View, Text, Image, ScrollView } from "react-native";
import { X } from "lucide-react-native";
import { theme } from "../theme";

const c = theme.color;

export type JudgeForDisplay = {
  id: string;
  name: string;
  photo: string | null | undefined;
  isUser: boolean;
  popped: boolean;
};

export function JudgeAvatar({ judge, size = 48 }: { judge: JudgeForDisplay; size?: number }) {
  const ringColor = judge.popped ? c.borderStrong : judge.isUser ? c.primary : c.borderStrong;
  return (
    <View style={{ alignItems: "center", gap: 6 }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: judge.isUser && !judge.popped ? 2.5 : 1.5,
          borderColor: ringColor,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: c.surface2,
          opacity: judge.popped ? 0.45 : 1,
        }}
      >
        {judge.photo ? (
          <Image
            source={{ uri: judge.photo }}
            style={{ width: "100%", height: "100%" }}
            // Grayscale isn't a built-in RN Image prop — a real greyed-out
            // filter would need expo-image + a blend mode or a separate
            // library; opacity alone (above) carries the "eliminated" read
            // well enough here without adding that dependency.
          />
        ) : null}
        {judge.popped && (
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.35)" }}>
            <X size={16} color="rgba(255,255,255,0.8)" />
          </View>
        )}
      </View>
      <Text style={{ fontSize: theme.font.caption, fontWeight: "500", color: judge.isUser ? c.primary : c.text2 }}>
        {judge.isUser ? "You" : judge.name}
      </Text>
    </View>
  );
}

export function JudgeRow({ judges }: { judges: JudgeForDisplay[] }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 16, paddingHorizontal: 20, paddingVertical: 12, justifyContent: "center", flexGrow: 1 }}
    >
      {judges.map((j) => <JudgeAvatar key={j.id} judge={j} />)}
    </ScrollView>
  );
}
