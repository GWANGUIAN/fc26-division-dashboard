import { useEffect, useMemo, useState } from "react";
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
import {
  createSquadBuilderCollisionDetection,
  classifyDropIntent,
  resolveInsertIndex,
  type DragActiveData,
  type DragOverData,
  type DropIntent,
} from "./dragInteraction.js";
import { getFormation } from "./formations.js";
import { Pitch } from "./Pitch";
import { SquadBuilderCard } from "./SquadBuilderCard";
import { SquadControls } from "./SquadControls";
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
  const { state, dispatch, activeSquad } = useSquadBuilder(streamers);

  const streamerById = useMemo(
    () => new Map(streamers.map((streamer) => [streamer.id, streamer])),
    [streamers],
  );
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
   * applies). A pitch card drag starts assuming the drawer is collapsed and
   * only forces it open once the pointer reaches down into the collapsed
   * drawer's own strip at the bottom of the screen — so dragging within the
   * pitch (even past the halfway point) never blocks the lower rows. A
   * candidate drag starts assuming the drawer is open (you were hovering it
   * to grab the card) and only forces it collapsed once the pointer leaves
   * that open area upward, onto the pitch.
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
    const kind = activeDragData.kind;
    const onPointerMove = (event: PointerEvent) => {
      const pointerY = event.clientY;
      if (kind === "placed") {
        // Starts collapsed; expands only once the pointer reaches down into
        // the collapsed drawer's own small strip, so dragging within the
        // pitch (even to the back line/GK) never gets blocked by the drawer.
        setDragDrawerExpanded(pointerY > innerHeight - DRAWER_PEEK_PX);
        return;
      }
      // Candidate drags start from inside the open drawer. Hysteresis on
      // purpose: once open, only leaving the drawer's actual open area
      // (crossing the 46vh line) closes it; once closed, only reaching
      // back down into the small collapsed strip reopens it.
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
                candidateOrder: streamers.map((streamer) => streamer.id),
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
          <Pitch
            formation={formation}
            placements={activeSquad.placements}
            streamerById={streamerById}
            overSlotId={overSlotId}
            snapStreamerId={snapStreamerId}
          />
        </div>

        <CandidateDrawer
          candidateIds={activeSquad.candidateOrder}
          streamerById={streamerById}
          dragExpandOverride={dragDrawerExpanded}
          dragIntent={dragIntent}
          onSort={(order) =>
            dispatch({ type: "SORT_CANDIDATES", squadId: activeSquad.id, order })
          }
        />

        <DragOverlay>
          {draggedStreamer && activeDragData && (
            <div className="squad-builder-drag-overlay">
              <SquadBuilderCard
                streamer={draggedStreamer}
                variant={activeDragData.kind === "placed" ? "placed" : "candidate"}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
