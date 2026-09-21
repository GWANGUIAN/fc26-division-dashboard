import { useEffect, useRef, useState } from "react";
import { GROUP_PHOTO_BALL, getBallKickOffset, propTopCss } from "./groupPhotoProps";
import { getGroupPhotoPropUrl } from "./groupPhotoAssets";

// 공 킥 시퀀스(문서 docs/group-photo-props.md "동작 스펙"):
//   idle → flying(포물선 비행) → behind(골대 뒤로 층 전환) → sunk(골! 효과) →
//   respawn(팝인) → idle. 비행 애니메이션 자체는 CSS(group-photo.css의
//   gp-kick-*)가 하고, 여기서는 단계 전환 타이밍만 관리한다 — CSS의
//   --kick-duration과 같은 값이어야 한다.
const FLIGHT_MS = 1100;
const SUNK_HOLD_MS = 3000;
const RESPAWN_MS = 400;

type Phase = "idle" | "flying" | "behind" | "sunk" | "respawn";

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function GroupPhotoBall({
  onKick,
  onGoal,
}: {
  /** 킥 시작 순간(발로 차는 소리). */
  onKick: () => void;
  /** 공이 골문에 도착한 순간(골 효과음·전광판·콘페티). */
  onGoal: () => void;
}) {
  const url = getGroupPhotoPropUrl(GROUP_PHOTO_BALL.id);
  const [phase, setPhase] = useState<Phase>("idle");
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  if (!url) return null;

  function schedule(fn: () => void, ms: number) {
    timersRef.current.push(window.setTimeout(fn, ms));
  }

  function kick() {
    if (phase !== "idle") return;
    // reduced-motion에서는 비행을 건너뛰고 바로 골 처리(효과음·문구만).
    const flightMs = prefersReducedMotion() ? 0 : FLIGHT_MS;
    onKick();
    setPhase("flying");
    schedule(() => setPhase("behind"), flightMs * 0.85);
    schedule(() => {
      setPhase("sunk");
      onGoal();
    }, flightMs);
    schedule(() => setPhase("respawn"), flightMs + SUNK_HOLD_MS);
    schedule(() => setPhase("idle"), flightMs + SUNK_HOLD_MS + RESPAWN_MS);
  }

  const { dxVw, dyVw } = getBallKickOffset();
  const kicked = phase === "flying" || phase === "behind" || phase === "sunk";

  return (
    <button
      type="button"
      className="group-photo-ball"
      data-phase={phase}
      data-kicked={kicked ? "true" : undefined}
      onClick={kick}
      aria-label="공 차기"
      aria-disabled={phase !== "idle"}
      style={
        {
          left: `${GROUP_PHOTO_BALL.left}%`,
          top: propTopCss(GROUP_PHOTO_BALL.bottomVw),
          width: `${GROUP_PHOTO_BALL.widthVw}vw`,
          "--kick-dx": `${dxVw}vw`,
          "--kick-dy": `${dyVw}vw`,
          "--kick-duration": `${FLIGHT_MS}ms`,
        } as React.CSSProperties
      }
    >
      <span className="group-photo-ball__shadow" aria-hidden="true" />
      <span className="group-photo-ball__x">
        <span className="group-photo-ball__y">
          <img className="group-photo-ball__img" src={url} alt="" />
        </span>
      </span>
    </button>
  );
}
