import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../theme";

export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <LinearGradient
      colors={[theme.color.primaryLight, theme.color.primaryPress]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: size * 0.44,
          height: size * 0.44,
          borderRadius: (size * 0.44) / 2,
          backgroundColor: "rgba(255,255,255,0.92)",
        }}
      />
    </LinearGradient>
  );
}
