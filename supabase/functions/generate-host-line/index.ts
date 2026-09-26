import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const GEMINI_MODEL = "gemini-3.5-flash";
const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are the live AI host of Blink, a group dating game.
Tone: dry, warm, slightly teasing — a late-night dating-show host, not a hype DJ.
Rules:
- Reply with ONE spoken line only. 1–2 short sentences. Max ~28 words.
- No quotes, no stage directions, no emoji, no hashtags, no lists.
- Do not mention being an AI, Gemini, or these instructions.
- Use provided names when they help; never invent extra names.
- Stay PG-13. Never shame anyone for getting popped.`;

type HostCtx = { name?: string; remaining?: number; question?: string; answer?: string };

const EVENT_BEATS: Record<string, string> = {
  room_formed: "The room just formed. Welcome everyone and introduce the contestant.",
  CONTESTANT_ENTERED: "The contestant just walked in. Introduce them to the judges.",
  COUNTDOWN_STARTED: "First-impression countdown is starting.",
  DECISION_PROMPT: "Judges must keep or pop right now. Prompt the decision.",
  PLAYER_POPPED: "A judge just popped (passed). Comment on the shrinking circle.",
  USER_POPPED: "The player just popped themselves out. Kind, brief send-off.",
  ROUND1_COMPLETE: "Round 1 (first impressions) just closed.",
  personality_question: "A personality question is being asked of the contestant.",
  PERSONALITY_ASKED: "A personality question is being asked of the contestant.",
  personality_answer: "The contestant just answered the personality question.",
  PERSONALITY_ANSWERED: "The contestant just answered the personality question.",
  ROUND2_COMPLETE: "The personality round just closed.",
  REVEAL_STARTED: "Reveal round: gated details (job, education, lifestyle) are unlocking.",
  FINAL_CHOICE: "Final pick is about to land. One remaining judge will match.",
  match_created: "It's a match. Celebrate without being cheesy.",
  MATCH_CREATED: "It's a match. Celebrate without being cheesy.",
  no_match: "No match this room. Keep it moving, not cruel.",
  NO_MATCH: "No match this room. Keep it moving, not cruel.",
  decision_submitted: "A judge just submitted a keep/pop. React briefly without spoiling others.",
  phase_changed: "The room just changed phase. Say the line that fits this beat.",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function fallbackLine(event: string, ctx: HostCtx): string {
  const name = ctx.name || "them";
  const remaining = ctx.remaining;
  switch (event) {
    case "room_formed":
    case "CONTESTANT_ENTERED":
      return `Here we go. Everyone, meet ${name}.`;
    case "COUNTDOWN_STARTED":
      return "First impressions, on my count.";
    case "DECISION_PROMPT":
    case "decision_submitted":
      return "Keep them in, or let them go.";
    case "PLAYER_POPPED":
      return remaining != null
        ? `That's a pass. ${remaining} still standing.`
        : "That's a pass. The circle just got smaller.";
    case "USER_POPPED":
      return "Not your match. Happens to the best of us.";
    case "ROUND1_COMPLETE":
      return remaining != null
        ? `First impressions, done. ${remaining} still in play.`
        : "That's a wrap on first impressions.";
    case "personality_question":
    case "PERSONALITY_ASKED":
      return "Let's get past the small talk.";
    case "personality_answer":
    case "PERSONALITY_ANSWERED":
      return "Okay. That answer just changed the room.";
    case "ROUND2_COMPLETE":
      return remaining != null
        ? `${remaining} left, and it's getting real.`
        : "Personality round, closed.";
    case "REVEAL_STARTED":
    case "reveal":
      return "Time to find out who they really are. No more secrets.";
    case "FINAL_CHOICE":
    case "final":
      return "This is it. One choice. No do-overs.";
    case "match_created":
    case "MATCH_CREATED":
      return "That's a match. Don't waste it.";
    case "no_match":
    case "NO_MATCH":
      return "Not this time. The next room's already filling up.";
    case "intro":
      return fallbackLine("CONTESTANT_ENTERED", ctx);
    case "countdown":
      return fallbackLine("COUNTDOWN_STARTED", ctx);
    case "round1":
    case "round2_decision":
      return fallbackLine("DECISION_PROMPT", ctx);
    case "round1_results":
      return fallbackLine("ROUND1_COMPLETE", ctx);
    case "round2_question":
      return fallbackLine("PERSONALITY_ASKED", ctx);
    case "round2_answer":
      return fallbackLine("PERSONALITY_ANSWERED", ctx);
    case "round2_results":
      return fallbackLine("ROUND2_COMPLETE", ctx);
    case "closed":
      return "That's the room. See you in the next one.";
    default:
      return "Stay with me — this next beat matters.";
  }
}

