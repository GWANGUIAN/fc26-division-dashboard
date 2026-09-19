// Prop definitions (docs/world/05 §2). The sprite is anchored at its bottom centre — the point that sorts
// against the player's feet — and (w, h) is the converted image's real size (== the 05 table size).
//
// This file is plain data with type-only imports so `scripts/build-world-map.mjs` can import it directly
// (Node ≥ 22.18 strips the types). Keep it free of runtime imports.
//
// Fields
//   content     size of the visible (opaque) art inside the file. The converter keeps the aspect ratio and
//               pads the rest with transparency, so tall thin props (fences, poles) are much smaller than
//               the 05 table says. Footprints below are the 05 values clamped to this.
//   foot        collision footprint(s), centred on `dx` from the feet and ending at the feet line.
//               Omitted = walk-through.
//   aboveFrom   px above the sprite's base. Everything higher than this is drawn again in the "above"
//               layer (over the player): tree canopies, arch spans. Decided in S2: per-prop px with
//               category defaults (trees 40, big oak 48, arches 48–64), none elsewhere.
//   decal       flat ground art: drawn under all entities, not y-sorted, no collision.
//   withered    a `<id>-withered` image exists (auto-derived from the lush one).

export interface PropFoot {
  dx: number;
  w: number;
  h: number;
}

export interface PropDef {
  w: number;
  h: number;
  content: [number, number];
  foot?: PropFoot[];
  aboveFrom?: number;
  decal?: boolean;
  withered?: boolean;
}

