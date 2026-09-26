import { supabase } from "./supabase";
import { hostSay, type HostCtx } from "../data/hostLines";

// Ask the generate-host-line edge function for a Gemini 3.5 Flash line.
// Falls back to the local bank so the room never sits silent if the
// function isn't deployed or the key isn't set yet.
export async function fetchHostLine(event: string, ctx: HostCtx = {}): Promise<string> {
  const canned = hostSay(event, ctx);
  try {
    const { data, error } = await supabase.functions.invoke("generate-host-line", {
      body: { event, ctx, return_only: true },
    });
    if (error) return canned;
    const line = typeof data?.line === "string" ? data.line.trim() : "";
    return line || canned;
  } catch {
    return canned;
  }
}
