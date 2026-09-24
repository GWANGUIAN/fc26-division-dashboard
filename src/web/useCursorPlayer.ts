import { useEffect, useState } from "react";
import type { CursorSelectionId } from "./cursorCatalog";
import { loadCursorPlayerId, saveCursorPlayerId } from "./storage";

export function useCursorPlayer() {
  const [cursorPlayerId, setCursorPlayerId] = useState<CursorSelectionId>(loadCursorPlayerId);

  useEffect(() => {
    saveCursorPlayerId(cursorPlayerId);
  }, [cursorPlayerId]);

  return { cursorPlayerId, setCursorPlayerId };
}
