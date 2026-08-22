import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
  type DragCancelEvent,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { X } from "lucide-react";
import type { StreamerRecord } from "../../shared/model.js";
import "./squad-builder.css";
import { CandidateDrawer } from "./CandidateDrawer";
import { CustomPlayerDialog } from "./CustomPlayerDialog";
import type { SquadPlayer } from "./customPlayerTypes.js";
import {
  createSquadBuilderCollisionDetection,
  classifyDropIntent,
  resolveInsertIndex,
  type DragActiveData,
  type DragOverData,
  type DropIntent,
} from "./dragInteraction.js";
import { getFormation } from "./formations.js";
import { LineupPanel } from "./LineupPanel";
import { Pitch } from "./Pitch";
import { SquadBuilderCard } from "./SquadBuilderCard";
import { ConfirmDialog, SquadControls } from "./SquadControls";
import { useCustomPlayers } from "./useCustomPlayers.js";
import { useSquadBuilder } from "./useSquadBuilder.js";

/** Must match `--drawer-peek` in squad-builder.css (the collapsed drawer's height). */
const DRAWER_PEEK_PX = 132;
/**
 * Must match the drawer's `:hover`/`:focus-within` `max-height: 46vh` in
 * squad-builder.css — this is the "have I actually left the open drawer's
 * area" line for a candidate drag. It's fine for this to be generous (it
 * used to also double as "how far the drawer visually blocks drops", which
 * pushed it down to an artificially small value and made it feel like it
 * closed instantly); the drawer-panel droppable is now outright *disabled*
 * whenever it's meant to be out of the way (see CandidateDrawer), so a
 * still-open drawer no longer swallows drops onto the pitch underneath it —
 * the two concerns don't need to share one threshold anymore.
 */
const DRAWER_EXPANDED_FRACTION = 0.46;

/**
 * The drawer's height changes via CSS during a drag (collapsing/expanding),
 * but dnd-kit only measures droppable rects once by default — without this,
 * the drawer-panel droppable keeps the stale (larger) rect it had at drag
 * start, so the pointer can register as "still over the drawer" even after
 * it has visually collapsed, silently swallowing drops onto the pitch rows
 * that used to sit under it.
 */
const MEASURING_CONFIG = {
  droppable: { strategy: MeasuringStrategy.Always },
};

/**
 * Card size preference for the pitch — a continuous multiplier (not the
 * discrete card-board--zoom-N steps used for the main card grid in App.tsx)
 * since squad-card's internals are already cqw-based and scale cleanly at
 * any ratio. Kept as a plain UI preference outside the squad reducer/storage
 * (see storage.ts) since it isn't squad data.
 */
const SQUAD_ZOOM_STORAGE_KEY = "fc26-squad-zoom";
const SQUAD_ZOOM_MIN = 0.5;
const SQUAD_ZOOM_MAX = 2;
const SQUAD_ZOOM_DEFAULT = 1.65;
const SQUAD_ZOOM_STEP = 0.05;

function loadSquadZoom(): number {
  try {
    const raw = localStorage.getItem(SQUAD_ZOOM_STORAGE_KEY);
    if (!raw) return SQUAD_ZOOM_DEFAULT;
    const value = Number(raw);
    if (!Number.isFinite(value)) return SQUAD_ZOOM_DEFAULT;
    return Math.min(SQUAD_ZOOM_MAX, Math.max(SQUAD_ZOOM_MIN, value));
  } catch {
    return SQUAD_ZOOM_DEFAULT;
  }
}

function saveSquadZoom(value: number) {
  try {
    localStorage.setItem(SQUAD_ZOOM_STORAGE_KEY, String(value));
  } catch {
    /* ignore quota/private-browsing errors */
  }
}

function useEscape(onClose: () => void) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    addEventListener("keydown", close);
    return () => removeEventListener("keydown", close);
  }, [onClose]);
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

