import { useState } from "react";
import { Camera } from "lucide-react";
import type { StreamerRecord } from "../../shared/model.js";
import { hexToRgba } from "../cardVisuals";
import "../photo-booth/photo-booth.css";
import { hasDiscoveredGroupPhoto, markGroupPhotoDiscovered } from "../storage";

// PhotoBoothTrigger.tsx를 그대로 본뜬 컴포넌트 — 아이콘/버튼/콜아웃 구조와
// CSS 클래스(photo-booth.css)는 그대로 재사용하고, 문구와 localStorage 키만
// "단체샷 구경하기" 전용으로 바꿨다. 두 기능이 동시에 렌더링되는 일이 없으므로
// (App.tsx의 SHOW_PHOTO_BOOTH_CELEBRATION 플래그로 배타적 분기) 같은 CSS를
// 공유해도 충돌하지 않는다.
export function GroupPhotoTrigger({
  passedStreamers,
  onOpen,
}: {
  passedStreamers: StreamerRecord[];
  onOpen: () => void;
}) {
  const [discovered, setDiscovered] = useState(() => hasDiscoveredGroupPhoto());

  if (passedStreamers.length === 0) return null;

  function handleClick() {
    if (!discovered) {
      markGroupPhotoDiscovered();
      setDiscovered(true);
    }
    onOpen();
  }

  return (
    <div className="photo-booth-trigger-slot">
      <button
        type="button"
        className={`photo-booth-trigger ${discovered ? "" : "fancy-border view-toggle-card--attention"}`}
        onClick={handleClick}
        aria-label="단체샷 구경하기"
        title="단체샷 구경하기"
        style={
          discovered
            ? undefined
            : ({
                "--fancy-color": "#00e9ae",
                "--fancy-glow-soft": hexToRgba("#00e9ae", 0.4),
                "--fancy-glow-strong": hexToRgba("#00e9ae", 0.85),
              } as React.CSSProperties)
        }
      >
        <Camera aria-hidden="true" />
        {!discovered && (
          <span className="view-toggle-card__sparks" aria-hidden="true">
            <i className="view-toggle-card__spark view-toggle-card__spark--1">✦</i>
            <i className="view-toggle-card__spark view-toggle-card__spark--2">✦</i>
            <i className="view-toggle-card__spark view-toggle-card__spark--3">✦</i>
            <i className="view-toggle-card__spark view-toggle-card__spark--4">✦</i>
            <i className="view-toggle-card__spark view-toggle-card__spark--5">✦</i>
          </span>
        )}
      </button>
      {!discovered && (
        <span className="photo-booth-trigger__callout" aria-hidden="true">
          단체샷 구경하기
        </span>
      )}
    </div>
  );
}
