// Per-character fine tuning of worn items (docs/pitch/13 §4-2). The automatic placement (engine/equipment.ts) is
// right for most characters; the entries below correct the ones whose head shape it does not fit. Missing entries
// mean "no correction". Offsets are in character-atlas pixels (the 96×96 cell, before depth / locker scaling):
// dx + = toward the right of the atlas frame (a left-facing character is the mirrored frame, so + is always "toward
// where the right-facing frame looks"), dy + = down. `scale` multiplies the item size.

import type { Direction } from "./animations";

export interface ItemFit {
  dx?: number;
  dy?: number;
  scale?: number;
}

/** `all` applies to every direction, then the direction's own entry is added on top (dx / dy add, scale multiplies). */
export type ItemFitViews = Partial<Record<Direction | "all", ItemFit>>;

/** characterId → item id → views. */
export const EQUIP_FIT: Readonly<
  Record<string, Readonly<Record<string, ItemFitViews>>>
> = {
  // 핑구
  sjh4018: {
    // side view: the hats sit a little behind the head, so they are moved 2px toward the facing direction (not headphones, santa, cowboy)
    cap: { down: { dx: -3, dy: 5 }, side: { dx: 6, dy: 3 } },
    beanie: { down: { dx: -2, dy: 2 }, side: { dx: 5, dy: 3 } },
    crown: { down: { dx: -2, dy: 4 }, side: { dx: 3 } },
    wizard: { down: { dx: -2 }, side: { dx: 2 } },
    straw: { down: { dx: -2 }, side: { dx: 4, dy: 2 } },
    headphones: {
      down: { dx: -3, dy: 6 },
      side: { dy: 4 },
      up: { dy: 2 },
    },
    santa: { down: { dy: 2 } },
    cowboy: { down: { dx: -2, dy: 2 }, side: { dx: 5, dy: 1 } },
  },
  // 재닌
  janine95kim: {
    cap: { side: { dx: 2, dy: 1 } },
  },
  // 뽀린걸
  bboringirl: {
    cap: { down: { dx: 1, dy: 3 }, side: { dx: 2, dy: 2 } },
    beanie: { down: { dx: 2, dy: 2 } },
    crown: { up: { dx: -1 }, down: { dx: 1 } },
    straw: { down: { dx: 2 }, up: { dx: -1 } },
    headphones: { down: { dx: 2, dy: 2 } },
    santa: { down: { dx: 3, dy: 1 } },
    cowboy: { down: { dx: 2 } },
  },
  // 쥬멩이
  ju010228: {
    cap: { down: { dx: -2, dy: 1 }, side: { dx: 7 } },
    beanie: { side: { dx: 7, dy: 2 } },
    crown: { side: { dx: 5, dy: 2 } },
    wizard: { side: { dx: 6, dy: 2 } },
    straw: { side: { dx: 6, dy: 2 } },
    headphones: { down: { dx: -2, dy: 3 } },
    cowboy: { side: { dx: 6 } },
  },
  // 우왁굳
  woowakgood: {
    cap: {
      side: { dx: 3 },
    },
    santa: { side: { dx: -4 }, down: { dx: 2 } },
    headphones: { side: { dx: -2 } },
  },
  // 하치
  hachi97: {
    cap: {
      side: { dx: 3, dy: 2 },
      up: { dy: 1 },
    },
    santa: { down: { dx: 2 }, side: { dx: -5 } },
    headphones: {
      side: { dx: -3, dy: 2 },
    },
  },
  kaksjak0730: {
    cap: {
      down: { dx: -2, dy: 2 },
      side: {
        dx: 5,
      },
    },
    beanie: { down: { dx: -2, dy: 3 }, side: { dx: 3 } },
    crown: { down: { dx: -3, dy: 4 }, side: { dx: 4, dy: 3 } },
    wizard: { down: { dx: -3, dy: 2 }, side: { dx: 2 }, up: { dy: -1 } },
    straw: { down: { dx: -2 }, side: { dx: 5 }, up: { dy: -1 } },
    headphones: {
      down: { dx: -2, dy: 3 },
    },
    cowboy: { down: { dx: -2 }, side: { dx: 1 } },
  },
  // 해파린
  haepalin: {
    cap: {
      down: { dx: 1, dy: 2 },
      side: {
        dy: 2,
      },
    },
    beanie: { down: { dx: 2 } },
    crown: { down: { dx: 1, dy: 2 }, side: { dy: 2 }, up: { dx: -2 } },
    wizard: { down: { dx: 1 }, up: { dx: -2 } },
    straw: { down: { dx: 2 }, up: { dx: -2 } },
    headphones: {
      down: { dy: 3 },
      side: { dx: -4, dy: 4 },
      up: { dx: -2 },
    },
    santa: { down: { dx: 3 }, side: { dx: -5 } },
    cowboy: { down: { dx: 2 }, up: { dx: -2 } },
  },
  // 빙밍
  tleod1818: {
    cap: {
      down: { dx: -3, dy: 1 },
      side: { dx: 2, dy: 1 },
      up: { dx: 3, dy: 1 },
    },
    beanie: { down: { dx: -3, dy: 3 }, up: { dx: 2, dy: 2 } },
    crown: { down: { dx: -4, dy: 3 }, up: { dx: 3 } },
    wizard: { down: { dx: -3, dy: 3 }, up: { dx: 2 } },
    straw: { down: { dx: -3, dy: 3 }, up: { dy: 3 } },
    headphones: {
      down: { dx: -2, dy: 4 },
      side: { dx: -1, dy: 4 },
      up: { dx: 2, dy: 3 },
    },
    santa: { down: { dx: -1, dy: 2 }, side: { dx: -4 }, up: { dx: 3, dy: 3 } },
    cowboy: { down: { dx: -3, dy: 3 }, up: { dx: 1, dy: 3 } },
  },
  // 다시바
  tdnlamuron: {
    santa: { side: { dx: -5 } },
    headphones: { side: { dx: -3 } },
  },
  // 리냐
  lina0108: {
    cap: {
      down: { dy: 2 },
      side: { dx: 1, dy: 2 },
    },
    beanie: { down: { dy: 2 } },
    crown: { down: { dy: 3 }, side: { dy: 2 } },
    santa: { down: { dx: 2, dy: 2 }, side: { dx: -3 } },
    headphones: { side: { dx: -6 } },
  },
};

/** Face items (glasses, eye patch) sit this many atlas px lower than the automatic eye line; woowakgood's automatic line is already right. */
export const FACE_DROP_DEFAULT = 2;
const FACE_DROP: Readonly<Record<string, number>> = { woowakgood: 0 };

export function faceDrop(characterId: string): number {
  return FACE_DROP[characterId] ?? FACE_DROP_DEFAULT;
}

export function fitFor(
  characterId: string,
  itemId: string,
  dir: Direction,
): Required<ItemFit> {
  const views = EQUIP_FIT[characterId]?.[itemId];
  const all = views?.all;
  const own = views?.[dir];
  return {
    dx: (all?.dx ?? 0) + (own?.dx ?? 0),
    dy: (all?.dy ?? 0) + (own?.dy ?? 0),
    scale: (all?.scale ?? 1) * (own?.scale ?? 1),
  };
}
