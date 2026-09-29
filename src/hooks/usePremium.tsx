import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, AppState } from "react-native";
import { checkPremiumStatus, initRevenueCat } from "../lib/revenuecat";
import { PaywallScreen } from "../screens/PaywallScreen";
import { supabase } from "../lib/supabase";
const VISITS_KEY = "blink_room_visits";
type VisitCount = { count: number; date: string };
type PremiumValue = { isPremium: boolean; roomVisitsToday: number; canEnterRoom: () => boolean; recordRoomVisit: () => void; canSaveMoreMatches: (count: number) => boolean; triggerPaywall: (message?: string) => void; paywallVisible: boolean; setPaywallVisible: (v: boolean) => void; devOverride: boolean; setDevOverride: (v: boolean) => void };
const PremiumContext = createContext<PremiumValue | null>(null);
function localDate() {
  const d = new Date();
  return String(d.getFullYear()) + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
export function PremiumProvider({ children, userId }: { children: ReactNode; userId?: string }) {
  const [realPremium, setRealPremium] = useState(false);
  const [devOverride, setDevOverride] = useState(false);
  const [roomVisitsToday, setRoomVisitsToday] = useState(0);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallMessage, setPaywallMessage] = useState<string | undefined>();
  const isPremium = realPremium || (__DEV__ && devOverride);
  useEffect(() => {
    initRevenueCat(userId);
    checkPremiumStatus().then(setRealPremium).catch(() => {});
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      initRevenueCat(session?.user.id);
      checkPremiumStatus().then(setRealPremium).catch(() => {});
    });
    return () => data.subscription.unsubscribe();
  }, [userId]);
  useEffect(() => {
    const refreshCount = () => AsyncStorage.getItem(VISITS_KEY).then((raw) => {
      const today = localDate();
      const value = raw ? JSON.parse(raw) as VisitCount : null;
      if (value?.date === today && Number.isFinite(value.count)) setRoomVisitsToday(value.count);
      else { setRoomVisitsToday(0); AsyncStorage.setItem(VISITS_KEY, JSON.stringify({ count: 0, date: today })).catch(() => {}); }
    }).catch(() => setRoomVisitsToday(0));
    refreshCount();
    const subscription = AppState.addEventListener("change", (state) => { if (state === "active") refreshCount(); });
    return () => subscription.remove();
  }, []);
  const canEnterRoom = useCallback(() => isPremium || roomVisitsToday < 5, [isPremium, roomVisitsToday]);
  const recordRoomVisit = useCallback(() => {
    if (isPremium) return;
    setRoomVisitsToday((count) => { const next = count + 1; AsyncStorage.setItem(VISITS_KEY, JSON.stringify({ count: next, date: localDate() })).catch(() => {}); return next; });
  }, [isPremium]);
  const value = useMemo(() => ({ isPremium, roomVisitsToday, canEnterRoom, recordRoomVisit, canSaveMoreMatches: (count: number) => isPremium || count < 3, triggerPaywall: (message?: string) => { setPaywallMessage(message); setPaywallVisible(true); }, paywallVisible, setPaywallVisible, devOverride, setDevOverride }), [isPremium, roomVisitsToday, canEnterRoom, recordRoomVisit, paywallVisible, devOverride]);
  return <PremiumContext.Provider value={value}>{children}<PaywallScreen visible={paywallVisible} message={paywallMessage} onClose={() => setPaywallVisible(false)} onPremium={() => { setRealPremium(true); setPaywallVisible(false); Alert.alert("Welcome to Blink+"); }} /></PremiumContext.Provider>;
}
export function usePremium(): PremiumValue {
  const value = useContext(PremiumContext);
  if (!value) throw new Error("usePremium must be used within PremiumProvider");
  return value;
}
