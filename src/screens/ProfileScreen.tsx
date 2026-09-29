import { useState } from "react";
import { View, Text, Image, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { Camera, EyeOff, ChevronRight, Info, Settings as SettingsIcon, Sparkles, Crown } from "lucide-react-native";
import { router } from "expo-router";
import { theme } from "../theme";
import { Chip, IconButton } from "../components/ui";
import { useAppState } from "../hooks/useAppState";
import { usePremium } from "../hooks/usePremium";

const c = theme.color;

export function ProfileScreen({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { profile, updatePhoto, datePreferences } = useAppState();
  const { isPremium, triggerPaywall } = usePremium();
  const [showReveal, setShowReveal] = useState(false);
  if (!profile) return null;

  async function changePhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true });
    if (!result.canceled && result.assets?.[0]?.base64) {
      const asset = result.assets[0];
      updatePhoto(`data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={["top"]}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 }}>
        <Text style={{ color: c.text, fontSize: theme.font.h1, fontWeight: "700" }}>Profile</Text>
        <IconButton icon={<SettingsIcon size={17} color={c.text} />} onPress={onOpenSettings} size={38} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 24 }}>
        <Pressable onPress={() => triggerPaywall()} style={{ padding: 16, borderRadius: theme.radius.lg, backgroundColor: isPremium ? c.successSoft : c.primary, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Crown size={20} color={isPremium ? c.success : c.accent} />
          <Text style={{ flex: 1, color: isPremium ? c.success : c.white, fontSize: theme.font.secondary, fontWeight: "700" }}>{isPremium ? "Blink+ Active ✓ · Visibility boosted" : "Upgrade to Blink+"}</Text>
          {!isPremium && <Text style={{ color: c.white, fontWeight: "700" }}>See Plans</Text>}
        </Pressable>
        <View style={{ borderRadius: theme.radius.xl, overflow: "hidden", aspectRatio: 4 / 5, backgroundColor: c.surface2 }}>
          <Image source={{ uri: profile.photo }} style={{ width: "100%", height: "100%" }} />
          <LinearGradient colors={["transparent", "rgba(0,0,0,0.85)"]} style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "55%" }} />
          <View style={{ position: "absolute", left: 20, right: 20, bottom: 20 }}>
            <Text style={{ color: c.white, fontSize: 24, fontWeight: "700" }}>{profile.name}, {profile.age}</Text>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: theme.font.secondary }}>{profile.location}</Text>
          </View>
          <Pressable onPress={changePhoto} style={{ position: "absolute", top: 16, right: 16, width: 38, height: 38, borderRadius: 19, backgroundColor: c.primary, alignItems: "center", justifyContent: "center" }}>
            <Camera size={16} color={c.white} />
          </Pressable>
        </View>

        {profile.interests.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {profile.interests.map((i) => <Chip key={i}>{i}</Chip>)}
          </View>
        )}

        {profile.prompts.length > 0 && (
          <View style={{ gap: 16 }}>
            {profile.prompts.map((p) => (
              <View key={p.q}>
                <Text style={{ color: c.text3, fontSize: theme.font.caption, fontWeight: "600", marginBottom: 4 }}>{p.q}</Text>
                <Text style={{ color: c.text, fontSize: theme.font.body, lineHeight: 22 }}>{p.a}</Text>
              </View>
            ))}
          </View>
        )}

        {profile.interests.length === 0 && profile.prompts.length === 0 && (
          <Text style={{ color: c.text2, fontSize: theme.font.secondary }}>Add interests and prompts to bring your profile to life.</Text>
        )}

        <Pressable
          onPress={() => router.push("/date-preferences")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: 14,
            borderTopWidth: 1,
            borderTopColor: c.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Sparkles size={16} color={c.primary} />
            <View>
              <Text style={{ color: c.text, fontSize: theme.font.secondary, fontWeight: "600" }}>
                Date Preferences
              </Text>
              <Text style={{ color: c.text2, fontSize: theme.font.caption }}>
                {datePreferences?.activities?.length || datePreferences?.foods?.length
                  ? `${datePreferences.activities.length} activities · ${datePreferences.foods.length} cuisines`
                  : "Activities, cuisines & drinks"}
              </Text>
            </View>
          </View>
          <ChevronRight size={16} color={c.text3} />
        </Pressable>

        <Pressable onPress={() => setShowReveal((s) => !s)} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderTopWidth: 1, borderTopColor: c.border }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <EyeOff size={16} color={c.text3} />
            <Text style={{ color: c.text, fontSize: theme.font.secondary, fontWeight: "500" }}>What shows in the reveal round</Text>
          </View>
          <ChevronRight size={16} color={c.text3} />
        </Pressable>
        {showReveal && (
          <View style={{ flexDirection: "row", gap: 8, marginTop: -12 }}>
            <Info size={14} color={c.text3} style={{ marginTop: 2 }} />
            <Text style={{ flex: 1, color: c.text2, fontSize: theme.font.caption, lineHeight: 18 }}>
              You're playing as a judge tonight, so this is just a preview of what a contestant would see about you if you ever took the hot seat.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
