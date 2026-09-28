import { supabase } from "./supabase";

export type CompatibilityResult = {
  overallScore: number;
  interestOverlap: string[];
  aiInsights: string[];
  score: number;
  analysis: string;
};

export type OpenRoom = {
  id: string;
  host_id: string;
  title: string;
  vibe: string;
  max_participants: number;
  participant_count: number;
  host?: {
    name?: string;
    age?: number;
    photo_url?: string;
  };
};

export async function createHostedRoom(title: string, vibe: string, maxParticipants: number): Promise<string> {
  const { data, error } = await supabase.rpc("create_hosted_room", {
    p_title: title,
    p_vibe: vibe,
    p_max_participants: maxParticipants,
  });
  if (error) throw error;
  return data;
}

export async function advanceHostedRoom(roomId: string, nextPhase: string) {
  const { error } = await supabase.rpc("advance_hosted_room", {
    p_room_id: roomId,
    p_next_phase: nextPhase,
  });
  if (error) throw error;
}

export async function eliminateParticipant(roomId: string, participantId: string) {
  const { error } = await supabase.rpc("eliminate_participant", {
    p_room_id: roomId,
    p_participant_id: participantId,
  });
  if (error) throw error;
}

export async function pickMatch(roomId: string, participantId: string): Promise<string> {
  const { data, error } = await supabase.rpc("pick_match", {
    p_room_id: roomId,
    p_participant_id: participantId,
  });
  if (error) throw error;
  return data;
}

export async function sendHostQuestion(roomId: string, question: string) {
  const { error } = await supabase.from("room_events").insert({
    room_id: roomId,
    event_type: "host_question",
    payload: { question },
  });
  if (error) throw error;
}

export async function joinRoom(roomId: string) {
  const { error } = await supabase.rpc("join_room", { p_room_id: roomId });
  if (error) throw error;
}

export async function submitAnswer(roomId: string, answer: string) {
  const { error } = await supabase.from("room_events").insert({
    room_id: roomId,
    event_type: "participant_answer",
    payload: { answer },
  });
  if (error) throw error;
}

export async function leaveRoom(roomId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase.from("room_participants")
    .update({ status: "left" })
    .eq("room_id", roomId)
    .eq("profile_id", user.id);
  if (error) throw error;
}

export async function getOpenRooms(): Promise<OpenRoom[]> {
  const { data, error } = await supabase.rpc("get_open_rooms");
  if (error) throw error;
  return data || [];
}

export async function analyzeCompatibility(roomId: string, hostId: string, participantId: string): Promise<CompatibilityResult> {
  const { data, error } = await supabase.functions.invoke("analyze-compatibility", {
    body: { roomId, hostId, participantId },
  });
  if (error) throw error;
  return data as CompatibilityResult;
}

export async function sendRealMessage(matchId: string, text: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not signed in");
  const { error } = await supabase.from("messages").insert({
    match_id: matchId,
    sender_id: user.id,
    text,
  });
  if (error) throw error;
}

// Legacy for backward compat
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
