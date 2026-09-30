import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { ChevronLeft, ChevronRight, Download, X, ZoomIn, ZoomOut } from "lucide-react";
import type { StreamerRecord } from "../../shared/model.js";
import "./wallpaper-overlay.css";
import { WOOWAKGOOD_BONUS_STREAMER } from "../toty-card/woowakgoodBonusCard.js";
import { WALLPAPERS, wallpaperFullUrl, wallpaperThumbUrl } from "./wallpaperData";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.5;

function useEscape(onClose: () => void) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    addEventListener("keydown", close);
    return () => removeEventListener("keydown", close);
  }, [onClose]);
}

/** Same pattern as GroupPhotoOverlay/CoverLoopPlaylistOverlay: locks the page behind the popup from scrolling. */
function useBodyScrollLock() {
  useEffect(() => {
    const html = document.documentElement;
    const { body } = document;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const scrollY = window.scrollY;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      window.scrollTo(0, scrollY);
    };
  }, []);
}

/** Same pattern as CoverLoopPlaylistOverlay: focuses the dialog on open, restores focus (the WallpaperToggle button) on close. */
function useFocusReturn(rootRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    rootRef.current?.focus({ preventScroll: true });
    return () => previous?.focus({ preventScroll: true });
  }, [rootRef]);
}

/** 사이드바 썸네일 — lazy 로드가 끝날 때까지 쉬머 스켈레톤을 깔아둔다. */
function WallpaperThumb({ file }: { file: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <span className={`wallpaper-overlay__thumb-wrap${loaded ? "" : " wallpaper-skeleton"}`}>
      <img
        src={wallpaperThumbUrl(file)}
        alt=""
        loading="lazy"
        className={`wallpaper-overlay__thumb${loaded ? " wallpaper-overlay__thumb--loaded" : ""}`}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </span>
  );
}

