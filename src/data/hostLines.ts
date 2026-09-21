// MOCK: replace with a real AI-host call keyed on the same event names (the
// web app's edge function, generate-host-line, already does this against a
// shared Supabase project — see the room logic below for where a real room
// reads host lines from room_events instead of this local bank).

type HostCtx = { name?: string; remaining?: number };

export const HOST_LINES: Record<string, (ctx: HostCtx) => string> = {
  CONTESTANT_ENTERED: (ctx) => pick([
    `Tonight's contestant just walked in. Everyone, meet ${ctx.name}.`,
    `Here we go. ${ctx.name} is in the room.`,
    `Five judges, one big decision. Let's see how this goes for ${ctx.name}.`,
  ]),
  COUNTDOWN_STARTED: () => pick([
    "First impressions, on my count.",
    "No pressure. Well — a little pressure.",
    "Here comes the hard part.",
  ]),
  DECISION_PROMPT: () => pick([
    "Make your call.",
    "In or out. Your move.",
    "Keep them in, or let them go.",
  ]),
  PLAYER_POPPED: (ctx) => pick([
    `And there it is. ${ctx.remaining} left standing.`,
    `One more out. ${ctx.remaining} to go.`,
    `${ctx.name} just made the call. ${ctx.remaining} remain.`,
  ]),
  USER_POPPED: () => pick([
    "Not your match. Happens to the best of us.",
    "That's a pass from you. On to someone else, then.",
    "Fair enough — not every room is your room.",
  ]),
  ROUND1_COMPLETE: (ctx) => pick([
    `That's a wrap on first impressions. ${ctx.remaining} still in play.`,
    `Round one, done. ${ctx.remaining} standing strong.`,
  ]),
  PERSONALITY_ASKED: () => pick([
    "Let's get past the small talk.",
    "Time to actually learn something.",
  ]),
  PERSONALITY_ANSWERED: () => pick([
    "Well. That answer just changed the room.",
    "Interesting. Let's see who's still feeling it.",
    "Okay, that was a good one.",
  ]),
  ROUND2_COMPLETE: (ctx) => pick([
    `Personality round, closed. ${ctx.remaining} still holding on.`,
    `${ctx.remaining} left, and it's getting real.`,
  ]),
  REVEAL_STARTED: () => pick([
    "Time to find out who they really are. No more secrets.",
    "Okay. Deep breath, everyone. Here's the truth.",
  ]),
  FINAL_CHOICE: () => pick([
    "This is it. One choice. No do-overs.",
    "The votes are in. Now it's their turn to choose.",
  ]),
  MATCH_CREATED: () => pick([
    "Well. Somebody's got chemistry.",
    "That's a match. Don't waste it.",
    "Oh, THAT'S what we came here for.",
  ]),
  NO_MATCH: () => pick([
    "Not this time. The next room's already filling up.",
    "Close, but not quite. On to the next one.",
  ]),
};

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function hostSay(event: string, ctx: HostCtx = {}): string {
  const fn = HOST_LINES[event];
  return fn ? fn(ctx) : "";
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
