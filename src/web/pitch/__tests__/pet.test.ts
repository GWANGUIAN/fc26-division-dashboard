import { describe, expect, it } from "vitest";
import { PET_CELL, createPet, petCell, resetPet, updatePet } from "../game/pet";

const settle = (pet: ReturnType<typeof createPet>, owner: { x: number; y: number }, seconds: number, facing = 0) => {
  for (let i = 0; i < Math.round(seconds * 60); i++) updatePet(pet, owner, 1 / 60, facing);
};

describe("pet following", () => {
  it("settles next to a standing owner and idles facing front", () => {
    const owner = { x: 300, y: 300 };
    const pet = createPet(owner.x, owner.y);
    settle(pet, owner, 2);
    expect(pet.moving).toBe(false);
    expect(Math.abs(pet.x - owner.x)).toBeGreaterThan(15);
    expect(Math.abs(pet.x - owner.x)).toBeLessThan(40);
    expect(petCell(pet).sy).toBe(0);
    expect(petCell(pet).sx).toBeLessThan(2 * PET_CELL);
  });

  it("trails behind a moving owner and plays the move frames facing the way it runs", () => {
    const owner = { x: 200, y: 300 };
    const pet = createPet(owner.x, owner.y);
    for (let i = 0; i < 90; i++) {
      owner.x += 3;
      updatePet(pet, owner, 1 / 60, 1);
    }
    expect(pet.x).toBeLessThan(owner.x);
    expect(pet.moving).toBe(true);
    expect(pet.dir).toBe("side");
    expect(pet.mirror).toBe(false);
    expect(petCell(pet).sy).toBe(PET_CELL);
    expect(petCell(pet).sx).toBeGreaterThanOrEqual(2 * PET_CELL);

    const target = { x: 600, y: 300 };
    const left = createPet(target.x, target.y);
    for (let i = 0; i < 90; i++) {
      target.x -= 3;
      updatePet(left, target, 1 / 60, -1);
    }
    expect(left.mirror).toBe(true);
    expect(left.x).toBeGreaterThan(target.x);
  });

  it("uses the back row when it runs up and resets without a run-up", () => {
    const owner = { x: 400, y: 400 };
    const pet = createPet(owner.x, owner.y);
    for (let i = 0; i < 90; i++) {
      owner.y -= 3;
      updatePet(pet, owner, 1 / 60);
    }
    expect(pet.dir).toBe("up");
    expect(petCell(pet).sy).toBe(2 * PET_CELL);
    resetPet(pet, 100, 100);
    expect(Math.abs(pet.x - 100)).toBeLessThan(40);
    expect(pet.trail).toHaveLength(1);
  });
});
