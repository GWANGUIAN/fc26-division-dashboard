import { rectIntersection, type CollisionDetection } from "@dnd-kit/core";

/** `data` payload attached to every draggable in the squad builder's single shared DndContext. */
export type DragActiveData =
  | { kind: "candidate"; streamerId: string }
  | { kind: "placed"; streamerId: string; slotId: string };

/** `data` payload attached to every droppable in the squad builder's single shared DndContext. */
export type DragOverData =
  | { kind: "slot"; slotId: string }
  | { kind: "candidate"; streamerId: string }
  | { kind: "drawer" };

/**
 * Uses rect-overlap (not just "is the raw pointer point inside the target")
 * so dropping registers as soon as the dragged card's box touches the
 * target's box at all — matching what the user actually sees (the floating
 * DragOverlay card visually over the target), rather than requiring their
 * literal cursor position to be inside it, which can be well off-center
 * from the card depending on where they grabbed it.
 *
 * The drawer's candidate cards are droppable AND sit inside a single
 * catch-all "drawer-panel" droppable (so a pitch card dropped anywhere in
 * the drawer, not precisely on another candidate, still returns to the
 * candidate list). A pitch slot can sit directly underneath that panel —
 * `drawerCoversTheScreen` says whether the drawer is *currently* the thing
 * actually visible on top there:
 *  - while genuinely open (drawer visibly covering that area), the drawer
 *    wins, same as what the user sees;
 *  - once it's collapsed (or no drag is active), a slot underneath wins
 *    outright instead — this is what lets a candidate drag reach a
 *    low-lying slot (GK, CBs) once the drawer is actually out of the way,
 *    without also letting drops sneak through to a slot that's still
 *    hidden behind a genuinely open drawer.
 */
export function createSquadBuilderCollisionDetection(
  drawerCoversTheScreen: boolean,
): CollisionDetection {
  return (args) => {
    const intersections = rectIntersection(args);
    if (intersections.length === 0) return intersections;

    if (drawerCoversTheScreen) {
      // The drawer is genuinely on top right now, so a slot underneath it
      // must not be reachable — even though dnd-kit's own overlap-ratio
      // math would often still favor the smaller slot rect over the huge
      // drawer-panel rect on its own (which is exactly what made the
      // "slot always wins" version below leak through a still-open
      // drawer). Explicitly drop any slot match instead of just declining
      // to prioritize it.
      const nonSlotCollisions = intersections.filter(
        (collision) => !String(collision.id).startsWith("slot:"),
      );
      return nonSlotCollisions.length > 0 ? nonSlotCollisions : intersections;
    }

    if (intersections.length === 1) return intersections;
    const slotCollision = intersections.find((collision) =>
      String(collision.id).startsWith("slot:"),
    );
    return slotCollision ? [slotCollision] : intersections;
  };
}

export interface DragRect {
  left: number;
  width: number;
}

export type DropIntent = "swap" | "insert-before" | "insert-after";

/** Outer fraction of the target's width (on each side) that counts as "insert" rather than "swap". */
const INSERT_ZONE_FRACTION = 0.25;

/**
 * Classifies where a dragged card is hovering over a target card: the
 * center zone means "drop here to swap the two", the outer edges mean
 * "drop here to insert before/after, shifting the rest over".
 */
export function classifyDropIntent(
  pointerX: number,
  targetRect: DragRect,
): DropIntent {
  const width = targetRect.width || 1;
  const fraction = (pointerX - targetRect.left) / width;
  if (fraction < INSERT_ZONE_FRACTION) return "insert-before";
  if (fraction > 1 - INSERT_ZONE_FRACTION) return "insert-after";
  return "swap";
}

/**
 * Given the candidate order with the dragged id already excluded, returns
 * the index it should land at for an insert-before/insert-after drop on
 * `targetId`. Used to compute the final MOVE_CANDIDATE index on drop.
 *
 * Deliberately NOT used to live-reorder the drawer's SortableContext while
 * hovering: doing that fed a constantly-changing `items` array back into
 * dnd-kit every time the pointer moved, which shifted the target card's
 * measured rect mid-hover, flipped `classifyDropIntent`'s result, and
 * produced a runaway setState loop (cards visibly ping-ponging, eventually
 * an infinite update-depth crash). The swap/insert intent is instead shown
 * with a static CSS highlight on the target card, and the actual reorder
 * (with its own smooth animation) only happens once on drop.
 */
export function resolveInsertIndex(
  orderWithoutDragged: string[],
  targetId: string,
  intent: "insert-before" | "insert-after",
): number {
  const index = orderWithoutDragged.indexOf(targetId);
  if (index === -1) return orderWithoutDragged.length;
  return intent === "insert-before" ? index : index + 1;
}
