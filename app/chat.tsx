import { router } from "expo-router";
import { ChatScreen } from "../src/screens/ChatScreen";
import { useAppState } from "../src/hooks/useAppState";

export default function Chat() {
  const { activeChat, closeChat, sendMockMessage, myProfileId } = useAppState();
  if (!activeChat) return null;

  return (
    <ChatScreen
      match={activeChat}
      onBack={() => { closeChat(); router.back(); }}
      onSendMessage={sendMockMessage}
      myProfileId={myProfileId}
    />
  );
}
