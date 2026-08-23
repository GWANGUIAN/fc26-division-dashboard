import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, Users } from "lucide-react";
import type { GrowthSeries } from "../shared/growth-series.js";
import { searchable } from "../shared/search.js";
import { Avatar, hexToRgba } from "./cardVisuals";
import { hasDiscoveredGrowthPicker, markGrowthPickerDiscovered } from "./storage";

export function GrowthStreamerPicker({
  series,
  selectedIds,
  onChange,
}: {
  series: GrowthSeries[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [anchor, setAnchor] = useState<{ top: number; right: number }>();
  const [discovered, setDiscovered] = useState(() => hasDiscoveredGrowthPicker());
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  function handleToggleOpen() {
    setIsOpen((current) => !current);
    if (!discovered) {
      markGrowthPickerDiscovered();
      setDiscovered(true);
    }
  }

  function updateAnchor() {
    const rect = toggleRef.current?.getBoundingClientRect();
    if (rect) setAnchor({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
  }

  useEffect(() => {
    if (!isOpen) return;
    updateAnchor();
    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (toggleRef.current?.contains(target)) return;
      if (panelRef.current && !panelRef.current.contains(target)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    // Capture phase: the modal's own backdrop-click-to-close handler calls stopPropagation()
    // on mousedown (bubble phase) to protect itself, which would otherwise also swallow this
    // listener for every click inside the modal, since the panel is portaled outside it.
    addEventListener("mousedown", closeOnOutsideClick, true);
    addEventListener("keydown", closeOnEscape);
    addEventListener("resize", updateAnchor);
    return () => {
      removeEventListener("mousedown", closeOnOutsideClick, true);
      removeEventListener("keydown", closeOnEscape);
      removeEventListener("resize", updateAnchor);
    };
  }, [isOpen]);

  const sorted = useMemo(
    () => [...series].sort((a, b) => a.currentDivision - b.currentDivision || a.displayName.localeCompare(b.displayName, "ko")),
    [series],
  );
  const filtered = useMemo(
    () => sorted.filter((item) => searchable(item.displayName, [], query)),
    [sorted, query],
  );
  const selected = new Set(selectedIds);

  function toggle(id: string) {
    onChange(selected.has(id) ? selectedIds.filter((existing) => existing !== id) : [...selectedIds, id]);
  }

  return (
    <div className="growth-picker">
      <button
        type="button"
        ref={toggleRef}
        className={`growth-picker__toggle ${discovered ? "" : "fancy-border view-toggle-card--attention"}`}
        onClick={handleToggleOpen}
        aria-expanded={isOpen}
        aria-label="표시할 인원 선택"
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
        <Users aria-hidden="true" />
        <span>{selectedIds.length}명 선택됨</span>
        <ChevronDown aria-hidden="true" className="growth-picker__chevron" />
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
      {isOpen &&
        anchor &&
        createPortal(
          <section
            ref={panelRef}
            className="growth-picker__panel"
            role="region"
            aria-label="인원 선택"
            style={{ position: "fixed", top: anchor.top, right: anchor.right }}
          >
            <div className="growth-picker__search">
              <Search aria-hidden="true" />
              <input
                type="text"
                placeholder="이름 검색"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoFocus
              />
            </div>
            <div className="growth-picker__actions">
              <button type="button" onClick={() => onChange(series.map((item) => item.streamerId))}>
                전체 선택
              </button>
              <button type="button" onClick={() => onChange([])}>
                전체 해제
              </button>
            </div>
            <div className="growth-picker__list">
              {filtered.map((item) => (
                <label key={item.streamerId} className="growth-picker__row">
                  <input
                    type="checkbox"
                    checked={selected.has(item.streamerId)}
                    onChange={() => toggle(item.streamerId)}
                  />
                  <Avatar profileImageUrl={item.profileImageUrl} soopId={item.soopId} displayName={item.displayName} />
                  <span className="growth-picker__name">{item.displayName}</span>
                  <span className="growth-picker__division" style={{ "--marker-color": item.color } as React.CSSProperties}>
                    디비전{item.currentDivision}
                  </span>
                </label>
              ))}
              {filtered.length === 0 && <p className="growth-picker__empty">검색 결과가 없습니다</p>}
            </div>
          </section>,
          document.body,
        )}
    </div>
  );
}
