import { useRef, useState } from "react";
import { View, Text, ImageBackground, Pressable, ScrollView, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Users, LockKeyhole, MessageCircle, ChevronUp } from "lucide-react-native";
import { theme } from "../theme";
import { CONTESTANT_POOL, type Contestant } from "../data/contestants";
import { usePremium } from "../hooks/usePremium";

const c = theme.color;
const MOCK_ROOM_HOSTS = ["Noah", "Maya", "Eli", "Zoe", "Jordan", "Avery"];
const MOCK_ROOM_PHOTOS = [12, 44, 15, 49, 68, 32];
const MOCK_ROOMS: Contestant[] = MOCK_ROOM_HOSTS.map((name, index) => ({
  ...CONTESTANT_POOL[index % CONTESTANT_POOL.length],
  id: `mock-room-${index + 1}`,
  name,
  photo: `https://i.pravatar.cc/900?img=${MOCK_ROOM_PHOTOS[index]}`,
}));

export function RoomsScreen({
  contestants, onEnterRoom,
}: { contestants: Contestant[]; onEnterRoom: (c: Contestant) => void; onRefreshPool: () => void }) {
  const { isPremium, triggerPaywall } = usePremium();
  // Keep the Rooms experience usable while hosted-room discovery is empty.
  const roomContestants = contestants.length > 0 ? contestants : MOCK_ROOMS;
  const [pageHeight, setPageHeight] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handlePageChange = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!pageHeight) return;
    const index = Math.round(event.nativeEvent.contentOffset.y / pageHeight);
    if (!isPremium && index > 0) {
      triggerPaywall();
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      setActiveIndex(0);
      return;
    }
    setActiveIndex(index);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={["top"]}>
      {(
        <View style={{ flex: 1 }} onLayout={(event) => setPageHeight(event.nativeEvent.layout.height)}>
          <ScrollView
            ref={scrollRef}
            pagingEnabled
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handlePageChange}
            scrollEventThrottle={16}
            style={{ flex: 1 }}
          >
            {roomContestants.map((contestant, i) => {
              const peopleCount = 8 + (Array.from(contestant.id).reduce((n, ch) => n + ch.charCodeAt(0), 0) % 17);
              return (
              <View key={contestant.id} style={{ width: "100%", height: pageHeight || "100%", backgroundColor: "#211722" }}>
                  <ImageBackground source={{ uri: contestant.photo }} resizeMode="cover" imageStyle={{ transform: [{ scale: 1.08 }] }} blurRadius={16} style={{ flex: 1, justifyContent: "space-between" }}>
                    <LinearGradient colors={["rgba(12,8,15,0.42)", "transparent", "rgba(12,8,15,0.88)"]} locations={[0, 0.42, 1]} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
                    <View style={{ paddingHorizontal: 22, paddingTop: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(20,12,20,0.54)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: theme.radius.full }}>
                        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#FF5C70" }} />
                        <Text style={{ color: c.white, fontSize: theme.font.caption, fontWeight: "700", letterSpacing: 0.5 }}>LIVE ROOM</Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(20,12,20,0.54)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: theme.radius.full }}>
                        <Users size={15} color={c.white} />
                        <Text style={{ color: c.white, fontSize: theme.font.caption, fontWeight: "700" }}>{peopleCount} vibing</Text>
                      </View>
                    </View>

                    <View style={{ paddingHorizontal: 24, paddingBottom: 30 }}>
                      <View style={{ alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.16)", borderRadius: theme.radius.full, paddingHorizontal: 12, paddingVertical: 7, marginBottom: 14 }}>
                        <Text style={{ color: c.white, fontSize: theme.font.caption, fontWeight: "600" }}>{contestant.location} · Room {i + 1}</Text>
                      </View>
                      <Text style={{ color: c.white, fontSize: 34, lineHeight: 40, fontWeight: "800", marginBottom: 7 }}>{contestant.name} is vibing</Text>
                      <Text style={{ color: "rgba(255,255,255,0.82)", fontSize: 16, lineHeight: 23, marginBottom: 24 }}>with {peopleCount} people right now</Text>
                      <Pressable onPress={() => onEnterRoom(contestant)} style={{ minHeight: 56, borderRadius: theme.radius.full, backgroundColor: c.white, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10 }}>
                        <MessageCircle size={19} color={c.primary} />
                        <Text style={{ color: c.primary, fontSize: 16, fontWeight: "800" }}>Enter room to chat</Text>
                      </Pressable>
                      <View style={{ alignItems: "center", marginTop: 18, gap: 5 }}>
                        <ChevronUp size={18} color="rgba(255,255,255,0.76)" />
                        <Text style={{ color: "rgba(255,255,255,0.76)", fontSize: theme.font.caption, fontWeight: "600" }}>
                          {i < roomContestants.length - 1 ? (isPremium ? "Swipe up for the next room" : "Swipe for more rooms") : "You've reached the end of rooms"}
                        </Text>
                      </View>
                    </View>
                  </ImageBackground>
                  {!isPremium && i > 0 && (
                    <Pressable onPress={() => triggerPaywall()} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15,10,18,0.36)", alignItems: "center", justifyContent: "center" }}>
                      <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: "rgba(20,12,20,0.66)", alignItems: "center", justifyContent: "center", marginBottom: 12 }}><LockKeyhole color={c.white} size={25} /></View>
                      <Text style={{ color: c.white, fontSize: 17, fontWeight: "800" }}>More rooms with Premium</Text>
                      <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 5 }}>Tap to see plans</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </ScrollView>
          {roomContestants.length > 1 && (
            <View pointerEvents="none" style={{ position: "absolute", top: 18, alignSelf: "center", flexDirection: "row", gap: 5 }}>
              {roomContestants.map((item, index) => <View key={item.id} style={{ width: 20, height: 3, borderRadius: 2, backgroundColor: index === activeIndex ? c.white : "rgba(255,255,255,0.44)" }} />)}
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
