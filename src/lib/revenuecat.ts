import Purchases, { LOG_LEVEL, type CustomerInfo, type PurchasesPackage } from "react-native-purchases";
import { Platform } from "react-native";
const RC_API_KEY_IOS = "appl_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
const RC_API_KEY_ANDROID = "goog_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
let configured = false;
let configuredUserId: string | null = null;
export function initRevenueCat(userId?: string): void {
  if (Platform.OS === "web") return;
  try {
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
    const apiKey = Platform.OS === "ios" ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;
    if (apiKey.includes("XXXX")) return;
    if (configured) {
      if (configuredUserId !== (userId ?? null)) {
        if (userId) void Purchases.logIn(userId);
        else void Purchases.logOut().catch(() => {});
      }
      configuredUserId = userId ?? null;
      return;
    }
    Purchases.configure({ apiKey, appUserID: userId ?? null });
    configuredUserId = userId ?? null;
    configured = true;
  } catch { /* SDK unavailable in Expo Go or unsupported environment. */ }
}
export async function checkPremiumStatus(): Promise<boolean> {
  try { const info: CustomerInfo = await Purchases.getCustomerInfo(); return info.entitlements.active.premium !== undefined; }
  catch { return false; }
}
export async function getOfferings() { try { return (await Purchases.getOfferings()).current; } catch { return null; } }
export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  try { const { customerInfo } = await Purchases.purchasePackage(pkg); return customerInfo.entitlements.active.premium !== undefined; }
  catch { return false; }
}
export async function restorePurchases(): Promise<boolean> {
  try { return (await Purchases.restorePurchases()).entitlements.active.premium !== undefined; } catch { return false; }
}