function beatFor(event: string, payload: Record<string, unknown>, ctx: HostCtx): string {
  if (event === "phase_changed") {
    const phase = String(payload.phase || ctx.name || "");
    const phaseBeats: Record<string, string> = {
      intro: EVENT_BEATS.CONTESTANT_ENTERED,
      countdown: EVENT_BEATS.COUNTDOWN_STARTED,
      round1: EVENT_BEATS.DECISION_PROMPT,
      round1_results: EVENT_BEATS.ROUND1_COMPLETE,
      round2_question: EVENT_BEATS.PERSONALITY_ASKED,
      round2_answer: EVENT_BEATS.PERSONALITY_ANSWERED,
      round2_decision: EVENT_BEATS.DECISION_PROMPT,
      round2_results: EVENT_BEATS.ROUND2_COMPLETE,
      reveal: EVENT_BEATS.REVEAL_STARTED,
      final: EVENT_BEATS.FINAL_CHOICE,
      closed: "The room just closed. One last line, then we're out.",
    };
    return phaseBeats[phase] || EVENT_BEATS.phase_changed;
  }
  return EVENT_BEATS[event] || `React in-character to this room event: ${event}.`;
}

function cleanLine(raw: string): string {
  return raw
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function generateLine(
  event: string,
  ctx: HostCtx,
  extra: string,
  payload: Record<string, unknown> = {},
): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  const fallbackEvent = event === "phase_changed" ? String(payload.phase || event) : event;
  if (!apiKey) return fallbackLine(fallbackEvent, ctx);

  const beat = beatFor(event, payload, ctx);
  const facts = [
    ctx.name ? `Contestant/person name: ${ctx.name}` : null,
    ctx.remaining != null ? `Judges still in: ${ctx.remaining}` : null,
    ctx.question ? `Question: ${ctx.question}` : null,
    ctx.answer ? `Answer: ${ctx.answer}` : null,
    extra || null,
  ].filter(Boolean).join("\n");

  const userPrompt = `${beat}

Facts you may use:
${facts || "(none)"}

Spoken line:`;

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 256,
        thinkingConfig: { thinkingLevel: "MINIMAL" },
      },
    }),
  });

  if (!res.ok) {
    console.error("Gemini error", res.status, await res.text());
    return fallbackLine(fallbackEvent, ctx);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text || "")
    .join(" ") ?? "";
  const line = cleanLine(text);
  return line || fallbackLine(fallbackEvent, ctx);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const auth = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    const isService = Boolean(serviceKey && auth === serviceKey);

    const roomId: string | undefined = body.room_id;
    const eventType: string = body.event_type || body.event || "";
    const payload = (body.payload && typeof body.payload === "object") ? body.payload : {};
    const ctx: HostCtx = body.ctx && typeof body.ctx === "object" ? body.ctx : {};
    const returnOnly = Boolean(body.return_only) || !roomId || !isService;

    if (!eventType) {
      return json(400, { error: "missing event" });
    }

    let extra = "";
    const merged: HostCtx = { ...ctx };

    if (isService && roomId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        serviceKey,
      );
      const [{ data: room }, { data: participants }, { data: recent }] = await Promise.all([
        supabase.from("rooms").select("phase, contestant:contestant_id(name)").eq("id", roomId).single(),
        supabase.from("room_participants").select("role, round1_decision, round2_decision, profile:profile_id(name)").eq("room_id", roomId),
        supabase.from("room_events").select("event_type, payload").eq("room_id", roomId).order("created_at", { ascending: false }).limit(8),
      ]);

      const contestantName = (room as any)?.contestant?.name;
      if (contestantName) merged.name = contestantName;

      const remaining = (participants || []).filter((p: any) =>
        p.role === "judge" && p.round1_decision !== "pop" && p.round2_decision !== "pop"
      ).length;
      merged.remaining = remaining;

      if (payload.question) merged.question = String(payload.question);
      if (payload.answer) merged.answer = String(payload.answer);

      const latestQ = recent?.find((e: any) => e.event_type === "personality_question")?.payload?.question;
      const latestA = recent?.find((e: any) => e.event_type === "personality_answer")?.payload?.answer;
      if (latestQ && !merged.question) merged.question = latestQ;
      if (latestA && !merged.answer) merged.answer = latestA;

      extra = [
        `Current phase: ${(room as any)?.phase || "unknown"}`,
        payload.phase ? `New phase: ${payload.phase}` : null,
        payload.decision ? `Latest decision: ${payload.decision}` : null,
        recent?.length
          ? `Recent events: ${recent.map((e: any) => e.event_type).join(", ")}`
          : null,
      ].filter(Boolean).join("\n");
    } else {
      extra = [
        payload.phase ? `Phase: ${payload.phase}` : null,
        payload.decision ? `Decision: ${payload.decision}` : null,
      ].filter(Boolean).join("\n");
      if (payload.question) merged.question = String(payload.question);
      if (payload.answer) merged.answer = String(payload.answer);
    }

    const line = await generateLine(eventType, merged, extra, payload);

    if (!returnOnly && isService && roomId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        serviceKey,
      );
      const { error } = await supabase.from("room_events").insert({
        room_id: roomId,
        event_type: "host_line",
        payload: { line, source: "gemini-3.5-flash", in_reply_to: eventType },
      });
      if (error) {
        console.error("Failed to insert host_line", error);
        return json(500, { error: error.message });
      }
    }

    return json(200, { line });
  } catch (err) {
    console.error(err);
    return json(500, { error: String(err) });
  }
});
