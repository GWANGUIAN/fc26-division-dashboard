import type { DashboardSnapshot } from "../shared/model.js";
import { SNAPSHOT_FIXTURE } from "./snapshotFixture.js";

// Automatic Naver Café collection is paused, so the dashboard serves a frozen
// snapshot instead of calling /api/snapshot. See docs/PROJECT_HANDOFF.md for
// why and how to resume live data.
export async function loadSnapshot(): Promise<DashboardSnapshot> {
  return SNAPSHOT_FIXTURE;
}
