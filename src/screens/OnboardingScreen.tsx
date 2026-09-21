import { useState } from "react";
import { View, Text, TextInput, ScrollView, Image, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Check, ChevronLeft, Camera } from "lucide-react-native";
import { theme } from "../theme";
import { LogoMark } from "../components/LogoMark";
import { PrimaryButton, GhostButton, IconButton, Chip, ProgressBar } from "../components/ui";
import { INTERESTS, PROMPTS, AVATAR_PRESETS } from "../data/contestants";
import { useAppState, type LocalProfile } from "../hooks/useAppState";

const c = theme.color;
const STEPS = ["welcome", "identity", "preference", "location", "photo", "interests", "prompts", "finish"] as const;
type Step = typeof STEPS[number];

export function OnboardingScreen() {
  const { handleOnboardingComplete } = useAppState();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [lookingFor, setLookingFor] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [avatarPreset, setAvatarPreset] = useState<number | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [promptAnswers, setPromptAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const stepId: Step = STEPS[step];
  const isFormStep = stepId !== "welcome" && stepId !== "finish";

  function next() { setStep((s) => Math.min(s + 1, STEPS.length - 1)); }
  function back() { setStep((s) => Math.max(s - 1, 0)); }

  function toggleInterest(name: string) {
    setInterests((cur) => cur.includes(name) ? cur.filter((i) => i !== name) : cur.length >= 6 ? cur : [...cur, name]);
  }

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]?.base64) {
      const asset = result.assets[0];
      const mime = asset.mimeType || "image/jpeg";
      setPhoto(`data:${mime};base64,${asset.base64}`);
      setAvatarPreset(null);
    }
  }

  async function finish() {
    setBusy(true);
    const finalPhoto = photo || `https://i.pravatar.cc/500?img=${avatarPreset || AVATAR_PRESETS[0]}`;
    const profile: LocalProfile = {
      name: name.trim() || "You",
      age: age || "—",
      lookingFor: lookingFor || "Everyone",
      location: location.trim() || "Nearby",
      photo: finalPhoto,
      hasVideo: false,
      interests,
      prompts: Object.entries(promptAnswers).filter(([, v]) => v.trim()).map(([q, a]) => ({ q, a })),
    };
    await handleOnboardingComplete(profile);
    setBusy(false);
    router.replace("/(tabs)/home");
  }

  const canContinue = stepId !== "identity" || name.trim().length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 16 }}>
          {isFormStep && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 32 }}>
              <IconButton icon={<ChevronLeft size={18} color={c.text} />} onPress={back} size={36} />
              <ProgressBar total={STEPS.length - 2} index={step - 1} />
            </View>
          )}

          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            {stepId === "welcome" && (
              <View style={{ alignItems: "center", gap: 24, paddingTop: 96 }}>
                <LogoMark size={56} />
                <Text style={{ fontSize: theme.font.h1, fontWeight: "700", color: c.text, textAlign: "center", lineHeight: 32 }}>
                  Dating, but{"\n"}make it a game.
                </Text>
              </View>
            )}

            {stepId === "identity" && (
              <View style={{ gap: 16, paddingTop: 16 }}>
                <Text style={styles.h2}>Who's playing tonight?</Text>
                <TextInput style={styles.input} placeholder="First name" placeholderTextColor={c.text3} value={name} onChangeText={setName} maxLength={20} autoFocus />
                <TextInput style={styles.input} placeholder="Age" placeholderTextColor={c.text3} keyboardType="number-pad" value={age} onChangeText={(t) => setAge(t.replace(/\D/g, "").slice(0, 2))} maxLength={2} />
              </View>
            )}

            {stepId === "preference" && (
              <View style={{ gap: 16, paddingTop: 16 }}>
                <Text style={styles.h2}>Who are you hoping to meet?</Text>
                <View style={{ gap: 10 }}>
                  {["Women", "Men", "Everyone"].map((opt) => (
                    <Pressable
                      key={opt}
                      onPress={() => setLookingFor(opt)}
                      style={[
                        styles.optionRow,
                        lookingFor === opt ? { backgroundColor: c.primarySoft, borderColor: c.primary } : { backgroundColor: c.surface2, borderColor: c.border },
                      ]}
                    >
                      <Text style={{ color: c.text, fontSize: theme.font.body, fontWeight: "500" }}>{opt}</Text>
                      {lookingFor === opt && <Check size={18} color={c.primaryLight} />}
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {stepId === "location" && (
              <View style={{ gap: 16, paddingTop: 16 }}>
                <Text style={styles.h2}>Where should we say you're from?</Text>
                <Text style={{ color: c.text2, fontSize: theme.font.secondary }}>We only ever show an approximate location, never an address.</Text>
                <TextInput style={styles.input} placeholder="City, State" placeholderTextColor={c.text3} value={location} onChangeText={setLocation} autoFocus />
              </View>
            )}

            {stepId === "photo" && (
              <View style={{ gap: 16, paddingTop: 16 }}>
                <Text style={styles.h2}>Add a profile photo</Text>
                <Text style={{ color: c.text2, fontSize: theme.font.secondary }}>The first thing people see. Optional — add it later if you'd rather.</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                  <View style={{ width: 96, height: 96, borderRadius: theme.radius.lg, backgroundColor: c.surface2, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    {photo ? (
                      <Image source={{ uri: photo }} style={{ width: "100%", height: "100%" }} />
                    ) : avatarPreset ? (
                      <Image source={{ uri: `https://i.pravatar.cc/200?img=${avatarPreset}` }} style={{ width: "100%", height: "100%" }} />
                    ) : (
                      <Camera size={22} color={c.text3} />
                    )}
                  </View>
                  <Pressable onPress={pickPhoto} style={{ backgroundColor: c.surface2, borderWidth: 1, borderColor: c.borderStrong, borderRadius: theme.radius.md, paddingVertical: 12, paddingHorizontal: 16 }}>
                    <Text style={{ color: c.text, fontWeight: "600", fontSize: theme.font.secondary }}>Upload a photo</Text>
                  </Pressable>
                </View>
                {!photo && (
                  <>
                    <Text style={{ color: c.text3, fontSize: theme.font.caption }}>Or choose a preset:</Text>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      {AVATAR_PRESETS.map((n) => (
                        <Pressable
                          key={n}
                          onPress={() => setAvatarPreset(n)}
                          style={{ width: 48, height: 48, borderRadius: theme.radius.md, overflow: "hidden", borderWidth: avatarPreset === n ? 2 : 0, borderColor: c.primary }}
                        >
                          <Image source={{ uri: `https://i.pravatar.cc/150?img=${n}` }} style={{ width: "100%", height: "100%" }} />
                        </Pressable>
                      ))}
                    </View>
                  </>
                )}
              </View>
            )}

            {stepId === "interests" && (
              <View style={{ gap: 16, paddingTop: 16 }}>
                <Text style={styles.h2}>Pick a few interests</Text>
                <Text style={{ color: c.text2, fontSize: theme.font.secondary }}>Up to 6. These show up during first impressions.</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {INTERESTS.map((i) => <Chip key={i} active={interests.includes(i)} onPress={() => toggleInterest(i)}>{i}</Chip>)}
                </View>
              </View>
            )}

            {stepId === "prompts" && (
              <View style={{ gap: 20, paddingTop: 16 }}>
                <Text style={styles.h2}>A couple of fun prompts</Text>
                <Text style={{ color: c.text2, fontSize: theme.font.secondary }}>Answer as many as you like.</Text>
                {PROMPTS.map((q) => (
                  <View key={q} style={{ gap: 8 }}>
                    <Text style={{ color: c.text, fontSize: theme.font.secondary, fontWeight: "600" }}>{q}</Text>
                    <TextInput
                      style={[styles.input, { minHeight: 64, textAlignVertical: "top" }]}
                      multiline
                      maxLength={120}
                      value={promptAnswers[q] || ""}
                      onChangeText={(t) => setPromptAnswers((cur) => ({ ...cur, [q]: t }))}
                    />
                  </View>
                ))}
              </View>
            )}

            {stepId === "finish" && (
              <View style={{ alignItems: "center", gap: 24, paddingTop: 96 }}>
                <View style={{ width: 64, height: 64, borderRadius: theme.radius.full, backgroundColor: c.surface2, alignItems: "center", justifyContent: "center" }}>
                  <Check size={26} color={c.success} />
                </View>
                <Text style={{ fontSize: theme.font.h1, fontWeight: "700", color: c.text }}>You're ready.</Text>
                <Text style={{ color: c.text2, fontSize: theme.font.secondary, textAlign: "center", maxWidth: 240 }}>
                  Your profile is good to go. Time to enter the room.
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={{ gap: 8, paddingTop: 16 }}>
            {stepId === "welcome" && (
              <PrimaryButton onPress={next} style={{ paddingVertical: 18 }}>
                <Text style={{ color: c.white, fontSize: 18, fontWeight: "700" }}>Let's play</Text>
              </PrimaryButton>
            )}
            {stepId === "finish" && (
              <PrimaryButton onPress={finish} disabled={busy} style={{ paddingVertical: 18 }}>
                <Text style={{ color: c.white, fontSize: 18, fontWeight: "700" }}>{busy ? "Setting up..." : "Enter the room"}</Text>
              </PrimaryButton>
            )}
            {isFormStep && (
              <>
                <PrimaryButton onPress={next} disabled={!canContinue}>Continue</PrimaryButton>
                {["location", "photo", "interests", "prompts"].includes(stepId) && (
                  <GhostButton onPress={next}>Skip for now</GhostButton>
                )}
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = {
  h2: { fontSize: theme.font.h1, fontWeight: "700" as const, color: c.text },
  input: {
    backgroundColor: c.surface2, borderWidth: 1.5, borderColor: c.border,
    borderRadius: theme.radius.md, paddingVertical: 16, paddingHorizontal: 16,
    fontSize: theme.font.body, color: c.text,
  },
  optionRow: {
    flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const,
    borderWidth: 1, borderRadius: theme.radius.md, paddingVertical: 16, paddingHorizontal: 20,
  },
};
