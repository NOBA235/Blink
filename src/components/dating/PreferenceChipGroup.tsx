import React from "react";
import { View, Text, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { PreferenceChip } from "./PreferenceChip";
import { datingTheme } from "../../theme";

interface PreferenceChipGroupProps {
  title: string;
  subtitle?: string;
  options: string[];
  selectedOptions: string[];
  onToggle: (option: string) => void;
  style?: StyleProp<ViewStyle>;
  maxSelection?: number;
}

export function PreferenceChipGroup({
  title,
  subtitle,
  options,
  selectedOptions,
  onToggle,
  style,
  maxSelection,
}: PreferenceChipGroupProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.headerRow}>
        <View style={styles.titleColumn}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {maxSelection ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {selectedOptions.length}/{maxSelection}
            </Text>
          </View>
        ) : selectedOptions.length > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {selectedOptions.length} selected
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.chipsContainer}>
        {options.map((option) => {
          const isSelected = selectedOptions.includes(option);
          return (
            <PreferenceChip
              key={option}
              label={option}
              selected={isSelected}
              onPress={() => onToggle(option)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: datingTheme.space.xxl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: datingTheme.space.md,
  },
  titleColumn: {
    flex: 1,
    paddingRight: datingTheme.space.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: datingTheme.color.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13.5,
    color: datingTheme.color.textSecondary,
    lineHeight: 18,
  },
  badge: {
    backgroundColor: datingTheme.color.activeBackground,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: datingTheme.radius.full,
  },
  badgeText: {
    color: datingTheme.color.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
});
