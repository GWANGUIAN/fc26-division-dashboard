import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MinigameStage } from "./MinigameStage.js";
import { RankingEnabledContext } from "./RankingEnabledContext.js";
import { useRanking } from "./useRanking.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("MinigameStage", () => {
  const stage = (enabled: boolean) =>
    renderToStaticMarkup(
      <RankingEnabledContext.Provider value={enabled}>
        <MinigameStage panel={<p>RANKING</p>}>
          <p>GAME</p>
        </MinigameStage>
      </RankingEnabledContext.Provider>,
    );

  it("puts the ranking panel beside the game by default", () => {
    const html = renderToStaticMarkup(
      <MinigameStage panel={<p>RANKING</p>}>
        <p>GAME</p>
      </MinigameStage>,
    );
    expect(html).toContain("minigame-stage__panel");
    expect(html).toContain("RANKING");
    expect(html).toContain("GAME");
  });

  it("renders only the game, with no wrapper, where the ranking is switched off", () => {
    expect(stage(false)).toBe("<p>GAME</p>");
  });
});

describe("useRanking", () => {
  const capture = (enabled: boolean) => {
    let report: (score: number) => void = () => {};
    function Probe() {
      report = useRanking("kickups").report;
      return null;
    }
    renderToStaticMarkup(
      <RankingEnabledContext.Provider value={enabled}>
        <Probe />
      </RankingEnabledContext.Provider>,
    );
    return report;
  };

  it("sends nothing for a finished run where the ranking is switched off", () => {
    const fetchSpy = vi.fn(() => Promise.reject(new Error("offline")));
    vi.stubGlobal("fetch", fetchSpy);
    capture(false)(42);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does ask the server for a run token after a finished run when the ranking is on", () => {
    const fetchSpy = vi.fn(() => Promise.reject(new Error("offline")));
    vi.stubGlobal("fetch", fetchSpy);
    // Rendering on the server never mounts, so React warns about the state updates report() makes; only the fetch matters here.
    vi.spyOn(console, "error").mockImplementation(() => {});
    capture(true)(42);
    expect(fetchSpy).toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});
