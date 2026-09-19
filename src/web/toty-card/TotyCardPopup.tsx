import { useEffect, useRef, useState } from "react";
import { Download, ImageDown, MousePointer2, X } from "lucide-react";
import type { StreamerRecord } from "../../shared/model.js";
import { useEscape } from "../Modal.js";
import { playSfx, stopSfx } from "../sfxAudio.js";
import { TotyCardSfxControl } from "./TotyCardSfxControl.js";
import { TotyCardReveal } from "./TotyCardReveal.js";
import { TotyCardVariantSelect } from "./TotyCardVariantSelect.js";
import { TotyCardStreamerSelect } from "./TotyCardStreamerSelect.js";
import { TotyCardDownloadMenu } from "./TotyCardDownloadMenu.js";
import { exportTotyCardPng } from "./exportTotyCardImage.js";
import {
  applyLowQualityPitchFilter,
  applyRetroClickSfxFilter,
  applyRetroSfxFilter,
  playCrayonScratch,
  playRetroBlip,
} from "./totyCardEasterEggSfx.js";
import {
  getAvailableTotyCardVariants,
  getBackgroundGlowUrl,
  getCardBackUrl,
  getCharacterHoverUrl,
  getHarugomemTotyCardPreviewUrl,
  getLowQualityTotyCardPreviewUrl,
  getPopupBackdropGlowUrl,
  getPopupBackdropUrl,
  getRetroTotyCardPreviewUrl,
  getTotyCardAssetsForVariant,
  getTotyCardPreviewBaseUrl,
  getTotyCardPreviewUrl,
  hasTotyCard,
  type TotyCardAssets,
  type TotyCardVariant,
} from "./totyCardAssets.js";
import { rollTotyCardVariant } from "./totyCardVariantRoll.js";
import { markTotyCardRevealed } from "./totyCardRevealedStore.js";
import { WOOWAKGOOD_BONUS_STREAMER, WOOWAKGOOD_ID } from "./woowakgoodBonusCard.js";
import "./toty-card.css";

const VARIANT_LABELS: Record<TotyCardVariant, string> = {
  normal: "기본",
  lowq: "조카의 스케치북",
  retro: "90년대 고전 도트",
  harugomem: "하루고멤",
};

// Dispatches to whichever easter-egg sfx filter (see totyCardEasterEggSfx.ts)
// matches the currently-showing variant — a no-op for "normal". Used by
// every local sfx helper below plus the streamer's own click sfx.
function applyVariantSfxFilter(audio: HTMLAudioElement, variant: TotyCardVariant): void {
  if (variant === "retro") applyRetroSfxFilter(audio);
  else if (variant === "lowq") applyLowQualityPitchFilter(audio);
}

// Same dispatch as applyVariantSfxFilter above, but used ONLY for the card's
// own click sfx (handleCardClick below) — "90년대 고전 도트" gets the
// noticeably gentler applyRetroClickSfxFilter there instead of the harsher
// applyRetroSfxFilter every other retro sfx moment (reveal impact/whoosh,
// popup-open sting) still uses unchanged.
function applyClickSfxFilter(audio: HTMLAudioElement, variant: TotyCardVariant): void {
  if (variant === "retro") applyRetroClickSfxFilter(audio);
  else if (variant === "lowq") applyLowQualityPitchFilter(audio);
}

// Plays independently of the shared single-slot sfxAudio.ts player (same
// reasoning as passAnnouncementSfx.ts) so the reveal stinger below never
// gets cut off by a later click on the card playing the streamer's own sfx.
const REVEAL_SFX_URL = "/sfxes/toty-reveal.mp3";
function playRevealSfx(volume: number, variant: TotyCardVariant): HTMLAudioElement {
  const audio = new Audio(REVEAL_SFX_URL);
  audio.volume = volume;
  applyVariantSfxFilter(audio, variant);
  audio.play().catch(() => {
    // ignore autoplay/decoding failures, and a not-yet-provided file's 404
  });
  return audio;
}

