// Same values as the web app's GlobalStyles CSS custom properties — kept as
// a plain object here since React Native has no CSS/custom-properties
// equivalent. Import `theme` wherever a color/spacing value is needed.

export const theme = {
  color: {
    bg: "#0B0B0E",
    surface: "#151519",
    surface2: "#1D1D23",
    surface3: "#26262E",
    border: "rgba(255,255,255,0.08)",
    borderStrong: "rgba(255,255,255,0.16)",
    text: "#F7F7F8",
    text2: "#A6A6B0",
    text3: "#6F6F79",
    primary: "#E93B62",
    primaryLight: "#FF6E8A",
    primaryPress: "#C42E4F",
    primarySoft: "rgba(233,59,98,0.14)",
    accent: "#E3B34D",
    success: "#3FBE83",
    successSoft: "rgba(63,190,131,0.14)",
    danger: "#D5533D",
    dangerSoft: "rgba(213,83,61,0.14)",
    white: "#FFFFFF",
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
  },
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  font: {
    display: 30,
    h1: 24,
    h2: 18,
    body: 15,
    secondary: 14,
    caption: 12,
  },
} as const;

export type Theme = typeof theme;
