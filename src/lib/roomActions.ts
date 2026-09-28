import { supabase } from "./supabase";

// Joins the matchmaking queue as either role. Returns a room id immediately
// if enough people were already waiting to form one on the spot; otherwise
// null — the scheduled try-form-room job (see the web app's
// 0001_init.sql) keeps retrying every ~10 seconds, and useMyRoomAssignment
// below is what catches a room that forms later rather than immediately.
export async function joinQueue(role: "contestant" | "judge"): Promise<string | null> {
  const { data, error } = await supabase.rpc("join_queue", { p_role: role });
  if (error) throw error;
  return data;
}

export async function leaveQueue() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase.from("room_queue").delete().eq("profile_id", user.id);
  if (error) throw error;
}

export async function submitDecision(roomId: string, round: 1 | 2, decision: "keep" | "pop") {
  const { error } = await supabase.rpc("submit_decision", {
    p_room_id: roomId,
    p_round: round,
    p_decision: decision,
  });
  if (error) throw error;
}

export async function submitPersonalityAnswer(roomId: string, answer: string) {
  const { error } = await supabase.rpc("submit_personality_answer", {
    p_room_id: roomId,
    p_answer: answer,
  });
  if (error) throw error;
}

export async function sendRealMessage(matchId: string, text: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not signed in");
  const { error } = await supabase.from("messages").insert({ match_id: matchId, sender_id: user.id, text });
  if (error) throw error;
}
