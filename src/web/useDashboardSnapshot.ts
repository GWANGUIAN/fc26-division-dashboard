import { useEffect, useState } from "react";
import type { DashboardSnapshot } from "../shared/model.js";
import { loadSnapshot } from "./api.js";
import { applyFancyMembersOverride } from "./appHelpers";

export function useDashboardSnapshot() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>();
  useEffect(() => {
    loadSnapshot()
      .then((data) =>
        setSnapshot(applyFancyMembersOverride(data, window.location.search)),
      )
      .catch(() => undefined);
  }, []);
  return snapshot;
}
