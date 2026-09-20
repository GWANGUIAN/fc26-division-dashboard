import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { WORLD_ONAIR_SOOP_IDS } from "../../../shared/world-onair.js";
import { OVERWORLD_MAP } from "../data/maps";
import { WORLD_CAST } from "../data/worldCast";
import { ON_AIR_FALLBACK_SIZE, ON_AIR_KEYS, ON_AIR_RISE, drawOnAirSign, entranceX, findOnAirSigns, homeSignAnchor, onAirRect, onAirSignAt, onAirSize } from "./onAirSign";
import { getScene } from "./mapScene";
import { HOME_SIGN_GAP, HOME_SIGN_HEIGHT, HOME_SIGN_RISE } from "./doorSigns";
import { TILE, drawHomeSign } from "./render";

const overworld = getScene("overworld")!;
const signs = findOnAirSigns(overworld.buildings, OVERWORLD_MAP);
const size = { w: ON_AIR_FALLBACK_SIZE.w, h: ON_AIR_FALLBACK_SIZE.h };

describe("findOnAirSigns", () => {
  it("puts one sign on each of the 11 member houses and nowhere else", () => {
    expect(signs.map((sign) => sign.soopId).sort()).toEqual([...WORLD_ONAIR_SOOP_IDS].sort());
    const playable = WORLD_CAST.filter((cast) => cast.playable).map((cast) => cast.id);
    expect(signs.map((sign) => sign.soopId).sort()).toEqual([...playable].sort());
    expect(findOnAirSigns(overworld.buildings.filter((building) => !building.id.startsWith("house-")), OVERWORLD_MAP)).toEqual([]);
  });

  it("centres each sign on the middle of its house's entrance mat, above the name plate", () => {
    for (const sign of signs) {
      const building = overworld.buildings[sign.buildingIndex];
      const door = OVERWORLD_MAP.buildings.find((entry) => entry.id === building.id)!.door!;
      expect(building.id).toBe(`house-${sign.soopId}`);
      // the mat lies just below the doorstep row, within a door's width of the door tiles
      const doorstep = (door[1] + 1) * TILE;
      const mats = OVERWORLD_MAP.props.filter((prop) => prop.prop === "mat-door" && prop.y > doorstep && prop.y <= doorstep + 64 && Math.abs(prop.x - (door[0] + 1) * TILE) <= 64);
      expect(mats, sign.soopId).toHaveLength(1);
      expect(sign.x, sign.soopId).toBe(mats[0].x);
      expect(sign.y, sign.soopId).toBe(building.y - ON_AIR_RISE);
    }
  });

  it("keeps the ON AIR sign where it was: 72 px above the doorstep row", () => {
    expect(ON_AIR_RISE).toBe(72);
    for (const sign of signs) expect(sign.y, sign.soopId).toBe(overworld.buildings[sign.buildingIndex].y - 72);
  });

  it("stacks the name plate above the ON AIR sign without touching it", () => {
    for (const sign of signs) {
      const building = overworld.buildings[sign.buildingIndex];
      const signTop = sign.y - size.h;
      const plateTop = building.y - HOME_SIGN_RISE;
      const plateBottom = plateTop + HOME_SIGN_HEIGHT;
      expect(plateBottom, sign.soopId).toBe(signTop - HOME_SIGN_GAP);
      expect(plateBottom, sign.soopId).toBeLessThan(signTop);
      // and it still lies inside the house sprite
      expect(plateTop, sign.soopId).toBeGreaterThanOrEqual(building.y - building.h);
    }
  });

  it("uses the hand-placed entrance mats: they differ from the door tiles' middle, which is why", () => {
    const tileMiddle = (id: string) => {
      const door = OVERWORLD_MAP.buildings.find((entry) => entry.id === `house-${id}`)!.door!;
      return (door[0] + door[2] / 2) * TILE;
    };
    const byId = Object.fromEntries(signs.map((sign) => [sign.soopId, sign.x]));
    expect(byId.hachi97).toBe(249);
    expect(byId.doormomo).toBe(2165);
    expect(byId.janine95kim).toBe(2035);
    expect(byId.hachi97).not.toBe(tileMiddle("hachi97"));
    expect(byId.doormomo).not.toBe(tileMiddle("doormomo"));
  });

  it("keeps every sign inside its house sprite", () => {
    for (const sign of signs) {
      const building = overworld.buildings[sign.buildingIndex];
      const rect = onAirRect(sign, size);
      expect(rect.x, sign.soopId).toBeGreaterThanOrEqual(building.x - building.w / 2);
      expect(rect.x + rect.w, sign.soopId).toBeLessThanOrEqual(building.x + building.w / 2);
      expect(rect.y, sign.soopId).toBeGreaterThanOrEqual(building.y - building.h);
      expect(rect.y + rect.h, sign.soopId).toBeLessThanOrEqual(building.y);
    }
  });

  it("paints the sign with the last strip of its house, so it is never hidden behind its own wall", () => {
    for (const sign of signs) {
      const fronts = overworld.buildings[sign.buildingIndex].fronts;
      const widest = Math.max(...fronts.map((front) => front.sortY));
      expect(fronts[sign.stripIndex].sortY).toBe(widest);
      expect(fronts.map((front) => front.sortY).lastIndexOf(widest)).toBe(sign.stripIndex);
    }
  });

  it("finds the strip of a building with several sort lines", () => {
    const building = {
      id: "house-hachi97",
      x: 100,
      y: 300,
      w: 64,
      h: 96,
      key: "buildings/house-hachi97",
      fronts: [
        { x: 0, w: 10, sortY: 280 },
        { x: 10, w: 44, sortY: 300 },
        { x: 54, w: 10, sortY: 300 },
      ],
    };
    const map = { buildings: [{ id: "house-hachi97", door: [3, 9, 2, 1] as [number, number, number, number] }], props: [] };
    expect(findOnAirSigns([building], map)[0].stripIndex).toBe(2);
    expect(findOnAirSigns([{ ...building, id: "house-stranger" }], map)).toEqual([]);
    // a house the map gives no door has nothing to hang the sign over
    expect(findOnAirSigns([building], { buildings: [{ id: "house-hachi97" }], props: [] })).toEqual([]);
  });
});

