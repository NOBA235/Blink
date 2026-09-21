import { router } from "expo-router";
import { RoomsScreen } from "../../src/screens/RoomsScreen";
import { useAppState } from "../../src/hooks/useAppState";

export default function Rooms() {
  const { availableContestants, enterLocalRoom, setPlayedIds } = useAppState();

  return (
    <RoomsScreen
      contestants={availableContestants}
      onEnterRoom={(c) => { enterLocalRoom(c); router.push("/room"); }}
      onRefreshPool={() => setPlayedIds([])}
    />
  );
}
