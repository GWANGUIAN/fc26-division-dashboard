import { useEffect, useRef, useState } from "react";
import {
  GRID_COLUMNS,
  GRID_ROWS,
  cellsInBounds,
  normalizeBounds,
  type GridBounds,
  type SoccerSum10Board,
} from "./soccerSum10Engine.js";
import type { SelectionResult, SoccerSum10Phase } from "./useSoccerSum10Game.js";

const LOGICAL_WIDTH = 1020;
const LOGICAL_HEIGHT = 600;
const GRID_LEFT = 34;
const GRID_TOP = 20;
const CELL_SIZE = 56;
const BALL_IMAGE_SRC = "/soccer-sum10-ball.webp";

type GridPoint = { row: number; column: number };
export type SelectionPreview = { bounds: GridBounds; count: number; sum: number } | null;

function pointToBounds(point: GridPoint, other: GridPoint) {
  return normalizeBounds(point, other);
}

function isInside(bounds: GridBounds, cell: { row: number; column: number }) {
  return cell.row >= bounds.startRow && cell.row <= bounds.endRow && cell.column >= bounds.startColumn && cell.column <= bounds.endColumn;
}

export function SoccerSum10Canvas({
  board,
  phase,
  timeLeft,
  onPreviewChange,
  onResolveSelection,
}: {
  board: SoccerSum10Board;
  phase: SoccerSum10Phase;
  timeLeft: number;
  onPreviewChange: (preview: SelectionPreview) => void;
  onResolveSelection: (bounds: GridBounds) => SelectionResult;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageReady, setImageReady] = useState(false);
  const [anchor, setAnchor] = useState<GridPoint | null>(null);
  const [pointer, setPointer] = useState<GridPoint | null>(null);
  const [cursor, setCursor] = useState<GridPoint>({ row: 0, column: 0 });
  const selection = anchor && pointer ? pointToBounds(anchor, pointer) : null;

  useEffect(() => {
    const image = new Image();
    image.onload = () => setImageReady(true);
    image.src = BALL_IMAGE_SRC;
    imageRef.current = image;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      context.setTransform((dpr * rect.width) / LOGICAL_WIDTH, 0, 0, (dpr * rect.height) / LOGICAL_HEIGHT, 0, 0);
      draw();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    draw();
  }, [board, cursor, imageReady, phase, selection, timeLeft]);

  function draw() {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    context.save();
    const selected = selection ? cellsInBounds(board, selection) : [];
    const selectedIds = new Set(selected.map((cell) => cell.id));
    const selectedSum = selected.reduce((sum, cell) => sum + cell.value, 0);
    if (selection) {
      const x = GRID_LEFT + selection.startColumn * CELL_SIZE;
      const y = GRID_TOP + selection.startRow * CELL_SIZE;
      const width = (selection.endColumn - selection.startColumn + 1) * CELL_SIZE;
      const height = (selection.endRow - selection.startRow + 1) * CELL_SIZE;
      const valid = selectedSum === 10;
      context.fillStyle = valid ? "rgba(255, 212, 79, .22)" : "rgba(0, 233, 174, .18)";
      context.fillRect(x + 2, y + 2, width - 4, height - 4);
      context.strokeStyle = valid ? "#ffd44f" : "#00e9ae";
      context.lineWidth = 3;
      context.setLineDash([8, 5]);
      context.strokeRect(x + 2.5, y + 2.5, width - 5, height - 5);
      context.setLineDash([]);
    }

    board.cells.forEach((cell) => {
      if (cell.removed) return;
      const selectedCell = selectedIds.has(cell.id);
      const x = GRID_LEFT + cell.column * CELL_SIZE + CELL_SIZE / 2;
      const y = GRID_TOP + cell.row * CELL_SIZE + CELL_SIZE / 2;
      const radius = 24;
      context.save();
      context.translate(x, y);
      if (selectedCell) {
        context.shadowColor = selectedSum === 10 ? "rgba(255, 212, 79, .95)" : "rgba(0, 233, 174, .95)";
        context.shadowBlur = 15;
        context.beginPath();
        context.arc(0, 0, radius + 4, 0, Math.PI * 2);
        context.fillStyle = selectedSum === 10 ? "rgba(255, 212, 79, .42)" : "rgba(0, 233, 174, .36)";
        context.fill();
        context.strokeStyle = selectedSum === 10 ? "#ffe78f" : "#afffe5";
        context.lineWidth = 2;
        context.stroke();
      }
      const image = imageRef.current;
      if (image?.complete && image.naturalWidth > 0) {
        context.drawImage(image, -radius, -radius, radius * 2, radius * 2);
      } else {
        context.beginPath();
        context.arc(0, 0, radius, 0, Math.PI * 2);
        context.fillStyle = "#f7faf6";
        context.fill();
        context.strokeStyle = "#12261c";
        context.lineWidth = 2;
        context.stroke();
      }
      context.shadowBlur = 0;
      context.beginPath();
      context.arc(0, 1, 16, 0, Math.PI * 2);
      context.fillStyle = "rgba(1, 22, 13, .82)";
      context.fill();
      context.strokeStyle = "rgba(255, 255, 255, .92)";
      context.lineWidth = 1.75;
      context.stroke();
      context.font = `900 28px "Barlow Condensed", "Noto Sans KR", sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.lineWidth = 3.5;
      context.strokeStyle = "#07130d";
      context.strokeText(String(cell.value), 0, 1);
      context.fillStyle = "#ffffff";
      context.fillText(String(cell.value), 0, 1);
      context.restore();
    });

    if (!selection && phase === "playing") {
      const x = GRID_LEFT + cursor.column * CELL_SIZE;
      const y = GRID_TOP + cursor.row * CELL_SIZE;
      context.strokeStyle = "rgba(255, 255, 255, .72)";
      context.lineWidth = 2;
      context.setLineDash([4, 4]);
      context.strokeRect(x + 5, y + 5, CELL_SIZE - 10, CELL_SIZE - 10);
      context.setLineDash([]);
    }
    const gaugeTop = 74;
    const gaugeHeight = 456;
    const gaugeRatio = Math.max(0, Math.min(1, timeLeft / 60));
    context.fillStyle = "rgba(0, 17, 10, .56)";
    context.fillRect(994, gaugeTop, 12, gaugeHeight);
    context.strokeStyle = "rgba(226, 255, 239, .62)";
    context.lineWidth = 1.5;
    context.strokeRect(994.75, gaugeTop + .75, 10.5, gaugeHeight - 1.5);
    const gaugeFillHeight = Math.max(3, (gaugeHeight - 4) * gaugeRatio);
    context.fillStyle = gaugeRatio > .3 ? "#00e9ae" : "#ffd44f";
    context.fillRect(997, gaugeTop + gaugeHeight - 2 - gaugeFillHeight, 6, gaugeFillHeight);
    context.font = "800 17px \"Barlow Condensed\", \"Noto Sans KR\", sans-serif";
    context.textAlign = "center";
    context.fillStyle = "#ffffff";
    context.strokeStyle = "#07130d";
    context.lineWidth = 3;
    context.strokeText(String(timeLeft), 1000, gaugeTop - 11);
    context.fillText(String(timeLeft), 1000, gaugeTop - 11);
    context.restore();
  }

  function preview(nextAnchor: GridPoint | null, nextPointer: GridPoint | null) {
    if (!nextAnchor || !nextPointer) {
      onPreviewChange(null);
      return;
    }
    const bounds = pointToBounds(nextAnchor, nextPointer);
    const cells = cellsInBounds(board, bounds);
    onPreviewChange({ bounds, count: cells.length, sum: cells.reduce((sum, cell) => sum + cell.value, 0) });
  }

  function gridPointFromEvent(event: React.PointerEvent<HTMLCanvasElement>): GridPoint {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * LOGICAL_WIDTH;
    const y = ((event.clientY - rect.top) / rect.height) * LOGICAL_HEIGHT;
    return {
      column: Math.max(0, Math.min(GRID_COLUMNS - 1, Math.floor((x - GRID_LEFT) / CELL_SIZE))),
      row: Math.max(0, Math.min(GRID_ROWS - 1, Math.floor((y - GRID_TOP) / CELL_SIZE))),
    };
  }

  function finishSelection(nextAnchor: GridPoint | null, nextPointer: GridPoint | null) {
    if (!nextAnchor || !nextPointer) return;
    const result = onResolveSelection(pointToBounds(nextAnchor, nextPointer));
    setAnchor(null);
    setPointer(null);
    onPreviewChange(null);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (phase !== "playing") return;
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = gridPointFromEvent(event);
    setCursor(point);
    setAnchor(point);
    setPointer(point);
    preview(point, point);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!anchor || phase !== "playing") return;
    const point = gridPointFromEvent(event);
    setPointer(point);
    preview(anchor, point);
  }

  function handlePointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!anchor) return;
    finishSelection(anchor, gridPointFromEvent(event));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLCanvasElement>) {
    if (phase !== "playing") return;
    const directions: Record<string, [number, number]> = {
      ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
    };
    if (event.key in directions) {
      event.preventDefault();
      const [rowDelta, columnDelta] = directions[event.key];
      const next = {
        row: Math.max(0, Math.min(GRID_ROWS - 1, cursor.row + rowDelta)),
        column: Math.max(0, Math.min(GRID_COLUMNS - 1, cursor.column + columnDelta)),
      };
      setCursor(next);
      if (anchor) {
        setPointer(next);
        preview(anchor, next);
      }
      return;
    }
    if (event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      const nextAnchor = anchor ? null : cursor;
      setAnchor(nextAnchor);
      setPointer(nextAnchor);
      preview(nextAnchor, nextAnchor);
      return;
    }
    if (event.key === "Enter" && anchor) {
      event.preventDefault();
      finishSelection(anchor, pointer ?? cursor);
      return;
    }
    if (event.key === "Escape") {
      setAnchor(null);
      setPointer(null);
      onPreviewChange(null);
    }
  }

  return (
    <canvas
      ref={canvasRef}
      className={`soccer-sum10-canvas ${anchor ? "soccer-sum10-canvas--dragging" : ""}`}
      tabIndex={0}
      aria-label="축구공 합 10 보드. 드래그해 합계 10을 만들거나, 화살표로 이동하고 Space로 시작점을 정한 뒤 Enter로 선택하세요."
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => { setAnchor(null); setPointer(null); onPreviewChange(null); }}
      onKeyDown={handleKeyDown}
    />
  );
}
