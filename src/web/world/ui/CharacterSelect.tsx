import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { WorldAudioLike } from "../audio/worldAudio";
import { CAST_PROFILES } from "../data/castProfiles";
import { PLAYABLE_CAST } from "../data/worldCast";
import type { CastDef, CastId } from "../types";
import { moveSelection } from "../state/selection";
import { getWorldAssetUrl } from "../worldAssets";
import { buttonProps } from "./buttonProps";

interface CharacterSelectProps {
  audio: WorldAudioLike;
  onConfirm: (id: CastId) => void;
  onBack: () => void;
}

/** The member's own card-click clip (same file as the 3D card); the audio outlives this screen, so it keeps playing into the prologue. */
function playCastVoice(audio: WorldAudioLike, cast: CastDef) {
  if (cast.voiceSfx) audio.playVoice?.(cast.voiceSfx);
}

/**
 * 11 member cards on a 4×3 grid (docs/world/06 §6). The four card frames differ in height (they keep the
 * art's aspect ratio), so every card is drawn into the same fixed box.
 */
export function CharacterSelect({ audio, onConfirm, onBack }: CharacterSelectProps) {
  const [index, setIndex] = useState(0);
  const indexRef = useRef(index);
  indexRef.current = index;
  const audioRef = useRef(audio);
  audioRef.current = audio;
  const [hover, setHover] = useState<number | null>(null);
  const playVoice = (cast: CastDef) => playCastVoice(audioRef.current, cast);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.altKey || event.metaKey) return;
      const deltas: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0], ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1],
      };
      const delta = deltas[event.code];
      if (delta) {
        event.preventDefault();
        event.stopPropagation();
        const next = moveSelection(indexRef.current, delta[0], delta[1], PLAYABLE_CAST.length);
        if (next !== indexRef.current) audioRef.current.playSfx("ui-move");
        setIndex(next);
      } else if (event.code === "Enter" || event.code === "NumpadEnter" || event.code === "Space" || event.code === "KeyE") {
        event.preventDefault();
        event.stopPropagation();
        if (event.repeat) return;
        audioRef.current.playSfx("ui-select");
        playCastVoice(audioRef.current, PLAYABLE_CAST[indexRef.current]);
        onConfirm(PLAYABLE_CAST[indexRef.current].id);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onConfirm]);

  const focused = PLAYABLE_CAST[index];
  const profile = CAST_PROFILES[focused.id];
  const bg = getWorldAssetUrl("ui/select-bg");
  const stand = getWorldAssetUrl(`characters/${focused.id}-stand`);
  const ball = getWorldAssetUrl("ui/ball-marker");
  const style: CSSProperties | undefined = bg ? { backgroundImage: `url(${bg})` } : undefined;

  return (
    <div className="world-select" style={style}>
      <h2 className="world-select__title">캐릭터를 골라 주세요</h2>

      <section className="world-select__detail" aria-live="polite">
        <div className="world-select__stand">
          {stand ? <img src={stand} alt={focused.displayName} draggable={false} /> : <div className="world-select__stand-fallback" style={{ background: focused.themeColor }}>{focused.displayName.slice(0, 1)}</div>}
        </div>
        <div className="world-select__name" style={{ color: focused.themeColor }}>{focused.displayName}</div>
        {profile && (
          <>
            <div className="world-select__meta"><span className="world-select__pos">{profile.position}</span> {profile.epithet}</div>
            <div className="world-select__home">집 · {profile.home}</div>
          </>
        )}
      </section>

      <div className="world-select__grid" role="listbox" aria-label="캐릭터 카드">
        {PLAYABLE_CAST.map((cast, i) => {
          const isFocused = i === index;
          const frameKey = isFocused ? "ui/card-selected" : hover === i ? "ui/card-hover" : "ui/card-normal";
          const frame = getWorldAssetUrl(frameKey);
          const face = getWorldAssetUrl(`portraits/${cast.id}-neutral`);
          return (
            <button
              key={cast.id}
              type="button"
              role="option"
              aria-selected={isFocused}
              className={`world-card${isFocused ? " is-focused" : ""}`}
              style={frame ? { backgroundImage: `url(${frame})` } : undefined}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover((current) => (current === i ? null : current))}
              onClick={() => {
                if (isFocused) {
                  audioRef.current.playSfx("ui-select");
                  onConfirm(cast.id);
                } else {
                  audioRef.current.playSfx("ui-move");
                  setIndex(i);
                }
                playVoice(cast);
              }}
              tabIndex={-1}
            >
              {isFocused && ball && <img className="world-card__ball" src={ball} alt="" draggable={false} />}
              {face ? <img className="world-card__face" src={face} alt="" draggable={false} /> : <span className="world-card__face world-card__face--fallback" style={{ background: cast.themeColor }}>{cast.displayName.slice(0, 1)}</span>}
              <span className="world-card__name">{cast.displayName}</span>
            </button>
          );
        })}
      </div>

      <div className="world-select__actions">
        <button type="button" {...buttonProps("secondary")} onClick={onBack}>돌아가기</button>
        <button type="button" {...buttonProps("primary")} onClick={() => { playVoice(focused); onConfirm(focused.id); }}>선택</button>
      </div>
      <p className="world-select__hint">방향키 이동 · Enter 선택 · Esc 타이틀로</p>
    </div>
  );
}
