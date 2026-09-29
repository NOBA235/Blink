import React, { useRef } from "react";
import {
  Text,
  Pressable,
  Animated,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
  Platform,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { datingTheme } from "../../theme";

interface PrimaryCTAProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  includeSafeAreaBottom?: boolean;
  icon?: React.ReactNode;
}

export function PrimaryCTA({
  label,
  onPress,
  disabled = false,
  loading = false,
  style,
  includeSafeAreaBottom = true,
  icon,
}: PrimaryCTAProps) {
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 110,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.92,
        duration: 110,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const bottomPadding = includeSafeAreaBottom ? Math.max(insets.bottom, 12) : 0;

  return (
    <View style={[styles.wrapper, { paddingBottom: bottomPadding }]}>
      <Animated.View
        style={[
          styles.animatedContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ disabled: disabled || loading }}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          style={({ pressed }) => [
            styles.ctaButton,
            pressed && styles.ctaButtonPressed,
            disabled && styles.ctaButtonDisabled,
            style,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={styles.contentRow}>
              <Text style={styles.ctaText}>{label}</Text>
              {icon && <View style={styles.iconContainer}>{icon}</View>}
            </View>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  animatedContainer: {
    width: "100%",
  },
  ctaButton: {
    height: datingTheme.geometry.ctaHeight,
    borderRadius: datingTheme.geometry.ctaRadius,
    backgroundColor: "#1c1c1c",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    minHeight: datingTheme.geometry.minTouchTarget,
    ...Platform.select({
      ios: {
        shadowColor: "#1c1c1c",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  ctaButtonPressed: {
    backgroundColor: "#1c1c1c",
    opacity: 0.85,
  },
  ctaButtonDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  iconContainer: {
    marginLeft: 2,
  },
});
