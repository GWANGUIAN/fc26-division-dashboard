import { useEffect, useMemo, useRef, useState } from "react";
import { ImageDown, X } from "lucide-react";
import type { StreamerRecord } from "../../shared/model.js";
import "../photo-booth/photo-booth.css";
import "./group-photo.css";
import { playSfx } from "../sfxAudio";
import { PhotoBoothStreamerPicker } from "../photo-booth/PhotoBoothStreamerPicker";
import { WOOWAKGOOD_BONUS_STREAMER } from "../toty-card/woowakgoodBonusCard.js";
import { GROUP_PHOTO_ROSTER } from "./groupPhotoRoster";
import { GroupPhotoCharacter } from "./GroupPhotoCharacter";
import { GroupPhotoProp } from "./GroupPhotoProp";
import { GroupPhotoBall } from "./GroupPhotoBall";
import { GroupPhotoConfetti } from "./GroupPhotoConfetti";
import { GROUP_PHOTO_PROPS } from "./groupPhotoProps";
import { getGroupPhotoBackgroundUrl } from "./groupPhotoAssets";
import { exportGroupPhotoPng } from "./exportGroupPhotoImage.js";
import { LedSignboard } from "./LedSignboard";
import { loadGroupPhotoState, saveGroupPhotoState } from "./storage";

// PhotoBoothOverlay.tsx와 같은 함성 효과음 — 처음 열렸을 때 + 선수 바꿀 때.
const CHEER_SFX_URL = "/sfxes/cheer.mp3";

// 공 차기 이스터에그(docs/group-photo-props.md "동작 스펙") 효과음 — 전부
// 기존 public/sfxes/ 재사용. playSfx는 단일 채널이라 킥음 → 골음처럼
// 순차 재생이어야 서로 안 끊긴다.
const KICK_SFX_URL = "/sfxes/ball-bounce.mp3";
const GOAL_SFX_URL = "/sfxes/goal.mp3";
const HAT_TRICK_SFX_URL = CHEER_SFX_URL;
const GOAL_MESSAGE = "GOAL!! 골~~~인!";
const HAT_TRICK_MESSAGE = "HAT-TRICK!!";
const GOAL_MESSAGE_MS = 3000;
const CONFETTI_MS = 2800;

const PROP_LABELS: Record<string, string> = {
  "corner-flag": "코너 플래그 흔들기",
  cones: "훈련 콘 건드리기",
};

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
  sfxEnabled,
  sfxVolume,
  onClose,
}: {
  passedStreamers: StreamerRecord[];
  sfxEnabled: boolean;
  sfxVolume: number;
  onClose: () => void;
}) {
  useEscape(onClose);
  useBodyScrollLock();

  // eslint-disable-next-line react-hooks/exhaustive-deps -- fires once when the overlay opens, not on every sfx setting change
  useEffect(() => {
    if (sfxEnabled) playSfx(CHEER_SFX_URL, sfxVolume / 100);
  }, []);

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
    if (sfxEnabled) playSfx(CHEER_SFX_URL, sfxVolume / 100);
  }

  // 공 차기: 골이 들어가면 전광판 문구를 잠시 골 문구로 바꾸고 색종이를
  // 터뜨린다. 저장 이미지에는 반영하지 않음(handleDownload는 아래 선택된
  // 선수 문구만 사용).
  const [goalMessage, setGoalMessage] = useState<string | null>(null);
  const [confettiId, setConfettiId] = useState<number | null>(null);
  const goalCountRef = useRef(0);
  const goalMessageTimerRef = useRef<number | undefined>(undefined);
  const confettiTimerRef = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(goalMessageTimerRef.current);
      window.clearTimeout(confettiTimerRef.current);
    },
    [],
  );

  function playPropSfx(url: string) {
    if (sfxEnabled) playSfx(url, sfxVolume / 100);
  }

  function handleGoal() {
    goalCountRef.current += 1;
    const hatTrick = goalCountRef.current % 3 === 0;
    playPropSfx(hatTrick ? HAT_TRICK_SFX_URL : GOAL_SFX_URL);

    setGoalMessage(hatTrick ? HAT_TRICK_MESSAGE : GOAL_MESSAGE);
    window.clearTimeout(goalMessageTimerRef.current);
    goalMessageTimerRef.current = window.setTimeout(() => setGoalMessage(null), GOAL_MESSAGE_MS);

    setConfettiId(goalCountRef.current);
    window.clearTimeout(confettiTimerRef.current);
    confettiTimerRef.current = window.setTimeout(() => setConfettiId(null), CONFETTI_MS);
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

  // 골 문구가 떠 있는 동안은 그것을 우선 표시 — 저장 이미지(handleDownload)는
  // 항상 선택된 선수의 문구를 쓴다.
  const cheerText =
    selectedStreamerId && selectedExists ? `${cheerNameFor(selectedStreamerId)} 화이팅~!!` : undefined;
  const ledText = goalMessage ?? cheerText;

  function handleDownload() {
    const fancy = selectedStreamerId ? isFancySelected(selectedStreamerId) : false;
    void exportGroupPhotoPng(cheerText ?? "잔디동 화이팅!!", fancy);
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
      {/* 렌더 순서 = 겹침 순서: 뒤 소품(z1) → 캐릭터(z2/3) → 앞 소품·공(z3, DOM 순서로 위).
          exportGroupPhotoImage.ts의 그리기 순서와 같아야 함. */}
      {GROUP_PHOTO_PROPS.filter((slot) => slot.layer === "behind").map((slot) => (
        <GroupPhotoProp key={slot.id} slot={slot} label={PROP_LABELS[slot.id]} />
      ))}
      {GROUP_PHOTO_ROSTER.map((slot) => (
        <GroupPhotoCharacter
          key={slot.id}
          slot={slot}
          displayName={displayNameFor(slot.id)}
          onSelect={() => handleSelect(slot.id)}
        />
      ))}
      {GROUP_PHOTO_PROPS.filter((slot) => slot.layer === "front").map((slot) => (
        <GroupPhotoProp
          key={slot.id}
          slot={slot}
          label={PROP_LABELS[slot.id]}
          onReact={slot.reaction === "tip" ? () => playPropSfx(KICK_SFX_URL) : undefined}
        />
      ))}
      <GroupPhotoBall onKick={() => playPropSfx(KICK_SFX_URL)} onGoal={handleGoal} />
      {confettiId !== null && <GroupPhotoConfetti burstId={confettiId} />}
      {ledText && (
        <div className="group-photo-cheer">
          <LedSignboard
            mode="static"
            text={ledText}
            fancy={selectedStreamerId ? isFancySelected(selectedStreamerId) : false}
          />
        </div>
      )}
    </div>
  );
}
