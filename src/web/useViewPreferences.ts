import { useState } from "react";
import {
  CARD_ZOOM_MAX,
  CARD_ZOOM_MIN,
  hasDiscoveredCardView,
  hasDiscoveredGrowthGraph,
  loadCardZoomLevel,
  loadViewMode,
  markCardViewDiscovered,
  markGrowthGraphDiscovered,
  saveCardZoomLevel,
  saveViewMode,
} from "./storage";

export function useViewPreferences() {
  const [viewMode, setViewModeState] = useState<"list" | "table" | "card">(() =>
    loadViewMode(),
  );
  const [cardViewDiscovered, setCardViewDiscovered] = useState(() =>
    hasDiscoveredCardView(),
  );
  const [growthGraphDiscovered, setGrowthGraphDiscovered] = useState(() =>
    hasDiscoveredGrowthGraph(),
  );
  const [sortMode, setSortMode] = useState<"division" | "winRate">("division");
  const [cardZoom, setCardZoom] = useState(() => loadCardZoomLevel());

  function setViewMode(mode: "list" | "table" | "card") {
    setViewModeState(mode);
    saveViewMode(mode);
    if (mode === "card" && !cardViewDiscovered) {
      markCardViewDiscovered();
      setCardViewDiscovered(true);
    }
  }
  function handleGrowthGraphOpen() {
    if (!growthGraphDiscovered) {
      markGrowthGraphDiscovered();
      setGrowthGraphDiscovered(true);
    }
  }
  function handleZoomOut() {
    setCardZoom((level) => {
      const next = Math.max(CARD_ZOOM_MIN, level - 1);
      saveCardZoomLevel(next);
      return next;
    });
  }
  function handleZoomIn() {
    setCardZoom((level) => {
      const next = Math.min(CARD_ZOOM_MAX, level + 1);
      saveCardZoomLevel(next);
      return next;
    });
  }

  return {
    viewMode,
    setViewMode,
    cardViewDiscovered,
    growthGraphDiscovered,
    handleGrowthGraphOpen,
    sortMode,
    setSortMode,
    cardZoom,
    handleZoomIn,
    handleZoomOut,
  };
}
