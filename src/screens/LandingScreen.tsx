import { useEffect, useMemo, useRef } from "react";
import { Animated, Pressable, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";
import { Heart, Sparkles } from "lucide-react-native";
import { theme } from "../theme";
import { LogoMark } from "../components/LogoMark";
import { PrimaryButton } from "../components/ui";

const c = theme.color;

const portraits = [
  { skin: "#D99A71", hair: "#30221F", shirt: "#D98D73", bg: "#F4DCCB", style: 0 },
  { skin: "#F0C9A2", hair: "#6E4734", shirt: "#789080", bg: "#DFE9DF", style: 1 },
  { skin: "#8C543B", hair: "#211E20", shirt: "#D8A648", bg: "#F3E7C7", style: 2 },
  { skin: "#E4B291", hair: "#A65F3C", shirt: "#6F8EA4", bg: "#DEE8EE", style: 3 },
  { skin: "#B87D5A", hair: "#242329", shirt: "#BD7480", bg: "#F2DFE3", style: 1 },
  { skin: "#F1C7A2", hair: "#49352F", shirt: "#839B70", bg: "#E5EBD9", style: 0 },
  { skin: "#70432F", hair: "#17191C", shirt: "#8075A0", bg: "#E7E2EF", style: 2 },
  { skin: "#D99E7D", hair: "#53382E", shirt: "#D98756", bg: "#F5E2D4", style: 3 },
  { skin: "#F1D0AD", hair: "#B9814E", shirt: "#568C86", bg: "#DDECE8", style: 2 },
  { skin: "#A9694D", hair: "#262127", shirt: "#C2A1C6", bg: "#EFE4EF", style: 1 },
  { skin: "#E9B793", hair: "#382B29", shirt: "#7484A2", bg: "#E0E6F0", style: 0 },
  { skin: "#C98B65", hair: "#4A3025", shirt: "#D8A25C", bg: "#F2E6D2", style: 3 },
];

function Portrait({ index }: { index: number }) {
  const p = portraits[index % portraits.length];
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="50" fill={p.bg} />
      <Path d="M8 104c2-22 17-34 42-34s40 12 42 34" fill={p.shirt} />
      <Path d="M38 65h24v17H38z" fill={p.skin} />
      {p.style === 2 && <Path d="M23 50c-9-22 1-40 25-40 22 0 33 18 27 40l-5 18H29z" fill={p.hair} />}
      {p.style === 0 && <Path d="M25 49c-8-23 3-38 25-38s31 16 25 39l-5 9H31z" fill={p.hair} />}
      {p.style === 1 && <Path d="M25 48c-7-24 3-38 25-38 20 0 30 14 25 38l-7-7-6-20c-8 8-19 11-36 10z" fill={p.hair} />}
      {p.style === 3 && <Path d="M26 54c-8-28 5-43 24-43 23 0 33 20 25 43l-8-8-2-24c-9 9-24 13-37 11z" fill={p.hair} />}
      <Ellipse cx="50" cy="48" rx="19" ry="23" fill={p.skin} />
      {p.style === 0 && <Path d="M31 37c1-16 11-25 22-24 13 1 20 11 17 24-8-7-23-10-39 0" fill={p.hair} />}
      {p.style === 1 && <Path d="M32 33c3-14 10-20 21-20 11 0 17 9 18 20-13-6-25-6-39 0" fill={p.hair} />}
      {p.style === 3 && <Path d="M30 35c2-15 9-22 20-22 14 0 20 9 20 22-11-7-28-7-40 0" fill={p.hair} />}
      <Circle cx="43" cy="48" r="1.5" fill="#382721" /><Circle cx="57" cy="48" r="1.5" fill="#382721" />
      <Path d="M46 58c3 2 6 2 9 0" fill="none" stroke="#985D4B" strokeWidth="1.7" strokeLinecap="round" />
      {index % 3 === 1 && <Rect x="27" y="45" width="17" height="10" rx="5" fill="none" stroke="#594A42" strokeWidth="2" />}
      {index % 3 === 1 && <Rect x="56" y="45" width="17" height="10" rx="5" fill="none" stroke="#594A42" strokeWidth="2" />}
    </Svg>
  );
}

const profiles = [
  { x: 4, y: 24, s: 62 }, { x: 25, y: 4, s: 76 }, { x: 61, y: 10, s: 70 }, { x: 82, y: 32, s: 56 },
  { x: 1, y: 56, s: 70 }, { x: 22, y: 39, s: 92 }, { x: 57, y: 44, s: 96 }, { x: 79, y: 65, s: 70 },
  { x: 17, y: 76, s: 56 }, { x: 43, y: 77, s: 64 }, { x: 67, y: 80, s: 50 }, { x: 43, y: 0, s: 48 },
];

