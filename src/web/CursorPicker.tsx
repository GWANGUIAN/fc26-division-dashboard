import { Download, MousePointer2, X } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  CURSOR_PLAYERS,
  cursorAssetUrls,
  getCursorPlayer,
  NATIVE_CURSOR_SELECTION_ID,
  type CursorSelectionId,
} from "./cursorCatalog";
import { hasDiscoveredCursorPicker, markCursorPickerDiscovered } from "./storage";

export function CursorPicker({
  playerId,
  onPlayerChange,
}: {
  playerId: CursorSelectionId;
  onPlayerChange: (id: CursorSelectionId) => void;
}) {
  const [open, setOpen] = useState(false);
  const [discovered, setDiscovered] = useState(() => hasDiscoveredCursorPicker());
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    addEventListener("mousedown", outside);
    addEventListener("keydown", escape);
    return () => {
      removeEventListener("mousedown", outside);
      removeEventListener("keydown", escape);
    };
  }, [open]);

  const togglePicker = () => {
    if (!discovered) {
      markCursorPickerDiscovered();
      setDiscovered(true);
    }
    setOpen((current) => !current);
  };
  const selectedPlayer = playerId === NATIVE_CURSOR_SELECTION_ID ? undefined : getCursorPlayer(playerId);
  const selectedPack = selectedPlayer ? cursorAssetUrls(selectedPlayer.id).windowsPack : undefined;

  return (
    <div className="cursor-picker" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={`theme-toggle cursor-picker__trigger ${open ? "cursor-picker__trigger--open" : ""} ${!discovered ? "cursor-picker__trigger--new" : ""}`}
        onClick={togglePicker}
        aria-label="마우스 포인터 설정"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <MousePointer2 aria-hidden="true" />
        {!discovered && <span className="cursor-picker__badge" aria-hidden="true">마우스 포인터 변경하기</span>}
      </button>
      {open && (
        <section className="cursor-picker__panel" role="dialog" aria-label="마우스 포인터 선택">
          <div className="cursor-picker__heading">
            <div><strong>마우스 포인터</strong><span>선수를 선택하세요</span></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="포인터 설정 닫기"><X aria-hidden="true" /></button>
          </div>
          <div className="cursor-picker__grid" aria-label="선수 포인터">
            <button
              type="button"
              className={`cursor-picker__player cursor-picker__player--default ${playerId === NATIVE_CURSOR_SELECTION_ID ? "cursor-picker__player--selected" : ""}`}
              onClick={() => onPlayerChange(NATIVE_CURSOR_SELECTION_ID)}
              aria-pressed={playerId === NATIVE_CURSOR_SELECTION_ID}
            >
              <span className="cursor-picker__native-preview" aria-hidden="true"><MousePointer2 /></span>
              <span className="cursor-picker__name">기본 <small>(변경 없음)</small></span>
            </button>
            {CURSOR_PLAYERS.map((player) => {
              const selected = player.id === playerId;
              const preview = cursorAssetUrls(player.id).preview;
              const glyph = cursorAssetUrls(player.id).glyph.default;
              return (
                <button
                  key={player.id}
                  type="button"
                  className={`cursor-picker__player ${selected ? "cursor-picker__player--selected" : ""}`}
                  onClick={() => onPlayerChange(player.id)}
                  aria-pressed={selected}
                  style={{ "--cursor-accent": player.accent } as CSSProperties}
                >
                  <span className="cursor-picker__preview" aria-hidden="true">
                    {glyph ? <img className="cursor-picker__preview-glyph" src={glyph} alt="" /> : <i className="cursor-picker__preview-glyph-fallback" />}
                    {preview ? <img className="cursor-picker__preview-character" src={preview} alt="" /> : <i className="cursor-picker__preview-character-fallback" />}
                  </span>
                  <span className="cursor-picker__name">{player.name}</span>
                </button>
              );
            })}
          </div>
          {selectedPlayer && selectedPack && (
            <a className="cursor-picker__download" href={selectedPack} download={`fc26-${selectedPlayer.id}-windows-cursor-pack.zip`}>
              <Download aria-hidden="true" /> {selectedPlayer.name} Windows 커서 팩 다운로드
            </a>
          )}
        </section>
      )}
    </div>
  );
}
