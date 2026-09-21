import { supabase } from "./supabase";
import type { Session } from "@supabase/supabase-js";

// `name` is passed as user metadata; the handle_new_user trigger (see the
// web app's supabase/migrations/0001_init.sql — this native app shares the
// exact same Supabase project and schema) reads it to create the matching
// profiles row automatically.
export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Fires immediately with the current session, then again on every auth
// state change. Returns the unsubscribe function.
export function onAuthChange(callback: (session: Session | null) => void) {
  supabase.auth.getSession().then(({ data }) => callback(data.session));
  const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => sub.subscription.unsubscribe();
}
