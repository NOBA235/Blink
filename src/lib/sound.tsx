// The web app's Sound object synthesized tones on the fly with the Web
// Audio API and could be called from anywhere (plain functions, not just
// components). expo-audio has no synthesis primitive — it plays real audio
// files — and its useAudioPlayer is a hook, meaning it can only be called
// inside a component's render body, not from an arbitrary function like
// popJudge(). SoundProvider below is the bridge: it calls all four
// useAudioPlayer hooks once, unconditionally, at the top of the tree (so
// the rules of hooks are respected), and exposes a plain playSound()
// function through context that any component can call from an event
// handler — matching how the rest of this app's code already calls it.
import { createContext, useContext, useMemo, ReactNode } from "react";
import { useAudioPlayer, AudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";

const SOUND_SOURCES = {
  tick: require("../../assets/sounds/tick.wav"),
  pop: require("../../assets/sounds/pop.wav"),
  keep: require("../../assets/sounds/keep.wav"),
  match: require("../../assets/sounds/match.wav"),
} as const;

type SoundName = keyof typeof SOUND_SOURCES;

type SoundContextValue = {
  playSound: (name: SoundName, enabled: boolean) => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const tick = useAudioPlayer(SOUND_SOURCES.tick);
  const pop = useAudioPlayer(SOUND_SOURCES.pop);
  const keep = useAudioPlayer(SOUND_SOURCES.keep);
  const match = useAudioPlayer(SOUND_SOURCES.match);

  const players: Record<SoundName, AudioPlayer> = { tick, pop, keep, match };

  const value = useMemo<SoundContextValue>(() => ({
    playSound(name, enabled) {
      if (!enabled) return;
      const player = players[name];
      try {
        // Rewind first so re-triggering the same cue quickly (e.g. several
        // quick pops) restarts it audibly instead of doing nothing.
        player.seekTo(0);
        player.play();
      } catch {
        // Never let a sound-effect failure interrupt the actual game logic.
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [tick, pop, keep, match]);

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

// Usage: const { playSound } = useSound(); playSound("pop", soundEnabled);
export function useSound(): SoundContextValue {
  const ctx = useContext(SoundContext);
  if (!ctx) {
    // Defensive fallback rather than a hard crash if a screen somehow
    // renders outside the provider — sound just silently no-ops.
    return { playSound: () => {} };
  }
  return ctx;
}

// Haptics don't share the hook-only constraint sound does — expo-haptics'
// functions are plain async calls, usable from anywhere. Mirrors the web
// app's buzz(pattern) call sites with the closest matching haptic per
// moment, rather than trying to replicate literal millisecond patterns
// (which don't exist as a concept on this API).
export function buzzKeep() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}
export function buzzPop() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}
export function buzzMatch() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
export function buzzTick() {
  Haptics.selectionAsync().catch(() => {});
}
