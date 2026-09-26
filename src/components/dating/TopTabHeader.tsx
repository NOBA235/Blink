import React from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  ViewStyle,
  StyleProp,
} from "react-native";
import { ChevronLeft, RotateCcw, MoreHorizontal } from "lucide-react-native";
import { datingTheme } from "../../theme";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface TopTabHeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  onRightAction?: () => void;
  rightActionIcon?: "reset" | "more";
  tabs?: TabItem[];
  activeTab?: string;
  onSelectTab?: (tabId: string) => void;
  style?: StyleProp<ViewStyle>;
}

export function TopTabHeader({
  title,
  subtitle,
  onBack,
  onRightAction,
  rightActionIcon = "more",
  tabs,
  activeTab,
  onSelectTab,
  style,
}: TopTabHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Top action row */}
      <View style={styles.topRow}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [
              styles.navButton,
              pressed && styles.navButtonPressed,
            ]}
          >
            <ChevronLeft
              size={22}
              color={datingTheme.color.textPrimary}
              strokeWidth={2.4}
            />
          </Pressable>
        ) : (
          <View style={styles.navButtonPlaceholder} />
        )}

        {/* Center title if provided */}
        {title ? (
          <View style={styles.titleContainer}>
            <Text style={styles.navTitle} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.navSubtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        {/* Right action button */}
        {onRightAction ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={rightActionIcon === "reset" ? "Reset preferences" : "More options"}
            onPress={onRightAction}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [
              styles.navButton,
              pressed && styles.navButtonPressed,
            ]}
          >
            {rightActionIcon === "reset" ? (
              <RotateCcw
                size={18}
                color={datingTheme.color.textSecondary}
                strokeWidth={2}
              />
            ) : (
              <MoreHorizontal
                size={20}
                color={datingTheme.color.textSecondary}
                strokeWidth={2}
              />
            )}
          </Pressable>
        ) : (
          <View style={styles.navButtonPlaceholder} />
        )}
      </View>

      {/* Optional horizontal category tabs */}
      {tabs && tabs.length > 0 && onSelectTab && (
        <View style={styles.tabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContent}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`${tab.label} tab`}
                  onPress={() => onSelectTab(tab.id)}
                  style={[
                    styles.tabPill,
                    isActive ? styles.tabPillActive : styles.tabPillInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      isActive ? styles.tabTextActive : styles.tabTextInactive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                  {tab.count !== undefined && tab.count > 0 && (
                    <View
                      style={[
                        styles.tabCountBadge,
                        isActive
                          ? styles.tabCountBadgeActive
                          : styles.tabCountBadgeInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tabCountText,
                          isActive
                            ? styles.tabCountTextActive
                            : styles.tabCountTextInactive,
                        ]}
                      >
                        {tab.count}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: datingTheme.color.bg,
    paddingBottom: datingTheme.space.sm,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: datingTheme.space.lg,
    paddingVertical: datingTheme.space.sm,
    minHeight: datingTheme.geometry.minTouchTarget,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: datingTheme.color.surface,
    borderWidth: 1,
    borderColor: datingTheme.color.border,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  navButtonPressed: {
    backgroundColor: datingTheme.color.activeBackground,
    borderColor: datingTheme.color.primary,
    opacity: 0.9,
  },
  navButtonPlaceholder: {
    width: 44,
    height: 44,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: datingTheme.color.textPrimary,
    textAlign: "center",
  },
  navSubtitle: {
    fontSize: 12,
    color: datingTheme.color.textSecondary,
    textAlign: "center",
    marginTop: 1,
  },
  tabsWrapper: {
    marginTop: datingTheme.space.xs,
    borderBottomWidth: 1,
    borderBottomColor: datingTheme.color.border,
    paddingBottom: 8,
  },
  tabsScrollContent: {
    paddingHorizontal: datingTheme.space.lg,
    gap: 8,
  },
  tabPill: {
    minHeight: 38,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: datingTheme.radius.full,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  tabPillInactive: {
    backgroundColor: datingTheme.color.surface,
    borderColor: datingTheme.color.border,
  },
  tabPillActive: {
    backgroundColor: datingTheme.color.primary,
    borderColor: datingTheme.color.primary,
  },
  tabText: {
    fontSize: 13.5,
    letterSpacing: 0.1,
  },
  tabTextInactive: {
    color: datingTheme.color.textSecondary,
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  tabCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  tabCountBadgeInactive: {
    backgroundColor: datingTheme.color.activeBackground,
  },
  tabCountBadgeActive: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: "700",
  },
  tabCountTextInactive: {
    color: datingTheme.color.primary,
  },
  tabCountTextActive: {
    color: "#FFFFFF",
  },
});