// Shared across every player (unlike the per-player popup-open sfx below) —
// a generic "whoosh" that plays the instant the viewer clicks "클릭해서 카드
// 공개", right as the light-tunnel effect starts, distinct from the impact
// stinger that lands later at the flip's midpoint.
const REVEAL_WHOOSH_SFX_URL = "/sfxes/toty-reveal-whoosh.mp3";
function playRevealWhooshSfx(volume: number, variant: TotyCardVariant): HTMLAudioElement {
  const audio = new Audio(REVEAL_WHOOSH_SFX_URL);
  audio.volume = volume;
  applyVariantSfxFilter(audio, variant);
  audio.play().catch(() => {
    // ignore autoplay/decoding failures, and a not-yet-provided file's 404
  });
  return audio;
}

// Per-player ambient sting (thunder for 빙밍, a water bloop for 해파린, a
// dragon roar for 하치, etc.) that plays the moment the popup opens — before
// the viewer has even clicked to reveal the card. Lives in public/sfxes/
// (not src/web/assets/toty-cards/, so it isn't glob-scanned by
// totyCardAssets.ts) — a missing file just 404s and playRevealSfx-style
// silently no-ops, same as the shared reveal stinger above, so a player
// without one yet simply gets no sound instead of a fallback. Same file
// regardless of variant — see handleCardClick below for the "하루고멤"
// variant's own dedicated click sfx.
function playPopupOpenSfx(streamerId: string, volume: number, variant: TotyCardVariant): HTMLAudioElement {
  const audio = new Audio(`/sfxes/${streamerId}-popup-open.mp3`);
  audio.volume = volume;
  applyVariantSfxFilter(audio, variant);
  audio.play().catch(() => {
    // ignore autoplay/decoding failures, and a not-yet-provided file's 404
  });
  return audio;
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

type TotyCardPopupStreamer = Pick<
  StreamerRecord,
  "id" | "displayName" | "hopedPosition1" | "currentDivision" | "sfx"
>;

export function TotyCardPopup({
  streamer,
  assets,
  allStreamers,
  woowakgoodUnlocked,
  sfxEnabled,
  sfxVolume,
  onToggleSfx,
  onSfxVolumeChange,
  onSelectStreamer,
  onClose,
  onView,
  initialVariant,
}: {
  streamer: TotyCardPopupStreamer;
  assets: TotyCardAssets;
  /** Every roster streamer (not just ones with a card yet) — filtered down
   * to hasTotyCard(id) below to build the top-left "다른 선수 카드 보기"
   * select's option list. Passing the full roster (rather than a
   * pre-filtered list) keeps that filtering logic in one place. */
  allStreamers: TotyCardPopupStreamer[];
  /** Gates 우왁굳's hidden bonus card out of the select's options until his
   * one-way achievement unlock (see useWoowakgoodBonusUnlock.ts) — same
   * "no button, no listing" rule his own WoowakgoodBonusButton follows. */
  woowakgoodUnlocked: boolean;
  sfxEnabled: boolean;
  sfxVolume: number;
  /** Same app-wide sfx setting (useSfxSettings.ts) every other sfx-playing
   * surface uses — this popup just exposes its own toggle/slider (see
   * .toty-card-popup__sfx-control below) so the viewer can adjust it
   * without leaving the popup, since every sound here (reveal stinger,
   * whoosh, popup-open sting, click sfx, variant-switch blip) already reads
   * sfxEnabled/sfxVolume from these same props. */
  onToggleSfx: () => void;
  onSfxVolumeChange: (value: number) => void;
  /** Switches the popup to a different player's card without closing it —
   * the caller (App.tsx) is expected to key this component on
   * streamer.id so swapping streamers cleanly remounts it (fresh variant
   * roll, reveal-from-mystery-back sequence, etc.) rather than trying to
   * live-swap a pack-opening sequence already mid-flight. */
  onSelectStreamer: (streamer: TotyCardPopupStreamer) => void;
  onClose: () => void;
  /** Reports which card is showing in which theme: once the card is revealed and again whenever the viewer
   * switches theme (the world card missions listen to this; the dashboard does not need it). */
  onView?: (id: string, variant: TotyCardVariant) => void;
  /** Optional caller-scoped opening theme. The normal dashboard cycle remains the default. */
  initialVariant?: TotyCardVariant;
}) {
  useEscape(onClose);
  useBodyScrollLock();

  // Every streamer with a full card art set, plus the hidden 우왁굳 bonus
  // once unlocked — powers the top-left streamer select below. Recomputed
  // on every render rather than memoized: hasTotyCard/allStreamers are both
  // cheap (a Set lookup and a short array), and this only actually runs
  // while the select is open.
  const cardStreamers: TotyCardPopupStreamer[] = allStreamers.filter((s) => hasTotyCard(s.id));
  if (woowakgoodUnlocked && hasTotyCard(WOOWAKGOOD_ID) && !cardStreamers.some((s) => s.id === WOOWAKGOOD_ID)) {
    cardStreamers.push(WOOWAKGOOD_BONUS_STREAMER);
  }

  // Easter eggs: shows a crayon-on-sketchbook, 16-bit-arcade-sprite, or
  // 하루고멤 collab version of the card instead of the real one (see
  // docs/toty-card-prompts.md) — only possible once that streamer's
  // <id>-lowq-*/<id>-retro-*/<id>-harugomem-* trio has actually been added,
  // so this stays "normal" for everyone else. Per streamer (see totyCardVariantRoll.ts):
  // the first-ever open is a random pick among whichever variants exist,
  // every open after that steps to the next one in a fixed cycle. Rolled
  // once per popup open via a ref guarded against React StrictMode's
  // dev-only double-invocation of the component body — rollTotyCardVariant
  // both reads and writes localStorage, so calling it twice in a row here
  // would silently skip an extra step in the cycle.
  const availableVariants = getAvailableTotyCardVariants(streamer.id);
  const rolledVariantRef = useRef<TotyCardVariant | null>(null);
  if (rolledVariantRef.current === null) {
    rolledVariantRef.current = initialVariant ?? rollTotyCardVariant(streamer.id, availableVariants);
  }
  // The viewer can override the rolled variant by hand via the select shown
  // above a revealed card (below) — purely a local override for this popup
  // instance, doesn't touch the roll/cycle state so the next open still
  // continues the sequence from where the roll (not this override) left off.
  const [variant, setVariant] = useState<TotyCardVariant>(rolledVariantRef.current);
  const cardAssets = getTotyCardAssetsForVariant(streamer.id, variant) ?? assets;

  // playRevealSfx/playPopupOpenSfx each spin up their own independent Audio
  // element (see their comments above), so nothing normally holds onto them
  // — track the ones this popup has started here so they can all be cut off
  // together if the popup closes while one is still playing.
  const localSfxRef = useRef<HTMLAudioElement[]>([]);
  useEffect(() => {
    return () => {
      for (const audio of localSfxRef.current) audio.pause();
      // Also cuts off the streamer's own click sfx below, which plays via
      // the shared sfxAudio.ts singleton rather than a locally-tracked Audio.
      stopSfx();
    };
  }, []);

  // Plays once, immediately, over the face-down "클릭해서 카드 공개" screen —
  // separate from (and in addition to) the reveal-impact stinger and the
  // streamer's own click sfx below, both of which stay exactly as they were.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- fires once on mount, not on every sfx setting change
  useEffect(() => {
    if (sfxEnabled) localSfxRef.current.push(playPopupOpenSfx(streamer.id, sfxVolume / 100, variant));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fires once on mount; `variant` here is intentionally its just-rolled initial value, not a live dependency
  }, []);

  // Fired by TotyCardReveal the instant the viewer clicks "클릭해서 카드 공개".
  const handleRevealStart = () => {
    if (sfxEnabled) localSfxRef.current.push(playRevealWhooshSfx(sfxVolume / 100, variant));
  };

  // Fired by TotyCardReveal at the reveal's impact moment (or immediately,
  // under prefers-reduced-motion) rather than as soon as the popup mounts,
  // so the stinger lands together with the flip/burst instead of ahead of it.
  // Also punches the popup backdrop image/glow (below) — unlike the card's
  // own background/glow layers, these sit outside the 3D flip entirely and
  // are always fully visible, so (unlike the card ones) this moment reads
  // fine for them without waiting for the flip to finish.
  const [backdropShake, setBackdropShake] = useState(false);
  const handleRevealImpact = () => {
    if (sfxEnabled) localSfxRef.current.push(playRevealSfx(sfxVolume / 100, variant));
    setBackdropShake(true);
  };

  // On the "하루고멤" variant specifically, swaps to that player's own
  // `<id>-harugomem.mp3` (the matched 하루고멤 member's own click sfx)
  // instead of the real card's streamer.sfx — same "missing file just
  // 404s/no-ops" fallback as playPopupOpenSfx/playRevealSfx above, for any
  // player not matched with a member yet.
  const handleCardClick = () => {
    if (!sfxEnabled) return;
    const clickSfxUrl = variant === "harugomem" ? `/sfxes/${streamer.id}-harugomem.mp3` : streamer.sfx;
    if (clickSfxUrl) {
      playSfx(clickSfxUrl, sfxVolume / 100, (audio) => applyClickSfxFilter(audio, variant));
    }
  };

  // Plays a short synthesized sfx (see totyCardEasterEggSfx.ts) only when
  // switching TO an easter-egg variant specifically — an arcade blip for
  // "90년대 고전 도트", a crayon scratch for "조카의 스케치북" — switching to
  // "기본" (or between the other options) stays silent.
  const handleVariantChange = (next: TotyCardVariant) => {
    setVariant(next);
    onView?.(streamer.id, next);
    if (!sfxEnabled) return;
    if (next === "retro") playRetroBlip(sfxVolume / 100);
    else if (next === "lowq") playCrayonScratch(sfxVolume / 100);
  };

  // The mouse-tilt hint doesn't make sense over a face-down mystery card, so
  // it only appears once TotyCardReveal's flip sequence has actually finished.
  const [revealed, setRevealed] = useState(false);

  const [exportingPng, setExportingPng] = useState(false);
  const handlePngExport = async (characterOverrideUrl?: string) => {
    if (exportingPng) return;
    setExportingPng(true);
    try {
      await exportTotyCardPng(streamer, cardAssets, characterOverrideUrl, variant);
    } finally {
      setExportingPng(false);
    }
  };

  const backdropUrl = getPopupBackdropUrl(streamer.id);
  const backdropGlowUrl = getPopupBackdropGlowUrl(streamer.id);
  // All undefined under the lowq/retro easter eggs — those variants are
  // explicitly just the three frame/background/character images, no hover
  // swap and no glow overlay (see docs/toty-card-prompts.md).
  const characterHoverUrl = variant === "normal" ? getCharacterHoverUrl(streamer.id) : undefined;
  // Pre-rendered offline (scripts/generate-toty-preview.mjs) rather than
  // encoded live in the browser — see the script's header comment for why.
  // previewUrl bakes in characterHoverUrl's swap for the whole loop (the
  // capture script's synthetic mouse never leaves the card), so it reads as
  // the "호버 이미지" option once one exists; previewBaseUrl is the older
  // pre-hover capture, offered alongside it as "기본 이미지". Under the
  // lowq/retro easter eggs, previewBaseUrl stays hidden (neither variant has
  // a separate pre-hover capture) and previewUrl swaps to that variant's own
  // gif (--lowq/--retro flag on the same script) instead of the real card's
  // — still hidden if that hasn't been generated for this player yet,
  // rather than falling back to a mismatched download of the real card.
  const previewBaseUrl = variant === "normal" ? getTotyCardPreviewBaseUrl(streamer.id) : undefined;
  const previewUrl =
    variant === "lowq"
      ? getLowQualityTotyCardPreviewUrl(streamer.id)
      : variant === "retro"
        ? getRetroTotyCardPreviewUrl(streamer.id)
        : variant === "harugomem"
          ? getHarugomemTotyCardPreviewUrl(streamer.id)
          : getTotyCardPreviewUrl(streamer.id);

  return (
    <div
      className="toty-card-popup"
      role="dialog"
      aria-modal="true"
      aria-label={`${streamer.displayName} 3D 카드`}
    >
      {/* Own wrapper (rather than .toty-card-popup's own `background`) so the
          impact shake below can move just the backdrop image + glow — not
          the close button or card stage sitting on top of them. The shake
          lands on this wrapper rather than on the image/glow divs
          themselves specifically so it doesn't fight backdrop-glow's own
          continuous drift animation (two `animation` values on one element
          would replace each other, not combine). */}
      <div
        className={`toty-card-popup__backdrop-wrap ${backdropShake ? "toty-card-popup__backdrop-wrap--shake" : ""}`}
      >
        {backdropUrl && (
          <div
            className="toty-card-popup__backdrop"
            aria-hidden="true"
            style={{ backgroundImage: `url(${backdropUrl})` }}
          />
        )}
        {backdropGlowUrl && (
          <div
            className="toty-card-popup__backdrop-glow"
            aria-hidden="true"
            style={{ backgroundImage: `url(${backdropGlowUrl})` }}
          />
        )}
      </div>
      <div className="toty-card-popup__scrim" aria-hidden="true" />
      {cardStreamers.length > 1 && (
        <div className="toty-card-popup__streamer-select">
          <TotyCardStreamerSelect
            value={streamer.id}
            onChange={(id) => {
              const next = cardStreamers.find((s) => s.id === id);
              if (next) onSelectStreamer(next);
            }}
            options={cardStreamers.map((s) => ({ value: s.id, label: s.displayName }))}
          />
        </div>
      )}
      <TotyCardSfxControl
        enabled={sfxEnabled}
        volume={sfxVolume}
        onToggle={onToggleSfx}
        onVolumeChange={onSfxVolumeChange}
      />
      <button
        type="button"
        className="toty-card-popup__close"
        onClick={onClose}
        aria-label="3D 카드 닫기"
      >
        <X aria-hidden="true" />
      </button>

      <div className="toty-card-popup__stage">
        {/* Only worth showing once there's actually something to switch
            between, and only once the card is done revealing (same
            reserved-space-via-visibility trick as the hint/actions below,
            so the stage's flex column doesn't grow and recenter the card
            once this appears). */}
        {availableVariants.length > 1 && (
          <div
            className="toty-card-popup__variant-select"
            style={{ visibility: revealed ? "visible" : "hidden" }}
          >
            <TotyCardVariantSelect
              value={variant}
              onChange={handleVariantChange}
              options={availableVariants.map((v) => ({ value: v, label: VARIANT_LABELS[v] }))}
            />
          </div>
        )}
        <TotyCardReveal
          streamer={streamer}
          assets={cardAssets}
          cardBackUrl={getCardBackUrl(streamer.id)}
          backgroundGlowUrl={variant === "normal" ? getBackgroundGlowUrl(streamer.id) : undefined}
          characterHoverUrl={characterHoverUrl}
          variant={variant}
          onCardClick={handleCardClick}
          onRevealStart={handleRevealStart}
          onImpact={handleRevealImpact}
          onRevealed={() => {
            setRevealed(true);
            markTotyCardRevealed(streamer.id);
            onView?.(streamer.id, variant);
          }}
        />

        {/* Always mounted (rather than conditionally rendered) so this
            reserves its layout space from the start — otherwise the stage's
            flex column grows once these appear post-reveal, and centering
            that taller column shifts the card upward out of its original spot. */}
        <p className="toty-card-popup__hint" style={{ visibility: revealed ? "visible" : "hidden" }}>
          
          카드에 <MousePointer2 aria-hidden="true" />마우스 커서를 올려 움직여 보세요
        </p>

        <div
          className="toty-card-popup__actions"
          style={{ visibility: revealed ? "visible" : "hidden" }}
        >
          <TotyCardDownloadMenu
            className="toty-card-popup__download"
            icon={<ImageDown aria-hidden="true" />}
            label={exportingPng ? "저장 중..." : "이미지로 저장"}
            disabled={exportingPng}
            options={
              characterHoverUrl
                ? [
                    { key: "base", label: "기본 이미지", onSelect: () => handlePngExport() },
                    { key: "hover", label: "호버 이미지", onSelect: () => handlePngExport(characterHoverUrl) },
                  ]
                : [{ key: "base", label: "기본 이미지", onSelect: () => handlePngExport() }]
            }
          />

          <TotyCardDownloadMenu
            className="toty-card-popup__download"
            icon={<Download aria-hidden="true" />}
            label="움짤로 저장"
            options={[
              ...(previewBaseUrl
                ? [{ key: "base", label: "기본 이미지", href: previewBaseUrl, download: `${streamer.displayName}-3d-card-base.gif` }]
                : []),
              ...(previewUrl
                ? [{ key: "hover", label: "호버 이미지", href: previewUrl, download: `${streamer.displayName}-3d-card-hover.gif` }]
                : []),
            ]}
          />
        </div>
      </div>
    </div>
  );
}
