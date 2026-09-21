import { View, Text, Image, Pressable, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Heart } from "lucide-react-native";
import { theme } from "../theme";
import { EmptyState } from "../components/ui";
import type { LocalMatch } from "../hooks/useAppState";

const c = theme.color;

export function MatchesScreen({
  matches, onOpenChat, onEnterRoom,
}: { matches: LocalMatch[]; onOpenChat: (m: LocalMatch) => void; onEnterRoom: () => void }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={["top"]}>
      <Text style={{ color: c.text, fontSize: theme.font.h1, fontWeight: "700", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
        Matches
      </Text>
      {matches.length === 0 ? (
        <EmptyState
          icon={<Heart size={20} color={c.text2} />}
          title="No matches yet"
          subtitle="Play a room and see who picks you back."
          actionLabel="Enter a room"
          onAction={onEnterRoom}
        />
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          renderItem={({ item: m }) => (
            <Pressable
              onPress={() => onOpenChat(m)}
              style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border }}
            >
              <Image source={{ uri: m.contestant.photo }} style={{ width: 56, height: 56, borderRadius: theme.radius.lg }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontSize: theme.font.secondary, fontWeight: "600" }}>{m.contestant.name}</Text>
                <Text style={{ color: c.text2, fontSize: theme.font.secondary }} numberOfLines={1}>
                  {m.messages.length ? m.messages[m.messages.length - 1].text : "Say hi and start the conversation"}
                </Text>
              </View>
              {m.messages.length === 0 && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.primary }} />}
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
