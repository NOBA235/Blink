import { View, Text, Image, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronRight, Mic, Users, Sparkles } from "lucide-react-native";
import { router } from "expo-router";
import { theme, datingTheme } from "../theme";
import { useAppState } from "../hooks/useAppState";

const c = theme.color;
const dt = datingTheme.color;

export function HomeScreen({
  onOpenProfile,
  profileCompletion,
}: {
  onOpenProfile: () => void;
  profileCompletion: number;
}) {
  const { profile, datePreferences, myProfileId } = useAppState();
  if (!profile) return null;

  const hasPreferences =
    datePreferences?.activities?.length > 0 ||
    datePreferences?.foods?.length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 24,
          gap: 28,
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text style={{ color: c.text2, fontSize: theme.font.secondary }}>
              Good evening
            </Text>
            <Text
              style={{
                color: c.text,
                fontSize: theme.font.h1,
                fontWeight: "700",
              }}
            >
              {profile.name}
            </Text>
          </View>
          <Pressable
            onPress={onOpenProfile}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              overflow: "hidden",
              backgroundColor: c.surface2,
            }}
          >
            <Image
              source={{ uri: profile.photo }}
              style={{ width: "100%", height: "100%" }}
            />
          </Pressable>
        </View>

        {/* Host a Room CTA */}
        <Pressable
          onPress={() => {
            if (!myProfileId) {
              router.push("/auth");
              return;
            }
            router.push("/create-room");
          }}
          style={({ pressed }) => ({
            backgroundColor: "#4E214E",
            borderRadius: theme.radius.xl,
            padding: 28,
            opacity: pressed ? 0.92 : 1,
          })}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Mic size={18} color="#FFFFFF" />
            </View>
            <Text
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: theme.font.caption,
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Host
            </Text>
          </View>
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 26,
              fontWeight: "700",
              lineHeight: 32,
              fontFamily: datingTheme.typography.serif,
              marginBottom: 6,
            }}
          >
            Host a Room
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: theme.font.secondary,
              lineHeight: 20,
            }}
          >
            Create your room, set the vibe, and pick your match.
          </Text>
        </Pressable>

        {/* Join a Room CTA */}
        <Pressable
          onPress={() => {
            if (!myProfileId) {
              router.push("/auth");
              return;
            }
            router.push("/(tabs)/rooms");
          }}
          style={({ pressed }) => ({
            backgroundColor: c.surface,
            borderRadius: theme.radius.xl,
            padding: 24,
            borderWidth: 1,
            borderColor: c.border,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            opacity: pressed ? 0.92 : 1,
          })}
        >
          <View style={{ flex: 1, paddingRight: 14 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <Users size={16} color={dt.primary} />
              <Text
                style={{
                  color: dt.primary,
                  fontSize: theme.font.caption,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Compete
              </Text>
            </View>
            <Text
              style={{
                color: c.text,
                fontSize: 18,
                fontWeight: "700",
                marginBottom: 4,
              }}
            >
              Join a Room
            </Text>
            <Text
              style={{
                color: c.text2,
                fontSize: theme.font.secondary,
                lineHeight: 20,
              }}
            >
              Browse live rooms and compete to be someone's pick
            </Text>
          </View>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: dt.activeBackground,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronRight size={18} color={dt.primary} />
          </View>
        </Pressable>

        {/* Date Preferences Banner */}
        <Pressable
          onPress={() => router.push("/date-special")}
          style={({ pressed }) => ({
            backgroundColor: c.surface,
            borderRadius: theme.radius.xl,
            padding: 20,
            borderWidth: 1,
            borderColor: c.border,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            opacity: pressed ? 0.92 : 1,
          })}
        >
          <View style={{ flex: 1, paddingRight: 14 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginBottom: 4,
              }}
            >
              <Sparkles size={14} color={dt.primary} />
              <Text
                style={{
                  color: dt.primary,
                  fontSize: 11,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Date Special
              </Text>
            </View>
            <Text
              style={{
                color: c.text,
                fontSize: 17,
                fontWeight: "700",
                marginBottom: 3,
              }}
            >
              Date Preferences
            </Text>
            <Text style={{ color: c.text2, fontSize: 13, lineHeight: 18 }}>
              {hasPreferences
                ? `${datePreferences.activities.length} activities · ${datePreferences.foods.length} cuisines selected`
                : "Customize your favorite activities, dining spots & drinks"}
            </Text>
          </View>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: dt.activeBackground,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronRight size={18} color={dt.primary} />
          </View>
        </Pressable>

        {/* Profile completion */}
        {profileCompletion < 100 && (
          <Pressable
            onPress={onOpenProfile}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 12,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: c.surface2,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: c.primary,
                    fontSize: theme.font.caption,
                    fontWeight: "700",
                  }}
                >
                  {profileCompletion}%
                </Text>
              </View>
              <Text
                style={{
                  color: c.text,
                  fontSize: theme.font.secondary,
                  fontWeight: "500",
                }}
              >
                Finish your profile
              </Text>
            </View>
            <ChevronRight size={16} color={c.text3} />
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
