import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Sparkles,
  Wine,
  UtensilsCrossed,
  Heart,
  CalendarCheck,
  CheckCircle2,
} from "lucide-react-native";
import { datingTheme } from "../theme";
import { PrimaryCTA } from "../components/dating/PrimaryCTA";
import { TopTabHeader } from "../components/dating/TopTabHeader";

interface DateSpecialScreenProps {
  onBack?: () => void;
  onGetStarted?: () => void;
}

export function DateSpecialScreen({
  onBack,
  onGetStarted,
}: DateSpecialScreenProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/home");
    }
  };

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      router.push("/date-preferences");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* Top Header */}
      <TopTabHeader
        onBack={handleBack}
        onRightAction={() => {}}
        rightActionIcon="more"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Main Content Area */}
        <View style={styles.mainContainer}>
          {/* Headline */}
          <Text style={styles.headline}>
            Let's Make Your Date Special!
          </Text>

          {/* Supporting explanation */}
          <Text style={styles.subtitle}>
            Choose your favorite options to help us suggest date ideas you'll both enjoy
          </Text>

          {/* Illustration Container */}
          <View style={styles.illustrationCard}>
            {/* Visual Motif: Soft Ambient Glow and Editorial Dating Emblem */}
            <View style={styles.ambientGlow} />

            <View style={styles.mascotContainer}>
              <View style={styles.iconBadgeLeft}>
                <UtensilsCrossed
                  size={24}
                  color={datingTheme.color.primary}
                  strokeWidth={2}
                />
              </View>

              <View style={styles.iconBadgeCenter}>
                <Heart
                  size={32}
                  color="#FFFFFF"
                  fill={datingTheme.color.primary}
                  strokeWidth={1.5}
                />
              </View>

              <View style={styles.iconBadgeRight}>
                <Wine
                  size={24}
                  color={datingTheme.color.primary}
                  strokeWidth={2}
                />
              </View>
            </View>

            {/* Sparkles accent */}
            <View style={styles.sparkleRow}>
              <Sparkles size={16} color={datingTheme.color.primary} />
              <Text style={styles.illustrationCaption}>
                Personalized Date Concierge
              </Text>
              <Sparkles size={16} color={datingTheme.color.primary} />
            </View>

            {/* Value bullets */}
            <View style={styles.valuePropsContainer}>
              <View style={styles.valueRow}>
                <CheckCircle2 size={16} color={datingTheme.color.primary} />
                <Text style={styles.valueText}>
                  Find mutually craved foods & drinks
                </Text>
              </View>
              <View style={styles.valueRow}>
                <CheckCircle2 size={16} color={datingTheme.color.primary} />
                <Text style={styles.valueText}>
                  Skip awkward "what do you want to do?" debates
                </Text>
              </View>
              <View style={styles.valueRow}>
                <CheckCircle2 size={16} color={datingTheme.color.primary} />
                <Text style={styles.valueText}>
                  Curated suggestions tuned to your personal vibe
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom CTA Section */}
        <View style={styles.bottomSection}>
          <PrimaryCTA
            label="Let's Get Started"
            onPress={handleGetStarted}
            includeSafeAreaBottom={false}
            icon={<CalendarCheck size={18} color="#FFFFFF" strokeWidth={2.4} />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: datingTheme.color.bg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: datingTheme.geometry.pagePaddingHorizontal,
    paddingTop: datingTheme.space.sm,
    paddingBottom: datingTheme.space.lg,
  },
  mainContainer: {
    flex: 1,
  },
  headline: {
    fontFamily: datingTheme.typography.serif,
    fontSize: 32,
    fontWeight: "700",
    color: datingTheme.color.textPrimary,
    lineHeight: 40,
    letterSpacing: -0.5,
    marginTop: datingTheme.space.sm,
    marginBottom: datingTheme.space.sm,
  },
  subtitle: {
    fontSize: 16,
    color: datingTheme.color.textSecondary,
    lineHeight: 24,
    marginBottom: datingTheme.space.xxl,
  },
  illustrationCard: {
    backgroundColor: datingTheme.color.surface,
    borderRadius: datingTheme.radius.card,
    borderWidth: 1,
    borderColor: datingTheme.color.border,
    paddingVertical: datingTheme.space.xxl,
    paddingHorizontal: datingTheme.space.xl,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#4E214E",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  ambientGlow: {
    position: "absolute",
    top: -40,
    width: 220,
    height: 180,
    borderRadius: 110,
    backgroundColor: datingTheme.color.pastelLavender,
    opacity: 0.8,
  },
  mascotContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: datingTheme.space.lg,
    marginTop: datingTheme.space.xs,
  },
  iconBadgeLeft: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: datingTheme.color.pastelPeach,
    alignItems: "center",
    justifyContent: "center",
    marginRight: -10,
    zIndex: 1,
    borderWidth: 2,
    borderColor: datingTheme.color.surface,
  },
  iconBadgeCenter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: datingTheme.color.primary,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    ...Platform.select({
      ios: {
        shadowColor: datingTheme.color.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  iconBadgeRight: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: datingTheme.color.pastelLavender,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -10,
    zIndex: 1,
    borderWidth: 2,
    borderColor: datingTheme.color.surface,
  },
  sparkleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: datingTheme.space.xl,
  },
  illustrationCaption: {
    fontSize: 13,
    fontWeight: "700",
    color: datingTheme.color.primary,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  valuePropsContainer: {
    width: "100%",
    backgroundColor: datingTheme.color.bg,
    borderRadius: datingTheme.radius.md,
    padding: datingTheme.space.lg,
    gap: 12,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  valueText: {
    fontSize: 14,
    color: datingTheme.color.textPrimary,
    fontWeight: "500",
    flex: 1,
    lineHeight: 20,
  },
  bottomSection: {
    paddingTop: datingTheme.space.xxl,
  },
});
