import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { RoomsScreen } from "../../src/screens/RoomsScreen";
import { useAppState } from "../../src/hooks/useAppState";
import { supabase } from "../../src/lib/supabase";
import type { OpenHostedRoom } from "../../src/lib/useRealtimeRoom";

export default function Rooms() {
  const { availableContestants, enterLocalRoom, setPlayedIds } = useAppState();
  const [hostedRooms, setHostedRooms] = useState<OpenHostedRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomsError, setRoomsError] = useState<string | null>(null);

  const loadHostedRooms = useCallback(async () => {
    setRoomsError(null);
    const { data, error } = await supabase.rpc("get_open_rooms");
    if (error) {
      setRoomsError(error.message);
    } else {
      setHostedRooms((data || []) as OpenHostedRoom[]);
    }
    setLoadingRooms(false);
  }, []);

  useFocusEffect(useCallback(() => {
    setLoadingRooms(true);
    void loadHostedRooms();
  }, [loadHostedRooms]));

  const joinHostedRoom = async (roomId: string) => {
    const { error } = await supabase.rpc("join_room", { p_room_id: roomId });
    if (error) throw error;
    await loadHostedRooms();
  };

  return (
    <RoomsScreen
      contestants={availableContestants}
      onEnterRoom={(c) => { enterLocalRoom(c); router.push("/room"); }}
      onRefreshPool={() => setPlayedIds([])}
      hostedRooms={hostedRooms}
      loadingHostedRooms={loadingRooms}
      hostedRoomsError={roomsError}
      onJoinHostedRoom={joinHostedRoom}
    />
  );
}
