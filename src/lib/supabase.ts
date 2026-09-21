// react-native-url-polyfill must be imported before @supabase/supabase-js
// anywhere in the app — React Native's JS engine doesn't have a complete
// URL implementation, and the Supabase client depends on one. Importing it
// here (the first place anything touches supabase-js) is enough, since ES
// module imports only execute once no matter how many files import this one.
import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  console.error(
    "Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env and fill in your project's values."
  );
}

export const supabase = createClient(url as string, publishableKey as string, {
  auth: {
    // Without a real device storage adapter, sessions would only live in
    // memory and vanish on every app restart — this is what makes "stay
    // signed in" actually work on a phone.
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // There's no browser URL bar to parse a session out of on native, and
    // leaving this on throws on some RN environments.
    detectSessionInUrl: false,
  },
});
