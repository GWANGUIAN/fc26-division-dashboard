import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { WorldAudioLike } from "../audio/worldAudio";
import { getCast } from "../data/worldCast";
import {
  TYPE_SPEED, advance, confirmChoice, currentLine, fillPlaceholders, moveChoice, startDialogue, tickTyping, visibleText,
  type DialogueEffect, type DialogueNode, type DialogueState,
} from "../state/dialogue";
import { getWorldAssetUrl } from "../worldAssets";

interface DialogueBoxProps {
  node: DialogueNode;
  playerName: string;
  audio: WorldAudioLike;
  /** Show the "E 다음 · Esc 닫기" hint (the first few conversations, docs/world/02 §4). */
  showHint: boolean;
  /** A picked choice carried a mission effect (accept the mission, take the parcels again…). */
  onEffect?: (effect: DialogueEffect) => void;
  onClose: () => void;
}

const CONFIRM_CODES = new Set(["KeyE", "Space", "Enter", "NumpadEnter"]);
const UP_CODES = new Set(["ArrowUp", "KeyW"]);
const DOWN_CODES = new Set(["ArrowDown", "KeyS"]);

/** A CSS custom property that feeds a 9-slice `border-image` (empty when the art is missing → plain CSS box). */
function frameVar(name: string, key: string): CSSProperties {
  const url = getWorldAssetUrl(key);
  return url ? ({ [name]: `url(${url})` } as CSSProperties) : {};
}

/**
 * The conversation box: typewriter text, portrait, name plate and choices, drawn as DOM over the canvas in the
 * 640×360 logical stage. E/Space/Enter confirm, ↑↓ pick a choice; Esc is handled by the overlay.
 */
