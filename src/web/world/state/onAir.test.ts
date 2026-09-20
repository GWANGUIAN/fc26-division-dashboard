import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ON_AIR_POLL_MS, ON_AIR_STALE_MS, OnAirTracker, onAirLink, openInNewTab, openOnAirLink } from "./onAir";

const snapshot = (entries: { soopId: string; live: boolean }[]) =>
  new Response(JSON.stringify({ generatedAt: "2026-09-20T00:00:00.000Z", streamers: entries }));

class FakeDoc {
  visibilityState: DocumentVisibilityState = "visible";
  private listeners = new Set<() => void>();
  addEventListener(_type: string, listener: () => void) {
    this.listeners.add(listener);
  }
  removeEventListener(_type: string, listener: () => void) {
    this.listeners.delete(listener);
  }
  setVisibility(state: DocumentVisibilityState) {
    this.visibilityState = state;
    this.listeners.forEach((listener) => listener());
  }
  get listenerCount() {
    return this.listeners.size;
  }
}

describe("OnAirTracker", () => {
  let clock = 0;
  let doc: FakeDoc;
  const now = () => clock;

  beforeEach(() => {
    vi.useFakeTimers();
    clock = 1_000_000;
    doc = new FakeDoc();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const make = (fetchImpl: typeof fetch) => new OnAirTracker({ fetchImpl, now, doc: doc as unknown as Document });
  const advance = async (ms: number) => {
    clock += ms;
    await vi.advanceTimersByTimeAsync(ms);
  };

  it("reads the members' status right away and again every two minutes", async () => {
    const fetchImpl = vi.fn(async () => snapshot([{ soopId: "hachi97", live: true }, { soopId: "doormomo", live: false }]));
    const tracker = make(fetchImpl as unknown as typeof fetch);

    tracker.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0]).toEqual(["/api/soop-onair", expect.objectContaining({ cache: "no-store" })]);
    expect(tracker.isLive("hachi97")).toBe(true);
    expect(tracker.isLive("doormomo")).toBe(false);
    expect(tracker.isLive("nobody")).toBe(false);

    await advance(ON_AIR_POLL_MS);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    tracker.stop();
  });

  it("follows a member going off air on the next reading", async () => {
    const answers = [[{ soopId: "lina0108", live: true }], [{ soopId: "lina0108", live: false }]];
    const fetchImpl = vi.fn(async () => snapshot(answers.shift() ?? []));
    const tracker = make(fetchImpl as unknown as typeof fetch);

    tracker.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(tracker.isLive("lina0108")).toBe(true);
    await advance(ON_AIR_POLL_MS);
    expect(tracker.isLive("lina0108")).toBe(false);
    tracker.stop();
  });

  it("stops polling once stopped, and never polls while the tab is hidden", async () => {
    const fetchImpl = vi.fn(async () => snapshot([]));
    const tracker = make(fetchImpl as unknown as typeof fetch);

    doc.visibilityState = "hidden";
    tracker.start();
    await advance(ON_AIR_POLL_MS * 3);
    expect(fetchImpl).not.toHaveBeenCalled();

    doc.setVisibility("visible");
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    tracker.stop();
    expect(doc.listenerCount).toBe(0);
    await advance(ON_AIR_POLL_MS * 3);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("catches up when the tab becomes visible again after a poll has passed", async () => {
    const fetchImpl = vi.fn(async () => snapshot([]));
    const tracker = make(fetchImpl as unknown as typeof fetch);
    tracker.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    doc.setVisibility("hidden");
    clock += ON_AIR_POLL_MS + 1; // the interval timer did not run (hidden tab), only the clock moved
    doc.setVisibility("visible");
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchImpl).toHaveBeenCalledTimes(2);

    doc.setVisibility("hidden");
    doc.setVisibility("visible"); // too soon: still fresh
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    tracker.stop();
  });

  it("does not overlap requests", async () => {
    let release: (response: Response) => void = () => undefined;
    const fetchImpl = vi.fn(() => new Promise<Response>((resolve) => (release = resolve)));
    const tracker = make(fetchImpl as unknown as typeof fetch);

    tracker.start();
    await advance(ON_AIR_POLL_MS);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    release(snapshot([{ soopId: "hachi97", live: true }]));
    await vi.advanceTimersByTimeAsync(0);
    expect(tracker.isLive("hachi97")).toBe(true);
    tracker.stop();
  });

  it("lets a reading expire when the polls keep failing", async () => {
    let fail = false;
    const fetchImpl = vi.fn(async () => {
      if (fail) throw new Error("offline");
      return snapshot([{ soopId: "hachi97", live: true }]);
    });
    const tracker = make(fetchImpl as unknown as typeof fetch);

    tracker.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(tracker.isLive("hachi97")).toBe(true);

    fail = true;
    await advance(ON_AIR_POLL_MS);
    expect(tracker.isLive("hachi97")).toBe(true); // one missed poll is fine
    await advance(ON_AIR_STALE_MS);
    expect(tracker.isLive("hachi97")).toBe(false);
    tracker.stop();
  });

  it("ignores error answers and malformed payloads", async () => {
    const answers = [
      new Response("{}", { status: 502 }),
      new Response(JSON.stringify({ streamers: "nope" })),
      new Response(JSON.stringify({ streamers: [{ soopId: 5, live: true }, { soopId: "hachi97", live: "yes" }, { soopId: "lina0108", live: true }] })),
    ];
    const fetchImpl = vi.fn(async () => answers.shift() ?? snapshot([]));
    const tracker = make(fetchImpl as unknown as typeof fetch);

    tracker.start();
    await vi.advanceTimersByTimeAsync(0);
    await advance(ON_AIR_POLL_MS);
    expect(tracker.isLive("lina0108")).toBe(false);
    await advance(ON_AIR_POLL_MS);
    expect(tracker.isLive("lina0108")).toBe(true);
    expect(tracker.isLive("hachi97")).toBe(false);
    tracker.stop();
  });
});

describe("onAirLink", () => {
  it("sends a live member's sign to their broadcast", () => {
    expect(onAirLink("hachi97", true)).toBe("https://play.sooplive.com/hachi97");
  });

  it("sends an off-air member's sign to their station", () => {
    expect(onAirLink("doormomo", false)).toBe("https://www.sooplive.com/station/doormomo");
  });

  it("passes the link to the opener", () => {
    const open = vi.fn();
    openOnAirLink("lina0108", true, open);
    openOnAirLink("lina0108", false, open);
    expect(open.mock.calls).toEqual([["https://play.sooplive.com/lina0108"], ["https://www.sooplive.com/station/lina0108"]]);
  });
});

describe("openInNewTab", () => {
  it("clicks a target=_blank link (a tab, never a popup window) and leaves nothing behind", () => {
    const clicked: { href: string; target: string; rel: string }[] = [];
    const anchor = { href: "", target: "", rel: "", style: { display: "" }, click() { clicked.push({ href: this.href, target: this.target, rel: this.rel }); }, remove: vi.fn() };
    const append = vi.fn();
    vi.stubGlobal("document", { createElement: () => anchor, body: { append } });
    try {
      openInNewTab("https://play.sooplive.com/hachi97");
    } finally {
      vi.unstubAllGlobals();
    }
    expect(clicked).toEqual([{ href: "https://play.sooplive.com/hachi97", target: "_blank", rel: "noopener noreferrer" }]);
    expect(append).toHaveBeenCalledWith(anchor);
    expect(anchor.remove).toHaveBeenCalled();
  });
});
