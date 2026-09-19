import { useEffect, useState } from "react";
import { getWorldAssetUrl } from "../worldAssets";

const TIPS = [
  "방향키 또는 WASD로 움직여요. Shift를 누르면 달려요.",
  "E · Space · Enter로 말을 걸고 대화를 넘겨요.",
  "Esc를 누르면 월드에서 나갈 수 있어요.",
  "시들어가는 황금 잔디를 다시 살려 보세요.",
  "잔디동 멤버들의 집을 하나씩 찾아가 보세요.",
];

const TIP_INTERVAL_MS = 2600;

/** Loading art + progress bar + rotating tips. Falls back to a flat panel when the art is missing. */
export function LoadingScreen({ progress, label = "불러오는 중" }: { progress: number; label?: string }) {
  const [tip, setTip] = useState(() => Math.floor(Math.random() * TIPS.length));
  useEffect(() => {
    const id = window.setInterval(() => setTip((current) => (current + 1) % TIPS.length), TIP_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  const art = getWorldAssetUrl("ui/loading-bg");
  const frame = getWorldAssetUrl("ui/loading-bar-frame");
  const percent = Math.round(Math.min(1, Math.max(0, progress)) * 100);

  return (
    <div className="world-loading" style={art ? { backgroundImage: `url(${art})` } : undefined} role="status" aria-live="polite">
      <div className="world-loading__panel">
        <div className="world-loading__title">잔디동 월드</div>
        <div
          className={`world-loading__bar${frame ? " world-loading__bar--framed" : ""}`}
          style={frame ? ({ "--world-bar-frame": `url(${frame})` } as React.CSSProperties) : undefined}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label={label}
        >
          <div className="world-loading__fill" style={{ width: `${percent}%` }} />
        </div>
        <div className="world-loading__label">{label} {percent}%</div>
        <div className="world-loading__tip">{TIPS[tip]}</div>
      </div>
    </div>
  );
}
