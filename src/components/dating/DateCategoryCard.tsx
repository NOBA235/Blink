import React, { useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Platform,
} from "react-native";
import {
  Utensils,
  Wine,
  Film,
  Music,
  Footprints,
  Gamepad2,
  Coffee,
  Sparkles,
  Check,
} from "lucide-react-native";
import { datingTheme } from "../../theme";

export interface DateCategoryCardProps {
  id: string;
  label: string;
  subtitle?: string;
  iconName: string;
  pastelBg?: string;
  selected: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

function renderCategoryIcon(name: string, isSelected: boolean) {
  const iconColor = isSelected ? datingTheme.color.primary : "#4A3B4E";
  const iconSize = 28;

  switch (name.toLowerCase()) {
    case "utensils":
    case "dining":
      return <Utensils size={iconSize} color={iconColor} strokeWidth={1.8} />;
    case "wine":
    case "drinks":
      return <Wine size={iconSize} color={iconColor} strokeWidth={1.8} />;
    case "film":
    case "movie":
      return <Film size={iconSize} color={iconColor} strokeWidth={1.8} />;
    case "music":
    case "live_music":
      return <Music size={iconSize} color={iconColor} strokeWidth={1.8} />;
    case "footprints":
    case "coffee_walk":
    case "stroll":
      return <Footprints size={iconSize} color={iconColor} strokeWidth={1.8} />;
    case "gamepad-2":
    case "gamepad2":
    case "games":
      return <Gamepad2 size={iconSize} color={iconColor} strokeWidth={1.8} />;
    case "coffee":
      return <Coffee size={iconSize} color={iconColor} strokeWidth={1.8} />;
    default:
      return <Sparkles size={iconSize} color={iconColor} strokeWidth={1.8} />;
  }
}

export function DateCategoryCard({
  label,
  subtitle,
  iconName,
  pastelBg = "#F7EFF7",
  selected,
  onPress,
  style,
}: DateCategoryCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.96,
      duration: 110,
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
        styles.wrapper,
        { transform: [{ scale: scaleAnim }] },
        style,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} category, ${selected ? "selected" : "not selected"}`}
        accessibilityState={{ selected }}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          selected ? styles.cardSelected : styles.cardUnselected,
        ]}
      >
        {/* Selected badge checkmark in corner */}
        <View
          style={[
            styles.selectionBadge,
            selected ? styles.selectionBadgeActive : styles.selectionBadgeInactive,
          ]}
        >
          {selected && (
            <Check size={12} color="#FFFFFF" strokeWidth={3} />
          )}
        </View>

        {/* Pastel visual framing for icon */}
        <View
          style={[
            styles.iconFrame,
            { backgroundColor: pastelBg },
            selected && styles.iconFrameSelected,
          ]}
        >
          {renderCategoryIcon(iconName, selected)}
        </View>

        {/* Category label */}
        <Text
          style={[
            styles.label,
            selected ? styles.labelSelected : styles.labelUnselected,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>

        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    minWidth: 100,
  },
  card: {
    backgroundColor: datingTheme.color.surface,
    borderRadius: datingTheme.radius.card,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    minHeight: 120,
    position: "relative",
    ...Platform.select({
      ios: {
        shadowColor: "#2A182A",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardUnselected: {
    borderColor: datingTheme.color.border,
  },
  cardSelected: {
    borderColor: datingTheme.color.primary,
    backgroundColor: "#FFFAFC",
  },
  selectionBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  selectionBadgeInactive: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: datingTheme.color.inactiveBorder,
  },
  selectionBadgeActive: {
    backgroundColor: datingTheme.color.primary,
    borderWidth: 0,
  },
  iconFrame: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  iconFrameSelected: {
    borderWidth: 1,
    borderColor: "rgba(78, 33, 78, 0.15)",
  },
  label: {
    fontSize: 15,
    letterSpacing: -0.1,
    textAlign: "center",
  },
  labelUnselected: {
    fontWeight: "600",
    color: datingTheme.color.textPrimary,
  },
  labelSelected: {
    fontWeight: "700",
    color: datingTheme.color.primary,
  },
  subtitle: {
    fontSize: 11,
    color: datingTheme.color.textSecondary,
    marginTop: 2,
    textAlign: "center",
  },
});
