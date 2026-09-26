import React from "react";
import { View, Text, StyleSheet, Platform, ViewStyle, StyleProp } from "react-native";
import { Sparkles, Compass } from "lucide-react-native";
import { datingTheme } from "../../theme";
import { ActivityCategoryItem } from "../../types/dating";

interface PreferenceSummaryCardProps {
  activityLabels: string[];
  foodLabels: string[];
  drinkLabels: string[];
  style?: StyleProp<ViewStyle>;
}

export function PreferenceSummaryCard({
  activityLabels,
  foodLabels,
  drinkLabels,
  style,
}: PreferenceSummaryCardProps) {
  const hasActivities = activityLabels.length > 0;
  const hasFoods = foodLabels.length > 0;
  const hasDrinks = drinkLabels.length > 0;
  const hasAnySelection = hasActivities || hasFoods || hasDrinks;

  return (
    <View style={[styles.card, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconContainer}>
          <Sparkles size={16} color={datingTheme.color.primary} />
        </View>
        <Text style={styles.headerTitle}>Your date style</Text>
      </View>

      {!hasAnySelection ? (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyIconBg}>
            <Compass size={22} color={datingTheme.color.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No preferences selected yet</Text>
          <Text style={styles.emptyDescription}>
            Pick your favorite activities, dining spots, and drinks above to see your customized date profile here.
          </Text>
        </View>
      ) : (
        <View style={styles.sectionsContainer}>
          {hasActivities && (
            <View style={styles.summarySection}>
              <Text style={styles.sectionTitle}>Things to do</Text>
              <Text style={styles.sectionContent}>
                {activityLabels.join("  ·  ")}
              </Text>
            </View>
          )}

          {hasFoods && (
            <View
              style={[
                styles.summarySection,
                hasActivities && styles.sectionBorder,
              ]}
            >
              <Text style={styles.sectionTitle}>Dining</Text>
              <Text style={styles.sectionContent}>
                {foodLabels.join("  ·  ")}
              </Text>
            </View>
          )}

          {hasDrinks && (
            <View
              style={[
                styles.summarySection,
                (hasActivities || hasFoods) && styles.sectionBorder,
              ]}
            >
              <Text style={styles.sectionTitle}>Drinks</Text>
              <Text style={styles.sectionContent}>
                {drinkLabels.join("  ·  ")}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: datingTheme.color.surface,
    borderRadius: datingTheme.radius.cardLarge,
    padding: datingTheme.space.xl,
    borderWidth: 1,
    borderColor: datingTheme.color.border,
    marginBottom: datingTheme.space.xxl,
    ...Platform.select({
      ios: {
        shadowColor: "#331633",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: datingTheme.space.lg,
  },
  headerIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: datingTheme.color.activeBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: datingTheme.typography.serif,
    fontSize: 20,
    fontWeight: "700",
    color: datingTheme.color.primary,
    letterSpacing: -0.2,
  },
  sectionsContainer: {
    gap: 0,
  },
  summarySection: {
    paddingVertical: datingTheme.space.sm,
  },
  sectionBorder: {
    borderTopWidth: 1,
    borderTopColor: datingTheme.color.border,
    paddingTop: datingTheme.space.md,
    marginTop: datingTheme.space.xs,
  },
  sectionTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: datingTheme.color.textMuted,
    marginBottom: 4,
  },
  sectionContent: {
    fontSize: 16,
    fontWeight: "600",
    color: datingTheme.color.textPrimary,
    lineHeight: 22,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: datingTheme.space.lg,
    paddingHorizontal: datingTheme.space.md,
  },
  emptyIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: datingTheme.color.pastelLavender,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: datingTheme.color.textPrimary,
    marginBottom: 6,
  },
  emptyDescription: {
    fontSize: 13,
    color: datingTheme.color.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 260,
  },
});
