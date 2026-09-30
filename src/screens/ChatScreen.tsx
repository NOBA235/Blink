import { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, Pressable, FlatList, KeyboardAvoidingView, Platform, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Send, Flag, Mic } from "lucide-react-native";
import { theme } from "../theme";
import { IconButton } from "../components/ui";
import { useRealtimeMessages } from "../lib/useRealtimeRoom";
import { sendRealMessage } from "../lib/roomActions";
import type { LocalMatch } from "../hooks/useAppState";

const c = theme.color;

export function ChatScreen({
  match, onBack, onSendMessage, myProfileId,
}: { match: LocalMatch; onBack: () => void; onSendMessage: (matchId: string, text: string) => void; myProfileId: string | null }) {
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);
  const isReal = Boolean(match.isReal);
  const { messages: realMessages, error: messageLoadError } = useRealtimeMessages(isReal ? match.id : null);

  const messages = isReal
    ? realMessages.map((m) => ({ from: m.sender_id === myProfileId ? "user" as const : "them" as const, text: m.text }))
    : match.messages;

  useEffect(() => {
    if (messages.length) listRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  async function send() {
    if (!draft.trim()) return;
    const text = draft.trim();
    setSendError(null);
    if (isReal) {
      setSending(true);
      try {
        await sendRealMessage(match.id, text);
        setDraft("");
      } catch (error: any) {
        setSendError(error?.message || "Message could not be sent. Please try again.");
      } finally {
        setSending(false);
      }
    } else {
      setDraft("");
      onSendMessage(match.id, text);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }} keyboardVerticalOffset={90}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border }}>
          <IconButton icon={<ChevronLeft size={18} color={c.text} />} onPress={onBack} size={36} />
          <Image source={{ uri: match.contestant.photo }} style={{ width: 36, height: 36, borderRadius: 18 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: theme.font.secondary, fontWeight: "600" }}>{match.contestant.name}</Text>
            <Text style={{ color: c.text3, fontSize: theme.font.caption }}>{isReal ? "Real match" : "Matched tonight"}</Text>
          </View>
          <IconButton icon={<Flag size={14} color={c.text} />} onPress={() => {}} size={36} />
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20, gap: 10 }}
          ListHeaderComponent={<Text style={{ textAlign: "center", color: c.text3, fontSize: theme.font.caption, marginBottom: 8 }}>You and {match.contestant.name} matched — say hi</Text>}
          renderItem={({ item: m }) => (
            <View
              style={{
                maxWidth: "75%",
                alignSelf: m.from === "user" ? "flex-end" : "flex-start",
                backgroundColor: m.from === "user" ? c.primary : c.surface2,
                borderRadius: theme.radius.lg,
                paddingVertical: 10,
                paddingHorizontal: 14,
                marginBottom: 4,
              }}
            >
              <Text style={{ color: m.from === "user" ? c.white : c.text, fontSize: theme.font.secondary }}>{m.text}</Text>
            </View>
          )}
        />

        {messageLoadError || sendError ? <Text style={{ color: c.danger, textAlign: "center", paddingHorizontal: 16, paddingBottom: 8 }}>{sendError || messageLoadError}</Text> : null}

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: c.border }}>
          <IconButton icon={<Mic size={16} color={c.text} />} onPress={() => {}} size={38} />
          <TextInput
            style={{ flex: 1, backgroundColor: c.surface2, borderRadius: theme.radius.full, paddingVertical: 10, paddingHorizontal: 16, color: c.text, fontSize: theme.font.secondary }}
            placeholder="Say something..."
            placeholderTextColor={c.text3}
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={() => void send()}
          />
          <Pressable disabled={sending} onPress={() => void send()} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "#1c1c1c", alignItems: "center", justifyContent: "center", opacity: sending ? 0.55 : 1 }}>
            <Send size={16} color="#ffffff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
