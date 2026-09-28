import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const GEMINI_MODEL = "gemini-3.5-flash";
const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an AI matchmaking assistant for Blink.
Your job is to analyze two dating profiles and provide 2-3 brief, engaging "whisper insights" about their compatibility for the host.
The host is the user hosting the room, and the participant is the one joining.
Insights should be short (1-2 sentences max), positive, and highlight specific shared interests, complementary vibes, or fun date ideas based on their preferences.
Format as a JSON array of strings. Do not include markdown formatting like \`\`\`json.`;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function calculateJaccardSimilarity(arr1: string[] = [], arr2: string[] = []): number {
  if (!arr1 || !arr2 || arr1.length === 0 && arr2.length === 0) return 0;
  const set1 = new Set(arr1.map(s => s.toLowerCase()));
  const set2 = new Set(arr2.map(s => s.toLowerCase()));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { room_id, host_id, participant_id } = body;

    if (!room_id || !host_id || !participant_id) {
      return json(400, { error: "Missing required parameters" });
    }

    const auth = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    // We use service role to read both profiles and upsert the score
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: host, error: hostErr } = await supabase
      .from("profiles")
      .select("interests, date_preferences, prompts, location")
      .eq("id", host_id)
      .single();

    const { data: participant, error: partErr } = await supabase
      .from("profiles")
      .select("interests, date_preferences, prompts, location")
      .eq("id", participant_id)
      .single();

    if (hostErr || partErr) {
      return json(500, { error: "Failed to fetch profiles" });
    }

    // Compute compatibility scores
    const hostInterests = host.interests || [];
    const partInterests = participant.interests || [];
    const interestOverlapList = hostInterests.filter((i: string) => 
      partInterests.map((p: string) => p.toLowerCase()).includes(i.toLowerCase())
    );

    const hostPrefs = host.date_preferences || {};
    const partPrefs = participant.date_preferences || {};

    const foodAlignment = calculateJaccardSimilarity(hostPrefs.foods || [], partPrefs.foods || []);
    const activityAlignment = calculateJaccardSimilarity(hostPrefs.activities || [], partPrefs.activities || []);
    const drinkAlignment = calculateJaccardSimilarity(hostPrefs.drinks || [], partPrefs.drinks || []);
    
    const overallScore = (
      (calculateJaccardSimilarity(hostInterests, partInterests) * 0.4) +
      (foodAlignment * 0.2) +
      (activityAlignment * 0.3) +
      (drinkAlignment * 0.1)
    ) * 100;

    let aiInsights: string[] = [];
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    
    if (apiKey) {
      const userPrompt = `
Host Profile:
Interests: ${hostInterests.join(", ")}
Date Preferences: ${JSON.stringify(hostPrefs)}
Prompts: ${JSON.stringify(host.prompts)}
Location: ${host.location}

Participant Profile:
Interests: ${partInterests.join(", ")}
Date Preferences: ${JSON.stringify(partPrefs)}
Prompts: ${JSON.stringify(participant.prompts)}
Location: ${participant.location}

Shared Interests: ${interestOverlapList.join(", ")}

Generate 2-3 insights.`;

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
            temperature: 0.7,
            maxOutputTokens: 256,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts
          ?.map((p: { text?: string }) => p.text || "")
          .join("") ?? "[]";
        
        try {
          aiInsights = JSON.parse(text);
          if (!Array.isArray(aiInsights)) {
            aiInsights = [];
          }
        } catch (e) {
          console.error("Failed to parse Gemini output as JSON", text);
        }
      } else {
        console.error("Gemini API error", await res.text());
      }
    }

    const scoreData = {
      room_id,
      host_id,
      participant_id,
      overall_score: overallScore,
      interest_overlap: interestOverlapList,
      food_alignment: foodAlignment,
      activity_alignment: activityAlignment,
      drink_alignment: drinkAlignment,
      ai_insights: aiInsights,
    };

    const { error: upsertErr } = await supabase
      .from("compatibility_scores")
      .upsert(scoreData, { onConflict: "room_id,participant_id" });

    if (upsertErr) {
      console.error("Failed to upsert score", upsertErr);
      return json(500, { error: upsertErr.message });
    }

    return json(200, scoreData);
  } catch (err) {
    console.error(err);
    return json(500, { error: String(err) });
  }
});
