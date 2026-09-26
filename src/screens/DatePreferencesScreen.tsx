import React, { useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Check, CheckCircle2 } from "lucide-react-native";
import { datingTheme } from "../theme";
import { useAppState } from "../hooks/useAppState";
import {
  DATE_ACTIVITIES,
  FOOD_OPTIONS,
  DRINK_OPTIONS,
  type DatePreferencesState,
} from "../types/dating";
import {
  DateCategoryCard,
  PreferenceChipGroup,
  PreferenceSummaryCard,
  PrimaryCTA,
  TopTabHeader,
  type TabItem,
} from "../components/dating";

interface DatePreferencesScreenProps {
  onBack?: () => void;
  onSave?: (prefs: DatePreferencesState) => void;
}

export function DatePreferencesScreen({
  onBack,
  onSave,
}: DatePreferencesScreenProps) {
  const { profile, datePreferences, updateDatePreferences, resetDatePreferences } =
    useAppState();
  const { width } = useWindowDimensions();

  // Local draft state initialized with persisted app state
  const [selectedActivities, setSelectedActivities] = useState<string[]>(
    datePreferences?.activities || ["dining", "drinks"]
  );
  const [selectedFoods, setSelectedFoods] = useState<string[]>(
    datePreferences?.foods || ["Pizza", "Sushi"]
  );
  const [selectedDrinks, setSelectedDrinks] = useState<string[]>(
    datePreferences?.drinks || ["Coffee", "Cocktails"]
  );

  const [activeTab, setActiveTab] = useState<string>("all");
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const scrollRef = useRef<ScrollView>(null);

  // Dynamic user name with fallback to 'Aditi' as requested in prompt
  const displayName = profile?.name && profile.name !== "You" ? profile.name : "Aditi";
  const screenTitle = `${displayName}'s Date Preferences`;

  // Toggle helpers
  const toggleActivity = (id: string) => {
    setSelectedActivities((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleFood = (food: string) => {
    setSelectedFoods((prev) =>
      prev.includes(food) ? prev.filter((item) => item !== food) : [...prev, food]
    );
  };

  const toggleDrink = (drink: string) => {
    setSelectedDrinks((prev) =>
      prev.includes(drink) ? prev.filter((item) => item !== drink) : [...prev, drink]
    );
  };

  const handleReset = () => {
    setSelectedActivities([]);
    setSelectedFoods([]);
    setSelectedDrinks([]);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/home");
    }
  };

  const handleSave = () => {
    const payload: DatePreferencesState = {
      activities: selectedActivities,
      foods: selectedFoods,
      drinks: selectedDrinks,
    };

    updateDatePreferences(payload);
    setSaveSuccess(true);

    if (onSave) {
      onSave(payload);
    }

    setTimeout(() => {
      handleBack();
    }, 450);
  };

  // Convert selected activity IDs into friendly labels for Summary Card
  const activityLabels = useMemo(() => {
    return selectedActivities
      .map((id) => DATE_ACTIVITIES.find((a) => a.id === id)?.label)
      .filter((label): label is string => Boolean(label));
  }, [selectedActivities]);

  // Responsive calculations: 2 columns on phones, 3 columns on larger tablets
  const horizontalPadding = datingTheme.geometry.pagePaddingHorizontal;
  const gridGap = 12;
  const availableWidth = width - horizontalPadding * 2;
  const numColumns = availableWidth > 540 ? 3 : 2;
  const cardWidth = (availableWidth - (numColumns - 1) * gridGap) / numColumns;

  // Header tabs configuration
  const tabs: TabItem[] = [
    { id: "all", label: "All" },
    {
      id: "activities",
      label: "Things to do",
      count: selectedActivities.length,
    },
    {
      id: "foods",
      label: "Food",
      count: selectedFoods.length,
    },
    {
      id: "drinks",
      label: "Drinks",
      count: selectedDrinks.length,
    },
    {
      id: "summary",
      label: "Summary",
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* Top Header with navigation & section tabs */}
      <TopTabHeader
        onBack={handleBack}
        onRightAction={handleReset}
        rightActionIcon="reset"
        tabs={tabs}
        activeTab={activeTab}
        onSelectTab={(tabId) => {
          setActiveTab(tabId);
          scrollRef.current?.scrollTo({ y: 0, animated: true });
        }}
      />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Editorial Heading Section */}
        <View style={styles.headerSection}>
          <Text style={styles.headline}>{screenTitle}</Text>
          <Text style={styles.subheadline}>
            Select the activities, dining, and drinks that match your ideal date style.
          </Text>
        </View>

        {/* Section 1: Things to Do */}
        {(activeTab === "all" || activeTab === "activities") && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Things to do</Text>
                <Text style={styles.sectionSubtitle}>
                  Choose your go-to date experiences
                </Text>
              </View>
              {selectedActivities.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {selectedActivities.length} picked
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.categoryGrid}>
              {DATE_ACTIVITIES.map((item) => {
                const isSelected = selectedActivities.includes(item.id);
                return (
                  <View
                    key={item.id}
                    style={{ width: cardWidth, marginBottom: gridGap }}
                  >
                    <DateCategoryCard
                      id={item.id}
                      label={item.label}
                      subtitle={item.subtitle}
                      iconName={item.icon}
                      pastelBg={item.pastelBg}
                      selected={isSelected}
                      onPress={() => toggleActivity(item.id)}
                    />
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Section 2: Foods */}
        {(activeTab === "all" || activeTab === "foods") && (
          <PreferenceChipGroup
            title="Foods"
            subtitle="Cuisines and dishes you always say yes to"
            options={FOOD_OPTIONS}
            selectedOptions={selectedFoods}
            onToggle={toggleFood}
          />
        )}

        {/* Section 3: Drinks */}
        {(activeTab === "all" || activeTab === "drinks") && (
          <PreferenceChipGroup
            title="Drinks"
            subtitle="Favorite sips from morning roast to nightcap"
            options={DRINK_OPTIONS}
            selectedOptions={selectedDrinks}
            onToggle={toggleDrink}
          />
        )}

        {/* Section 4: Dynamic Summary Card */}
        {(activeTab === "all" || activeTab === "summary") && (
          <View style={styles.summarySection}>
            <PreferenceSummaryCard
              activityLabels={activityLabels}
              foodLabels={selectedFoods}
              drinkLabels={selectedDrinks}
            />
          </View>
        )}

        {/* Bottom CTA */}
        <View style={styles.ctaContainer}>
          <PrimaryCTA
            label={saveSuccess ? "Preferences Saved!" : "Save Date Preferences"}
            onPress={handleSave}
            includeSafeAreaBottom={false}
            icon={
              saveSuccess ? (
                <Check size={18} color="#FFFFFF" strokeWidth={2.8} />
              ) : (
                <CheckCircle2 size={18} color="#FFFFFF" strokeWidth={2.2} />
              )
            }
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
    paddingHorizontal: datingTheme.geometry.pagePaddingHorizontal,
    paddingTop: datingTheme.space.sm,
    paddingBottom: datingTheme.space.xxxl,
  },
  headerSection: {
    marginBottom: datingTheme.space.xl,
    marginTop: datingTheme.space.xs,
  },
  headline: {
    fontFamily: datingTheme.typography.serif,
    fontSize: 28,
    fontWeight: "700",
    color: datingTheme.color.textPrimary,
    letterSpacing: -0.4,
    marginBottom: 6,
    lineHeight: 34,
  },
  subheadline: {
    fontSize: 15,
    color: datingTheme.color.textSecondary,
    lineHeight: 22,
  },
  sectionContainer: {
    marginBottom: datingTheme.space.xxl,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: datingTheme.space.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: datingTheme.color.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13.5,
    color: datingTheme.color.textSecondary,
    lineHeight: 18,
  },
  countBadge: {
    backgroundColor: datingTheme.color.activeBackground,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: datingTheme.radius.full,
  },
  countBadgeText: {
    color: datingTheme.color.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 4,
  },
  summarySection: {
    marginTop: datingTheme.space.xs,
  },
  ctaContainer: {
    marginTop: datingTheme.space.sm,
  },
});
