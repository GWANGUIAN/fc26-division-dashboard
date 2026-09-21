export type BrickType = "hp1" | "hp2" | "hp3" | "gold" | "steel" | "burst";

export interface KeeperBreakoutBrick {
  col: number;
  row: number;
  type: BrickType;
  hp: number;
  /** Points awarded only when this brick is destroyed. */
  value: number;
}

export const STAGES: string[][] = [
  ["1111111111", "1111111111", "2222222222", "2222222222"],
  ["1.1.1.1.1.", ".2.2.2.2.2", "1.1.1.1.1.", ".2.2.2.2.2", "3333333333"],
  ["S.11GG11.S", "S.22..22.S", "S.33..33.S", "S.22GG22.S", "S.11..11.S"],
  ["....11....", "...2BB2...", "..22GG22..", ".33333333.", "..22BB22..", "...2222..."],
  ["3333333333", "2S2S2S2S2S", "1B1B1B1B1B", "G22222222G", "1111111111", "S.S.S.S.S."],
];

const BRICKS: Record<Exclude<BrickType, "steel">, { hp: number; value: number }> = {
  hp1: { hp: 1, value: 10 },
  hp2: { hp: 2, value: 20 },
  hp3: { hp: 3, value: 30 },
  gold: { hp: 1, value: 50 },
  burst: { hp: 1, value: 15 },
};

const CHARACTERS: Record<string, BrickType | undefined> = { "1": "hp1", "2": "hp2", "3": "hp3", G: "gold", S: "steel", B: "burst" };

export function parseStage(lines: string[]): KeeperBreakoutBrick[] {
  return lines.flatMap((line, row) => Array.from(line).flatMap((character, col) => {
    const type = CHARACTERS[character];
    if (!type) return [];
    if (type === "steel") return [{ col, row, type, hp: Number.POSITIVE_INFINITY, value: 0 }];
    return [{ col, row, type, ...BRICKS[type] }];
  }));
}

export function brickScore(type: BrickType) {
  return type === "steel" ? 0 : BRICKS[type].value;
}
