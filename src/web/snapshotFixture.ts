import type { DashboardSnapshot } from "../shared/model.js";
import snapshotJson from "./snapshotFixture.json";

// Frozen copy of the last live DynamoDB snapshot, captured when automatic
// Naver Café collection was paused. See docs/PROJECT_HANDOFF.md for why and
// how to resume live data.
export const SNAPSHOT_FIXTURE = snapshotJson as DashboardSnapshot;
