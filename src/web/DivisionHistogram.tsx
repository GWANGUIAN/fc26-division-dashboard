import { useEffect, useMemo, useRef, useState } from "react";
import { ChartColumn } from "lucide-react";
import type { StreamerRecord } from "../shared/model.js";
import { buildDivisionHistogram } from "../shared/division-histogram.js";

export function DivisionHistogram({
  streamers,
  excludedNames = [],
}: {
  streamers: StreamerRecord[];
  excludedNames?: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buckets = useMemo(() => buildDivisionHistogram(streamers), [streamers]);
  const chartBuckets = useMemo(
    () => buckets.filter((bucket) => bucket.division !== 10),
    [buckets],
  );
  const unjoinedBucket = buckets.find((bucket) => bucket.division === 10);
  const maxCount = Math.max(1, ...chartBuckets.map((bucket) => bucket.count));

  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node))
        setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    addEventListener("mousedown", closeOnOutsideClick);
    addEventListener("keydown", closeOnEscape);
    return () => {
      removeEventListener("mousedown", closeOnOutsideClick);
      removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div className="division-histogram" ref={panelRef}>
      <button
        type="button"
        className="division-histogram__toggle"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-label="디비전 분포 보기"
      >
        <ChartColumn aria-hidden="true" /> <span>분포 현황</span>
      </button>
      <section
        className={`division-histogram__panel ${isOpen ? "division-histogram__panel--open" : "division-histogram__panel--collapsed"}`}
        role="region"
        aria-label="디비전 분포"
        aria-hidden={!isOpen}
      >
        <div className="division-histogram__heading">
          <span>디비전 분포</span>
          <small>
            총 {streamers.length}명
            {unjoinedBucket && unjoinedBucket.count > 0
              ? ` · 미참여 ${unjoinedBucket.count}명`
              : ""}
            {excludedNames.length > 0
              ? ` (${excludedNames.map((name) => name + "님").join(", ")} 제외)`
              : ""}
          </small>
        </div>
        <div className="division-histogram__chart">
          {chartBuckets.map((bucket, index) => {
            const ratio = bucket.count / maxCount;
            const label = `${bucket.division}부`;
            return (
              <div
                className="division-histogram__bar"
                key={bucket.division}
                tabIndex={isOpen ? 0 : -1}
              >
                <b className="division-histogram__count">{bucket.count}</b>
                <span className="division-histogram__track">
                  <span
                    className="division-histogram__fill"
                    style={{
                      transform: isOpen ? `scaleY(${ratio})` : "scaleY(0)",
                      transitionDelay: `${index * 25}ms`,
                    }}
                  />
                </span>
                <small className="division-histogram__label">{label}</small>
                {bucket.count > 0 && (
                  <span role="tooltip">
                    {bucket.entries.map((entry, entryIndex) => (
                      <span key={entry.name}>
                        <span
                          className={
                            entry.isFancy
                              ? "division-histogram__entry division-histogram__entry--fancy"
                              : "division-histogram__entry"
                          }
                        >
                          {entry.isFancy && <span aria-hidden="true">✦ </span>}
                          {entry.name}
                        </span>
                        {entryIndex < bucket.entries.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
