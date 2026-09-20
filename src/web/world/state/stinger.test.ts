import { describe, expect, it } from "vitest";
import { AMBIENCE_FILES, SFX_FILES } from "../audio/worldAudio";
import { STINGER_CUES, STINGER_CUTS, STINGER_END_CARD, STINGER_LEAD_SECONDS, STINGER_SPEAKER } from "../data/stingerData";
import { getWorldAssetUrl } from "../worldAssets";
import { advanceStinger, stingerCutBoundaries, stingerCutFrame } from "./stinger";

// docs/world/14 §1: the player steps through the stinger. A still plays its entrance (fade, motion, captions), holds once it
// has settled, and only Enter brings in the next one. These tests pin those rules and that the data names real things.

const LAST = STINGER_CUTS.length - 1;

describe("stinger stepping", () => {
  it("has six stills after a short black lead-in", () => {
    expect(STINGER_CUTS).toHaveLength(6);
    expect(STINGER_LEAD_SECONDS).toBeGreaterThan(0);
  });

  it("holds a still until its entrance is over: Enter before that does nothing", () => {
    STINGER_CUTS.forEach((cut, index) => {
      expect(stingerCutFrame(index, 0).ready, `${cut.id} at 0`).toBe(cut.settleSeconds <= 0);
      expect(stingerCutFrame(index, cut.settleSeconds - 0.01).ready, `${cut.id} just before`).toBe(false);
      expect(stingerCutFrame(index, cut.settleSeconds).ready, `${cut.id} settled`).toBe(true);
      expect(stingerCutFrame(index, cut.settleSeconds + 600).ready, `${cut.id} held for ten minutes`).toBe(true);
      expect(advanceStinger(index, false), `${cut.id} still coming in`).toBe(index);
    });
  });

  it("moves one still at a time on Enter, and the last press hands over to the fade to black", () => {
    for (let index = 0; index < LAST; index++) expect(advanceStinger(index, true)).toBe(index + 1);
    expect(advanceStinger(LAST, true)).toBe(STINGER_CUTS.length);
  });

  it("ignores Enter on the black lead-in and while fading out", () => {
    expect(advanceStinger(-1, true)).toBe(-1);
    expect(advanceStinger(STINGER_CUTS.length, true)).toBe(STINGER_CUTS.length);
  });

  it("brings in each caption at its time and keeps it on screen until the next one replaces it", () => {
    const scheme = STINGER_CUTS.findIndex((cut) => cut.id === "scheme-room");
    expect(stingerCutFrame(scheme, 0.5).caption).toBeNull();
    expect(stingerCutFrame(scheme, 0.6).caption?.text).toBe("제초왕은 너무 물렀어.");
    expect(stingerCutFrame(scheme, 2.5).caption?.text).toBe("제초왕은 너무 물렀어.");
    expect(stingerCutFrame(scheme, 2.6).caption?.text).toBe("이번엔 뿌리째 밀어 주지.");
    expect(stingerCutFrame(scheme, 600).caption?.text).toBe("이번엔 뿌리째 밀어 주지.");
    const rise = STINGER_CUTS.findIndex((cut) => cut.id === "silhouette-rise");
    expect(stingerCutFrame(rise, 0.79).caption).toBeNull();
    expect(stingerCutFrame(rise, 0.8).caption?.text).toBe("…이거, 아직 쓸 만하네.");
    expect(stingerCutFrame(0, 600).caption).toBeNull();
  });

  it("puts the to-be-continued card on the last still only, and keeps it there", () => {
    expect(stingerCutFrame(LAST, STINGER_END_CARD.at - 0.01).endCard).toBe(false);
    expect(stingerCutFrame(LAST, STINGER_END_CARD.at).endCard).toBe(true);
    expect(stingerCutFrame(LAST, 600).endCard).toBe(true);
    for (let index = 0; index < LAST; index++) expect(stingerCutFrame(index, 600).endCard, STINGER_CUTS[index].id).toBe(false);
  });

  it("finishes every caption and the end card before the player can move on", () => {
    STINGER_CUTS.forEach((cut, index) => {
      for (const caption of cut.captions) expect(caption.at, `${cut.id} caption`).toBeLessThan(cut.settleSeconds);
      if (index === LAST) expect(STINGER_END_CARD.at).toBeLessThan(cut.settleSeconds);
    });
  });

  it("lists every moment a still's frame changes, sorted and without repeats", () => {
    STINGER_CUTS.forEach((cut, index) => {
      const boundaries = stingerCutBoundaries(index);
      expect([...boundaries].sort((a, b) => a - b), cut.id).toEqual(boundaries);
      expect(new Set(boundaries).size, cut.id).toBe(boundaries.length);
      expect(boundaries, cut.id).toContain(cut.settleSeconds);
      for (const caption of cut.captions) expect(boundaries, `${cut.id} caption`).toContain(caption.at);
      // Between two boundaries the frame never changes, so waking up only at the boundaries misses nothing.
      for (let i = 0; i < boundaries.length - 1; i++) {
        expect(stingerCutFrame(index, (boundaries[i] + boundaries[i + 1]) / 2), `${cut.id} between ${boundaries[i]} and ${boundaries[i + 1]}`).toEqual(stingerCutFrame(index, boundaries[i]));
      }
    });
    expect(stingerCutBoundaries(LAST)).toContain(STINGER_END_CARD.at);
  });
});

describe("stinger content", () => {
  it("only ever lets ??? speak", () => {
    expect(STINGER_SPEAKER).toBe("???");
  });

  it("uses converted stills that exist, each with a description for screen readers", () => {
    for (const cut of STINGER_CUTS) {
      expect(getWorldAssetUrl(cut.image), cut.image).toBeTruthy();
      expect(cut.alt.length, `${cut.id} alt`).toBeGreaterThan(10);
    }
    expect(new Set(STINGER_CUTS.map((cut) => cut.id)).size).toBe(STINGER_CUTS.length);
  });

  it("plays its sound cues with their still and names sounds the world audio knows", () => {
    for (const cue of STINGER_CUES) {
      expect(cue.cut).toBeGreaterThanOrEqual(0);
      expect(cue.cut).toBeLessThan(STINGER_CUTS.length);
      expect(cue.at, "a cue inside its still's entrance").toBeLessThan(STINGER_CUTS[cue.cut].settleSeconds);
      if (cue.sfx) expect(SFX_FILES[cue.sfx], cue.sfx).toBeTruthy();
      if (cue.ambience) expect(AMBIENCE_FILES[cue.ambience], cue.ambience).toBeTruthy();
    }
  });
});
