import { useCallback, useEffect, useState } from "react";
import type { DashboardSnapshot } from "../shared/model.js";
import { loadSnapshot } from "./api.js";
import { applyFancyMembersOverride } from "./appHelpers";

export function useDashboardSnapshot() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>();
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadSnapshot();
      setSnapshot(applyFancyMembersOverride(data, window.location.search));
    } catch {
      // Keep whatever snapshot is already on screen; the sync indicator
      // in HeroSection surfaces staleness instead of blanking the board.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { snapshot, loading, refresh };
}
