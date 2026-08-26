import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Copy } from "lucide-react";
import type { StreamerRecord } from "../../shared/model.js";
import { divisionColor } from "../../shared/division-theme.js";
import { CtaButton } from "./CtaButton";
import { RevealCard, type RevealStep } from "./RevealCard";
import { RevealedListCard } from "./RevealedListCard";
import { SpinDurationSettings } from "./SpinDurationSettings";
import { copyRosterImageToClipboard } from "./exportSummaryImage";
import {
  playButtonHoverSfx,
  playClickSfx,
  playRevealStopSfx,
  startSpinSfx,
} from "./passAnnouncementSfx";
import { loadSpinDurationSeconds, saveSpinDurationSeconds } from "./spinDurationStorage";
import type { PassEntry } from "./types.js";

type CopyStatus = "idle" | "copying" | "success" | "success-no-photos" | "error";

export function AnnouncementScreen({
  title,
  passList,
  streamerById,
  sfxEnabled,
  sfxVolume,
  onSfxVolumeChange,
  onMarkRevealed,
  onBack,
}: {
  title: string;
  passList: PassEntry[];
  /** Already run through toPassAnnouncementStreamer (see
   * PassAnnouncementOverlay) — fancy decoration stripped, photo forced to
   * the SOOP-id default. */
  streamerById: Map<string, StreamerRecord>;
  sfxEnabled: boolean;
  sfxVolume: number;
  onSfxVolumeChange: (value: number) => void;
  onMarkRevealed: (streamerId: string) => void;
  onBack: () => void;
}) {
  const [step, setStep] = useState<RevealStep | null>(null);
  const [revealingId, setRevealingId] = useState<string | null>(null);
  const [spinSeconds, setSpinSeconds] = useState(() => loadSpinDurationSeconds());
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const copyStatusTimeoutRef = useRef<number | undefined>(undefined);

  function handleSpinSecondsChange(value: number) {
    setSpinSeconds(value);
    saveSpinDurationSeconds(value);
  }

  const nextEntry = useMemo(
    () => passList.find((entry) => !entry.revealed),
    [passList],
  );
  // Excludes the card currently on stage (still frozen mid-reveal, or
  // sliding out) so it isn't shown twice — it only rejoins the rail once its
  // settle animation actually finishes (see onSettleEnd below).
  const revealedStreamers = useMemo(
    () =>
      passList
        .filter((entry) => entry.revealed && entry.streamerId !== revealingId)
        .map((entry) => streamerById.get(entry.streamerId))
        .filter((streamer): streamer is StreamerRecord => !!streamer),
    [passList, streamerById, revealingId],
  );

  const isBusy = step === "entering" || step === "shadow-fade" || step === "spinning" || step === "settling";
  // A frozen card on stage is always actionable — settling it out is valid
  // whether or not another one is queued behind it (the last passer still
  // needs to make its way to the rail, it just has nothing to chain into
  // afterward — see the nextEntry check inside onSettleEnd below).
  const canSettleCurrent = step === "revealed";

  function handleReveal() {
    if (isBusy) return;
    if (canSettleCurrent) {
      playClickSfx(sfxEnabled, sfxVolume);
      // Slides the frozen card out to the rail; onSettleEnd chains into the
      // next reveal automatically if one remains, or just finishes here.
      setStep("settling");
      return;
    }
    if (!nextEntry) return;
    playClickSfx(sfxEnabled, sfxVolume);
    setRevealingId(nextEntry.streamerId);
    setStep("entering");
  }

  const revealingStreamer = revealingId ? streamerById.get(revealingId) : undefined;
  const buttonLabel = canSettleCurrent
    ? nextEntry
      ? "다음 합격자 공개"
      : "완료"
    : nextEntry
      ? "합격자 공개"
      : "모든 합격자 공개 완료";

  // Everything has been revealed and settled off stage — the roster moves
  // from the side rail to a centered final lineup with the copy-as-image
  // action, rather than staying pinned to the left forever.
  const allDone = !nextEntry && step === null && passList.length > 0;

  async function handleCopyImage() {
    if (copyStatus === "copying") return;
    window.clearTimeout(copyStatusTimeoutRef.current);
    setCopyStatus("copying");
    const result = await copyRosterImageToClipboard(revealedStreamers, title);
    setCopyStatus(
      !result.ok ? "error" : result.withPhotos ? "success" : "success-no-photos",
    );
    copyStatusTimeoutRef.current = window.setTimeout(
      () => setCopyStatus("idle"),
      3000,
    );
  }

  return (
    <div className="pass-announcement-screen">
      <button
        type="button"
        className="pass-announcement-screen__back"
        onClick={onBack}
      >
        <ArrowLeft aria-hidden="true" />
        <span>명단 수정</span>
      </button>
      {allDone ? (
        <div className="pass-announcement-summary">
          <div className="pass-announcement-summary__grid">
            {revealedStreamers.map((streamer) => (
              <RevealedListCard key={streamer.id} streamer={streamer} />
            ))}
          </div>
          <div className="pass-announcement-summary__actions">
            <button
              type="button"
              className="pass-announcement-summary__copy"
              onClick={handleCopyImage}
              disabled={copyStatus === "copying"}
            >
              <Copy aria-hidden="true" />
              {copyStatus === "copying" ? "이미지 만드는 중..." : "이미지로 복사"}
            </button>
            {(copyStatus === "success" || copyStatus === "success-no-photos") && (
              <span className="pass-announcement-summary__status pass-announcement-summary__status--ok">
                이미지로 복사했어요
                {copyStatus === "success-no-photos" && " (프로필 사진 제외)"}
              </span>
            )}
            {copyStatus === "error" && (
              <span className="pass-announcement-summary__status pass-announcement-summary__status--error">
                복사에 실패했어요
              </span>
            )}
          </div>
        </div>
      ) : (
        <>
          <aside className="pass-reveal-rail" aria-label="공개된 합격자 명단">
            {revealedStreamers.map((streamer) => (
              <RevealedListCard key={streamer.id} streamer={streamer} />
            ))}
          </aside>
          <div className="pass-announcement-stage">
            {revealingStreamer && step && (
              <RevealCard
                streamer={revealingStreamer}
                color={divisionColor(revealingStreamer.currentDivision)}
                step={step}
                spinSeconds={spinSeconds}
                onEnterEnd={() => setStep("shadow-fade")}
                onShadowFadeEnd={() => {
                  startSpinSfx(sfxEnabled, sfxVolume, spinSeconds);
                  setStep("spinning");
                }}
                onSpinEnd={() => {
                  playRevealStopSfx(sfxEnabled, sfxVolume);
                  onMarkRevealed(revealingStreamer.id);
                  setStep("revealed");
                }}
                onSettleEnd={() => {
                  if (nextEntry) {
                    setRevealingId(nextEntry.streamerId);
                    setStep("entering");
                  } else {
                    setRevealingId(null);
                    setStep(null);
                  }
                }}
              />
            )}
            <CtaButton
              className="pass-announcement-screen__reveal-button"
              onClick={handleReveal}
              disabled={isBusy || (!canSettleCurrent && !nextEntry)}
              onHoverStart={() => playButtonHoverSfx(sfxEnabled, sfxVolume)}
            >
              {buttonLabel}
            </CtaButton>
            <SpinDurationSettings
              seconds={spinSeconds}
              onChange={handleSpinSecondsChange}
              sfxEnabled={sfxEnabled}
              sfxVolume={sfxVolume}
              onSfxVolumeChange={onSfxVolumeChange}
            />
          </div>
        </>
      )}
    </div>
  );
}
