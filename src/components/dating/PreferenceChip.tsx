import React, { useRef, useEffect } from "react";
import {
  Text,
  Pressable,
  Animated,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Platform,
  View,
} from "react-native";
import { Check } from "lucide-react-native";
import { datingTheme } from "../../theme";

interface PreferenceChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  showCheckmark?: boolean;
}

export function PreferenceChip({
  label,
  selected,
  onPress,
  style,
  showCheckmark = true,
}: PreferenceChipProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const activeAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(activeAnim, {
      toValue: selected ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [selected, activeAnim]);

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 60,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.animatedWrapper,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${selected ? "selected" : "not selected"}`}
        accessibilityState={{ selected }}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        style={[
          styles.chipBase,
          selected ? styles.chipActive : styles.chipInactive,
          style,
        ]}
      >
        <View style={styles.contentRow}>
          {selected && showCheckmark && (
            <Check
              size={14}
              color={datingTheme.color.primary}
              strokeWidth={2.6}
              style={styles.checkIcon}
            />
          )}
          <Text
            style={[
              styles.chipLabel,
              selected ? styles.labelActive : styles.labelInactive,
            ]}
          >
            {label}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animatedWrapper: {
    marginRight: 8,
    marginBottom: 10,
  },
  chipBase: {
    minHeight: datingTheme.geometry.minTouchTarget,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: datingTheme.radius.full,
    borderWidth: 1.2,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  chipInactive: {
    backgroundColor: datingTheme.color.surface,
    borderColor: datingTheme.color.inactiveBorder,
  },
  chipActive: {
    backgroundColor: datingTheme.color.activeBackground,
    borderColor: datingTheme.color.primary,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  checkIcon: {
    marginRight: 6,
  },
  chipLabel: {
    fontSize: 14.5,
    letterSpacing: 0.2,
  },
  labelInactive: {
    color: datingTheme.color.inactiveText,
    fontWeight: "500",
  },
  labelActive: {
    color: datingTheme.color.activeText,
    fontWeight: "700",
  },
});
