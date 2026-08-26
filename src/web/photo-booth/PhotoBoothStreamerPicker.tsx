import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search } from "lucide-react";
import type { StreamerRecord } from "../../shared/model.js";
import { searchable } from "../../shared/search.js";
import { Avatar } from "../cardVisuals";

export function PhotoBoothStreamerPicker({
  streamers,
  selectedId,
  onSelect,
}: {
  streamers: StreamerRecord[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [anchor, setAnchor] = useState<{ top: number; left: number }>();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const selected = streamers.find((streamer) => streamer.id === selectedId);

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
    // Capture phase, same reason as GrowthStreamerPicker: the overlay's own
    // backdrop mousedown handler would otherwise swallow this listener since
    // the panel is portaled outside the overlay.
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
    () => [...streamers].sort((a, b) => a.displayName.localeCompare(b.displayName, "ko")),
    [streamers],
  );
  const filtered = useMemo(
    () => sorted.filter((item) => searchable(item.displayName, item.cafeAliases ?? [], query)),
    [sorted, query],
  );

  function handleSelect(id: string) {
    onSelect(id);
    setIsOpen(false);
  }

  return (
    <div className="photo-booth-picker">
      <button
        type="button"
        ref={toggleRef}
        className="photo-booth-picker__toggle"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-label="인증샷 스트리머 선택"
      >
        {selected ? (
          <>
            <Avatar
              profileImageUrl={selected.profileImageUrl}
              soopId={selected.soopId}
              displayName={selected.displayName}
            />
            <span className="photo-booth-picker__toggle-name">{selected.displayName}</span>
          </>
        ) : (
          <span className="photo-booth-picker__toggle-name">스트리머 선택</span>
        )}
        <ChevronDown aria-hidden="true" className="photo-booth-picker__chevron" />
      </button>
      {isOpen &&
        anchor &&
        createPortal(
          <section
            ref={panelRef}
            className="photo-booth-picker__panel"
            role="region"
            aria-label="인증샷 스트리머 선택"
            style={{ position: "fixed", top: anchor.top, left: anchor.left }}
          >
            <div className="photo-booth-picker__search">
              <Search aria-hidden="true" />
              <input
                type="text"
                placeholder="이름 검색"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoFocus
              />
            </div>
            <div className="photo-booth-picker__list">
              {filtered.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`photo-booth-picker__row ${item.id === selectedId ? "photo-booth-picker__row--selected" : ""}`}
                  onClick={() => handleSelect(item.id)}
                >
                  <Avatar
                    profileImageUrl={item.profileImageUrl}
                    soopId={item.soopId}
                    displayName={item.displayName}
                  />
                  <span className="photo-booth-picker__name">{item.displayName}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="photo-booth-picker__empty">검색 결과가 없습니다</p>
              )}
            </div>
          </section>,
          document.body,
        )}
    </div>
  );
}
