import { Redirect } from "expo-router";
import { LandingScreen } from "../src/screens/LandingScreen";
import { useAppState } from "../src/hooks/useAppState";

// A returning user whose profile was restored from AsyncStorage on boot
// (see AppStateProvider) skips straight past the landing screen — this is
// what makes "stay signed in" actually feel that way, whether or not
// they're also signed into a real Supabase account.
export default function Index() {
  const { booting, profile } = useAppState();
  // Render the public landing page immediately on web. Restoring local state
  // and checking the auth session continue in the background; a saved profile
  // will redirect to home as soon as that restoration completes.
  if (booting) return <LandingScreen />;
  if (profile) return <Redirect href="/(tabs)/home" />;
  return <LandingScreen />;
}
