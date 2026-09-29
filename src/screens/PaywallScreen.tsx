import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Crown, X } from "lucide-react-native";
import type { PurchasesPackage } from "react-native-purchases";
import { theme } from "../theme";
import { getOfferings, purchasePackage, restorePurchases } from "../lib/revenuecat";
const c = theme.color;

export function PaywallScreen({ visible, message, onClose, onPremium }: { visible: boolean; message?: string; onClose: () => void; onPremium: () => void }) {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selected, setSelected] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!visible) return;
    getOfferings().then((offering) => {
      const available = offering?.availablePackages ?? [];
      setPackages(available);
      setSelected(available.find((pkg) => pkg.packageType === "ANNUAL") ?? available[0] ?? null);
    });
  }, [visible]);
  async function buy() {
    if (!selected) { Alert.alert("Plans unavailable", "RevenueCat offerings are not configured yet."); return; }
    setLoading(true);
    const success = await purchasePackage(selected);
    setLoading(false);
    if (success) onPremium(); else Alert.alert("Purchase not completed", "Please try again or restore a previous purchase.");
  }
  async function restore() {
    setLoading(true);
    const success = await restorePurchases();
    setLoading(false);
    if (success) onPremium(); else Alert.alert("No purchases found", "We couldn't find an active Blink+ purchase.");
  }
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: c.overlay }}>
      <View style={{ maxHeight: "92%", backgroundColor: c.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 }}>
        <Pressable onPress={onClose} style={{ alignSelf: "flex-end", padding: 6 }}><X size={22} color={c.text2} /></Pressable>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ alignItems: "center", marginBottom: 22 }}>
            <Crown size={32} color={c.accent} />
            <Text style={{ color: c.text, fontSize: 28, fontWeight: "800", marginTop: 8 }}>Blink+</Text>
            <Text style={{ color: c.text2, fontSize: theme.font.secondary, marginTop: 4, textAlign: "center" }}>{message ?? "More chances to find your person."}</Text>
          </View>
          {["Unlimited Rooms", "Enhanced AI Vibe Match", "Unlimited saved matches", "Profile visibility boost"].map((item) => <View key={item} style={{ padding: 14, marginBottom: 8, borderRadius: theme.radius.md, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }}><Text style={{ color: c.text, fontWeight: "700" }}>{item}</Text></View>)}
          <Text style={{ color: c.text2, fontSize: theme.font.caption, marginTop: 10, marginBottom: 8 }}>FREE: 5 rooms/day · 3 saved matches · Basic vibe match</Text>
          {packages.map((pkg) => <Pressable key={pkg.identifier} onPress={() => setSelected(pkg)} style={{ padding: 14, marginBottom: 8, borderRadius: theme.radius.md, borderWidth: 2, borderColor: selected?.identifier === pkg.identifier ? c.primary : c.border, backgroundColor: c.surface, flexDirection: "row", justifyContent: "space-between" }}><Text style={{ color: c.text, fontWeight: "600" }}>{pkg.packageType === "ANNUAL" ? "Annual" : "Monthly"}</Text><Text style={{ color: c.text, fontWeight: "700" }}>{pkg.product.priceString}</Text></Pressable>)}
          <Pressable onPress={buy} disabled={loading} style={{ backgroundColor: c.primary, padding: 16, borderRadius: theme.radius.lg, alignItems: "center", marginTop: 10 }}>{loading ? <ActivityIndicator color={c.white} /> : <Text style={{ color: c.white, fontWeight: "700", fontSize: theme.font.body }}>Continue with Premium</Text>}</Pressable>
          <Pressable onPress={restore} disabled={loading} style={{ padding: 14, alignItems: "center" }}><Text style={{ color: c.primary, fontWeight: "600" }}>Restore Purchases</Text></Pressable>
        </ScrollView>
      </View>
    </View>
  </Modal>;
}