describe("name plate", () => {
  it("is anchored on the same entrance axis as the ON AIR sign, for every house", () => {
    for (const sign of signs) {
      const anchor = homeSignAnchor(OVERWORLD_MAP, `house-${sign.soopId}`)!;
      expect(anchor.x, sign.soopId).toBe(sign.x);
      expect(anchor.y, sign.soopId).toBe(overworld.buildings[sign.buildingIndex].y);
    }
    expect(homeSignAnchor(OVERWORLD_MAP, "house-nobody")).toBeNull();
    expect(homeSignAnchor({ buildings: [{ id: "house-x" }], props: [] }, "house-x")).toBeNull();
  });

  it("is drawn centred on that axis, above the sign", () => {
    const rects: number[][] = [];
    const ctx = new Proxy({} as CanvasRenderingContext2D, {
      get: (_target, name: string) => {
        if (name === "measureText") return (text: string) => ({ width: text.length * 5 + 1 }); // odd on purpose
        if (name === "fillRect") return (...args: number[]) => rects.push(args);
        return () => undefined;
      },
      set: () => true,
    });
    for (const sign of signs) {
      rects.length = 0;
      const anchor = homeSignAnchor(OVERWORLD_MAP, `house-${sign.soopId}`)!;
      const camera = { x: anchor.x - 300, y: anchor.y - 200 };
      drawHomeSign(ctx, camera, anchor.x, anchor.y, "하치");
      const [x, y, w, h] = rects[0];
      expect(x + w / 2, sign.soopId).toBe(anchor.x - camera.x);
      expect(y + h, sign.soopId).toBeLessThan(sign.y - size.h - camera.y);
    }
  });
});

describe("entranceX", () => {
  const door: [number, number, number, number] = [10, 20, 2, 1]; // tile middle x = 352, doorstep y = 672
  const mat = (x: number, y: number, prop = "mat-door") => ({ prop, x, y });

  it("takes the x of the mat lying at the doorstep", () => {
    expect(entranceX(door, [mat(365, 700)])).toBe(365);
  });

  it("picks the mat nearest the door when several lie in reach", () => {
    expect(entranceX(door, [mat(400, 700), mat(340, 700), mat(300, 700)])).toBe(340);
  });

  it("ignores other props, mats of other houses, and mats behind the door", () => {
    expect(entranceX(door, [mat(360, 700, "bench-h"), mat(600, 700), mat(360, 900), mat(360, 600)])).toBe(352);
  });

  it("falls back to the middle of the door tiles when there is no mat", () => {
    expect(entranceX(door, [])).toBe(352);
  });
});

describe("onAirSignAt", () => {
  const sign = signs[0];
  const rect = onAirRect(sign, size);

  it("hits inside the sign and a few pixels around it, and misses beyond", () => {
    expect(onAirSignAt(signs, size, rect.x + rect.w / 2, rect.y + rect.h / 2)).toBe(sign);
    expect(onAirSignAt(signs, size, rect.x - 2, rect.y - 2)).toBe(sign);
    expect(onAirSignAt(signs, size, rect.x - 10, rect.y + 5)).toBeNull();
    expect(onAirSignAt(signs, size, rect.x + rect.w / 2, rect.y + rect.h + 20)).toBeNull();
    expect(onAirSignAt([], size, rect.x, rect.y)).toBeNull();
  });

  it("does not let the sign of one house catch a click on another", () => {
    for (const each of signs) {
      const box = onAirRect(each, size);
      expect(onAirSignAt(signs, size, box.x + box.w / 2, box.y + box.h / 2)).toBe(each);
    }
  });
});

