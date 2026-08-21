import { useEffect, useMemo, useRef, useState } from "react";
import {
  deletePlayerPhoto,
  getPlayerPhoto,
  savePlayerPhoto,
} from "./customPlayerPhotoDB.js";
import {
  loadCustomPlayers,
  saveCustomPlayers,
} from "./customPlayerStorage.js";
import {
  customPlayerToSquadPlayer,
  type CustomPlayer,
  type CustomPlayerInput,
  type SquadPlayer,
} from "./customPlayerTypes.js";
import { createId } from "./storage.js";

export type PhotoAction = "keep" | "remove" | File;

export function useCustomPlayers() {
  const [customPlayers, setCustomPlayers] = useState<CustomPlayer[]>(loadCustomPlayers);
  const [photoUrlById, setPhotoUrlById] = useState<Map<string, string>>(new Map());
  const fetchedIds = useRef<Set<string>>(new Set());
  const photoUrlByIdRef = useRef(photoUrlById);
  photoUrlByIdRef.current = photoUrlById;

  useEffect(() => {
    saveCustomPlayers(customPlayers);
  }, [customPlayers]);

  useEffect(() => {
    const liveIds = new Set(customPlayers.map((player) => player.id));

    for (const id of liveIds) {
      if (fetchedIds.current.has(id)) continue;
      fetchedIds.current.add(id);
      getPlayerPhoto(id).then((blob) => {
        if (!blob) return;
        setPhotoUrlById((current) => {
          if (current.has(id)) return current;
          const next = new Map(current);
          next.set(id, URL.createObjectURL(blob));
          return next;
        });
      });
    }

    for (const id of fetchedIds.current) {
      if (liveIds.has(id)) continue;
      fetchedIds.current.delete(id);
      setPhotoUrlById((current) => {
        if (!current.has(id)) return current;
        const next = new Map(current);
        const url = next.get(id);
        if (url) URL.revokeObjectURL(url);
        next.delete(id);
        return next;
      });
    }
  }, [customPlayers]);

  useEffect(() => {
    return () => {
      for (const url of photoUrlByIdRef.current.values()) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  function setPhotoUrl(id: string, url: string | undefined) {
    setPhotoUrlById((current) => {
      const next = new Map(current);
      const previous = next.get(id);
      if (previous) URL.revokeObjectURL(previous);
      if (url) next.set(id, url);
      else next.delete(id);
      return next;
    });
  }

  async function addCustomPlayer(input: CustomPlayerInput, photoFile: File | null) {
    const id = createId();
    if (photoFile) {
      await savePlayerPhoto(id, photoFile);
      fetchedIds.current.add(id);
      setPhotoUrl(id, URL.createObjectURL(photoFile));
    }
    const player: CustomPlayer = { id, ...normalizeInput(input) };
    setCustomPlayers((players) => [...players, player]);
  }

  async function updateCustomPlayer(
    id: string,
    input: CustomPlayerInput,
    photoAction: PhotoAction,
  ) {
    if (photoAction instanceof File) {
      await savePlayerPhoto(id, photoAction);
      fetchedIds.current.add(id);
      setPhotoUrl(id, URL.createObjectURL(photoAction));
    } else if (photoAction === "remove") {
      await deletePlayerPhoto(id);
      setPhotoUrl(id, undefined);
    }
    setCustomPlayers((players) =>
      players.map((player) =>
        player.id === id
          ? {
              id,
              ...normalizeInput(input),
              staticPhotoUrl:
                photoAction === "remove" ? undefined : player.staticPhotoUrl,
              isFancy: player.isFancy,
            }
          : player,
      ),
    );
  }

  async function deleteCustomPlayer(id: string) {
    setCustomPlayers((players) => players.filter((player) => player.id !== id));
    await deletePlayerPhoto(id);
    setPhotoUrl(id, undefined);
  }

  const customPlayerStreamerRecords: SquadPlayer[] = useMemo(
    () =>
      customPlayers.map((player) =>
        customPlayerToSquadPlayer(player, photoUrlById.get(player.id)),
      ),
    [customPlayers, photoUrlById],
  );

  return {
    customPlayers,
    photoUrlById,
    customPlayerStreamerRecords,
    addCustomPlayer,
    updateCustomPlayer,
    deleteCustomPlayer,
  };
}

function normalizeInput(input: CustomPlayerInput): CustomPlayerInput {
  const name = input.name.trim();
  const hasRecord =
    !!input.record && (input.record.wins + input.record.draws + input.record.losses) > 0;
  return {
    name,
    division: input.division,
    record: hasRecord ? input.record : undefined,
    winRatePercent: hasRecord ? undefined : input.winRatePercent,
  };
}
