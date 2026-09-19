import { useEffect, useRef, useState } from "react";
import type { CastId, MinigameRoundResult } from "../types";
import { getWorldAssetUrl } from "../worldAssets";
import { useWorldKeys } from "../ui/useWorldKeys";
import { arcadeRank } from "../state/ranks";
import { createRush, RUSH_DT, rushScore, stepRush, type RushInput } from "./GrassRushEngine";
import { RepeatPanel } from "../ui/RepeatPanel";

export function GrassRushModal({ player, factory = false, best, onClose, onRoundEnd }: {
  player: CastId; factory?: boolean; best?: number; onClose: () => void; onRoundEnd?: (result: MinigameRoundResult) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef(createRush());
  const input = useRef<RushInput | undefined>(undefined);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<MinigameRoundResult | null>(null);
  const callback = useRef(onRoundEnd); callback.current = onRoundEnd;
  useWorldKeys((code, event) => {
    if (!["Space", "ArrowUp", "ArrowDown"].includes(code)) return false;
    if (!event.repeat && running) input.current = code === "ArrowDown" ? "slide" : "jump";
    return true;
  });
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    const images = new Map<string, HTMLImageElement>();
    for (const key of ["bg-far", "bg-mid", "bg-factory", "ground", "cone", "mower", "banner-low", "tackler-stand", "seed", "player"]) {
      const image = new Image(); image.src = getWorldAssetUrl(key === "player" ? `characters/${player}-atlas` : `rush/${key}`) ?? ""; images.set(key, image);
    }
    let raf = 0, last = 0, accumulator = 0, reported = false;
    const draw = (key: string, x: number, y: number, w: number, h: number) => {
      const image = images.get(key);
      if (image?.complete && image.naturalWidth) ctx.drawImage(image, x, y, w, h);
    };
    function frame(now: number) {
      const elapsed = last ? Math.min((now - last) / 1000, 0.1) : 0; last = now;
      if (running && !document.hidden) {
        accumulator += elapsed;
        while (accumulator >= RUSH_DT && !state.current.over) {
          state.current = stepRush(state.current, input.current); input.current = undefined; accumulator -= RUSH_DT;
        }
      }
      const s = state.current;
      ctx!.imageSmoothingEnabled = false;
      ctx!.fillStyle = factory ? "#313b39" : "#9dcde0"; ctx!.fillRect(0, 0, 640, 360);
      for (const [key, speed] of [[factory ? "bg-factory" : "bg-far", 0.5], ["bg-mid", 1.5], ["ground", 8]] as const) {
        const offset = s.distance * speed % 640;
        for (const x of [-offset, 640 - offset]) draw(key, x, key === "ground" ? 280 : 0, 640, key === "ground" ? 80 : 280);
      }
      for (const o of s.objects) draw(o.kind, o.x, o.kind === "banner-low" ? 198 : 246, 40, 40);
      const atlas = images.get("player");
      const sliding = s.slide > 0;
      if (atlas?.complete && atlas.naturalWidth) ctx!.drawImage(atlas, (Math.floor(s.distance / 2) % 4) * 48, 128, 48, 64, 78, 284 - s.height - (sliding ? 32 : 64), 48, sliding ? 32 : 64);
      ctx!.fillStyle = "#10241d"; ctx!.font = "bold 18px sans-serif";
      ctx!.fillText(`${Math.floor(s.distance)}m · 씨앗 ${s.seeds} · ${rushScore(s)}점`, 20, 30);
      if (running && s.over && !reported) {
        reported = true;
        const round: MinigameRoundResult = { game: "rush", score: rushScore(s), distance: Math.floor(s.distance) };
        setResult(round); setRunning(false); callback.current?.(round);
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [running, player, factory]);
  return <RepeatPanel title={`잔디 러시${factory ? " · 제초 공장 코스" : ""}`} onClose={onClose}>
    <p>Space / ↑ 점프 · ↓ 슬라이드 · Esc 닫기</p>
    <p>최고 {best ?? 0}m · {arcadeRank("rush", best)} · 씨앗은 10점, 랭크는 거리 기준</p>
    <canvas ref={canvas} width={640} height={360} aria-label="장애물을 피하고 씨앗을 모으는 잔디 러시" />
    {result && <p role="status">{result.distance}m · {result.score}점 · {arcadeRank("rush", result.distance)}</p>}
    {!running && <button onClick={() => { state.current = createRush(); input.current = undefined; setResult(null); setRunning(true); }}>{result ? "다시 도전" : "시작"}</button>}
  </RepeatPanel>;
}
