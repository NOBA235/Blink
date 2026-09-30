import { useEffect } from "react";
import { ActivityIndicator, Platform, Text, View } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { AppStateProvider, useAppState } from "../src/hooks/useAppState";
import { SoundProvider } from "../src/lib/sound";
import { PremiumProvider } from "../src/hooks/usePremium";
import { theme } from "../src/theme";
import { LogoMark } from "../src/components/LogoMark";

// Keeps the native splash screen up until the app's own boot logic
// (restoring a saved local session from AsyncStorage) has resolved —
// otherwise there'd be a blank white flash between the native splash
// disappearing and the JS bundle having anything to show.
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { booting } = useAppState();

  useEffect(() => {
    if (!booting) SplashScreen.hideAsync().catch(() => {});
  }, [booting]);

  // Native apps keep the OS splash screen visible during boot. Browsers do
  // not have one, so render a small branded state instead of a white page.
  if (booting && Platform.OS === "web") {
    return (
      <View style={{ flex: 1, minHeight: "100vh", alignItems: "center", justifyContent: "center", gap: 16, backgroundColor: theme.color.bg }}>
        <LogoMark size={48} />
        <Text style={{ color: theme.color.text, fontSize: 22, fontWeight: "800" }}>blink</Text>
        <ActivityIndicator color={theme.color.primary} />
      </View>
    );
  }
  if (booting) return null; // native splash screen is still covering this

  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="create-room" options={{ presentation: "card", animation: "slide_from_right" }} />
      <Stack.Screen name="date-special" options={{ presentation: "card", animation: "slide_from_right" }} />
      <Stack.Screen name="date-preferences" options={{ presentation: "card", animation: "slide_from_right" }} />
      <Stack.Screen name="room" options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }} />
      <Stack.Screen name="chat" options={{ presentation: "card", animation: "slide_from_right" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <PremiumProvider>
      <AppStateProvider>
        <SoundProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </SoundProvider>
      </AppStateProvider>
    </PremiumProvider>
  );
}
