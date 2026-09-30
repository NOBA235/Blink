import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowUpRight, Crown, Flame, Mic, MessageCircle, Users } from "lucide-react-native";
import { router } from "expo-router";
import { theme } from "../theme";
import { useAppState } from "../hooks/useAppState";
import { usePremium } from "../hooks/usePremium";
import { CONTESTANT_POOL } from "../data/contestants";
import { buzzTick } from "../lib/sound";

const c = theme.color;

interface HomeScreenProps {
  onOpenProfile: () => void;
  profileCompletion: number;
  roomsAvailable?: number;
  onEnterRoom?: () => void;
  onOpenRooms?: () => void;
}

export function HomeScreen({
  onOpenProfile,
  roomsAvailable = 3,
  onEnterRoom,
  onOpenRooms,
}: HomeScreenProps) {
  const { profile, myProfileId, availableContestants, enterLocalRoom, attemptRealRoom } = useAppState();
  const { isPremium, roomVisitsToday, triggerPaywall } = usePremium();
  if (!profile) return null;

  const hasRooms = availableContestants.length > 0;
  const featuredHost = hasRooms ? availableContestants[0] : CONTESTANT_POOL[0];
  const roomCount = hasRooms ? Math.max(roomsAvailable, availableContestants.length) : 0;
  const peopleCount = hasRooms ? roomCount * 4 + 2 : 6;
  const prompt = featuredHost.prompts[0];

  const openRooms = () => {
    buzzTick();
    if (!myProfileId) {
      router.push("/auth");
      return;
    }
    if (onOpenRooms) onOpenRooms();
    else router.push("/(tabs)/rooms");
  };

  const enterRoom = () => {
    buzzTick();
    if (onEnterRoom) {
      onEnterRoom();
      return;
    }
    enterLocalRoom?.(featuredHost);
    attemptRealRoom?.().catch(() => {});
    router.push("/room");
  };

  const hostRoom = () => {
    buzzTick();
    if (!isPremium && roomVisitsToday >= 5) {
      triggerPaywall();
      return;
    }
    if (!myProfileId) {
      router.push("/auth");
      return;
    }
    router.push("/create-room");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 10, paddingBottom: 28, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <View>
            <Text style={{ color: c.primary, fontSize: 13, fontWeight: "800", letterSpacing: 2 }}>BLINK</Text>
            <Text style={{ color: c.text, fontSize: 24, fontWeight: "800", marginTop: 3 }}>Rooms for tonight</Text>
          </View>
          <Pressable onPress={() => { buzzTick(); onOpenProfile(); }} accessibilityRole="button" accessibilityLabel="Open your profile" style={({ pressed }) => ({ width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: c.white, opacity: pressed ? 0.8 : 1 })}>
            <Image source={{ uri: profile.photo }} style={{ width: "100%", height: "100%", borderRadius: 22 }} />
          </Pressable>
        </View>

        <Pressable onPress={enterRoom} style={({ pressed }) => ({ flex: 1, minHeight: 430, borderRadius: 28, overflow: "hidden", backgroundColor: "#2B1B2B", marginBottom: 14, transform: [{ scale: pressed ? 0.99 : 1 }] })}>
          <Image source={{ uri: featuredHost.photo }} blurRadius={16} resizeMode="cover" style={{ position: "absolute", width: "100%", height: "100%", transform: [{ scale: 1.08 }] }} />
          <LinearGradient colors={["rgba(20,12,20,0.28)", "rgba(20,12,20,0.04)", "rgba(20,12,20,0.9)"]} locations={[0, 0.4, 1]} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />

          <View style={{ flex: 1, padding: 18, justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 99, backgroundColor: "rgba(20,12,20,0.58)", paddingHorizontal: 12, paddingVertical: 9 }}>
                {hasRooms ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#FF6173" }} /> : <Flame size={14} color={c.accent} />}
                <Text style={{ color: c.white, fontSize: 11, fontWeight: "800", letterSpacing: 0.6 }}>{hasRooms ? "ROOMS LIVE" : "ROOM PREVIEW"}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 99, backgroundColor: "rgba(20,12,20,0.58)", paddingHorizontal: 11, paddingVertical: 9 }}>
                <Users size={14} color={c.white} />
                <Text style={{ color: c.white, fontSize: 12, fontWeight: "700" }}>{peopleCount} here</Text>
              </View>
            </View>

            <View>
              <View style={{ alignSelf: "flex-start", borderRadius: 99, backgroundColor: "rgba(255,255,255,0.16)", paddingHorizontal: 11, paddingVertical: 7, marginBottom: 13 }}>
                <Text style={{ color: c.white, fontSize: 12, fontWeight: "600" }}>{featuredHost.location} · Hosted by {featuredHost.name}</Text>
              </View>
              <Text style={{ color: c.white, fontSize: 30, lineHeight: 36, fontWeight: "800", marginBottom: 8 }}>{hasRooms ? `${featuredHost.name}'s room` : "Meet someone new"}</Text>
              <Text style={{ color: "rgba(255,255,255,0.82)", fontSize: 15, lineHeight: 22, marginBottom: 20 }} numberOfLines={2}>{prompt?.a || "A room full of fresh faces and good conversation."}</Text>
              <Pressable onPress={enterRoom} style={({ pressed }) => ({ height: 54, borderRadius: 27, backgroundColor: c.white, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, opacity: pressed ? 0.9 : 1 })}>
                <MessageCircle size={18} color={c.primary} />
                <Text style={{ color: c.primary, fontSize: 15, fontWeight: "800" }}>Enter room to chat</Text>
              </Pressable>
              {!hasRooms && <Text style={{ color: "rgba(255,255,255,0.66)", fontSize: 11, textAlign: "center", marginTop: 10 }}>Demo room · live rooms appear here when available</Text>}
            </View>
          </View>
        </Pressable>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable onPress={hostRoom} style={({ pressed }) => ({ flex: 1, minHeight: 82, borderRadius: 20, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", gap: 12, opacity: pressed ? 0.84 : 1 })}>
            <View style={{ width: 42, height: 42, borderRadius: 15, backgroundColor: c.accentSoft, alignItems: "center", justifyContent: "center" }}><Mic size={19} color={c.primary} /></View>
            <View style={{ flex: 1 }}><Text style={{ color: c.text, fontSize: 14, fontWeight: "800" }}>Host a room</Text><Text style={{ color: c.text2, fontSize: 11, marginTop: 4 }}>Start your own</Text></View>
            {!isPremium && roomVisitsToday >= 5 ? <Crown size={16} color={c.accent} /> : <ArrowUpRight size={17} color={c.text3} />}
          </Pressable>
          <Pressable onPress={openRooms} style={({ pressed }) => ({ flex: 1, minHeight: 82, borderRadius: 20, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", gap: 12, opacity: pressed ? 0.84 : 1 })}>
            <View style={{ width: 42, height: 42, borderRadius: 15, backgroundColor: c.primarySoft, alignItems: "center", justifyContent: "center" }}><Users size={19} color={c.primary} /></View>
            <View style={{ flex: 1 }}><Text style={{ color: c.text, fontSize: 14, fontWeight: "800" }}>Browse rooms</Text><Text style={{ color: c.text2, fontSize: 11, marginTop: 4 }}>{hasRooms ? `${roomCount} to explore` : "See room previews"}</Text></View>
            <ArrowUpRight size={17} color={c.text3} />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
