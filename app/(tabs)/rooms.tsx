import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { RoomsScreen } from "../../src/screens/RoomsScreen";
import { useAppState } from "../../src/hooks/useAppState";
import { supabase } from "../../src/lib/supabase";
import type { OpenHostedRoom } from "../../src/lib/useRealtimeRoom";

export default function Rooms() {
  const { availableContestants, enterLocalRoom, setPlayedIds, myProfileId } = useAppState();
  const [hostedRooms, setHostedRooms] = useState<OpenHostedRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomsError, setRoomsError] = useState<string | null>(null);

  const loadHostedRooms = useCallback(async () => {
    setRoomsError(null);
    const { data, error } = await supabase.rpc("get_open_rooms");
    if (error) {
      setRoomsError(error.message);
    } else {
      setHostedRooms(((data || []) as OpenHostedRoom[]).filter((room) => room.host_id !== myProfileId));
    }
    setLoadingRooms(false);
  }, [myProfileId]);

  useFocusEffect(useCallback(() => {
    setLoadingRooms(true);
    void loadHostedRooms();
    const channel = supabase.channel("open-hosted-rooms")
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, () => {
        void loadHostedRooms();
      })
      .subscribe();
    const refreshTimer = setInterval(() => void loadHostedRooms(), 15000);
    return () => {
      clearInterval(refreshTimer);
      void supabase.removeChannel(channel);
    };
  }, [loadHostedRooms]));

  const joinHostedRoom = async (roomId: string) => {
    const { error } = await supabase.rpc("join_room", { p_room_id: roomId });
    if (error) throw error;
    await loadHostedRooms();
    router.push({ pathname: "/hosted-room", params: { roomId } });
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