export function WallpaperOverlay({
  passedStreamers,
  onClose,
}: {
  passedStreamers: StreamerRecord[];
  onClose: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  useEscape(onClose);
  useBodyScrollLock();
  useFocusReturn(rootRef);

  // 멤버 필터 칩 목록 — 최종 합격자 + 로스터 밖 감독 우왁굳(group-photo/toty-card와
  // 동일한 하드코딩 게스트 컨벤션).
  const memberOptions = useMemo(
    () => [...passedStreamers, WOOWAKGOOD_BONUS_STREAMER].map((s) => ({ id: s.id, label: s.displayName })),
    [passedStreamers],
  );

  const [filterMemberId, setFilterMemberId] = useState<string | null>(null);
  const filtered = useMemo(
    () => (filterMemberId ? WALLPAPERS.filter((w) => w.members.includes(filterMemberId)) : WALLPAPERS),
    [filterMemberId],
  );

  const [selectedId, setSelectedId] = useState<string>(WALLPAPERS[0].id);
  // 필터가 바뀌어서 현재 선택된 이미지가 목록에서 사라지면 목록 첫 장으로 이동.
  useEffect(() => {
    if (filtered.length > 0 && !filtered.some((w) => w.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selectedIndex = Math.max(
    0,
    filtered.findIndex((w) => w.id === selectedId),
  );
  const selected = filtered[selectedIndex];

  // 원본(full) 이미지 로드 완료 여부 — 선택이 바뀌면 자연히 로딩 상태가 되도록 id로 추적.
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const isImageLoading = !!selected && loadedId !== selected.id;

  const [zoom, setZoom] = useState(MIN_ZOOM);
  useEffect(() => setZoom(MIN_ZOOM), [selectedId]);

  function goTo(delta: number) {
    if (filtered.length === 0) return;
    const next = (selectedIndex + delta + filtered.length) % filtered.length;
    setSelectedId(filtered[next].id);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowDown" || event.key === "ArrowRight") goTo(1);
      else if (event.key === "ArrowUp" || event.key === "ArrowLeft") goTo(-1);
    }
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- goTo closes over filtered/selectedIndex, both listed
  }, [filtered, selectedIndex]);

  const activeItemRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  // 확대 상태에서 드래그로 화면 이동 — frame의 overflow:auto 스크롤 위치를 포인터
  // 이동량만큼 직접 옮긴다(transform이 아니라 실제 스크롤이라 브라우저 네이티브
  // 스크롤바/관성과도 자연스럽게 맞물림).
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; scrollLeft: number; scrollTop: number } | null>(
    null,
  );
  const [isPanning, setIsPanning] = useState(false);

  function handleFramePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (zoom <= MIN_ZOOM) return;
    const frame = frameRef.current;
    if (!frame) return;
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      scrollLeft: frame.scrollLeft,
      scrollTop: frame.scrollTop,
    };
    frame.setPointerCapture(event.pointerId);
    setIsPanning(true);
  }

  function handleFramePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const frame = frameRef.current;
    const drag = dragRef.current;
    if (!frame || !drag || drag.pointerId !== event.pointerId) return;
    frame.scrollLeft = drag.scrollLeft - (event.clientX - drag.x);
    frame.scrollTop = drag.scrollTop - (event.clientY - drag.y);
  }

  function endPan(event: React.PointerEvent<HTMLDivElement>) {
    const frame = frameRef.current;
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
    if (frame?.hasPointerCapture(event.pointerId)) frame.releasePointerCapture(event.pointerId);
    setIsPanning(false);
  }

  function handleFilterClick(id: string) {
    setFilterMemberId((current) => (current === id ? null : id));
  }

  return (
    <div
      ref={rootRef}
      className="wallpaper-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="잔디동 월페이퍼"
      tabIndex={-1}
    >
      <button type="button" className="wallpaper-overlay__close" onClick={onClose} aria-label="잔디동 월페이퍼 닫기">
        <X aria-hidden="true" />
      </button>

      <aside className="wallpaper-overlay__sidebar">
        <div className="wallpaper-overlay__filters" role="group" aria-label="멤버 필터">
          <button
            type="button"
            className={`wallpaper-filter-chip${filterMemberId === null ? " wallpaper-filter-chip--active" : ""}`}
            onClick={() => setFilterMemberId(null)}
          >
            전체
          </button>
          {memberOptions.map((member) => (
            <button
              key={member.id}
              type="button"
              className={`wallpaper-filter-chip${filterMemberId === member.id ? " wallpaper-filter-chip--active" : ""}`}
              onClick={() => handleFilterClick(member.id)}
            >
              {member.label}
            </button>
          ))}
        </div>

        <ul className="wallpaper-overlay__list" role="listbox" aria-label="월페이퍼 목록">
          {filtered.map((wallpaper) => {
            const active = wallpaper.id === selectedId;
            return (
              <li key={wallpaper.id} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  ref={active ? activeItemRef : undefined}
                  className={`wallpaper-overlay__list-item${active ? " wallpaper-overlay__list-item--active" : ""}`}
                  onClick={() => setSelectedId(wallpaper.id)}
                >
                  <WallpaperThumb file={wallpaper.file} />
                  <span className="wallpaper-overlay__list-title">{wallpaper.title}</span>
                </button>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="wallpaper-overlay__empty">해당 멤버가 나온 이미지가 없어요</li>
          )}
        </ul>
      </aside>

      <div className="wallpaper-overlay__main">
        <div className="wallpaper-overlay__topbar">
          <span className="wallpaper-overlay__title">{selected?.title ?? ""}</span>
          <span className="wallpaper-overlay__counter">
            {filtered.length > 0 ? selectedIndex + 1 : 0}/{filtered.length}
          </span>
        </div>

        {/* nav 버튼은 frame(스크롤되는 확대/이동 영역) 밖, stage(스크롤 안 되는 고정
            영역)에 둬야 확대·드래그 이동과 무관하게 항상 같은 위치에 머문다 — frame
            안에 있으면 absolute 위치가 frame의 스크롤 콘텐츠 좌표계를 따라가서 확대
            상태에서 스크롤할 때마다 버튼도 같이 밀려나 버림. */}
        <div className="wallpaper-overlay__stage">
          <div
            ref={frameRef}
            className={`wallpaper-overlay__frame${zoom > MIN_ZOOM ? " wallpaper-overlay__frame--zoomed" : ""}${
              isPanning ? " wallpaper-overlay__frame--panning" : ""
            }`}
            onPointerDown={handleFramePointerDown}
            onPointerMove={handleFramePointerMove}
            onPointerUp={endPan}
            onPointerCancel={endPan}
          >
            {selected && (
              <img
                key={selected.id}
                src={wallpaperFullUrl(selected.file)}
                alt={selected.title}
                className={`wallpaper-overlay__image${isImageLoading ? " wallpaper-overlay__image--loading" : ""}`}
                style={zoom > MIN_ZOOM ? { width: `${zoom * 100}%` } : undefined}
                draggable={false}
                onLoad={() => setLoadedId(selected.id)}
                onError={() => setLoadedId(selected.id)}
                onDoubleClick={() => setZoom((z) => (z > MIN_ZOOM ? MIN_ZOOM : 2))}
              />
            )}
          </div>
          {/* 로딩 표시는 frame(스크롤 영역) 밖 stage에 둬서 확대 상태와 무관하게 화면을 덮는다.
              사이드바에서 이미 받아둔 썸네일을 흐리게 깔아 원본이 오기 전에도 대략의 그림이 보이게 함. */}
          {isImageLoading && selected && (
            <div className="wallpaper-overlay__loader wallpaper-skeleton" role="status" aria-label="이미지 불러오는 중">
              <img src={wallpaperThumbUrl(selected.file)} alt="" className="wallpaper-overlay__loader-preview" />
              <span className="wallpaper-overlay__spinner" aria-hidden="true" />
            </div>
          )}
          {filtered.length > 1 && (
            <>
              <button
                type="button"
                className="wallpaper-overlay__nav wallpaper-overlay__nav--prev"
                onClick={() => goTo(-1)}
                aria-label="이전 이미지"
              >
                <ChevronLeft aria-hidden="true" />
              </button>
              <button
                type="button"
                className="wallpaper-overlay__nav wallpaper-overlay__nav--next"
                onClick={() => goTo(1)}
                aria-label="다음 이미지"
              >
                <ChevronRight aria-hidden="true" />
              </button>
            </>
          )}
        </div>

        <div className="wallpaper-overlay__toolbar">
          <div className="wallpaper-overlay__zoom">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)))}
              disabled={zoom <= MIN_ZOOM}
              aria-label="이미지 축소"
            >
              <ZoomOut aria-hidden="true" />
            </button>
            <span className="wallpaper-overlay__zoom-value">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)))}
              disabled={zoom >= MAX_ZOOM}
              aria-label="이미지 확대"
            >
              <ZoomIn aria-hidden="true" />
            </button>
          </div>
          {selected && (
            <a
              className="wallpaper-overlay__download"
              href={wallpaperFullUrl(selected.file)}
              download={`${selected.file}.webp`}
            >
              <Download aria-hidden="true" />
              다운로드
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