function FloatingPortrait({ index, size, left, top }: { index: number; size: number; left: string; top: string }) {
  const lift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(lift, { toValue: -3, duration: 2100 + (index % 4) * 220, useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 2100 + (index % 4) * 220, useNativeDriver: true }),
    ]));
    const timer = setTimeout(() => animation.start(), (index % 5) * 170);
    return () => { clearTimeout(timer); animation.stop(); };
  }, [index, lift]);
  return (
    <Animated.View style={{ position: "absolute", left, top, width: size, height: size, transform: [{ translateY: lift }], zIndex: index + 1 }}>
      <View style={{ flex: 1, borderRadius: size / 2, overflow: "hidden", borderWidth: 3, borderColor: "#FFFDF9", backgroundColor: portraits[index].bg, shadowColor: "#49314A", shadowOpacity: 0.14, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 4 }}>
        <Portrait index={index} />
      </View>
    </Animated.View>
  );
}

export function LandingScreen() {
  const { width, height } = useWindowDimensions();
  const avatarSize = Math.min(94, Math.max(42, width * 0.235));
  const compact = height < 740;
  const layout = useMemo(() => profiles.map((p) => ({ ...p, size: p.s / 96 * avatarSize, left: `${p.x}%`, top: `${p.y}%` })), [avatarSize]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FBF8F2" }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: compact ? 4 : 10, paddingBottom: 8 }}>
        <View style={{ height: 42, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 }}>
          <LogoMark size={30} />
          <Text style={{ fontSize: 22, fontWeight: "700", letterSpacing: -0.7, color: c.text }}>blink</Text>
        </View>

        <View style={{ flex: 1, minHeight: 255, maxHeight: compact ? 340 : 390, marginTop: compact ? 4 : 10, marginBottom: compact ? 4 : 12, position: "relative", alignSelf: "center", width: "100%" }}>
          {layout.map((p, i) => <FloatingPortrait key={i} index={i} size={p.size} left={p.left} top={p.top} />)}
          <View style={{ position: "absolute", left: "30%", top: "31%", zIndex: 30, width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFDF9", borderWidth: 1, borderColor: "#F1E7DC", shadowColor: "#6A3945", shadowOpacity: 0.1, shadowRadius: 6, elevation: 2 }}>
            <Heart size={15} color="#C96C72" fill="#C96C72" />
          </View>
          <View style={{ position: "absolute", right: "23%", top: "70%", zIndex: 30, width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFDF9", borderWidth: 1, borderColor: "#F1E7DC" }}>
            <Sparkles size={15} color="#B48748" />
          </View>
          <View style={{ position: "absolute", left: "42%", top: "49%", zIndex: 30, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: "#FFFDF9", borderWidth: 1, borderColor: "#F1E7DC" }}>
            <Text style={{ color: c.primary, fontSize: 10, fontWeight: "700", letterSpacing: 0.2 }}>GOOD ENERGY</Text>
          </View>
        </View>

        <View style={{ alignItems: "center", paddingHorizontal: 2, marginTop: 2 }}>
          <Text style={{ color: c.text, fontSize: compact ? 29 : 32, lineHeight: compact ? 35 : 38, fontWeight: "700", letterSpacing: -1.1, textAlign: "center" }}>
            Find your people.{"\n"}<Text style={{ color: c.primary }}>Match your vibe.</Text>
          </Text>
          <Text style={{ color: c.text2, fontSize: 14, lineHeight: 21, textAlign: "center", maxWidth: 310, marginTop: 10 }}>
            Discover people who share your energy, interests, and vibe — not just a profile.
          </Text>
        </View>

        <View style={{ width: "100%", gap: 4, paddingTop: compact ? 14 : 20, paddingBottom: 2 }}>
          <PrimaryButton onPress={() => router.push("/auth")} style={{ width: "100%", minHeight: 56, borderRadius: 18, backgroundColor: c.primary }}>
            <Text style={{ color: c.white, fontSize: 16, fontWeight: "700" }}>Get Started</Text>
          </PrimaryButton>
          <Pressable onPress={() => router.push("/date-special")} style={({ pressed }) => ({ minHeight: 44, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.65 : 1 })}>
            <Text style={{ color: c.text2, fontSize: 14, fontWeight: "600" }}>Explore Blink</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
