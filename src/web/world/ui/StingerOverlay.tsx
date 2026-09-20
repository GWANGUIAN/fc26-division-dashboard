import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { WorldAudioLike } from "../audio/worldAudio";
import { STINGER_CUES, STINGER_CUTS, STINGER_END_CARD, STINGER_LEAD_SECONDS, STINGER_OUT_SECONDS, STINGER_SPEAKER } from "../data/stingerData";
import { advanceStinger, stingerCutBoundaries, stingerCutFrame } from "../state/stinger";
import { getWorldAssetUrl } from "../worldAssets";

// The post-credits stinger (docs/world/14): six stills, a caption or two and a "to be continued" card. The player steps
// through it — every still plays its entrance, holds, and Enter brings in the next one; the last press fades to black.
// Plain DOM over the canvas, like the other ending screens. Every keyframe animation runs from the moment its layer
// mounts, so the component only has to know which still is up and how far into it we are (state/stinger.ts).

const CONFIRM_CODES = new Set(["KeyE", "Space", "Enter", "NumpadEnter"]);
const LAST = STINGER_CUTS.length - 1;

/** Starts fetching and decoding the stills while the rest of the ending plays, so the first cut never waits for the network. */
export function preloadStingerImages(): void {
  if (typeof Image === "undefined") return;
  for (const cut of STINGER_CUTS) {
    const url = getWorldAssetUrl(cut.image);
    if (!url) continue;
    const image = new Image();
    image.src = url;
    void image.decode?.().catch(() => {});
  }
}

interface StingerOverlayProps {
  audio: WorldAudioLike;
  /** The stinger is over (the last press faded out, or the player skipped it all with Esc). */
  onDone: () => void;
}

/** Which still is up (-1 = the black lead-in, STINGER_CUTS.length = fading out) and the seconds since it came in. */
interface Position {
  index: number;
  elapsed: number;
}

export function StingerOverlay({ audio, onDone }: StingerOverlayProps) {
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const audioRef = useRef(audio);
  audioRef.current = audio;
  const [pos, setPos] = useState<Position>({ index: -1, elapsed: 0 });

  const { index } = pos;
  const showing = index >= 0 && index <= LAST;
  const frame = showing ? stingerCutFrame(index, pos.elapsed) : null;

  /** Enter (or a click): the next still, once this one has settled. */
  const advance = () => {
    if (!frame) return;
    const next = advanceStinger(index, frame.ready);
    if (next !== index) setPos({ index: next, elapsed: 0 });
  };
  const advanceRef = useRef(advance);
  advanceRef.current = advance;

  // Silence the music once; the ambience and sounds follow the stills.
  useEffect(() => {
    audioRef.current.playBgm(null);
  }, []);

  // Everything timed belongs to one still: its captions, the end of its entrance and its sound cues.
  useEffect(() => {
    const timers: number[] = [];
    const at = (seconds: number, run: () => void) => timers.push(window.setTimeout(run, seconds * 1000));
    if (index < 0) {
      at(STINGER_LEAD_SECONDS, () => setPos({ index: 0, elapsed: 0 }));
    } else if (index <= LAST) {
      for (const time of stingerCutBoundaries(index)) at(time, () => setPos((current) => (current.index === index ? { index, elapsed: time } : current)));
      for (const cue of STINGER_CUES.filter((entry) => entry.cut === index)) {
        at(cue.at, () => {
          if (cue.ambience !== undefined) audioRef.current.playAmbience?.(cue.ambience);
          if (cue.sfx) audioRef.current.playSfx(cue.sfx);
        });
      }
    } else {
      at(STINGER_OUT_SECONDS, () => doneRef.current());
    }
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [index]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.altKey || event.metaKey || !CONFIRM_CODES.has(event.code)) return;
      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat) advanceRef.current();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  // The still on top and the one under it (which the top one fades in over); older ones are gone.
  const top = Math.min(index, LAST);
  const layers = [top - 1, top].filter((layer, position, all) => layer >= 0 && all.indexOf(layer) === position);

  return (
    <div className="world-stinger" role="status" aria-label="엔딩 이후 이야기" onClick={advance}>
      {layers.map((layer) => {
        const cut = STINGER_CUTS[layer];
        const url = getWorldAssetUrl(cut.image);
        const style = { "--stinger-fade": `${cut.fadeIn}s`, "--stinger-seconds": `${cut.settleSeconds}s` } as CSSProperties;
        return (
          <div key={cut.id} className={`world-stinger__cut is-${cut.motion}`} style={style} aria-hidden={layer !== top}>
            {url && <img src={url} alt={layer === top ? cut.alt : ""} draggable={false} />}
          </div>
        );
      })}
      <div className="world-stinger__captions" aria-live="polite">
        {frame?.caption && (
          <p key={frame.caption.text} className="world-stinger__caption">
            <span className="world-stinger__who">{STINGER_SPEAKER}</span>
            {frame.caption.text}
          </p>
        )}
        {frame?.endCard && <p className="world-stinger__end">{STINGER_END_CARD.text}</p>}
      </div>
      <p className="world-stinger__hint">Esc 전체 건너뛰기</p>
      {frame?.ready && <p className="world-stinger__next">Enter ▶ {index === LAST ? "마치기" : "다음"}</p>}
      <div className={`world-stinger__black${index > LAST ? " is-fading" : ""}`} />
    </div>
  );
}
