import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ImageDown, RotateCcw, Sparkles } from "lucide-react";
import { getPositionTestCardBackUrl, getPositionTestResultCardUrl } from "./positionTestAssets";
import { POSITION_LABELS, type PositionTestResultEntry } from "./positionTestResults";
import { exportPositionTestCardPng } from "./exportPositionTestCardImage";
import "./position-test-reveal.css";

const FLIP_MS = 700;

type Phase = "back" | "flipping" | "revealed";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

/**
 * Single-card "카드 뒷면 → 공개 버튼 → 플립 → 결과" sequence — reuses the
 * fortune-flip 3D flip technique (fortune-draw.css) under its own
 * `.position-flip` class names (this codebase keeps each feature's overlay
 * animation CSS independent rather than sharing one, see fortune-popup.css's
 * header comment), simplified down from FortuneDraw's 3-card shuffle/pick
 * since the result here is already decided by the quiz answers — there's
 * nothing left to pick, just one card to reveal.
 */
export function PositionTestReveal({
  name,
  entry,
  onCardOpen,
  onRevealImpact,
  onRestart,
}: {
  name: string;
  entry: PositionTestResultEntry;
  onCardOpen?: () => void;
  onRevealImpact?: () => void;
  onRestart: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("back");
  const [exporting, setExporting] = useState(false);
  const impactFiredRef = useRef(false);

  useEffect(() => {
    if (phase !== "flipping") return;
    impactFiredRef.current = false;
    const impactTimer = window.setTimeout(() => {
      if (impactFiredRef.current) return;
      impactFiredRef.current = true;
      onRevealImpact?.();
    }, FLIP_MS / 2);
    const doneTimer = window.setTimeout(() => setPhase("revealed"), FLIP_MS);
    return () => {
      window.clearTimeout(impactTimer);
      window.clearTimeout(doneTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onRevealImpact is stable enough for this one-shot sequence
  }, [phase]);

  const backUrl = getPositionTestCardBackUrl();
  const frontUrl = getPositionTestResultCardUrl(entry.memberId, entry.style);

  const handleOpen = () => {
    if (phase !== "back") return;
    onCardOpen?.();
    if (prefersReducedMotion()) {
      onRevealImpact?.();
      setPhase("revealed");
    } else {
      setPhase("flipping");
    }
  };

  const handleSaveImage = async () => {
    if (exporting || !frontUrl) return;
    setExporting(true);
    try {
      await exportPositionTestCardPng(name, entry, frontUrl);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="position-test-reveal">
      {phase !== "revealed" && <p className="position-test-reveal__status">{phase === "back" ? "결과 카드가 준비됐어요" : "카드를 확인하는 중..."}</p>}

      <div
        className={`position-flip ${phase === "flipping" ? "position-flip--anim" : ""} ${phase !== "back" ? "position-flip--flipped" : ""}`}
        style={{ "--position-accent": entry.accentColor } as CSSProperties}
      >
        <div className="position-flip__inner">
          <div className="position-test-card-face position-test-card-face--back">
            {backUrl ? <img src={backUrl} alt="" /> : <div className="position-test-card-face__placeholder">?</div>}
          </div>
          <div className="position-test-card-face position-test-card-face--front position-flip__front">
            {frontUrl ? (
              <img src={frontUrl} alt="" />
            ) : (
              <div className="position-test-card-face__placeholder">
                <Sparkles aria-hidden="true" />
              </div>
            )}
          </div>
        </div>
      </div>

      {phase === "back" && (
        <button type="button" className="position-test-reveal__open-btn" onClick={handleOpen}>
          결과 확인하기
        </button>
      )}

      {phase === "revealed" && (
        <div className="position-test-reveal__panel" style={{ "--position-accent": entry.accentColor } as CSSProperties}>
          <p className="position-test-reveal__eyebrow">
            {name}님에게 어울리는 포지션은 <b>{POSITION_LABELS[entry.position]}</b>
          </p>
          <h3 className="position-test-reveal__title">{entry.title}</h3>
          <p className="position-test-reveal__subtitle">{entry.subtitle}</p>
          <div className="position-test-reveal__actions">
            <button type="button" className="position-test-reveal__btn" onClick={onRestart}>
              <RotateCcw aria-hidden="true" /> 다시 하기
            </button>
            {frontUrl && (
              <button type="button" className="position-test-reveal__btn position-test-reveal__btn--save" onClick={handleSaveImage} disabled={exporting}>
                <ImageDown aria-hidden="true" /> {exporting ? "저장 중..." : "이미지로 저장"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
