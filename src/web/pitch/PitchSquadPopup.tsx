import { useEffect, useMemo } from "react";
import { SquadBuilderOverlay } from "../squad-builder/SquadBuilderOverlay";
import { useDashboardSnapshot } from "../useDashboardSnapshot";

const PLACEHOLDER_STYLE = {
  position: "fixed",
  inset: 0,
  zIndex: 80,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 16,
  background: "var(--bg-base, #05060f)",
  color: "var(--text-primary, #f7f7ff)",
  font: "14px 'Galmuri11', monospace",
} as const;

/**
 * The dashboard's "나만의 스쿼드 빌더" opened from the locker-room whiteboard. The pitch never mounts the dashboard, so this
 * loads the roster itself (the same snapshot and the same 1차 합격자 filter the dashboard hands the builder) and shows a
 * small placeholder until it is there. Lazy-loaded by PitchEntry, so the pitch chunk does not carry the drag-and-drop code.
 */
export default function PitchSquadPopup({ onClose }: { onClose: () => void }) {
  const { snapshot, loading } = useDashboardSnapshot();
  const passedStreamers = useMemo(() => (snapshot?.streamers ?? []).filter((streamer) => streamer.passedFirstRound), [snapshot]);

  // The builder closes itself on Esc once it is up; the placeholder needs the same.
  const showPlaceholder = loading || !snapshot;
  useEffect(() => {
    if (!showPlaceholder) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    addEventListener("keydown", close);
    return () => removeEventListener("keydown", close);
  }, [showPlaceholder, onClose]);

  if (showPlaceholder) {
    return (
      <div style={PLACEHOLDER_STYLE} role="dialog" aria-modal="true" aria-label="스쿼드 관리">
        <p>{loading ? "스쿼드 불러오는 중…" : "스쿼드를 불러오지 못했습니다."}</p>
        <button type="button" onClick={onClose} style={{ font: "inherit", padding: "6px 14px" }}>
          닫기
        </button>
      </div>
    );
  }
  return <SquadBuilderOverlay streamers={passedStreamers} onClose={onClose} />;
}
