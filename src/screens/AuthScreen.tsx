import { useState } from "react";
import { View, Text, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { theme } from "../theme";
import { LogoMark } from "../components/LogoMark";
import { PrimaryButton, GhostButton } from "../components/ui";
import { signUp, signIn } from "../lib/auth";
import { useAppState } from "../hooks/useAppState";

const c = theme.color;

export function AuthScreen() {
  const { afterAuth } = useAppState();
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        await signUp(email.trim(), password, name.trim() || "New player");
      } else {
        await signIn(email.trim(), password);
      }
      const dest = await afterAuth();
      router.replace(dest === "onboarding" ? "/onboarding" : "/(tabs)/home");
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24, gap: 32 }}>
          <View style={{ alignItems: "center", gap: 16 }}>
            <LogoMark size={48} />
            <Text style={{ fontSize: theme.font.h1, fontWeight: "700", color: c.text }}>
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </Text>
            <Text style={{ fontSize: theme.font.secondary, color: c.text2, textAlign: "center" }}>
              {mode === "signup" ? "Real judges are waiting in real rooms." : "Sign in to pick up where you left off."}
            </Text>
          </View>

          <View style={{ gap: 12 }}>
            {mode === "signup" && (
              <TextInput
                style={inputStyle}
                placeholder="First name"
                placeholderTextColor={c.text3}
                value={name}
                onChangeText={setName}
                maxLength={20}
              />
            )}
            <TextInput
              style={inputStyle}
              placeholder="Email"
              placeholderTextColor={c.text3}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={inputStyle}
              placeholder="Password"
              placeholderTextColor={c.text3}
              secureTextEntry
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChangeText={setPassword}
            />
            {error && <Text style={{ color: c.danger, fontSize: theme.font.secondary }}>{error}</Text>}
            <PrimaryButton onPress={submit} disabled={busy} style={{ paddingVertical: 18, marginTop: 4 }}>
              {busy ? <ActivityIndicator color={c.white} /> : (
                <Text style={{ color: c.white, fontSize: theme.font.body, fontWeight: "700" }}>
                  {mode === "signup" ? "Create account" : "Sign in"}
                </Text>
              )}
            </PrimaryButton>
          </View>

          <GhostButton onPress={() => { setMode((m) => (m === "signup" ? "signin" : "signup")); setError(null); }}>
            {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
          </GhostButton>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const inputStyle = {
  backgroundColor: c.surface2,
  borderWidth: 1.5,
  borderColor: c.border,
  borderRadius: theme.radius.md,
  paddingVertical: 16,
  paddingHorizontal: 16,
  fontSize: theme.font.body,
  color: c.text,
};