describe("onAirSize", () => {
  it("uses the art's size once loaded and the fallback size before", () => {
    const image = { width: 60, height: 30 } as ImageBitmap;
    expect(onAirSize({ get: () => undefined })).toEqual(ON_AIR_FALLBACK_SIZE);
    expect(onAirSize({ get: (key) => (key === ON_AIR_KEYS.off ? image : undefined) })).toEqual({ w: 60, h: 30 });
  });
});

describe("drawOnAirSign", () => {
  const calls: string[] = [];
  const ctx = new Proxy({} as CanvasRenderingContext2D, {
    get: (_target, name: string) => {
      if (name === "createRadialGradient") return () => ({ addColorStop: () => undefined });
      if (name === "measureText") return () => ({ width: 10 });
      return (...args: unknown[]) => {
        calls.push(`${name}:${args.length}`);
      };
    },
    set: () => true,
  });

  it("picks the lit art for a live member and the dark art otherwise", () => {
    const asked: string[] = [];
    const images: Record<string, ImageBitmap> = {
      [ON_AIR_KEYS.on]: { width: 72, height: 41 } as ImageBitmap,
      [ON_AIR_KEYS.off]: { width: 72, height: 41 } as ImageBitmap,
    };
    const assets = { get: (key: string) => (asked.push(key), images[key]) };
    drawOnAirSign(ctx, assets, signs[0], true, { x: 0, y: 0 }, 0, false);
    drawOnAirSign(ctx, assets, signs[0], false, { x: 0, y: 0 }, 0, false);
    expect(asked).toEqual([ON_AIR_KEYS.on, ON_AIR_KEYS.off]);
  });

  it("still draws a stand-in sign while the art is missing", () => {
    calls.length = 0;
    drawOnAirSign(ctx, { get: () => undefined }, signs[0], true, { x: 0, y: 0 }, 0, true);
    expect(calls.some((call) => call.startsWith("fillText"))).toBe(true);
    expect(calls.some((call) => call.startsWith("drawImage"))).toBe(false);
  });
});

describe("sign art is centred on the entrance axis", () => {
  const file = (key: string) => fileURLToPath(new URL(`../../assets/world/${key}.webp`, import.meta.url));

  async function opaqueColumns(key: string) {
    const { data, info } = await sharp(file(key)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let first = info.width;
    let last = -1;
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        if (data[(y * info.width + x) * 4 + 3] > 0) {
          first = Math.min(first, x);
          last = Math.max(last, x);
        }
      }
    }
    return { width: info.width, first, last };
  }

  it("draws the picture's own middle exactly on the entrance x, for both states", async () => {
    for (const key of [ON_AIR_KEYS.on, ON_AIR_KEYS.off]) {
      const { width, first, last } = await opaqueColumns(key);
      // an even width puts the image's centre on a whole pixel, so drawImage(x - w / 2) lands it exactly on the entrance x
      expect(width % 2, key).toBe(0);
      // and the visible art is symmetric about that centre (the board fills the whole width)
      expect(first, key).toBe(0);
      expect(last, key).toBe(width - 1);
    }
    for (const sign of signs) {
      const left = Math.round(sign.x - ON_AIR_FALLBACK_SIZE.w / 2);
      expect(left + ON_AIR_FALLBACK_SIZE.w / 2, sign.soopId).toBe(sign.x);
    }
  });
});

describe("converted sign art", () => {
  const file = (key: string) => fileURLToPath(new URL(`../../assets/world/${key}.webp`, import.meta.url));

  it("has both states at the same size, with transparent corners", async () => {
    const [on, off] = await Promise.all([sharp(file(ON_AIR_KEYS.on)).ensureAlpha().raw().toBuffer({ resolveWithObject: true }), sharp(file(ON_AIR_KEYS.off)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })]);
    expect([on.info.width, on.info.height]).toEqual([ON_AIR_FALLBACK_SIZE.w, ON_AIR_FALLBACK_SIZE.h]);
    expect([off.info.width, off.info.height]).toEqual([on.info.width, on.info.height]);
    for (const { data, info } of [on, off]) {
      for (const [x, y] of [[0, 0], [info.width - 1, 0], [0, info.height - 1], [info.width - 1, info.height - 1]]) {
        expect(data[(y * info.width + x) * 4 + 3], `${x},${y}`).toBe(0);
      }
    }
  });
});