export function SquadBuilderOverlay({
  streamers,
  onClose,
}: {
  streamers: StreamerRecord[];
  onClose: () => void;
}) {
  useEscape(onClose);
  useBodyScrollLock();
  const {
    customPlayers,
    photoUrlById,
    customPlayerStreamerRecords,
    addCustomPlayer,
    updateCustomPlayer,
    deleteCustomPlayer,
  } = useCustomPlayers();
  const allPlayers = useMemo<SquadPlayer[]>(
    () => [...customPlayerStreamerRecords, ...streamers],
    [streamers, customPlayerStreamerRecords],
  );
  const { state, dispatch, activeSquad } = useSquadBuilder(allPlayers);

  const streamerById = useMemo(
    () => new Map(allPlayers.map((player) => [player.id, player])),
    [allPlayers],
  );

  const [zoom, setZoom] = useState(() => loadSquadZoom());
  useEffect(() => saveSquadZoom(zoom), [zoom]);

  const [dialogMode, setDialogMode] = useState<
    { mode: "add" } | { mode: "edit"; id: string } | null
  >(null);
  const [pendingDelete, setPendingDelete] = useState<
    { id: string; name: string } | null
  >(null);
  const formation = useMemo(
    () => getFormation(activeSquad.formationId),
    [activeSquad.formationId],
  );

  const [activeDragData, setActiveDragData] = useState<DragActiveData | null>(
    null,
  );
  const [overSlotId, setOverSlotId] = useState<string | null>(null);
  const [dragIntent, setDragIntent] = useState<
    { targetId: string; intent: DropIntent } | null
  >(null);
  /**
   * Whether the drawer should be forced open/closed for the duration of the
   * active drag, `null` when nothing is being dragged (normal hover behavior
   * applies). The two drag kinds only differ in their *starting* value: a
   * pitch card drag starts assuming collapsed (so dragging within the pitch,
   * even to the back line/GK, never gets blocked by the drawer), a
   * candidate drag starts assuming open (you were hovering the drawer to
   * grab the card). From there both follow the same hysteresis (see the
   * pointermove effect below) — once opened, only crossing the drawer's
   * actual open-height line collapses it again; once collapsed, only
   * reaching back down into its small collapsed strip reopens it.
   */
  const [dragDrawerExpanded, setDragDrawerExpanded] = useState<boolean | null>(
    null,
  );
  // Recomputed whenever the drawer's forced open/closed state changes, so a
  // pitch slot only wins over the drawer-panel once the drawer has actually
  // stopped covering it — while it's still genuinely open on screen, the
  // drawer (being what's visually on top) should keep catching the drop.
  const collisionDetection = useMemo(
    () => createSquadBuilderCollisionDetection(dragDrawerExpanded === true),
    [dragDrawerExpanded],
  );
  /** The streamer whose pitch card should skip its position transition on
   * the next render — set right after a pitch swap/move so the card the
   * user just dragged snaps straight to the drop point (where the
   * DragOverlay already visually placed it) instead of replaying the
   * slide from its old slot; the *other* swapped card still animates
   * normally. Cleared a couple of frames later so future moves animate. */
  const [snapStreamerId, setSnapStreamerId] = useState<string | null>(null);

  useEffect(() => {
    if (!snapStreamerId) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setSnapStreamerId(null));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [snapStreamerId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const resetDragState = () => {
    setActiveDragData(null);
    setOverSlotId(null);
    setDragIntent(null);
    setDragDrawerExpanded(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as DragActiveData | undefined;
    if (!data) return;
    setActiveDragData(data);
    // Candidate drags start from inside the (hovered, open) drawer; pitch
    // drags start from the pitch, where the drawer is presumably collapsed.
    setDragDrawerExpanded(data.kind === "candidate");
  };

  /**
   * Tracks the *actual* cursor/touch position directly via a native
   * pointermove listener, rather than dnd-kit's `active.rect.current`
   * (the dragged element's own measured box, which lags behind the real
   * pointer by however far off-center the user grabbed the card).
   */
  useEffect(() => {
    if (!activeDragData) return;
    const onPointerMove = (event: PointerEvent) => {
      const pointerY = event.clientY;
      // Same hysteresis for both drag kinds, regardless of which state they
      // started in (see handleDragStart): while expanded, only leaving the
      // drawer's actual open area (crossing the 46vh line) collapses it
      // again; while collapsed, only reaching back down into the small
      // collapsed strip (132px) expands it. A single shared threshold used
      // to flip a pitch-card drag closed again the instant it stepped back
      // out of that small strip, which felt like it was using the wrong
      // (too-low) line once the drawer had actually opened.
      // collisionDetection (see dragInteraction.ts) is what keeps a
      // still-open drawer from swallowing drops onto the pitch underneath
      // it — this threshold only needs to match what the drawer visually
      // does, not also guard the pitch.
      const openThresholdY = innerHeight * (1 - DRAWER_EXPANDED_FRACTION);
      const closedThresholdY = innerHeight - DRAWER_PEEK_PX;
      setDragDrawerExpanded((expanded) =>
        expanded ? pointerY >= openThresholdY : pointerY >= closedThresholdY,
      );
    };
    window.addEventListener("pointermove", onPointerMove);
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [activeDragData]);

  const handleDragOver = (event: DragOverEvent) => {
    const overData = event.over?.data.current as DragOverData | undefined;
    if (!overData) {
      setOverSlotId(null);
      setDragIntent(null);
      return;
    }
    if (overData.kind === "slot") {
      setOverSlotId(overData.slotId);
      setDragIntent(null);
      return;
    }
    setOverSlotId(null);
    if (
      overData.kind === "candidate" &&
      activeDragData?.kind === "candidate" &&
      overData.streamerId !== activeDragData.streamerId &&
      event.over
    ) {
      const activeRect = event.active.rect.current.translated;
      const overRect = event.over.rect;
      const pointerX = activeRect
        ? activeRect.left + activeRect.width / 2
        : overRect.left + overRect.width / 2;
      setDragIntent({
        targetId: overData.streamerId,
        intent: classifyDropIntent(pointerX, overRect),
      });
    } else {
      setDragIntent(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const activeData = event.active.data.current as DragActiveData | undefined;
    const overData = event.over?.data.current as DragOverData | undefined;

    if (activeData && overData) {
      if (activeData.kind === "candidate") {
        if (overData.kind === "slot") {
          dispatch({
            type: "PLACE_CANDIDATE",
            squadId: activeSquad.id,
            streamerId: activeData.streamerId,
            slotId: overData.slotId,
          });
        } else if (
          overData.kind === "candidate" &&
          overData.streamerId !== activeData.streamerId &&
          dragIntent
        ) {
          if (dragIntent.intent === "swap") {
            dispatch({
              type: "SWAP_CANDIDATES",
              squadId: activeSquad.id,
              idA: activeData.streamerId,
              idB: overData.streamerId,
            });
          } else {
            const withoutDragged = activeSquad.candidateOrder.filter(
              (id) => id !== activeData.streamerId,
            );
            const toIndex = resolveInsertIndex(
              withoutDragged,
              overData.streamerId,
              dragIntent.intent,
            );
            dispatch({
              type: "MOVE_CANDIDATE",
              squadId: activeSquad.id,
              streamerId: activeData.streamerId,
              toIndex,
            });
          }
        }
      } else if (activeData.kind === "placed") {
        if (overData.kind === "slot") {
          if (overData.slotId !== activeData.slotId) {
            dispatch({
              type: "MOVE_PLACED",
              squadId: activeSquad.id,
              fromSlotId: activeData.slotId,
              toSlotId: overData.slotId,
            });
            setSnapStreamerId(activeData.streamerId);
          }
        } else if (overData.kind === "candidate" || overData.kind === "drawer") {
          dispatch({
            type: "RETURN_TO_CANDIDATES",
            squadId: activeSquad.id,
            streamerId: activeData.streamerId,
          });
        }
      }
    }

    resetDragState();
  };

  const handleDragCancel = (_event: DragCancelEvent) => resetDragState();

  const draggedStreamer = activeDragData
    ? streamerById.get(activeDragData.streamerId)
    : undefined;

  return (
    <div
      className="squad-builder-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="스쿼드 빌더"
    >
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        measuring={MEASURING_CONFIG}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <header className="squad-builder-overlay__header">
          <div className="squad-builder-overlay__header-spacer" aria-hidden="true" />
          <SquadControls
            squads={state.squads}
            activeSquadId={activeSquad.id}
            onSelect={(squadId) => dispatch({ type: "SELECT_SQUAD", squadId })}
            onAdd={(name) =>
              dispatch({
                type: "ADD_SQUAD",
                name,
                candidateOrder: allPlayers.map((player) => player.id),
              })
            }
            onRename={(squadId, name) =>
              dispatch({ type: "RENAME_SQUAD", squadId, name })
            }
            onDelete={(squadId) => dispatch({ type: "DELETE_SQUAD", squadId })}
            formationId={activeSquad.formationId}
            onFormationChange={(formationId) =>
              dispatch({
                type: "SET_FORMATION",
                squadId: activeSquad.id,
                formationId,
              })
            }
          />
          <button
            type="button"
            className="squad-builder-overlay__close"
            onClick={onClose}
            aria-label="스쿼드 빌더 닫기"
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="squad-builder-overlay__pitch-wrap">
          <LineupPanel
            formation={formation}
            placements={activeSquad.placements}
            streamerById={streamerById}
            hasSlotOffsets={
              Object.keys(activeSquad.slotOffsets ?? {}).length > 0
            }
            onResetPositions={() =>
              dispatch({ type: "RESET_SLOT_OFFSETS", squadId: activeSquad.id })
            }
          />
          <div className="squad-zoom-panel">
            <span className="squad-zoom-panel__label">카드 크기</span>
            <div className="squad-zoom-panel__row">
              <input
                type="range"
                min={SQUAD_ZOOM_MIN}
                max={SQUAD_ZOOM_MAX}
                step={SQUAD_ZOOM_STEP}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                aria-label="카드 크기 조절"
              />
              <span className="squad-zoom-panel__value">
                {Math.round(zoom * 100)}%
              </span>
            </div>
          </div>
          <Pitch
            formation={formation}
            placements={activeSquad.placements}
            streamerById={streamerById}
            overSlotId={overSlotId}
            snapStreamerId={snapStreamerId}
            zoom={zoom}
            slotOffsets={activeSquad.slotOffsets ?? {}}
            onNudgeSlot={(slotId, slotXPct, slotYPct, dxPct, dyPct) =>
              dispatch({
                type: "NUDGE_SLOT",
                squadId: activeSquad.id,
                slotId,
                slotXPct,
                slotYPct,
                dxPct,
                dyPct,
              })
            }
            onRequestEditCustomPlayer={(id) => setDialogMode({ mode: "edit", id })}
            onRequestDeleteCustomPlayer={(id, name) => setPendingDelete({ id, name })}
          />
        </div>

        <CandidateDrawer
          candidateIds={activeSquad.candidateOrder}
          streamerById={streamerById}
          dragExpandOverride={dragDrawerExpanded}
          dragIntent={dragIntent}
          showReturnHint={
            activeDragData?.kind === "placed" && dragDrawerExpanded === true
          }
          onSort={(order) =>
            dispatch({ type: "SORT_CANDIDATES", squadId: activeSquad.id, order })
          }
          onAddCustomPlayer={() => setDialogMode({ mode: "add" })}
          onRequestEditCustomPlayer={(id) => setDialogMode({ mode: "edit", id })}
          onRequestDeleteCustomPlayer={(id, name) => setPendingDelete({ id, name })}
        />

        <DragOverlay>
          {draggedStreamer && activeDragData && (
            <div
              className="squad-builder-drag-overlay"
              style={{ "--squad-zoom": zoom } as CSSProperties}
            >
              <SquadBuilderCard
                streamer={draggedStreamer}
                variant={activeDragData.kind === "placed" ? "placed" : "candidate"}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {dialogMode?.mode === "add" && (
        <CustomPlayerDialog
          onSubmit={(input, photoAction) => {
            addCustomPlayer(input, photoAction instanceof File ? photoAction : null);
            setDialogMode(null);
          }}
          onClose={() => setDialogMode(null)}
        />
      )}
      {dialogMode?.mode === "edit" &&
        (() => {
          const player = customPlayers.find((p) => p.id === dialogMode.id);
          if (!player) return null;
          return (
            <CustomPlayerDialog
              player={player}
              currentPhotoUrl={photoUrlById.get(player.id) ?? player.staticPhotoUrl}
              onSubmit={(input, photoAction) => {
                updateCustomPlayer(player.id, input, photoAction);
                setDialogMode(null);
              }}
              onClose={() => setDialogMode(null)}
            />
          );
        })()}
      {pendingDelete && (
        <ConfirmDialog
          title="커스텀 선수 삭제"
          message={`"${pendingDelete.name}" 선수를 삭제할까요? 스쿼드에 배치되어 있었다면 함께 제거됩니다.`}
          confirmLabel="삭제"
          onConfirm={() => {
            deleteCustomPlayer(pendingDelete.id);
            setPendingDelete(null);
          }}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
