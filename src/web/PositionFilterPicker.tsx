import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import {
  POSITION_GROUP_CODES,
  POSITION_GROUP_COLORS,
  POSITION_GROUP_LABELS,
  type PositionGroup,
} from "../shared/position-theme.js";

const POSITION_GROUP_ORDER: PositionGroup[] = ["FW", "MF", "DF", "GK"];

/** Multi-select dropdown for individual position codes (ST, CM, ...), grouped
 * under their FW/MF/DF/GK headers. Only codes with at least one current
 * candidate are listed (`availableCodes`). Selecting every listed code is
 * equivalent to no filter at all — the toggle label reads "전체 포지션" in
 * that state. */
export function PositionFilterPicker({
  availableCodes,
  selected,
  onChange,
}: {
  availableCodes: string[];
  selected: string[];
  onChange: (codes: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ top: number; left: number }>();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  function updateAnchor() {
    const rect = toggleRef.current?.getBoundingClientRect();
    if (rect) setAnchor({ top: rect.bottom + 8, left: rect.left });
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
    // Capture phase: a modal's own backdrop-click-to-close handler calls
    // stopPropagation() on mousedown (bubble phase), which would otherwise
    // also swallow this listener when the panel is portaled outside it.
    addEventListener("mousedown", closeOnOutsideClick, true);
    addEventListener("keydown", closeOnEscape);
    addEventListener("resize", updateAnchor);
    return () => {
      removeEventListener("mousedown", closeOnOutsideClick, true);
      removeEventListener("keydown", closeOnEscape);
      removeEventListener("resize", updateAnchor);
    };
  }, [isOpen]);

  const selectedSet = new Set(selected);
  const isAllSelected = selected.length >= availableCodes.length;

  function toggleCode(code: string) {
    onChange(
      selectedSet.has(code)
        ? selected.filter((existing) => existing !== code)
        : [...selected, code],
    );
  }

  return (
    <div className="position-picker">
      <button
        type="button"
        ref={toggleRef}
        className="position-picker__toggle"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-label="포지션 필터"
      >
        <span>
          {isAllSelected ? "전체 포지션" : `${selected.length}개 포지션 선택`}
        </span>
        <ChevronDown aria-hidden="true" className="position-picker__chevron" />
      </button>
      {isOpen &&
        anchor &&
        createPortal(
          <section
            ref={panelRef}
            className="position-picker__panel"
            role="region"
            aria-label="포지션 선택"
            style={{ position: "fixed", top: anchor.top, left: anchor.left }}
          >
            <div className="position-picker__actions">
              <button
                type="button"
                onClick={() => onChange([...availableCodes])}
              >
                전체 선택
              </button>
              <button type="button" onClick={() => onChange([])}>
                전체 해제
              </button>
            </div>
            <div className="position-picker__list">
              {POSITION_GROUP_ORDER.map((group) => {
                const codesInGroup = POSITION_GROUP_CODES[group].filter(
                  (code) => availableCodes.includes(code),
                );
                if (codesInGroup.length === 0) return null;
                return (
                  <div className="position-picker__group" key={group}>
                    <span
                      className="position-picker__group-label"
                      style={
                        {
                          "--position-color": POSITION_GROUP_COLORS[group],
                        } as React.CSSProperties
                      }
                    >
                      {POSITION_GROUP_LABELS[group]}
                    </span>
                    {codesInGroup.map((code) => (
                      <label key={code} className="position-picker__row">
                        <input
                          type="checkbox"
                          checked={selectedSet.has(code)}
                          onChange={() => toggleCode(code)}
                        />
                        <span
                          className="position-tag"
                          style={
                            {
                              "--position-color": POSITION_GROUP_COLORS[group],
                            } as React.CSSProperties
                          }
                        >
                          {code}
                        </span>
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>
          </section>,
          document.body,
        )}
    </div>
  );
}
