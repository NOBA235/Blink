// Same values as the web app's GlobalStyles CSS custom properties — kept as
// a plain object here since React Native has no CSS/custom-properties
// equivalent. Import `theme` wherever a color/spacing value is needed.

export const theme = {
  color: {
    bg: "#FAF4F8",
    surface: "#FFFFFF",
    surface2: "#F4EBF4",
    surface3: "#EFE8EF",
    border: "#EFE8EF",
    borderStrong: "#E2DAE2",
    text: "#1C141E",
    text2: "#655966",
    text3: "#8F8291",
    primary: "#4E214E",
    primaryLight: "#6E336E",
    primaryPress: "#3D193D",
    primarySoft: "rgba(78, 33, 78, 0.12)",
    accent: "#D49B4B",
    accentSoft: "rgba(212, 155, 75, 0.16)",
    overlay: "rgba(15, 10, 18, 0.72)",
    success: "#2E7D59",
    successSoft: "rgba(46, 125, 89, 0.12)",
    danger: "#C84B4B",
    dangerSoft: "rgba(200, 75, 75, 0.12)",
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

import { Platform } from "react-native";

export const datingTheme = {
  color: {
    background: "#FAF4F8",
    bg: "#FAF4F8",
    surface: "#FFFFFF",
    border: "#EFE8EF",
    primary: "#4E214E",
    primaryDark: "#3D193D",
    activeBackground: "#F4EBF4",
    activeText: "#4E214E",
    inactiveBorder: "#E2DAE2",
    inactiveText: "#4A4A4A",
    textPrimary: "#1C141E",
    textSecondary: "#655966",
    textMuted: "#8F8291",
    pastelPill: "#F3EBF3",
    pastelPeach: "#FDF2EC",
    pastelLavender: "#F6EFF7",
    pastelSage: "#EEF5F0",
    pastelRose: "#FDF0F4",
    shadow: "rgba(78, 33, 78, 0.06)",
  },
  typography: {
    serif: Platform.select({
      ios: "Georgia",
      android: "serif",
      default: "Georgia",
    }),
    sans: Platform.select({
      ios: "System",
      android: "sans-serif",
      default: "System",
    }),
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    card: 20,
    cardLarge: 24,
    cta: 27,
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
  geometry: {
    pagePaddingHorizontal: 20,
    ctaHeight: 54,
    ctaRadius: 27,
    minTouchTarget: 44,
  },
} as const;

export type DatingTheme = typeof datingTheme;
export type Theme = typeof theme;
