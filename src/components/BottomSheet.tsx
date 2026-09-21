import { ReactNode } from "react";
import { Modal, View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { theme } from "../theme";
import { IconButton } from "./ui";

const c = theme.color;

export function BottomSheet({
  visible, onClose, title, children,
}: { visible: boolean; onClose: () => void; title: string; children: ReactNode }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)" }} onPress={onClose} />
        <View style={{ backgroundColor: c.surface2, borderTopLeftRadius: theme.radius.xl, borderTopRightRadius: theme.radius.xl, maxHeight: "85%" }}>
          <SafeAreaView edges={["bottom"]}>
            <View style={{ alignItems: "center", paddingTop: 12 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.surface3 }} />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
              <Text style={{ fontSize: theme.font.h2, fontWeight: "700", color: c.text }}>{title}</Text>
              <IconButton icon={<X size={16} color={c.text} />} onPress={onClose} size={32} />
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
              {children}
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}
