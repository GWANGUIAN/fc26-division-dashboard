import type { DashboardSnapshot } from "../shared/model.js";

// Automatic Naver Café collection is paused, so the dashboard serves a frozen
// snapshot instead of calling /api/snapshot. See docs/PROJECT_HANDOFF.md for
// why and how to resume live data.
export async function loadSnapshot(): Promise<DashboardSnapshot> {
  // Imported lazily so the ~1MB JSON stays out of the entry chunk.
  const { SNAPSHOT_FIXTURE } = await import("./snapshotFixture.js");
  return SNAPSHOT_FIXTURE;
}
