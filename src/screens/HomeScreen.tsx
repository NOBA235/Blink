import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  Platform,
  Animated,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronRight,
  Mic,
  Users,
  Sparkles,
  Crown,
  Flame,
  Lock,
  ArrowRight,
  Zap,
  Check,
  Bot,
} from "lucide-react-native";
import { router } from "expo-router";
import { theme, datingTheme } from "../theme";
import { useAppState } from "../hooks/useAppState";
import { usePremium } from "../hooks/usePremium";
import { CONTESTANT_POOL, type Contestant } from "../data/contestants";
import { DATE_ACTIVITIES } from "../types/dating";
import { buzzTick } from "../lib/sound";

const c = theme.color;
const dt = datingTheme.color;

interface HomeScreenProps {
  onOpenProfile: () => void;
  profileCompletion: number;
  roomsAvailable?: number;
  onEnterRoom?: () => void;
  onOpenRooms?: () => void;
}

export function HomeScreen({
  onOpenProfile,
  profileCompletion,
  roomsAvailable = 3,
  onEnterRoom,
  onOpenRooms,
}: HomeScreenProps) {
  const {
    profile,
    datePreferences,
    myProfileId,
    availableContestants,
    enterLocalRoom,
    attemptRealRoom,
  } = useAppState();
  const { isPremium, roomVisitsToday, triggerPaywall } = usePremium();

  // Animated green pulse for live room activity
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  // Round 2 Icebreaker / Daily Vibe Check interactive state
  const [vibeVote, setVibeVote] = useState<"speakeasy" | "night_market" | null>(null);
  const [voteStats, setVoteStats] = useState({
    speakeasy: 64,
    night_market: 36,
  });

  const handleVibeVote = (option: "speakeasy" | "night_market") => {
    buzzTick();
    if (vibeVote === option) return;
    setVibeVote(option);
    if (option === "speakeasy") {
      setVoteStats({ speakeasy: 65, night_market: 35 });
    } else {
      setVoteStats({ speakeasy: 63, night_market: 37 });
    }
  };

  // Curated preference pills showcase (powers AI Whisper Engine compatibility)
  const preferencePills = useMemo(() => {
    const chips: { label: string; bg: string }[] = [];
    const pastels = [
      dt.pastelLavender,
      dt.pastelPeach,
      dt.pastelSage,
      dt.pastelRose,
    ];
    let idx = 0;

    const activityEmojis: Record<string, string> = {
      drinks: "🍸",
      dining: "🍽️",
      movie: "🎬",
      live_music: "🎷",
      coffee_walk: "🌿",
      games: "🎯",
    };

    (datePreferences?.activities || []).forEach((actId) => {
      const act = DATE_ACTIVITIES.find((a) => a.id === actId);
      if (act) {
        chips.push({
          label: `${activityEmojis[actId] || "✨"} ${act.label}`,
          bg: pastels[idx % pastels.length],
        });
        idx++;
      }
    });

    const foodEmojis: Record<string, string> = {
      Sushi: "🍣",
      Pizza: "🍕",
      Burgers: "🍔",
      Pasta: "🍝",
      Tacos: "🌮",
      Thai: "🍜",
      Desserts: "🍰",
      Indian: "🍛",
      Mediterranean: "🥗",
      Tapas: "🍢",
    };

    (datePreferences?.foods || []).forEach((food) => {
      chips.push({
        label: `${foodEmojis[food] || "🍴"} ${food}`,
        bg: pastels[idx % pastels.length],
      });
      idx++;
    });

    const drinkEmojis: Record<string, string> = {
      Wine: "🍷",
      Cocktails: "🍸",
      Coffee: "☕",
      Tea: "🍵",
      Matcha: "🍵",
      Boba: "🧋",
      "Craft Beer": "🍺",
      Mocktails: "🍹",
    };

    (datePreferences?.drinks || []).forEach((drink) => {
      chips.push({
        label: `${drinkEmojis[drink] || "🥂"} ${drink}`,
        bg: pastels[idx % pastels.length],
      });
      idx++;
    });

    return chips;
  }, [datePreferences]);

  if (!profile) return null;

  // Active Host contestant preview from available pool or fallback
  const featuredHost: Contestant =
    (availableContestants && availableContestants.length > 0
      ? availableContestants[0]
      : CONTESTANT_POOL[0]) || CONTESTANT_POOL[0];

  const hostPrompt =
    featuredHost.prompts?.[0] || {
      q: "My most questionable obsession is...",
      a: "Alphabetizing my vinyl by mood, not artist.",
    };

  // Dynamic live numbers
  const liveRooms = Math.max(roomsAvailable, availableContestants?.length || 3);
  const liveParticipants = liveRooms * 4 + 2;

  // Navigation handlers
  const handleEnterRoom = () => {
    buzzTick();
    if (onEnterRoom) {
      onEnterRoom();
    } else {
      enterLocalRoom?.(featuredHost);
      attemptRealRoom?.().catch(() => {});
      router.push("/room");
    }
  };

  const handleOpenRooms = () => {
    buzzTick();
    if (!myProfileId) {
      router.push("/auth");
      return;
    }
    if (onOpenRooms) {
      onOpenRooms();
    } else {
      router.push("/rooms");
    }
  };

  const handleHostRoom = () => {
    buzzTick();
    if (!isPremium && roomVisitsToday >= 5) {
      triggerPaywall();
      return;
    }
    if (!myProfileId) {
      router.push("/auth");
      return;
    }
    router.push("/create-room");
  };

  const handleProfilePress = () => {
    buzzTick();
    onOpenProfile();
  };

  const firstName = profile.name ? profile.name.split(" ")[0] : "You";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header & Live Pulse Bar */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <Text style={styles.greetingEyebrow}>Good evening,</Text>
            <Text style={styles.greetingName}>{firstName}</Text>
          </View>
          <Pressable
            onPress={handleProfilePress}
            style={({ pressed }) => [
              styles.avatarContainer,
              {
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              },
            ]}
          >
            <Image
              source={{ uri: profile.photo }}
              style={styles.avatarImage}
            />
            <View style={styles.avatarOnlineDot} />
          </Pressable>
        </View>

        {/* Live Activity & Blink+ Status Strip */}
        <View style={styles.statusStripRow}>
          <Pressable
            onPress={handleOpenRooms}
            style={({ pressed }) => [
              styles.livePulsePill,
              {
                opacity: pressed ? 0.88 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <View style={styles.pulseDotWrapper}>
              <Animated.View
                style={[
                  styles.pulseDotPing,
                  {
                    transform: [{ scale: pulseAnim }],
                    opacity: pulseAnim.interpolate({
                      inputRange: [1, 1.4],
                      outputRange: [0.8, 0],
                    }),
                  },
                ]}
              />
              <View style={styles.pulseDotSolid} />
            </View>
            <Text style={styles.livePulseText}>
              <Text style={styles.livePulseBold}>{liveRooms} Rooms Live</Text> ·{" "}
              {liveParticipants} Singles Competing
            </Text>
          </Pressable>

          <Pressable
            onPress={() => triggerPaywall()}
            style={({ pressed }) => [
              styles.premiumPill,
              isPremium && styles.premiumPillActive,
              {
                opacity: pressed ? 0.88 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            {isPremium ? (
              <Crown size={13} color={c.accent} />
            ) : (
              <Flame size={13} color={c.accent} />
            )}
            <Text style={styles.premiumPillText}>
              {isPremium
                ? "Blink+ Active"
                : `${Math.max(0, 5 - roomVisitsToday)} left · `}
              {!isPremium && <Text style={{ color: c.accent }}>Blink+</Text>}
            </Text>
          </Pressable>
        </View>

        {/* 2. Hero Feature: "Live Room Waiting for Participants" Card */}
        <Pressable
          onPress={handleEnterRoom}
          style={({ pressed }) => [
            styles.heroRoomCard,
            {
              opacity: pressed ? 0.95 : 1,
              transform: [{ scale: pressed ? 0.985 : 1 }],
            },
          ]}
        >
          {/* Blurred Background Host Photo */}
          <Image
            source={{ uri: featuredHost.photo }}
            style={StyleSheet.absoluteFillObject}
            blurRadius={Platform.OS === "ios" ? 18 : 10}
            resizeMode="cover"
          />
          {/* Dark plum scrim gradient overlay */}
          <LinearGradient
            colors={[
              "rgba(46, 17, 46, 0.45)",
              "rgba(28, 14, 28, 0.82)",
              "rgba(18, 10, 18, 0.96)",
            ]}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.heroRoomContent}>
            {/* Badges Row */}
            <View style={styles.heroRoomTopRow}>
              <View style={styles.heroRoomBadge}>
                <Flame size={12} color="#D49B4B" />
                <Text style={styles.heroRoomBadgeText}>FEATURED LIVE ROOM</Text>
              </View>

              <View style={styles.heroRoomHostPill}>
                <Text style={styles.heroRoomHostPillText}>
                  Hosted by {featuredHost.name} · {featuredHost.age},{" "}
                  {featuredHost.location.split(",")[0]}
                </Text>
              </View>
            </View>

            {/* Prompt Question & Editorial Quote */}
            <View style={styles.heroRoomMiddle}>
              <View style={styles.whisperScoreRow}>
                <Bot size={13} color="#D49B4B" />
                <Text style={styles.whisperScoreText}>
                  PICKED FOR YOUR VIBE
                </Text>
              </View>
              <Text style={styles.heroRoomPromptQuestion} numberOfLines={1}>
                {hostPrompt.q}
              </Text>
              <Text style={styles.heroRoomPromptQuote} numberOfLines={3}>
                “{hostPrompt.a}”
              </Text>
            </View>

            {/* Social Proof + Direct CTA */}
            <View style={styles.heroRoomBottomRow}>
              <View style={styles.heroRoomSocialProof}>
                <Users size={13} color="rgba(255,255,255,0.75)" />
                <Text style={styles.heroRoomSocialProofText}>
                {liveRooms} rooms are open now
                </Text>
              </View>

              <View style={styles.heroRoomCTAButton}>
                <Text style={styles.heroRoomCTAText}>Join a room</Text>
                <ArrowRight size={14} color="#1C141E" />
              </View>
            </View>
          </View>
        </Pressable>

        {/* 3. The Core Blink Experience: Host vs. Join Action Tiles */}
        <View style={styles.actionTilesRow}>
          {/* Tile A: Host a Room */}
          <Pressable
            onPress={handleHostRoom}
            style={({ pressed }) => [
              styles.actionTile,
              {
                opacity: pressed ? 0.92 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            {!isPremium && roomVisitsToday >= 5 && (
              <View style={styles.lockBadge}>
                <Lock size={10} color={c.accent} />
                <Text style={styles.lockBadgeText}>Blink+</Text>
              </View>
            )}

            <View style={styles.tileHeader}>
              <View style={styles.micAura}>
                <Mic size={18} color="#D49B4B" />
              </View>
              <View style={styles.tagPillAmber}>
                <Text style={styles.tagPillAmberText}>YOU PICK</Text>
              </View>
            </View>

            <View style={styles.tileBody}>
              <Text style={styles.tileTitle}>Host a Room</Text>
              <Text style={styles.tileSubtitle}>
                Create a room and meet people through three quick rounds.
              </Text>
            </View>

            <View style={styles.tileFooter}>
              <Text style={styles.tileActionLink}>Create room</Text>
              <View style={styles.tileArrowCircle}>
                <ChevronRight size={14} color="#4E214E" />
              </View>
            </View>
          </Pressable>

          {/* Tile B: Join a Room (Compete as Participant) */}
          <Pressable
            onPress={handleOpenRooms}
            style={({ pressed }) => [
              styles.actionTile,
              {
                opacity: pressed ? 0.92 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <View style={styles.tileHeader}>
              {/* Overlapping Participant Micro-Avatars */}
              <View style={styles.avatarStack}>
                <Image
                  source={{ uri: CONTESTANT_POOL[1]?.photo }}
                  style={[styles.stackAvatar, { zIndex: 3 }]}
                />
                <Image
                  source={{ uri: CONTESTANT_POOL[2]?.photo }}
                  style={[styles.stackAvatar, { zIndex: 2, marginLeft: -8 }]}
                />
                <Image
                  source={{ uri: CONTESTANT_POOL[3]?.photo }}
                  style={[styles.stackAvatar, { zIndex: 1, marginLeft: -8 }]}
                />
                <View style={styles.stackPlusPill}>
                  <Text style={styles.stackPlusText}>+{liveParticipants}</Text>
                </View>
              </View>
            </View>

            <View style={styles.tileBody}>
              <View style={styles.competeTagRow}>
                <View style={styles.liveDotSmall} />
                <Text style={styles.tagPillPlumText}>3 ROUNDS · COMPETE</Text>
              </View>
              <Text style={styles.tileTitle}>Join a Room</Text>
              <Text style={styles.tileSubtitle}>
                Find a live room and join the conversation.
              </Text>
            </View>

            <View style={styles.tileFooter}>
              <Text style={styles.tileActionLink}>Browse rooms</Text>
              <View style={styles.tileArrowCircle}>
                <ChevronRight size={14} color="#4E214E" />
              </View>
            </View>
          </Pressable>
        </View>

        {/* 4. Round 2 Icebreaker / Daily Vibe Check */}
        <View style={styles.vibeCard}>
          <View style={styles.vibeHeader}>
            <View style={styles.vibeBadge}>
              <Zap size={12} color="#4E214E" />
              <Text style={styles.vibeBadgeText}>ROUND 2 ICEBREAKER SNEAK PEEK</Text>
            </View>
            <Text style={styles.vibeTimeText}>Daily Poll</Text>
          </View>

          <Text style={styles.vibeQuestion}>
            Would you rather: First date at an intimate speakeasy or a bustling
            night market?
          </Text>

          {/* Interactive Poll Options */}
          <View style={styles.vibeOptionsRow}>
            {/* Option A */}
            <Pressable
              onPress={() => handleVibeVote("speakeasy")}
              style={({ pressed }) => [
                styles.vibeOptionBtn,
                vibeVote === "speakeasy" && styles.vibeOptionBtnSelected,
                { opacity: pressed ? 0.9 : 1 },
              ]}
            >
              {vibeVote && (
                <View
                  style={[
                    styles.vibeOptionProgress,
                    { width: `${voteStats.speakeasy}%` },
                  ]}
                />
              )}
              <View style={styles.vibeOptionInner}>
                <View style={styles.vibeOptionTextRow}>
                  {vibeVote === "speakeasy" && (
                    <Check size={14} color="#4E214E" style={{ marginRight: 4 }} />
                  )}
                  <Text
                    style={[
                      styles.vibeOptionLabel,
                      vibeVote === "speakeasy" && styles.vibeOptionLabelSelected,
                    ]}
                  >
                    Speakeasy 🍸
                  </Text>
                </View>
                {vibeVote && (
                  <Text style={styles.vibeOptionPercent}>
                    {voteStats.speakeasy}%
                  </Text>
                )}
              </View>
            </Pressable>

            {/* Option B */}
            <Pressable
              onPress={() => handleVibeVote("night_market")}
              style={({ pressed }) => [
                styles.vibeOptionBtn,
                vibeVote === "night_market" && styles.vibeOptionBtnSelected,
                { opacity: pressed ? 0.9 : 1 },
              ]}
            >
              {vibeVote && (
                <View
                  style={[
                    styles.vibeOptionProgress,
                    { width: `${voteStats.night_market}%` },
                  ]}
                />
              )}
              <View style={styles.vibeOptionInner}>
                <View style={styles.vibeOptionTextRow}>
                  {vibeVote === "night_market" && (
                    <Check size={14} color="#4E214E" style={{ marginRight: 4 }} />
                  )}
                  <Text
                    style={[
                      styles.vibeOptionLabel,
                      vibeVote === "night_market" && styles.vibeOptionLabelSelected,
                    ]}
                  >
                    Night Market 🍜
                  </Text>
                </View>
                {vibeVote && (
                  <Text style={styles.vibeOptionPercent}>
                    {voteStats.night_market}%
                  </Text>
                )}
              </View>
            </Pressable>
          </View>

          <Text style={styles.vibeFooterProof}>
            {vibeVote
              ? "✨ 1,420 singles answered today · AI uses icebreaker alignment in Round 2"
              : "Tap an option to see how singles in your city answered"}
          </Text>
        </View>

        {/* 5. Date Preferences (AI Whisper Engine Fuel) Showcase */}
        <Pressable
          onPress={() => {
            buzzTick();
            router.push("/date-special");
          }}
          style={({ pressed }) => [
            styles.dateSpecialCard,
            {
              opacity: pressed ? 0.94 : 1,
              transform: [{ scale: pressed ? 0.985 : 1 }],
            },
          ]}
        >
          <View style={styles.dateSpecialHeader}>
            <View style={styles.dateSpecialBadge}>
              <Sparkles size={12} color="#4E214E" />
              <Text style={styles.dateSpecialBadgeText}>
                DATE PREFERENCES · AI WHISPER FUEL
              </Text>
            </View>
            <View style={styles.dateSpecialEditBtn}>
              <ChevronRight size={16} color="#8F8291" />
            </View>
          </View>

          <Text style={styles.dateSpecialTitle}>Date Preferences</Text>

          {preferencePills.length > 0 ? (
            <View style={styles.dateSpecialBody}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.preferenceScrollContent}
              >
                {preferencePills.map((chip, index) => (
                  <View
                    key={index}
                    style={[
                      styles.preferencePill,
                      { backgroundColor: chip.bg },
                    ]}
                  >
                    <Text style={styles.preferencePillText}>{chip.label}</Text>
                  </View>
                ))}
              </ScrollView>
              <Text style={styles.dateSpecialHelper}>
                Whisper Engine compares your dining & activity tastes during live rounds
              </Text>
            </View>
          ) : (
            <View style={styles.dateSpecialEmptyBody}>
              <Text style={styles.dateSpecialEmptyTitle}>
                Tell your AI host your favorite first date spots →
              </Text>
              <Text style={styles.dateSpecialEmptySubtitle}>
                Select go-to cuisines, drinks & activities so the Whisper Engine can calculate match compatibility
              </Text>
            </View>
          )}
        </Pressable>

        {/* 6. Profile Completion Ribbon */}
        {profileCompletion < 100 && (
          <Pressable
            onPress={handleProfilePress}
            style={({ pressed }) => [
              styles.completionCard,
              {
                opacity: pressed ? 0.94 : 1,
                transform: [{ scale: pressed ? 0.985 : 1 }],
              },
            ]}
          >
            <View style={styles.completionTopRow}>
              <View style={styles.completionLeft}>
                <View style={styles.completionPercentBadge}>
                  <Text style={styles.completionPercentText}>
                    {profileCompletion}%
                  </Text>
                </View>
                <View>
                  <Text style={styles.completionTitle}>Finish your profile</Text>
                  <Text style={styles.completionSubtitle}>
                    Add your voice note & prompt for higher AI compatibility scores
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color="#8F8291" />
            </View>

            {/* Slim Rounded Progress Bar */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${profileCompletion}%` },
                ]}
              />
            </View>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const cardShadow = Platform.select({
  ios: {
    shadowColor: "#4E214E",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  android: {
    elevation: 3,
  },
  default: {},
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: c.bg,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 28,
    gap: 16,
  },

  /* 1. Header */
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    gap: 2,
  },
  greetingEyebrow: {
    color: c.text2,
    fontSize: 13,
    fontWeight: "600",
  },
  greetingName: {
    color: c.text,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  avatarContainer: {
    position: "relative",
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: c.bg,
    backgroundColor: dt.pastelLavender,
  },
  avatarOnlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: c.bg,
  },

  /* Live Pulse & Status Strip */
  statusStripRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  livePulsePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    ...cardShadow,
  },
  pulseDotWrapper: {
    width: 10,
    height: 10,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  pulseDotPing: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22C55E",
  },
  pulseDotSolid: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#22C55E",
  },
  livePulseText: {
    color: c.text2,
    fontSize: 12,
    fontWeight: "500",
  },
  livePulseBold: {
    color: c.text,
    fontWeight: "700",
  },
  premiumPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: "rgba(78, 33, 78, 0.08)",
    ...cardShadow,
  },
  premiumPillActive: {
    borderColor: "rgba(212, 155, 75, 0.4)",
    backgroundColor: "#FFFDF9",
  },
  premiumPillText: {
    color: "#1C141E",
    fontSize: 12,
    fontWeight: "700",
  },

  /* 2. Hero Live Room Card */
  heroRoomCard: {
    height: 252,
    borderRadius: 22,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(78, 33, 78, 0.12)",
    ...Platform.select({
      ios: {
        shadowColor: "#4E214E",
        shadowOpacity: 0.12,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
  },
  heroRoomContent: {
    flex: 1,
    padding: 18,
    justifyContent: "space-between",
  },
  heroRoomTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroRoomBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(212, 155, 75, 0.22)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(212, 155, 75, 0.45)",
  },
  heroRoomBadgeText: {
    color: "#E5A855",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  heroRoomHostPill: {
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  heroRoomHostPillText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  heroRoomMiddle: {
    gap: 6,
  },
  whisperScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(78, 33, 78, 0.5)",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(212, 155, 75, 0.3)",
  },
  whisperScoreText: {
    color: "#F6EFF7",
    fontSize: 11,
    fontWeight: "700",
  },
  heroRoomPromptQuestion: {
    color: "rgba(255, 255, 255, 0.65)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    marginTop: 2,
  },
  heroRoomPromptQuote: {
    color: "#FFFFFF",
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "700",
  },
  heroRoomBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroRoomSocialProof: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroRoomSocialProofText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    fontWeight: "500",
  },
  heroRoomCTAButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: c.surface,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 2,
      },
    }),
  },
  heroRoomCTAText: {
    color: c.text,
    fontSize: 12,
    fontWeight: "700",
  },

  /* 3. Action Tiles */
  actionTilesRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionTile: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    justifyContent: "space-between",
    minHeight: 164,
    borderWidth: 1,
    borderColor: "rgba(78, 33, 78, 0.08)",
    position: "relative",
    ...cardShadow,
  },
  lockBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#FFF4D6",
    zIndex: 10,
  },
  lockBadgeText: {
    color: "#1C141E",
    fontSize: 10,
    fontWeight: "700",
  },
  tileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  micAura: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(212, 155, 75, 0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  tagPillAmber: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(212, 155, 75, 0.12)",
  },
  tagPillAmberText: {
    color: "#B87F30",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  stackAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    backgroundColor: dt.pastelLavender,
  },
  stackPlusPill: {
    marginLeft: -6,
    zIndex: 4,
    backgroundColor: "#F4EBF4",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  stackPlusText: {
    color: "#4E214E",
    fontSize: 9,
    fontWeight: "700",
  },
  competeTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  liveDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
  },
  tagPillPlumText: {
    color: "#4E214E",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  tileBody: {
    marginVertical: 10,
  },
  tileTitle: {
    color: "#1C141E",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  tileSubtitle: {
    color: "#655966",
    fontSize: 11,
    lineHeight: 15,
  },
  tileFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(78, 33, 78, 0.05)",
    paddingTop: 10,
  },
  tileActionLink: {
    color: "#4E214E",
    fontSize: 12,
    fontWeight: "700",
  },
  tileArrowCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F4EBF4",
    alignItems: "center",
    justifyContent: "center",
  },

  /* 4. Round 2 Icebreaker / Daily Vibe Check */
  vibeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 17,
    borderWidth: 1,
    borderColor: "rgba(78, 33, 78, 0.08)",
    gap: 14,
    ...cardShadow,
  },
  vibeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  vibeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: dt.pastelLavender,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  vibeBadgeText: {
    color: "#4E214E",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  vibeTimeText: {
    color: "#8F8291",
    fontSize: 11,
    fontWeight: "600",
  },
  vibeQuestion: {
    color: "#1C141E",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
  },
  vibeOptionsRow: {
    gap: 10,
  },
  vibeOptionBtn: {
    position: "relative",
    borderRadius: 16,
    backgroundColor: "#FDFBFD",
    borderWidth: 1,
    borderColor: "rgba(78, 33, 78, 0.1)",
    overflow: "hidden",
    minHeight: 46,
    justifyContent: "center",
  },
  vibeOptionBtnSelected: {
    borderColor: "#4E214E",
  },
  vibeOptionProgress: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(78, 33, 78, 0.09)",
  },
  vibeOptionInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    zIndex: 1,
  },
  vibeOptionTextRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  vibeOptionLabel: {
    color: "#1C141E",
    fontSize: 14,
    fontWeight: "600",
  },
  vibeOptionLabelSelected: {
    color: "#4E214E",
    fontWeight: "700",
  },
  vibeOptionPercent: {
    color: "#4E214E",
    fontSize: 13,
    fontWeight: "700",
  },
  vibeFooterProof: {
    color: "#8F8291",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },

  /* 5. Date Preferences Card (AI Whisper Engine Fuel) */
  dateSpecialCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 17,
    borderWidth: 1,
    borderColor: "rgba(78, 33, 78, 0.08)",
    gap: 12,
    ...cardShadow,
  },
  dateSpecialHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateSpecialBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: dt.pastelPeach,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  dateSpecialBadgeText: {
    color: "#854D27",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  dateSpecialEditBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F9F6F8",
    alignItems: "center",
    justifyContent: "center",
  },
  dateSpecialTitle: {
    color: "#1C141E",
    fontSize: 18,
    fontWeight: "800",
  },
  dateSpecialBody: {
    gap: 10,
  },
  preferenceScrollContent: {
    gap: 8,
    paddingVertical: 2,
  },
  preferencePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(78, 33, 78, 0.06)",
  },
  preferencePillText: {
    color: "#1C141E",
    fontSize: 13,
    fontWeight: "600",
  },
  dateSpecialHelper: {
    color: "#8F8291",
    fontSize: 12,
  },
  dateSpecialEmptyBody: {
    gap: 4,
  },
  dateSpecialEmptyTitle: {
    color: "#4E214E",
    fontSize: 14,
    fontWeight: "700",
  },
  dateSpecialEmptySubtitle: {
    color: "#655966",
    fontSize: 12,
    lineHeight: 17,
  },

  /* 6. Profile Completion Ribbon */
  completionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: c.border,
    gap: 12,
    ...cardShadow,
  },
  completionTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  completionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  completionPercentBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: dt.pastelLavender,
    alignItems: "center",
    justifyContent: "center",
  },
  completionPercentText: {
    color: dt.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  completionTitle: {
    color: "#1C141E",
    fontSize: 14,
    fontWeight: "700",
  },
  completionSubtitle: {
    color: "#655966",
    fontSize: 12,
    marginTop: 2,
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: "#F0E8EE",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: dt.primary,
    borderRadius: 3,
  },
});
