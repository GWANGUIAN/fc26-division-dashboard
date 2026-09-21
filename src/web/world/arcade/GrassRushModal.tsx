import { useEffect, useRef, useState } from "react";
import type { CastId, MinigameRoundResult } from "../types";
import { getWorldAssetUrl } from "../worldAssets";
import { CONFIRM_CODES, useWorldKeys } from "../ui/useWorldKeys";
import { buttonProps } from "../ui/buttonProps";
import { panelArt } from "../ui/panelArt";
import { arcadeRank, nextRankGoal, rankTier } from "../state/ranks";
import { getCast } from "../data/worldCast";
import { characterFrameCell, CHAR_FRAME_H, CHAR_FRAME_W } from "../engine/render";
import { createRush, RUSH_DT, RUSH_SLIDE_SECONDS, rushScore, stepRush, type RushInput } from "./GrassRushEngine";
import type { WorldAudioLike } from "../audio/worldAudio";
import "./grass-rush.css";

/** y where sprite soles sit: the front edge of the `ground` lawn (its top ~20px are transparent, grass starts at ~285). */
const FLOOR_Y = 312;
/** The distance that earns the 「러시 1000m」 badge. */
const BADGE_METERS = 1000;
const COUNT_FROM = 3;
const COUNT_STEP_MS = 700;
/** A key pressed while the run just ended must not restart it by accident. */
const RETRY_LOCK_MS = 600;
/** Where the runner stands: the sprite's soles sit at (RUNNER_X, FLOOR_Y). */
const RUNNER_X = 102;
/** A slide turns the runner onto its back, feet first: this long (s) to lie down and to get up again. */
const SLIDE_BLEND = 0.08;
/** The lying runner slides this far forward while the body swings down (px). */
const SLIDE_FORWARD = 28;
/** The stride cadence follows the running speed: about 8 steps a second at the start (the world's walk rate). */
const METERS_PER_SECOND_AT_START = 26;
const DEFAULT_BACK_MARGIN = 17;

type Phase = "ready" | "count" | "run" | "over";

interface GrassRushModalProps {
  player: CastId;
  factory?: boolean;
  best?: number;
  onClose: () => void;
  onRoundEnd?: (result: MinigameRoundResult) => void;
  audio?: WorldAudioLike;
}

/** Sets a node's text only when it changed, so the per-frame HUD costs nothing while a number stands still. */
function setText(node: HTMLElement | null, text: string) {
  if (node && node.textContent !== text) node.textContent = text;
}

/** The medal of a rank tier (new art, docs/world/18); without the file the rank is just its name chip. */
function RankMedal({ tier }: { tier: number }) {
  const url = getWorldAssetUrl(`ui/rush-rank-${Math.min(7, Math.max(0, tier))}`);
  return url ? <img className="world-rush__medal" src={url} alt="" draggable={false} /> : null;
}

/**
 * Grass Rush (docs/world/18), drawn inside the scaled stage like the mission log: the 640×360 canvas fills the stage and
 * the game UI sits on it as DOM — framed HUD chips (distance, seeds and score), a gauge towards the next rank, the start
 * window, a 3-2-1 count and the result window. Space / ↑ / W jump, ↓ / S slide, E / Enter / Space start and retry, Esc
 * (handled by the overlay) closes.
 */
