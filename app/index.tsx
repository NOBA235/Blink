import { Redirect } from "expo-router";
import { LandingScreen } from "../src/screens/LandingScreen";
import { useAppState } from "../src/hooks/useAppState";

// A returning user whose profile was restored from AsyncStorage on boot
// (see AppStateProvider) skips straight past the landing screen — this is
// what makes "stay signed in" actually feel that way, whether or not
// they're also signed into a real Supabase account.
export default function Index() {
  const { profile } = useAppState();
  if (profile) return <Redirect href="/(tabs)/home" />;
  return <LandingScreen />;
}
