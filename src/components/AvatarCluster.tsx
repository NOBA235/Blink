import { useEffect, useRef } from "react";
import { Animated, View, useWindowDimensions, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";
import { Heart, Sparkles } from "lucide-react-native";
import { theme } from "../theme";

const portraits = [
  { skin: "#D99A71", hair: "#30221F", shirt: "#D98D73", bg: "#F4DCCB", style: 0 },
  { skin: "#F0C9A2", hair: "#6E4734", shirt: "#789080", bg: "#DFE9DF", style: 1 },
  { skin: "#8C543B", hair: "#211E20", shirt: "#D8A648", bg: "#F3E7C7", style: 2 },
  { skin: "#E4B291", hair: "#A65F3C", shirt: "#6F8EA4", bg: "#DEE8EE", style: 3 },
  { skin: "#B87D5A", hair: "#242329", shirt: "#BD7480", bg: "#F2DFE3", style: 1 },
  { skin: "#F1C7A2", hair: "#49352F", shirt: "#839B70", bg: "#E5EBD9", style: 0 },
];

function Portrait({ index }: { index: number }) {
  const p = portraits[index % portraits.length];
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="50" fill={p.bg} />
      <Path d="M8 104c2-22 17-34 42-34s40 12 42 34" fill={p.shirt} />
      <Path d="M38 65h24v17H38z" fill={p.skin} />
      {p.style === 2 && <Path d="M23 50c-9-22 1-40 25-40 22 0 33 18 27 40l-5 18H29z" fill={p.hair} />}
      {p.style !== 2 && <Path d="M25 49c-8-23 3-38 25-38s31 16 25 39l-5 9H31z" fill={p.hair} />}
      <Ellipse cx="50" cy="48" rx="19" ry="23" fill={p.skin} />
      <Path d="M31 37c1-16 11-25 22-24 13 1 20 11 17 24-8-7-23-10-39 0" fill={p.hair} />
      <Circle cx="43" cy="48" r="1.5" fill="#382721" /><Circle cx="57" cy="48" r="1.5" fill="#382721" />
      <Path d="M46 58c3 2 6 2 9 0" fill="none" stroke="#985D4B" strokeWidth="1.7" strokeLinecap="round" />
      {index % 3 === 1 && <><Rect x="27" y="45" width="17" height="10" rx="5" fill="none" stroke="#594A42" strokeWidth="2" /><Rect x="56" y="45" width="17" height="10" rx="5" fill="none" stroke="#594A42" strokeWidth="2" /></>}
    </Svg>
  );
}

function FloatingAvatar({ index, style }: { index: number; style: object }) {
  const lift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(lift, { toValue: -4, duration: 1700 + index * 160, useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 1700 + index * 160, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [index, lift]);
  const portrait = portraits[index % portraits.length];
  return (
    <Animated.View style={[style, { transform: [{ translateY: lift }] }]}>
      <View style={{ flex: 1, borderRadius: 999, overflow: "hidden", borderWidth: 3, borderColor: "#FFFFFF", backgroundColor: portrait.bg, elevation: 5 }}>
        <Portrait index={index} />
      </View>
    </Animated.View>
  );
}

export function AvatarCluster({ style }: { style?: StyleProp<ViewStyle> }) {
  const { width } = useWindowDimensions();
  const avatar = Math.min(92, width * 0.22);
  const people: { left?: `${number}%`; right?: `${number}%`; top?: `${number}%`; bottom?: `${number}%`; size: number }[] = [
    { left: "4%", top: "25%", size: avatar * 0.82 }, { left: "28%", top: "4%", size: avatar },
    { right: "25%", top: "8%", size: avatar * 0.88 }, { right: "3%", top: "30%", size: avatar * 0.78 },
    { left: "8%", bottom: "4%", size: avatar * 0.8 }, { left: "39%", bottom: "0%", size: avatar * 0.92 },
    { right: "5%", bottom: "5%", size: avatar * 0.88 },
  ];
  const c = theme.color;
  return (
    <View style={[{ flex: 1, minHeight: 230, justifyContent: "center" }, style]}>
      <View style={{ flex: 1, position: "relative", maxWidth: 390, width: "100%", alignSelf: "center" }}>
        {people.map((p, i) => <FloatingAvatar key={i} index={i} style={{ position: "absolute", width: p.size, height: p.size, left: p.left, right: p.right, top: p.top, bottom: p.bottom }} />)}
        <View style={{ position: "absolute", left: "31%", top: "47%", width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF", elevation: 4 }}><Heart size={19} color={c.primary} fill={c.primary} /></View>
        <View style={{ position: "absolute", right: "28%", bottom: "22%", width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF9EF", elevation: 3 }}><Sparkles size={17} color={c.accent} /></View>
      </View>
    </View>
  );
}
