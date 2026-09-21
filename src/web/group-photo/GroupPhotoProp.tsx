import { useEffect, useRef, useState } from "react";
import type { GroupPhotoPropSlot } from "./groupPhotoProps";
import { propTopCss } from "./groupPhotoProps";
import { getGroupPhotoPropUrl } from "./groupPhotoAssets";

const REACTION_MS = 900;

/**
 * 골대·콘·코너 플래그 등 축구장 소품 한 개. 이미지 파일이 아직 없으면
 * 아무것도 렌더하지 않는다(GroupPhotoCharacter와 같은 규칙). `reaction`이
 * 있는 소품만 클릭 가능하고, 저장 이미지(exportGroupPhotoImage.ts)에는
 * 반응 애니메이션이 아니라 정지 상태로 그려진다.
 */
export function GroupPhotoProp({
  slot,
  label,
  onReact,
}: {
  slot: GroupPhotoPropSlot;
  /** 클릭 가능한 소품의 접근성 이름. */
  label?: string;
  onReact?: () => void;
}) {
  const url = getGroupPhotoPropUrl(slot.id);
  const [reacting, setReacting] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  if (!url) return null;

  const style = {
    left: `${slot.left}%`,
    top: propTopCss(slot.bottomVw),
    width: `${slot.widthVw}vw`,
  } as React.CSSProperties;
  const className = `group-photo-prop group-photo-prop--${slot.layer}`;

  if (!slot.reaction) {
    return (
      <div className={className} style={style} aria-hidden="true">
        <img className="group-photo-prop__img" src={url} alt="" />
      </div>
    );
  }

  function handleClick() {
    onReact?.();
    // 연타하면 애니메이션을 처음부터 다시 — 클래스를 뗐다가 다음 프레임에 붙임.
    window.clearTimeout(timerRef.current);
    setReacting(false);
    requestAnimationFrame(() => {
      setReacting(true);
      timerRef.current = window.setTimeout(() => setReacting(false), REACTION_MS);
    });
  }

  return (
    <button
      type="button"
      className={`${className} group-photo-prop--interactive${reacting ? ` group-photo-prop--${slot.reaction}` : ""}`}
      style={style}
      onClick={handleClick}
      aria-label={label ?? slot.id}
    >
      <img className="group-photo-prop__img" src={url} alt="" />
    </button>
  );
}