export const PROP_DEFS: Record<string, PropDef> = {
  // props-trees
  "tree-oak": { w: 96, h: 128, content: [96, 106], foot: [{ dx: 0, w: 16, h: 12 }], aboveFrom: 40, withered: true },
  "tree-oak-big": { w: 128, h: 160, content: [128, 115], foot: [{ dx: 0, w: 20, h: 14 }], aboveFrom: 48, withered: true },
  "tree-pine": { w: 80, h: 128, content: [80, 106], foot: [{ dx: 0, w: 14, h: 12 }], aboveFrom: 40, withered: true },
  "tree-birch": { w: 80, h: 120, content: [80, 103], foot: [{ dx: 0, w: 14, h: 12 }], aboveFrom: 40, withered: true },
  "tree-sakura": { w: 112, h: 136, content: [112, 107], foot: [{ dx: 0, w: 16, h: 12 }], aboveFrom: 40, withered: true },
  "tree-cloud": { w: 96, h: 128, content: [96, 98], foot: [{ dx: 0, w: 16, h: 12 }], aboveFrom: 40 },
  "tree-frost": { w: 80, h: 128, content: [80, 109], foot: [{ dx: 0, w: 14, h: 12 }], aboveFrom: 40 },
  "tree-night": { w: 96, h: 128, content: [96, 93], foot: [{ dx: 0, w: 16, h: 12 }], aboveFrom: 40 },
  "tree-dead": { w: 88, h: 128, content: [88, 93], foot: [{ dx: 0, w: 14, h: 12 }], aboveFrom: 40 },
  "tree-lava": { w: 88, h: 128, content: [88, 110], foot: [{ dx: 0, w: 14, h: 12 }], aboveFrom: 40 },
  "tree-golden": { w: 96, h: 128, content: [96, 105], foot: [{ dx: 0, w: 16, h: 12 }], aboveFrom: 40 },
  "tree-stump": { w: 40, h: 32, content: [40, 30], foot: [{ dx: 0, w: 32, h: 20 }] },
  // props-plants
  "bush-a": { w: 48, h: 40, content: [46, 40], foot: [{ dx: 0, w: 32, h: 16 }], withered: true },
  "bush-berry": { w: 48, h: 40, content: [48, 39], foot: [{ dx: 0, w: 32, h: 16 }], withered: true },
  "bush-flower": { w: 56, h: 44, content: [54, 44], foot: [{ dx: 0, w: 36, h: 16 }], withered: true },
  "hedge-h": { w: 64, h: 40, content: [64, 35], foot: [{ dx: 0, w: 64, h: 14 }], withered: true },
  "flower-red": { w: 32, h: 24, content: [30, 24], withered: true },
  "flower-yellow": { w: 32, h: 24, content: [32, 24], withered: true },
  "flower-white": { w: 32, h: 24, content: [31, 24], withered: true },
  "flower-blue": { w: 32, h: 24, content: [32, 23], withered: true },
  "grass-tuft-prop": { w: 24, h: 24, content: [24, 22], withered: true },
  "fern": { w: 32, h: 28, content: [32, 27], withered: true },
  "mushrooms": { w: 24, h: 20, content: [23, 20] },
  "reeds": { w: 40, h: 48, content: [40, 39], foot: [{ dx: 0, w: 16, h: 8 }] },
  // props-rocks
  "rock-small": { w: 24, h: 20, content: [23, 20], foot: [{ dx: 0, w: 20, h: 10 }] },
  "rock-medium": { w: 40, h: 32, content: [40, 31], foot: [{ dx: 0, w: 34, h: 14 }] },
  "rock-large": { w: 64, h: 48, content: [52, 48], foot: [{ dx: 0, w: 52, h: 20 }] }, // 05 table 56×20, art is 52×48 → 52×20
  "boulder-mossy": { w: 80, h: 64, content: [68, 64], foot: [{ dx: 0, w: 68, h: 24 }] },
  "log": { w: 48, h: 24, content: [34, 24], foot: [{ dx: 0, w: 34, h: 12 }] }, // 05 table 44×12, art is 34×24 → 34×12
  "log-pile": { w: 56, h: 40, content: [50, 40], foot: [{ dx: 0, w: 48, h: 16 }] },
  "fence-wood-h": { w: 64, h: 32, content: [52, 32], foot: [{ dx: 0, w: 52, h: 10 }] }, // 05 table 64×10, art is 52×32 → 52×10
  "fence-wood-v": { w: 16, h: 48, content: [16, 20], foot: [{ dx: 0, w: 12, h: 20 }] }, // 05 table 12×44, art is 16×20 → 12×20
  "fence-wood-corner": { w: 32, h: 48, content: [32, 26], foot: [{ dx: 0, w: 32, h: 10 }] },
  "stone-wall-h": { w: 64, h: 40, content: [64, 39], foot: [{ dx: 0, w: 64, h: 14 }] },
  "stone-wall-v": { w: 24, h: 64, content: [24, 35], foot: [{ dx: 0, w: 20, h: 35 }] }, // 05 table 20×60, art is 24×35 → 20×35
  "cliff-face": { w: 96, h: 64, content: [66, 64], foot: [{ dx: 0, w: 66, h: 24 }] }, // 05 table 96×24, art is 66×64 → 66×24
  // props-town
  "lamp-post": { w: 24, h: 64, content: [24, 47], foot: [{ dx: 0, w: 10, h: 8 }] },
  "bench-h": { w: 48, h: 32, content: [45, 32], foot: [{ dx: 0, w: 44, h: 12 }] },
  "bench-v": { w: 24, h: 40, content: [24, 35], foot: [{ dx: 0, w: 20, h: 30 }] },
  "signpost-arrow": { w: 32, h: 56, content: [32, 42], foot: [{ dx: 0, w: 10, h: 8 }] },
  "board-daily": { w: 96, h: 80, content: [94, 80], foot: [{ dx: 0, w: 88, h: 14 }] },
  "mailbox": { w: 24, h: 40, content: [22, 40], foot: [{ dx: 0, w: 12, h: 8 }] },
  "trash-bin": { w: 20, h: 28, content: [20, 27], foot: [{ dx: 0, w: 16, h: 8 }] },
  "flagpole": { w: 32, h: 96, content: [32, 40], foot: [{ dx: 0, w: 10, h: 8 }] },
  "planter": { w: 40, h: 32, content: [34, 32], foot: [{ dx: 0, w: 34, h: 14 }] }, // 05 table 36×14, art is 34×32 → 34×14
  "market-stall": { w: 64, h: 56, content: [64, 54], foot: [{ dx: 0, w: 56, h: 16 }] },
  "bike-rack": { w: 56, h: 32, content: [44, 32], foot: [{ dx: 0, w: 44, h: 12 }] }, // 05 table 48×12, art is 44×32 → 44×12
  "mat-door": { w: 56, h: 32, content: [53, 32], decal: true },
  // props-football
  "goal-west": { w: 64, h: 96, content: [64, 71], foot: [{ dx: 0, w: 64, h: 71 }] }, // 05 table 64×96, art is 64×71 → 64×71
  "goal-front": { w: 96, h: 64, content: [96, 60], foot: [{ dx: 0, w: 96, h: 60 }] }, // 05 table 96×64, art is 96×60 → 96×60
  "corner-flag": { w: 16, h: 40, content: [16, 27] },
  "cone-orange": { w: 20, h: 24, content: [20, 24] },
  "cone-row": { w: 64, h: 24, content: [64, 24] },
  "hurdle": { w: 40, h: 28, content: [40, 23], foot: [{ dx: 0, w: 34, h: 8 }] },
  "ball-standard": { w: 16, h: 16, content: [16, 16] },
  "ad-board": { w: 96, h: 32, content: [51, 32], foot: [{ dx: 0, w: 51, h: 10 }] }, // 05 table 96×10, art is 51×32 → 51×10
  "bleacher": { w: 128, h: 96, content: [118, 96], foot: [{ dx: 0, w: 118, h: 40 }] }, // 05 table 120×40, art is 118×96 → 118×40
  "dugout": { w: 96, h: 64, content: [75, 64], foot: [{ dx: 0, w: 75, h: 24 }] }, // 05 table 90×24, art is 75×64 → 75×24
  "dummy-wall": { w: 72, h: 56, content: [56, 56], foot: [{ dx: 0, w: 56, h: 14 }] }, // 05 table 68×14, art is 56×56 → 56×14
  "ball-bag": { w: 32, h: 28, content: [24, 28], foot: [{ dx: 0, w: 24, h: 10 }] }, // 05 table 28×10, art is 24×28 → 24×10
  // props-spring
  "sakura-arch": { w: 128, h: 128, content: [128, 126], foot: [{ dx: -48, w: 12, h: 10 }, { dx: 48, w: 12, h: 10 }], aboveFrom: 64 },
  "flower-arch": { w: 112, h: 112, content: [112, 111], foot: [{ dx: -40, w: 12, h: 10 }, { dx: 40, w: 12, h: 10 }], aboveFrom: 56 },
  "vine-trellis": { w: 64, h: 96, content: [64, 64], foot: [{ dx: 0, w: 56, h: 12 }] },
  "lantern-pink": { w: 24, h: 48, content: [24, 33], foot: [{ dx: 0, w: 14, h: 10 }] },
  "petal-pile": { w: 48, h: 24, content: [45, 24], decal: true },
  "dragon-statue": { w: 128, h: 160, content: [128, 129], foot: [{ dx: 0, w: 80, h: 28 }] },
  "dragon-egg": { w: 40, h: 56, content: [40, 43], foot: [{ dx: 0, w: 28, h: 14 }] },
  "pond-small": { w: 96, h: 64, content: [78, 64], foot: [{ dx: 0, w: 78, h: 40 }] }, // 05 table 84×40, art is 78×64 → 78×40
  "bridge-mini": { w: 64, h: 48, content: [62, 48] },
  "scarecrow": { w: 40, h: 72, content: [40, 54], foot: [{ dx: 0, w: 12, h: 10 }] },
  "picnic-blanket": { w: 56, h: 40, content: [50, 40], decal: true },
  "windchime": { w: 24, h: 56, content: [24, 40], foot: [{ dx: 0, w: 10, h: 8 }] },
  // props-frost
  "ice-crystal-a": { w: 56, h: 80, content: [56, 63], foot: [{ dx: 0, w: 32, h: 14 }] },
  "ice-crystal-b": { w: 48, h: 64, content: [48, 54], foot: [{ dx: 0, w: 28, h: 12 }] },
  "snowman": { w: 40, h: 56, content: [40, 44], foot: [{ dx: 0, w: 24, h: 12 }] },
  "telescope": { w: 40, h: 64, content: [40, 49], foot: [{ dx: 0, w: 20, h: 12 }] },
  "star-lamp": { w: 24, h: 72, content: [23, 37], foot: [{ dx: 0, w: 10, h: 8 }] },
  "rink-board-h": { w: 64, h: 32, content: [52, 32], foot: [{ dx: 0, w: 52, h: 10 }] }, // 05 table 64×10, art is 52×32 → 52×10
  "rink-board-v": { w: 16, h: 48, content: [16, 21], foot: [{ dx: 0, w: 12, h: 21 }] }, // 05 table 12×44, art is 16×21 → 12×21
  "night-flower": { w: 32, h: 24, content: [31, 24] },
  "boat-small": { w: 72, h: 40, content: [42, 40], foot: [{ dx: 0, w: 42, h: 18 }] }, // 05 table 64×18, art is 42×40 → 42×18
  "dock-post": { w: 16, h: 40, content: [16, 16], foot: [{ dx: 0, w: 10, h: 8 }] },
  "pier-lantern": { w: 20, h: 48, content: [20, 26], foot: [{ dx: 0, w: 10, h: 8 }] },
  "lily-pads": { w: 40, h: 24, content: [31, 24], decal: true },
  // props-forge
  "pipe-h": { w: 64, h: 24, content: [53, 24], foot: [{ dx: 0, w: 53, h: 10 }] }, // 05 table 64×10, art is 53×24 → 53×10
  "pipe-v": { w: 24, h: 64, content: [24, 45], foot: [{ dx: 0, w: 12, h: 45 }] }, // 05 table 12×56, art is 24×45 → 12×45
  "pipe-corner": { w: 32, h: 32, content: [32, 25], foot: [{ dx: 0, w: 28, h: 25 }] }, // 05 table 28×28, art is 32×25 → 28×25
  "barrel-red": { w: 28, h: 36, content: [22, 36], foot: [{ dx: 0, w: 22, h: 10 }] },
  "barrel-gray": { w: 28, h: 36, content: [22, 36], foot: [{ dx: 0, w: 22, h: 10 }] },
  "crate-stack": { w: 48, h: 48, content: [48, 44], foot: [{ dx: 0, w: 44, h: 16 }] },
  "generator": { w: 56, h: 48, content: [53, 48], foot: [{ dx: 0, w: 52, h: 18 }] },
  "lava-vent": { w: 40, h: 32, content: [39, 32], foot: [{ dx: 0, w: 32, h: 12 }] },
  "chimney-small": { w: 32, h: 72, content: [32, 45], foot: [{ dx: 0, w: 22, h: 14 }] },
  "anvil": { w: 40, h: 32, content: [32, 32], foot: [{ dx: 0, w: 32, h: 12 }] },
  "tool-rack": { w: 56, h: 40, content: [49, 40], foot: [{ dx: 0, w: 49, h: 10 }] }, // 05 table 52×10, art is 49×40 → 49×10
  "scrap-pile": { w: 56, h: 36, content: [41, 36], foot: [{ dx: 0, w: 41, h: 14 }] }, // 05 table 48×14, art is 41×36 → 41×14
  // props-cloud
  "cloud-pillar": { w: 40, h: 88, content: [40, 57], foot: [{ dx: 0, w: 28, h: 14 }] },
  "cloud-bench": { w: 56, h: 32, content: [43, 32], foot: [{ dx: 0, w: 43, h: 12 }] }, // 05 table 50×12, art is 43×32 → 43×12
  "rune-stone-a": { w: 40, h: 72, content: [40, 51], foot: [{ dx: 0, w: 26, h: 12 }] },
  "rune-stone-b": { w: 40, h: 64, content: [40, 50], foot: [{ dx: 0, w: 26, h: 12 }] },
  "rune-circle": { w: 128, h: 96, content: [117, 88], decal: true },
  "crystal-purple": { w: 32, h: 56, content: [32, 39], foot: [{ dx: 0, w: 20, h: 10 }] },
  "floating-book": { w: 32, h: 32, content: [32, 27] },
  "wind-vane": { w: 32, h: 72, content: [32, 33], foot: [{ dx: 0, w: 10, h: 8 }] },
  "cloud-fountain": { w: 80, h: 64, content: [62, 64], foot: [{ dx: 0, w: 62, h: 28 }] }, // 05 table 72×28, art is 62×64 → 62×28
  "banner-blue": { w: 24, h: 72, content: [24, 40], foot: [{ dx: 0, w: 10, h: 8 }] },
  "stone-arch": { w: 96, h: 96, content: [88, 96], foot: [{ dx: -36, w: 12, h: 10 }, { dx: 36, w: 12, h: 10 }], aboveFrom: 48 },
  "cloud-stairs": { w: 64, h: 32, content: [35, 32] },
  // props-weed
  "mower-ride-on": { w: 80, h: 64, content: [69, 64], foot: [{ dx: 0, w: 69, h: 24 }] }, // 05 table 72×24, art is 69×64 → 69×24
  "mower-push": { w: 40, h: 40, content: [37, 40], foot: [{ dx: 0, w: 32, h: 14 }] },
  "fence-barbed-h": { w: 64, h: 40, content: [64, 37], foot: [{ dx: 0, w: 64, h: 10 }] },
  "fence-barbed-v": { w: 16, h: 56, content: [16, 29], foot: [{ dx: 0, w: 12, h: 29 }] }, // 05 table 12×52, art is 16×29 → 12×29
  "warning-sign": { w: 32, h: 56, content: [32, 56], foot: [{ dx: 0, w: 10, h: 8 }] },
  "cut-grass-pile": { w: 40, h: 24, content: [28, 23] },
  "barricade": { w: 72, h: 32, content: [36, 32], foot: [{ dx: 0, w: 36, h: 12 }] }, // 05 table 72×12, art is 36×32 → 36×12
  "oil-drum": { w: 28, h: 36, content: [23, 36], foot: [{ dx: 0, w: 22, h: 10 }] },
  "tire-stack": { w: 40, h: 40, content: [39, 34], foot: [{ dx: 0, w: 34, h: 14 }] },
  "floodlight": { w: 24, h: 88, content: [24, 62], foot: [{ dx: 0, w: 10, h: 8 }] },
  "chimney-tall": { w: 48, h: 128, content: [48, 75], foot: [{ dx: 0, w: 32, h: 16 }] },
  "king-statue": { w: 56, h: 88, content: [56, 82], foot: [{ dx: 0, w: 36, h: 14 }] },
  // secret (single image, not on a sheet): the backwards-walking statue of the rune hill
  "mystery-statue": { w: 56, h: 88, content: [40, 88], foot: [{ dx: 0, w: 36, h: 14 }] },
  // the plaza's collection book stand (single image), next to the daily board
  "collection-stand": { w: 32, h: 48, content: [26, 48], foot: [{ dx: 0, w: 22, h: 10 }] },
};

/** Asset key of a prop's image (lush, or its withered twin). */
export function propAssetKey(id: string, withered = false): string {
  return withered ? `props/${id}-withered` : `props/${id}`;
}

export function getPropDef(id: string): PropDef | undefined {
  return PROP_DEFS[id];
}
