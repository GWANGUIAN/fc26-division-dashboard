import { useEffect, useRef, useState } from "react";
import type { WorldAudioLike } from "../audio/worldAudio";
import { PROLOGUE_LINES } from "../data/dialogueData";
import { TYPE_SPEED, countChars, fillPlaceholders } from "../state/dialogue";
import { getWorldAssetUrl } from "../worldAssets";

interface PrologueProps {
  playerName: string;
  audio: WorldAudioLike;
  onDone: () => void;
}

const CONFIRM_CODES = new Set(["KeyE", "Space", "Enter", "NumpadEnter"]);

/** The short opening cut before the player wakes up at home (docs/world/01 §3, wording in data/dialogueData.ts). */
export function Prologue({ playerName, audio, onDone }: PrologueProps) {
  const [line, setLine] = useState(0);
  const [chars, setChars] = useState(0);
  const lineRef = useRef(0);
  const charsRef = useRef(0);
  const audioRef = useRef(audio);
  audioRef.current = audio;
  lineRef.current = line;
  charsRef.current = chars;

  const text = fillPlaceholders(PROLOGUE_LINES[line] ?? "", playerName);
  const total = countChars(text);
  const done = chars >= total;

  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => setChars((current) => Math.min(total, current + TYPE_SPEED * 0.03)), 30);
    return () => window.clearInterval(id);
  }, [done, total, line]);

  function confirm() {
    const currentText = fillPlaceholders(PROLOGUE_LINES[lineRef.current] ?? "", playerName);
    if (charsRef.current < countChars(currentText)) {
      setChars(countChars(currentText));
      return;
    }
    audioRef.current.playSfx("dialog-next");
    if (lineRef.current + 1 >= PROLOGUE_LINES.length) {
      onDone();
      return;
    }
    setLine(lineRef.current + 1);
    setChars(0);
  }

  const confirmRef = useRef(confirm);
  confirmRef.current = confirm;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.altKey || event.metaKey || !CONFIRM_CODES.has(event.code)) return;
      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat) confirmRef.current();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  const bg = getWorldAssetUrl("ui/title-bg");
  return (
    <div className="world-prologue" style={bg ? { backgroundImage: `url(${bg})` } : undefined} onClick={confirm}>
      <div className="world-prologue__veil" />
      <p className="world-prologue__text" aria-hidden="true">{Array.from(text).slice(0, Math.floor(chars)).join("")}</p>
      <p className="world-sr-only" aria-live="polite">{text}</p>
      <p className="world-prologue__hint">E · Enter 다음 · Esc 건너뛰기</p>
    </div>
  );
}
