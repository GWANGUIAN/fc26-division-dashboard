import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Volume2, VolumeX, X } from "lucide-react";
import { useEscape } from "../Modal.js";
import { playSfx, stopSfx } from "../sfxAudio.js";
import { SoundControl } from "../minigame/SoundControl.js";
import { PositionTestQuiz } from "./PositionTestQuiz";
import { PositionTestReveal } from "./PositionTestReveal";
import {
  choosePositionTestAnswer,
  computePositionTestOutcome,
  createPositionTestState,
  restartPositionTest,
  submitPositionTestName,
} from "./positionTestEngine";
import { getPositionTestResult } from "./positionTestResults";
import { getPositionTestPopupBackdropUrl } from "./positionTestAssets";
import { usePositionTestSfx } from "./usePositionTestSfx";
import { loadPositionTestName, savePositionTestName } from "../storage";
import "./position-test-popup.css";

const SOUND = {
  open: "/sfxes/position-test-open.mp3",
  select: "/sfxes/position-test-select.mp3",
  next: "/sfxes/position-test-next.mp3",
  cardOpen: "/sfxes/position-test-card-open.mp3",
  revealImpact: "/sfxes/position-test-reveal-impact.mp3",
  complete: "/sfxes/position-test-complete.mp3",
} as const;

/** Locks the page behind the overlay from scrolling while it's open — same
 * implementation as FortunePopup's own useBodyScrollLock (each bespoke
 * fixed overlay in this codebase keeps its own copy rather than sharing
 * one). */
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

export function PositionTestPopup({
  sfxVolume,
  onSfxVolumeChange,
  onClose,
}: {
  sfxVolume: number;
  onSfxVolumeChange: (value: number) => void;
  onClose: () => void;
}) {
  useEscape(onClose);
  useBodyScrollLock();
  const { sfxOn, toggleSfx } = usePositionTestSfx();

  const [state, setState] = useState(createPositionTestState);
  const [nameInput, setNameInput] = useState(loadPositionTestName);

  const backdropUrl = getPositionTestPopupBackdropUrl();

  const play = (sound: keyof typeof SOUND) => {
    if (sfxOn) playSfx(SOUND[sound], sfxVolume / 100);
  };

  const openedRef = useRef(false);
  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    play("open");
    return () => stopSfx();
    // Fires once on mount only — sfxOn/sfxVolume are read fresh via the
    // closure at the moment this runs, same "one-shot" reasoning
    // FootballRulesQuizModal's own open effect uses.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStart = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    savePositionTestName(trimmed);
    setState((current) => submitPositionTestName(current, trimmed));
    play("open");
  };

  const handleAnswer = (optionIndex: number) => {
    play("select");
    setState((current) => {
      const next = choosePositionTestAnswer(current, optionIndex);
      if (next.phase === "reveal") window.setTimeout(() => play("complete"), 120);
      return next;
    });
    window.setTimeout(() => play("next"), 55);
  };

  const handleRestart = () => {
    stopSfx();
    setState(restartPositionTest());
    setNameInput(loadPositionTestName());
  };

  const outcome = useMemo(
    () => (state.phase === "reveal" ? computePositionTestOutcome(state) : null),
    [state],
  );
  const resultEntry = outcome ? getPositionTestResult(outcome.position, outcome.style) : null;

  return (
    <div className="position-test-popup" role="dialog" aria-modal="true" aria-label="나의 축구 포지션은?">
      <div className="position-test-popup__backdrop-wrap" aria-hidden="true">
        {backdropUrl && <div className="position-test-popup__backdrop" style={{ backgroundImage: `url(${backdropUrl})` }} />}
      </div>
      <div className="position-test-popup__scrim" aria-hidden="true" />

      <SoundControl
        enabled={sfxOn}
        volume={sfxVolume}
        onToggle={toggleSfx}
        onVolumeChange={onSfxVolumeChange}
        icon={sfxOn ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
        label="효과음"
        wrapperClassName={`position-test-popup__sfx-toggle ${sfxOn ? "" : "position-test-popup__sfx-toggle--muted"}`}
      />
      <button type="button" className="position-test-popup__close" onClick={onClose} aria-label="나의 축구 포지션은? 닫기">
        <X aria-hidden="true" />
      </button>

      <div className="position-test-popup__stage">
        {state.phase === "name" && (
          <div className="position-test-popup__intro">
            <h2 className="position-test-popup__title">
              <Sparkles aria-hidden="true" /> 나의 축구 포지션은?
            </h2>
            <p className="position-test-popup__intro-text">9개의 질문에 답하면 잔디동 멤버 중 나와 꼭 닮은 포지션을 찾아드려요.</p>
            <input
              type="text"
              className="position-test-popup__name-input"
              placeholder="이름(닉네임)을 입력해주세요"
              value={nameInput}
              maxLength={12}
              onChange={(event) => setNameInput(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleStart()}
              aria-label="이름 입력"
            />
            <button type="button" className="position-test-popup__start-btn" onClick={handleStart} disabled={!nameInput.trim()}>
              시작하기
            </button>
          </div>
        )}

        {state.phase === "question" && <PositionTestQuiz questionIndex={state.questionIndex} onAnswer={handleAnswer} />}

        {state.phase === "reveal" && outcome && resultEntry && (
          <PositionTestReveal
            name={state.name}
            entry={resultEntry}
            onCardOpen={() => play("cardOpen")}
            onRevealImpact={() => play("revealImpact")}
            onRestart={handleRestart}
          />
        )}
      </div>
    </div>
  );
}
