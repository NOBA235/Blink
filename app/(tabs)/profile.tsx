import { useState } from "react";
import { ProfileScreen } from "../../src/screens/ProfileScreen";
import { SettingsSheet } from "../../src/screens/SettingsSheet";

export default function Profile() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <>
      <ProfileScreen onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
