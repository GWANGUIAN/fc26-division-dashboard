import type { TotyCardVariant } from "../../toty-card/totyCardAssets";
import type { WorldSave } from "../types";
import { missionStatusById } from "./missions";

/** The first director-led card view is instructional, so it never consumes the dashboard's variant cycle. */
export function initialWorldCardVariant(save: WorldSave): TotyCardVariant | undefined {
  const status = missionStatusById(save, "m-01-mycard");
  return status === "active" || status === "ready" ? "normal" : undefined;
}
