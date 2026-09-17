import { useEffect, useMemo, useState } from "react";
import { ImageDown, X } from "lucide-react";
import type { StreamerRecord } from "../../shared/model.js";
import "../photo-booth/photo-booth.css";
import "./group-photo.css";
import { PhotoBoothStreamerPicker } from "../photo-booth/PhotoBoothStreamerPicker";
import { WOOWAKGOOD_BONUS_STREAMER } from "../toty-card/woowakgoodBonusCard.js";
import { GROUP_PHOTO_ROSTER } from "./groupPhotoRoster";
import { GroupPhotoCharacter } from "./GroupPhotoCharacter";
import { getGroupPhotoBackgroundUrl } from "./groupPhotoAssets";
import { exportGroupPhotoPng } from "./exportGroupPhotoImage.js";
import { LedSignboard } from "./LedSignboard";
import { loadGroupPhotoState, saveGroupPhotoState } from "./storage";

function useEscape(onClose: () => void) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    addEventListener("keydown", close);
    return () => removeEventListener("keydown", close);
  }, [onClose]);
}

/** Locks the page behind the overlay from scrolling while it's open. */
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

// 우왁굳(감독, 로스터에 없는 하드코딩 게스트)이 화이팅 문구에서만 실명으로
// 불림 — 캐릭터 alt 텍스트/스트리머 피커 라벨은 그대로 "우왁굳".
const WOOWAKGOOD_CHEER_NAME = "오영택";

export function GroupPhotoOverlay({
  passedStreamers,
  onClose,
}: {
  passedStreamers: StreamerRecord[];
  onClose: () => void;
}) {
  useEscape(onClose);
  useBodyScrollLock();

  // 선수 선택 드롭다운/캐릭터 클릭 모두에서 고를 수 있는 전체 목록 — 최종
  // 합격자 + 감독 우왁굳. WOOWAKGOOD_BONUS_STREAMER엔 profileImageUrl이 없어서
  // (toty-card 보너스 버튼 쪽에선 필요 없는 필드) 이 피커 전용으로만 덧붙임.
  const pickerStreamers = useMemo(
    () => [
      ...passedStreamers,
      { ...WOOWAKGOOD_BONUS_STREAMER, profileImageUrl: "/profiles/profile_wakgood.webp" },
    ],
    [passedStreamers],
  );

  const [selectedStreamerId, setSelectedStreamerId] = useState<string | undefined>(
    () => loadGroupPhotoState().selectedStreamerId,
  );

  // A remembered streamer who no longer has a passed-second-round entry
  // (roster changed since last visit) falls back to the first available one
  // — same dangling-id cleanup PhotoBoothOverlay does for its list.
  useEffect(() => {
    if (passedStreamers.length === 0) return;
    if (
      selectedStreamerId &&
      pickerStreamers.some((streamer) => streamer.id === selectedStreamerId)
    ) {
      return;
    }
    setSelectedStreamerId(passedStreamers[0].id);
  }, [passedStreamers, pickerStreamers, selectedStreamerId]);

  function handleSelect(id: string) {
    setSelectedStreamerId(id);
    saveGroupPhotoState({ schemaVersion: 1, selectedStreamerId: id });
  }

  const selectedExists = pickerStreamers.some((streamer) => streamer.id === selectedStreamerId);
  const backgroundUrl = getGroupPhotoBackgroundUrl();

  // 단체샷 구경 기능 안에서는(헤더의 움직이는 티커와 달리) 닉네임을 우선
  // 사용 — celebrationMessageFor(useLatestActivity.ts)가 축하 배너에서 쓰는
  // 것과 같은 규칙.
  function displayNameFor(id: string): string {
    if (id === WOOWAKGOOD_BONUS_STREAMER.id) return WOOWAKGOOD_BONUS_STREAMER.displayName;
    const streamer = passedStreamers.find((item) => item.id === id);
    return streamer ? streamer.nickname?.trim() || streamer.displayName : id;
  }

  function cheerNameFor(id: string): string {
    if (id === WOOWAKGOOD_BONUS_STREAMER.id) return WOOWAKGOOD_CHEER_NAME;
    return displayNameFor(id);
  }

  // 하치처럼 isFancy인 선수를 골랐을 때만 전광판을 화려하게 — 우왁굳은 로스터
  // 밖 하드코딩 게스트라 항상 false.
  function isFancySelected(id: string): boolean {
    return passedStreamers.find((item) => item.id === id)?.isFancy ?? false;
  }

  function handleDownload() {
    const cheerText =
      selectedStreamerId && selectedExists
        ? `${cheerNameFor(selectedStreamerId)} 화이팅~!!`
        : "잔디동 화이팅!!";
    const fancy = selectedStreamerId ? isFancySelected(selectedStreamerId) : false;
    void exportGroupPhotoPng(cheerText, fancy);
  }

  return (
    <div
      className="group-photo-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="잔디동 단체샷"
      style={
        backgroundUrl
          ? ({ "--group-photo-bg-image": `url(${backgroundUrl})` } as React.CSSProperties)
          : undefined
      }
    >
      <div className="photo-booth-topbar-right">
        <button
          type="button"
          className="group-photo-download-btn"
          onClick={handleDownload}
          disabled={!backgroundUrl}
        >
          <ImageDown aria-hidden="true" />
          이미지로 저장
        </button>
        <button
          type="button"
          className="photo-booth-overlay__close"
          onClick={onClose}
          aria-label="단체샷 닫기"
        >
          <X aria-hidden="true" />
        </button>
      </div>
      <div className="photo-booth-topbar-left">
        <PhotoBoothStreamerPicker
          streamers={pickerStreamers}
          selectedId={selectedStreamerId}
          onSelect={handleSelect}
        />
      </div>
      {GROUP_PHOTO_ROSTER.map((slot) => (
        <GroupPhotoCharacter
          key={slot.id}
          slot={slot}
          displayName={displayNameFor(slot.id)}
          onSelect={() => handleSelect(slot.id)}
        />
      ))}
      {selectedStreamerId && selectedExists && (
        <div className="group-photo-cheer">
          <LedSignboard
            mode="static"
            text={`${cheerNameFor(selectedStreamerId)} 화이팅~!!`}
            fancy={isFancySelected(selectedStreamerId)}
          />
        </div>
      )}
    </div>
  );
}