export function DialogueBox({ node, playerName, audio, showHint, onEffect, onClose }: DialogueBoxProps) {
  const [state, setState] = useState<DialogueState>(() => startDialogue(node));
  const closedRef = useRef(false);
  const audioRef = useRef(audio);
  audioRef.current = audio;
  const effectRef = useRef(onEffect);
  effectRef.current = onEffect;
  // The key/typing handlers read the latest state from here so sound effects stay out of state updaters.
  const stateRef = useRef(state);
  stateRef.current = state;

  // A different node (a choice's branch is handled inside the state) restarts the runner.
  useEffect(() => {
    closedRef.current = false;
    setState(startDialogue(node));
  }, [node]);

  /** Confirms a choice: its effect fires here (an event, not a state updater) and the runner moves on. */
  const pick = (current: DialogueState, index = current.choice): DialogueState => {
    const chosen = current.node.choices?.[index];
    if (chosen?.disabled) return current;
    if (current.phase === "choosing" && chosen?.effect) effectRef.current?.(chosen.effect);
    return confirmChoice({ ...current, choice: index });
  };

  const typing = state.phase === "typing";
  useEffect(() => {
    if (!typing) return;
    const id = window.setInterval(() => {
      const current = stateRef.current;
      const next = tickTyping(current, TYPE_SPEED * 0.03);
      if (Math.floor(next.chars / 2) !== Math.floor(current.chars / 2)) audioRef.current.playSfx("dialog-tick");
      setState(next);
    }, 30);
    return () => window.clearInterval(id);
  }, [typing]);

  useEffect(() => {
    if (state.phase === "done" && !closedRef.current) {
      closedRef.current = true;
      onClose();
    }
  }, [state.phase, onClose]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.altKey || event.metaKey) return;
      if (CONFIRM_CODES.has(event.code)) {
        event.preventDefault();
        event.stopPropagation();
        if (event.repeat) return;
        const current = stateRef.current;
        audioRef.current.playSfx(current.phase === "choosing" ? "ui-select" : "dialog-next");
        setState(current.phase === "choosing" ? pick(current) : advance(current));
      } else if (UP_CODES.has(event.code) || DOWN_CODES.has(event.code)) {
        event.preventDefault();
        event.stopPropagation();
        const current = stateRef.current;
        if (current.phase === "choosing") audioRef.current.playSfx("ui-move");
        setState(moveChoice(current, UP_CODES.has(event.code) ? -1 : 1));
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  const line = currentLine(state);
  const speaker = line?.speaker ? getCast(line.speaker) : null;
  const portrait = speaker ? getWorldAssetUrl(`portraits/${speaker.id}-${line?.mood ?? "neutral"}`) ?? getWorldAssetUrl(`portraits/${speaker.id}-neutral`) : undefined;
  const fullText = line ? fillPlaceholders(line.text, playerName) : "";
  const shown = useMemo(() => fillPlaceholders(visibleText(state), playerName), [state, playerName]);
  const choosing = state.phase === "choosing";
  const waiting = state.phase === "waiting";
  const next1 = getWorldAssetUrl("ui/next-1");
  const next2 = getWorldAssetUrl("ui/next-2");
  const cursor = getWorldAssetUrl("ui/cursor");

  const art = {
    box: Boolean(getWorldAssetUrl("ui/dialog-frame")),
    name: Boolean(getWorldAssetUrl("ui/nameplate")),
    portrait: Boolean(getWorldAssetUrl("ui/portrait-frame")),
    choice: Boolean(getWorldAssetUrl("ui/choice-normal") && getWorldAssetUrl("ui/choice-selected")),
  };
  const style: CSSProperties = {
    ...frameVar("--frame-dialog", "ui/dialog-frame"),
    ...frameVar("--frame-name", "ui/nameplate"),
    ...frameVar("--frame-portrait", "ui/portrait-frame"),
    ...frameVar("--frame-choice", "ui/choice-normal"),
    ...frameVar("--frame-choice-on", "ui/choice-selected"),
  };

  return (
    <div
      className="world-dialogue"
      style={style}
      onClick={() => {
        if (!choosing) setState((current) => advance(current));
      }}
    >
      {choosing && node && (
        <ul className="world-dialogue__choices" role="listbox" aria-label="선택지">
          {(state.node.choices ?? []).map((choice, index) => (
            <li
              key={choice.label}
              role="option"
              aria-selected={index === state.choice}
              aria-disabled={choice.disabled || undefined}
              className={`world-dialogue__choice${art.choice ? " world-dialogue__choice--art" : ""}${index === state.choice ? " is-on" : ""}${choice.disabled ? " is-disabled" : ""}`}
              onMouseEnter={() => {
                if (!choice.disabled) setState((current) => ({ ...current, choice: index }));
              }}
              onClick={(event) => {
                event.stopPropagation();
                if (choice.disabled) {
                  audioRef.current.playSfx("ui-error");
                  return;
                }
                setState(pick(stateRef.current, index));
              }}
            >
              {index === state.choice && cursor && <img className="world-dialogue__cursor" src={cursor} alt="" draggable={false} />}
              {choice.label}
            </li>
          ))}
        </ul>
      )}

      {portrait && (
        <div className={`world-dialogue__portrait${art.portrait ? " world-dialogue__portrait--art" : ""}`}>
          <img src={portrait} alt="" draggable={false} />
        </div>
      )}
      {speaker && (
        <div className={`world-dialogue__name${art.name ? " world-dialogue__name--art" : ""}${portrait ? "" : " world-dialogue__name--flush"}`}>{speaker.displayName}</div>
      )}

      <div className={`world-dialogue__box${art.box ? " world-dialogue__box--art" : ""}`}>
        <p className="world-dialogue__text" aria-hidden="true">{shown}</p>
        <p className="world-dialogue__sr" aria-live="polite">{fullText}</p>
        {waiting && next1 && next2 && (
          <span className="world-dialogue__next" aria-hidden="true">
            <img src={next1} alt="" draggable={false} />
            <img src={next2} alt="" draggable={false} />
          </span>
        )}
        {showHint && <span className="world-dialogue__hint">E 다음 · Esc 닫기</span>}
      </div>
    </div>
  );
}
