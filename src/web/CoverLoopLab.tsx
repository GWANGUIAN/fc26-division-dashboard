import { CoverLoopStage } from "./CoverLoopStage";
import { hachiCoverLoopTrack } from "./coverLoopLabData";
import "./cover-loop-lab.css";

// Dev/QA-only direct route (docs/cover-loop-lab-next-implementation.md) — no link in the main UI
// points here. The real entry point is the PlaylistToggle button + CoverLoopPlaylistOverlay.
export function CoverLoopLab() {
  return (
    <main className="cover-loop-lab">
      <h1 className="sr-only">하치 커버 루프 실험실</h1>
      <CoverLoopStage track={hachiCoverLoopTrack} index={1} />
    </main>
  );
}