export function GrassRushModal({ player, factory = false, best, onClose, onRoundEnd, audio }: GrassRushModalProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef(createRush());
  const input = useRef<RushInput | undefined>(undefined);
  const [phase, setPhaseState] = useState<Phase>("ready");
  const phaseRef = useRef<Phase>("ready");
  const setPhase = (next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  };
  const [count, setCount] = useState(COUNT_FROM);
  const [go, setGo] = useState(false);
  const [result, setResult] = useState<MinigameRoundResult | null>(null);
  const [runSeeds, setRunSeeds] = useState(0);
  const bestAtStart = useRef(best ?? 0);
  const overAt = useRef(0);
  const callback = useRef(onRoundEnd);
  callback.current = onRoundEnd;
  const audioRef = useRef(audio);
  audioRef.current = audio;
  const bestRef = useRef(best);
  bestRef.current = best;
  const hud = { distance: useRef<HTMLElement>(null), seeds: useRef<HTMLElement>(null), score: useRef<HTMLElement>(null), goal: useRef<HTMLElement>(null), fill: useRef<HTMLDivElement>(null) };

  const begin = () => {
    if (phaseRef.current === "count" || phaseRef.current === "run") return;
    state.current = createRush();
    input.current = undefined;
    bestAtStart.current = bestRef.current ?? 0;
    setResult(null);
    setCount(COUNT_FROM);
    setPhase("count");
    audioRef.current?.playSfx("count-tick");
  };

  useWorldKeys((code, event) => {
    const now = phaseRef.current;
    const jump = code === "Space" || code === "ArrowUp" || code === "KeyW";
    const slide = code === "ArrowDown" || code === "KeyS";
    const confirm = CONFIRM_CODES.has(code);
    if (now === "run") {
      if (!jump && !slide) return false;
      if (event.repeat) return true;
      const next: RushInput = slide ? "slide" : "jump";
      const s = state.current;
      const accepted = next === "jump" ? s.height === 0 && s.slide <= 0 : s.height === 0;
      if (accepted) {
        input.current = next;
        audioRef.current?.playSfx(next === "jump" ? "rush-jump" : "rush-slide");
      }
      return true;
    }
    if (!jump && !slide && !confirm) return false;
    if (event.repeat || !confirm) return true;
    if (now === "ready" || (now === "over" && Date.now() - overAt.current > RETRY_LOCK_MS)) begin();
    return true;
  });

  // 3 · 2 · 1, then the run starts.
  useEffect(() => {
    if (phase !== "count") return;
    let remaining = COUNT_FROM;
    const id = window.setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        setCount(remaining);
        audioRef.current?.playSfx("count-tick");
        return;
      }
      window.clearInterval(id);
      audioRef.current?.playSfx("count-go");
      setPhase("run");
    }, COUNT_STEP_MS);
    return () => window.clearInterval(id);
  }, [phase]);

  // A short "GO!" as the run begins.
  useEffect(() => {
    if (phase !== "run") return;
    setGo(true);
    const id = window.setTimeout(() => setGo(false), 700);
    return () => window.clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    const images = new Map<string, HTMLImageElement>();
    for (const key of ["bg-far", "bg-mid", "bg-factory", "ground", "cone", "mower", "banner-low", "tackler-stand", "seed", "player"]) {
      const image = new Image();
      image.src = getWorldAssetUrl(key === "player" ? `characters/${player}-atlas` : `rush/${key}`) ?? "";
      images.set(key, image);
    }
    const role = getCast(player).role;
    // How far the back of the standing side-view sprite is from the soles' centre line: the runner lies on it when sliding.
    let backMargin = DEFAULT_BACK_MARGIN;
    let measured = false;
    const measure = (atlas: HTMLImageElement) => {
      measured = true;
      try {
        const probe = document.createElement("canvas");
        probe.width = CHAR_FRAME_W;
        probe.height = CHAR_FRAME_H;
        const g = probe.getContext("2d");
        if (!g) return;
        g.drawImage(atlas, CHAR_FRAME_W, 0, CHAR_FRAME_W, CHAR_FRAME_H, 0, 0, CHAR_FRAME_W, CHAR_FRAME_H);
        const { data } = g.getImageData(0, 0, CHAR_FRAME_W, CHAR_FRAME_H);
        let minX = CHAR_FRAME_W;
        for (let y = 0; y < CHAR_FRAME_H; y++) for (let x = 0; x < minX; x++) if (data[(y * CHAR_FRAME_W + x) * 4 + 3] > 40) minX = x;
        if (minX < CHAR_FRAME_W / 2) backMargin = CHAR_FRAME_W / 2 - minX;
      } catch {
        // an unreadable canvas keeps the default margin
      }
    };
    let raf = 0;
    let last = 0;
    let accumulator = 0;
    const draw = (key: string, x: number, y: number, w: number, h: number) => {
      const image = images.get(key);
      if (image?.complete && image.naturalWidth) ctx.drawImage(image, x, y, w, h);
    };
    function frame(now: number) {
      const elapsed = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      if (phaseRef.current === "run" && !document.hidden) {
        accumulator += elapsed;
        while (accumulator >= RUSH_DT && !state.current.over) {
          const previous = state.current;
          state.current = stepRush(previous, input.current);
          input.current = undefined;
          accumulator -= RUSH_DT;
          if (state.current.seeds > previous.seeds) audioRef.current?.playSfx("rush-collect");
          if (state.current.over && !previous.over) audioRef.current?.playSfx("rush-hit");
        }
      }
      const s = state.current;
      ctx!.imageSmoothingEnabled = false;
      ctx!.fillStyle = factory ? "#313b39" : "#9dcde0";
      ctx!.fillRect(0, 0, 640, 360);
      for (const [key, speed] of [[factory ? "bg-factory" : "bg-far", 0.5], ["bg-mid", 1.5], ["ground", 8]] as const) {
        const offset = (s.distance * speed) % 640;
        for (const x of [-offset, 640 - offset]) draw(key, x, key === "ground" ? 264 : 0, 640, key === "ground" ? 96 : 360);
      }
      for (const o of s.objects) {
        const image = images.get(o.kind);
        if (image?.complete && image.naturalWidth) ctx!.drawImage(image, o.x + 20 - image.naturalWidth / 2, o.kind === "banner-low" ? FLOOR_Y - 74 : FLOOR_Y - image.naturalHeight);
      }
      const atlas = images.get("player");
      if (atlas?.complete && atlas.naturalWidth) {
        if (!measured) measure(atlas);
        // 0 = upright, 1 = lying on its back: eased in and out at the ends of the slide.
        const lie = s.slide > 0 ? Math.min(1, (RUSH_SLIDE_SECONDS - s.slide) / SLIDE_BLEND, s.slide / SLIDE_BLEND) : 0;
        // Side view like the world's walk: the strides (legs apart) alternate with the feet-together standing profile; in the air the legs stay apart.
        const cell =
          s.height > 0
            ? { col: 0, row: 2 }
            : lie > 0
              ? characterFrameCell(role, { x: 0, y: 0, facing: "right", moving: false, animTime: 0 })
              : characterFrameCell(role, { x: 0, y: 0, facing: "right", moving: phaseRef.current === "run", animTime: s.distance / METERS_PER_SECOND_AT_START });
        ctx!.save();
        // The turn is around the soles: they swing up-forward while the head goes back, and the back settles on the lawn.
        ctx!.translate(Math.round(RUNNER_X + SLIDE_FORWARD * lie), Math.round(FLOOR_Y - s.height - backMargin * lie));
        ctx!.rotate((-Math.PI / 2) * lie);
        ctx!.drawImage(atlas, cell.col * CHAR_FRAME_W, cell.row * CHAR_FRAME_H, CHAR_FRAME_W, CHAR_FRAME_H, -CHAR_FRAME_W / 2, -60, CHAR_FRAME_W, CHAR_FRAME_H);
        ctx!.restore();
      }

      // HUD numbers and the gauge towards the next rank.
      const meters = Math.floor(s.distance);
      setText(hud.distance.current, `${meters}m`);
      setText(hud.seeds.current, `×${s.seeds}`);
      setText(hud.score.current, `${rushScore(s)}점`);
      const next = nextRankGoal("rush", meters);
      setText(hud.goal.current, next ? `다음 랭크 · ${next.rank} ${next.goal}m` : "최고 랭크!");
      if (hud.fill.current) hud.fill.current.style.width = `${next ? Math.min(100, Math.max(0, ((s.distance - next.from) / (next.goal - next.from)) * 100)) : 100}%`;

      if (phaseRef.current === "run" && s.over) {
        const round: MinigameRoundResult = { game: "rush", score: rushScore(s), distance: meters };
        overAt.current = Date.now();
        audioRef.current?.playSfx("rush-gameover");
        setResult(round);
        setRunSeeds(s.seeds);
        setPhase("over");
        callback.current?.(round);
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the loop reads everything else through refs
  }, [player, factory]);

  const { style: artStyle, has } = panelArt({ frame: "ui/panel-frame", chip: "ui/tooltip-frame", bar: "ui/loading-bar-frame", banner: "ui/toast-frame", "count-plate": "ui/rush-count-plate", burst: "ui/rush-newbest" });
  const primary = buttonProps("primary");
  const secondary = buttonProps("secondary");
  const seedIcon = getWorldAssetUrl("rush/seed");
  const rushIcon = getWorldAssetUrl("ui/mi-rush");
  const badgeIcon = getWorldAssetUrl("ui/bd-rush-1000");
  const sparkle = getWorldAssetUrl("ui/sparkle-ring");

  const bestMeters = best ?? 0;
  const bestTier = rankTier("rush", best);
  const goal = nextRankGoal("rush", best);
  const resultMeters = result?.distance ?? 0;
  const badgeEarned = Math.max(bestMeters, resultMeters) >= BADGE_METERS;
  const newBest = result !== null && resultMeters > bestAtStart.current;
  const resultGoal = result ? nextRankGoal("rush", resultMeters) : null;
  const running = phase === "count" || phase === "run" || phase === "over";
  const title = `잔디 러시${factory ? " · 제초 공장 코스" : ""}`;

  return (
    <div className={`world-rush is-${phase}`} style={artStyle} role="dialog" aria-label={title}>
      <canvas ref={canvas} className="world-rush__canvas" width={640} height={360} aria-label="장애물을 피하고 씨앗을 모으는 잔디 러시" />

      {running && (
        <>
          <div className={`world-rush__chip world-rush__chip--left${has.chip ? " world-rush__chip--art" : ""}`} aria-label="달린 거리">
            <span className="world-rush__chip-label">거리</span>
            <b ref={hud.distance}>0m</b>
          </div>
          <div className={`world-rush__chip world-rush__chip--right${has.chip ? " world-rush__chip--art" : ""}`} aria-label="씨앗과 점수">
            {seedIcon && <img src={seedIcon} alt="" draggable={false} />}
            <b ref={hud.seeds}>×0</b>
            <b ref={hud.score} className="world-rush__score">0점</b>
          </div>
          <div className="world-rush__gauge" role="presentation">
            <div className={`world-rush__bar${has.bar ? " world-rush__bar--art" : ""}`}>
              <div ref={hud.fill} className="world-rush__fill" />
            </div>
            <span ref={hud.goal} className="world-rush__goal">다음 랭크</span>
          </div>
        </>
      )}
      <p className="world-rush__keys">
        <kbd className="world-key">Space</kbd>
        <kbd className="world-key">↑</kbd> 점프 <kbd className="world-key">↓</kbd> 슬라이드 <kbd className="world-key">Esc</kbd> 닫기
      </p>

      {phase === "ready" && (
        <section className={`world-rush__panel${has.frame ? " world-rush__panel--art" : ""}`}>
          <h2>
            {rushIcon && <img src={rushIcon} alt="" draggable={false} />}
            <span>잔디 러시</span>
          </h2>
          <p className="world-rush__sub">{factory ? "제초 공장 코스" : "장애물을 넘고 씨앗을 모아요"}</p>
          <ul className="world-rush__how">
            <li>
              <span className="world-rush__how-keys">
                <kbd className="world-key">Space</kbd>
                <kbd className="world-key">↑</kbd>
              </span>
              <span>점프 · 콘과 잔디깎이 넘기</span>
            </li>
            <li>
              <span className="world-rush__how-keys">
                <kbd className="world-key">↓</kbd>
              </span>
              <span>슬라이드 · 낮은 현수막 밑으로</span>
            </li>
            <li>
              <span className="world-rush__how-keys">{seedIcon ? <img src={seedIcon} alt="" draggable={false} /> : null}</span>
              <span>씨앗 +10점 · 랭크는 거리 기준</span>
            </li>
          </ul>
          <div className="world-rush__record">
            <RankMedal tier={bestTier} />
            <div className="world-rush__record-text">
              <p>
                최고 <b>{bestMeters}m</b> <span className={`world-rush__rank tier-${bestTier}`}>{arcadeRank("rush", best)}</span>
              </p>
              <small>{goal ? `다음 랭크 · ${goal.rank} ${goal.goal}m` : "최고 랭크를 달성했어요!"}</small>
            </div>
            <div className={`world-rush__badge${badgeEarned ? " is-earned" : ""}`} title="뱃지 「러시 1000m」">
              {badgeIcon ? <img src={badgeIcon} alt="" draggable={false} /> : <span aria-hidden="true">★</span>}
              <small>{badgeEarned ? "획득" : `${BADGE_METERS}m`}</small>
            </div>
          </div>
          <button type="button" className={`${primary.className} world-rush__go`} style={primary.style} onClick={() => { audioRef.current?.playSfx("ui-select"); begin(); }}>
            시작
          </button>
        </section>
      )}

      {phase === "count" && (
        <div key={count} className={`world-rush__count${has["count-plate"] ? " world-rush__count--art" : ""}`} role="status" aria-live="assertive">
          <span>{count}</span>
        </div>
      )}
      {go && (
        <div className="world-rush__count world-rush__count--go" role="status">
          <span>GO!</span>
        </div>
      )}

      {phase === "over" && result && (
        <>
          <div className="world-rush__flash" aria-hidden="true" />
          <section className={`world-rush__panel world-rush__panel--result${has.frame ? " world-rush__panel--art" : ""}`} role="status">
            <h2 className={`world-rush__banner${has.banner ? " world-rush__banner--art" : ""}`}>
              <span>게임 종료</span>
            </h2>
            <p className="world-rush__meters">
              <b>{resultMeters}</b>m
            </p>
            {newBest && (
              <p className={`world-rush__new${has.burst ? " world-rush__new--art" : ""}`}>
                {sparkle && <img src={sparkle} alt="" draggable={false} />}
                <span>신기록!</span>
              </p>
            )}
            <p className="world-rush__stats">
              {seedIcon && <img src={seedIcon} alt="" draggable={false} />}씨앗 {runSeeds}개 · {result.score}점
            </p>
            <div className="world-rush__record">
              <RankMedal tier={rankTier("rush", resultMeters)} />
              <div className="world-rush__record-text">
                <p>
                  <span className={`world-rush__rank tier-${rankTier("rush", resultMeters)}`}>{arcadeRank("rush", resultMeters)}</span>
                  <span className="world-rush__best">최고 {Math.max(bestMeters, resultMeters)}m</span>
                </p>
                <small>{resultGoal ? `${resultGoal.rank}까지 ${Math.max(0, resultGoal.goal - resultMeters)}m` : "최고 랭크 달성!"}</small>
              </div>
              {badgeEarned && (
                <div className="world-rush__badge is-earned" title="뱃지 「러시 1000m」">
                  {badgeIcon ? <img src={badgeIcon} alt="" draggable={false} /> : <span aria-hidden="true">★</span>}
                  <small>획득</small>
                </div>
              )}
            </div>
            <div className="world-rush__actions">
              <button type="button" className={`${primary.className} world-rush__go`} style={primary.style} onClick={() => { audioRef.current?.playSfx("ui-select"); begin(); }}>
                다시 도전
              </button>
              <button type="button" className={`${secondary.className} world-rush__go`} style={secondary.style} onClick={() => { audioRef.current?.playSfx("ui-close"); onClose(); }}>
                닫기
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
