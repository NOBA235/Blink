import AsyncStorage from "@react-native-async-storage/async-storage";

// Mirrors the web app's src/lib/storage.js get/set/delete contract (which
// itself mirrors the original Claude.ai artifact's window.storage API) so
// the same calling code works across all three. AsyncStorage's own API is
// already close enough to this shape that little translation is needed.
const PREFIX = "pop:";

function nsKey(key: string) {
  return PREFIX + key;
}

export const storage = {
  async get(key: string): Promise<{ key: string; value: string } | never> {
    const raw = await AsyncStorage.getItem(nsKey(key));
    if (raw === null) {
      throw new Error(`No value stored for "${key}"`);
    }
    return { key, value: raw };
  },
  async set(key: string, value: string) {
    await AsyncStorage.setItem(nsKey(key), value);
    return { key, value };
  },
  async delete(key: string) {
    await AsyncStorage.removeItem(nsKey(key));
    return { key, deleted: true };
  },
};
