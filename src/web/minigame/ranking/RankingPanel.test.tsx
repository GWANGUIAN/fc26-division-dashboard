import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RankingPanel } from "./RankingPanel.js";
import type { RankingPanelProps } from "./useRanking.js";

const baseProps: RankingPanelProps = {
  game: "kickups",
  status: "loading",
  board: null,
  me: null,
  playerKey: null,
  nickname: "",
  pending: null,
  busy: false,
  notice: null,
  nicknameError: null,
  onSubmitPending: () => {},
  onDismissPending: () => {},
  onRename: () => {},
  onReload: () => {},
};

const render = (props: Partial<RankingPanelProps>) => renderToStaticMarkup(<RankingPanel {...baseProps} {...props} />);
const countOf = (html: string, needle: string) => html.split(needle).length - 1;

describe("RankingPanel loading state", () => {
  it("shows skeleton rows shaped like the TOP 10 while the first load is pending", () => {
    const html = render({ status: "loading" });
    expect(countOf(html, "ranking-row--skeleton")).toBe(10);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("순위를 불러오는 중");
    expect(html).toContain("ranking-skeleton--count"); // the "총 N명" placeholder
  });

  it("keeps the skeleton out of the accessibility tree except for one status message", () => {
    const html = render({ status: "loading" });
    expect(html).toContain('role="status"');
    expect(html).toContain('<ol class="ranking-list" aria-hidden="true">');
  });

  it("swaps the skeleton for the real list once the board is here", () => {
    const html = render({
      status: "ready",
      board: { order: "desc", unit: "회", total: 1, entries: [{ rank: 1, key: "a".repeat(64), name: "문모모", score: 42 }] },
    });
    expect(html).not.toContain("ranking-skeleton");
    expect(html).toContain("문모모");
    expect(html).toContain("42회");
  });

  it("keeps showing an already loaded board while a reload is in flight", () => {
    const html = render({
      status: "loading",
      board: { order: "desc", unit: "회", total: 1, entries: [{ rank: 1, key: "a".repeat(64), name: "문모모", score: 42 }] },
    });
    expect(html).not.toContain("ranking-skeleton");
    expect(html).toContain("문모모");
  });

  it("shows the error message, not a skeleton, when loading failed", () => {
    const html = render({ status: "error" });
    expect(html).not.toContain("ranking-skeleton");
    expect(html).toContain("순위를 불러올 수 없어요");
  });
});
