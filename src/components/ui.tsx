import { ReactNode } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ViewStyle, StyleProp } from "react-native";
import { theme } from "../theme";

const c = theme.color;

export function PrimaryButton({
  children, onPress, disabled, style, textStyle,
}: { children: ReactNode; onPress?: () => void; disabled?: boolean; style?: StyleProp<ViewStyle>; textStyle?: any }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btnBase,
        { backgroundColor: c.primary },
        pressed && !disabled && { backgroundColor: c.primaryPress },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      {typeof children === "string" ? (
        <Text style={[styles.btnText, { color: c.white }, textStyle]}>{children}</Text>
      ) : children}
    </Pressable>
  );
}

export function SecondaryButton({
  children, onPress, disabled, style,
}: { children: ReactNode; onPress?: () => void; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btnBase,
        { backgroundColor: c.surface2, borderWidth: 1, borderColor: c.borderStrong },
        pressed && !disabled && { backgroundColor: c.surface3 },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      {typeof children === "string" ? <Text style={[styles.btnText, { color: c.text }]}>{children}</Text> : children}
    </Pressable>
  );
}

export function GhostButton({ children, onPress, style }: { children: ReactNode; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ padding: theme.space.sm }, pressed && { opacity: 0.6 }, style]}>
      <Text style={{ color: c.text2, fontSize: theme.font.secondary, fontWeight: "500", textAlign: "center" }}>{children}</Text>
    </Pressable>
  );
}

export function IconButton({
  icon, onPress, size = 40, style,
}: { icon: ReactNode; onPress?: () => void; size?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: size, height: size, borderRadius: theme.radius.full,
          backgroundColor: c.surface2, borderWidth: 1, borderColor: c.border,
          alignItems: "center", justifyContent: "center",
        },
        pressed && { backgroundColor: c.surface3, opacity: 0.9 },
        style,
      ]}
    >
      {icon}
    </Pressable>
  );
}

export function Chip({ children, active, onPress }: { children: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active
          ? { backgroundColor: c.primarySoft, borderColor: c.primary }
          : { backgroundColor: c.surface2, borderColor: c.border },
      ]}
    >
      <Text style={{ color: active ? c.primaryLight : c.text2, fontSize: theme.font.secondary, fontWeight: "500" }}>
        {children}
      </Text>
    </Pressable>
  );
}

export function Card({ children, elevated, style }: { children: ReactNode; elevated?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      style={[
        {
          backgroundColor: elevated ? c.surface2 : c.surface,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: theme.radius.lg,
          padding: theme.space.xl,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function ProgressBar({ total, index }: { total: number; index: number }) {
  const pct = total <= 1 ? 100 : Math.round((index / (total - 1)) * 100);
  return (
    <View style={{ flex: 1, height: 4, borderRadius: theme.radius.full, backgroundColor: c.surface3, overflow: "hidden" }}>
      <View style={{ width: `${pct}%`, height: "100%", backgroundColor: c.primary, borderRadius: theme.radius.full }} />
    </View>
  );
}

export function EmptyState({
  icon, title, subtitle, actionLabel, onAction,
}: { icon: ReactNode; title: string; subtitle: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={{ alignItems: "center", gap: theme.space.md, paddingVertical: 64, paddingHorizontal: theme.space.xxl }}>
      <View style={{ width: 56, height: 56, borderRadius: theme.radius.full, backgroundColor: c.surface2, alignItems: "center", justifyContent: "center" }}>
        {icon}
      </View>
      <Text style={{ color: c.text, fontSize: theme.font.body, fontWeight: "600" }}>{title}</Text>
      <Text style={{ color: c.text2, fontSize: theme.font.secondary, textAlign: "center", maxWidth: 240 }}>{subtitle}</Text>
      {actionLabel && (
        <SecondaryButton onPress={onAction} style={{ marginTop: theme.space.sm, paddingVertical: 10, paddingHorizontal: 20 }}>
          {actionLabel}
        </SecondaryButton>
      )}
    </View>
  );
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", gap: theme.space.md, paddingVertical: 64 }}>
      <ActivityIndicator color={c.primary} />
      <Text style={{ color: c.text2, fontSize: theme.font.secondary }}>{label}...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btnBase: {
    borderRadius: theme.radius.md,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontSize: theme.font.body,
    fontWeight: "600",
  },
  chip: {
    borderRadius: theme.radius.full,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});
