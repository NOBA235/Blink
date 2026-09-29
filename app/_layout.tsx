import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { AppStateProvider, useAppState } from "../src/hooks/useAppState";
import { SoundProvider } from "../src/lib/sound";
import { PremiumProvider } from "../src/hooks/usePremium";

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
