import { describe, expect, it } from "vitest";
import { resolveInitialMode, urlAfterSwitch, type EntryModeInput } from "../../entryMode";

const base: EntryModeInput = { search: "", hash: "", stored: null, coarsePointer: false };
const resolve = (patch: Partial<EntryModeInput>) => resolveInitialMode({ ...base, ...patch });

describe("resolveInitialMode", () => {
  it.each([
    ["first visit on desktop → pitch", {}, "pitch"],
    ["stored dashboard is kept", { stored: "dashboard" }, "dashboard"],
    ["stored pitch is kept", { stored: "pitch" }, "pitch"],
    ["touch device, nothing stored → dashboard", { coarsePointer: true }, "dashboard"],
    ["touch device with stored pitch → still dashboard", { coarsePointer: true, stored: "pitch" }, "dashboard"],
    ["?view=evaluation deep link → dashboard", { search: "?view=evaluation" }, "dashboard"],
    ["?totyCapture → dashboard even if pitch is stored", { search: "?totyCapture=1", stored: "pitch" }, "dashboard"],
    ["?fancyMembers → dashboard", { search: "?fancyMembers=1", stored: "pitch" }, "dashboard"],
    ["?worldDebug → dashboard", { search: "?worldDebug", stored: "pitch" }, "dashboard"],
    ["#section anchor → dashboard", { hash: "#results", stored: "pitch" }, "dashboard"],
    ["a bare # is not a deep link", { hash: "#" }, "pitch"],
    ["?mode=pitch overrides a deep link", { search: "?view=evaluation&mode=pitch" }, "pitch"],
    ["?mode=dashboard overrides the stored pitch", { search: "?mode=dashboard", stored: "pitch" }, "dashboard"],
    ["?mode=pitch does not override touch → dashboard", { search: "?mode=pitch", coarsePointer: true }, "dashboard"],
    ["unknown ?mode value is ignored", { search: "?mode=zzz" }, "pitch"],
    ["unrelated query keeps the default", { search: "?utm_source=x" }, "pitch"],
  ] satisfies Array<[string, Partial<EntryModeInput>, "pitch" | "dashboard"]>)("%s", (_name, patch, expected) => {
    expect(resolve(patch)).toBe(expected);
  });
});

describe("urlAfterSwitch", () => {
  it("drops ?mode= and dashboard deep links when going to the pitch so a refresh stays on it", () => {
    expect(urlAfterSwitch("pitch", "/", "?view=evaluation&mode=dashboard&utm=1", "#top")).toBe("/?utm=1");
  });

  it("drops only ?mode= when going to the dashboard and keeps the rest", () => {
    expect(urlAfterSwitch("dashboard", "/", "?mode=pitch&utm=1", "#top")).toBe("/?utm=1#top");
  });

  it("returns the bare path when nothing is left", () => {
    expect(urlAfterSwitch("pitch", "/x", "?view=evaluation", "")).toBe("/x");
  });
});
