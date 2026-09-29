import { useState } from "react";
import { View, Text, Pressable, Switch } from "react-native";
import { Shield, Flag, EyeOff, User, RefreshCw, ChevronRight } from "lucide-react-native";
import { theme } from "../theme";
import { BottomSheet } from "../components/BottomSheet";
import { SecondaryButton } from "../components/ui";
import { useAppState } from "../hooks/useAppState";
import { usePremium } from "../hooks/usePremium";

const c = theme.color;

export function SettingsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { soundEnabled, toggleSound, resetEverything, signOut, myProfileId } = useAppState();
  const { devOverride, setDevOverride } = usePremium();
  const [confirmingReset, setConfirmingReset] = useState(false);

  return (
    <BottomSheet visible={visible} onClose={() => { setConfirmingReset(false); onClose(); }} title="Settings">
      <View style={{ gap: 24 }}>
        {__DEV__ && <View><Text style={styles.sectionLabel}>Developer</Text><View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12 }}><Text style={{ flex: 1, color: c.text, fontSize: theme.font.secondary, fontWeight: "500" }}>[DEV] Simulate Premium</Text><Switch value={devOverride} onValueChange={setDevOverride} trackColor={{ true: c.primary, false: c.surface3 }} thumbColor={c.white} /></View></View>}
        <View>
          <Text style={styles.sectionLabel}>Preferences</Text>
          <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12 }}>
            <Text style={{ flex: 1, color: c.text, fontSize: theme.font.secondary, fontWeight: "500" }}>Sound effects</Text>
            <Switch value={soundEnabled} onValueChange={toggleSound} trackColor={{ true: c.primary, false: c.surface3 }} thumbColor={c.white} />
          </View>
        </View>

        <View>
          <Text style={styles.sectionLabel}>Safety</Text>
          {[
            { icon: <Shield size={17} color={c.text2} />, label: "Blocked people" },
            { icon: <Flag size={17} color={c.text2} />, label: "Report a problem" },
            { icon: <EyeOff size={17} color={c.text2} />, label: "Hide my profile" },
          ].map((row) => (
            <Pressable key={row.label} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 }}>
              {row.icon}
              <Text style={{ flex: 1, color: c.text, fontSize: theme.font.secondary, fontWeight: "500" }}>{row.label}</Text>
              <ChevronRight size={16} color={c.text3} />
            </Pressable>
          ))}
        </View>

        <View>
          <Text style={styles.sectionLabel}>Account</Text>
          {myProfileId && (
            <Pressable onPress={signOut} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 }}>
              <User size={17} color={c.text2} />
              <Text style={{ flex: 1, color: c.text, fontSize: theme.font.secondary, fontWeight: "500" }}>Sign out</Text>
            </Pressable>
          )}
          {!confirmingReset ? (
            <Pressable onPress={() => setConfirmingReset(true)} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 }}>
              <RefreshCw size={17} color={c.text2} />
              <Text style={{ flex: 1, color: c.text, fontSize: theme.font.secondary, fontWeight: "500" }}>Start over</Text>
            </Pressable>
          ) : (
            <View style={{ gap: 12, paddingVertical: 8 }}>
              <Text style={{ color: c.text2, fontSize: theme.font.caption, lineHeight: 18 }}>
                This clears your saved profile and matches from this device. It can't be undone.
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <SecondaryButton onPress={() => setConfirmingReset(false)} style={{ flex: 1, paddingVertical: 12 }}>Cancel</SecondaryButton>
                <Pressable onPress={resetEverything} style={{ flex: 1, backgroundColor: "#1c1c1c", borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: "#ffffff", fontSize: theme.font.secondary, fontWeight: "600" }}>Confirm</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = {
  sectionLabel: { color: c.text3, fontSize: theme.font.caption, fontWeight: "700" as const, marginBottom: 4 },
};
