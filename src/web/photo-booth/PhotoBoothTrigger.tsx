import { useState } from "react";
import { Camera } from "lucide-react";
import type { StreamerRecord } from "../../shared/model.js";
import { hexToRgba } from "../cardVisuals";
import { hasDiscoveredPhotoBooth, markPhotoBoothDiscovered } from "../storage";

export function PhotoBoothTrigger({
  passedStreamers,
  onOpen,
}: {
  passedStreamers: StreamerRecord[];
  onOpen: () => void;
}) {
  const [discovered, setDiscovered] = useState(() => hasDiscoveredPhotoBooth());

  if (passedStreamers.length === 0) return null;

  function handleClick() {
    if (!discovered) {
      markPhotoBoothDiscovered();
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
        aria-label="합격 인증샷 찍기"
        title="합격 인증샷 찍기"
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
          합격 인증샷 찍기
        </span>
      )}
    </div>
  );
}
