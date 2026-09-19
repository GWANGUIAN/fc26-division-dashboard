import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SILENT_AUDIO } from "../audio/worldAudio";
import { debugSkipTutorial } from "../state/debugTools";
import { acceptMission, applyMissionEvent, defaultTracked, missionViews } from "../state/missions";
import { createNewGameSave, DEFAULT_WORLD_SETTINGS } from "../storage";
import { Hud } from "./Hud";
import { MissionLog } from "./MissionLog";
import { PauseMenu } from "./PauseMenu";
import { STATUS_LABEL, missionIconKey, rewardText } from "./missionIcons";
import { getMissionDef } from "../data/missionDefs";

// The overlay's panels render on the server side here (no DOM, effects do not run): enough to catch a render-time
// crash and to check what text a player would read. How they look is what the ?worldDebug check-list is for.

const noop = () => {};

function midGame() {
  let save = acceptMission(debugSkipTutorial(createNewGameSave("janine95kim")), "m-haepalin-lanterns");
  save = applyMissionEvent(save, { type: "pickup", id: "jelly-lantern-a" }).save;
  return { ...save, shards: 3 };
}

describe("Hud", () => {
  it("shows the shard count and the tracked mission with its progress", () => {
    const save = midGame();
    const html = renderToString(<Hud shards={save.shards} tracked={defaultTracked(missionViews(save))} />);
    expect(html).toContain("잔디 조각 3/10");
    expect(html).toContain("잃어버린 해파리 랜턴");
    expect(html).toContain("1/3 해파리 랜턴");
  });

  it("tells the player to report when the goal is met, and renders without a tracked mission", () => {
    let save = midGame();
    for (const id of ["jelly-lantern-b", "jelly-lantern-c"]) save = applyMissionEvent(save, { type: "pickup", id }).save;
    expect(renderToString(<Hud shards={3} tracked={defaultTracked(missionViews(save))} />)).toContain("해파린에게 보고하세요");
    expect(renderToString(<Hud shards={0} tracked={null} />)).toContain("잔디 조각 0/10");
  });
});

describe("MissionLog", () => {
  it("lists the missions of the player with the detail of the first one", () => {
    const save = midGame();
    const html = renderToString(<MissionLog views={missionViews(save)} trackedId={null} audio={SILENT_AUDIO} onTrack={noop} onClose={noop} />);
    expect(html).toContain("미션 로그");
    expect(html).toContain("잃어버린 해파리 랜턴"); // active main mission is listed first
    expect(html).toContain("천리안 셈법"); // an available one
    expect(html).not.toContain("서리 카드 뒤집기"); // the player's own mission never shows
    expect(html).toContain("의뢰인");
    expect(html).toContain("보상");
  });

  it("renders an empty log", () => {
    const html = renderToString(<MissionLog views={[]} trackedId={null} audio={SILENT_AUDIO} onTrack={noop} onClose={noop} />);
    expect(html).toContain("받을 수 있는 미션이 없어요");
  });
});

describe("PauseMenu", () => {
  const menu = (view: "main" | "settings" | "confirm-new") => (
    <PauseMenu
      view={view}
      onView={noop}
      settings={DEFAULT_WORLD_SETTINGS}
      onSettings={noop}
      audio={SILENT_AUDIO}
      onResume={noop}
      onLog={noop}
      onGuide={noop}
      onNewGame={noop}
      onExit={noop}
    />
  );

  it("offers every menu item on the main page", () => {
    const html = renderToString(menu("main"));
    for (const label of ["이어하기", "미션 로그", "설정", "가이드 다시 보기", "새로 시작", "월드 나가기"]) expect(html).toContain(label);
  });

  it("shows the sound settings and asks before a new game", () => {
    const settings = renderToString(menu("settings"));
    expect(settings).toContain("배경음악 켜짐");
    expect(settings).toContain("효과음 볼륨");
    expect(renderToString(menu("confirm-new"))).toContain("계속할까요");
  });
});

describe("mission icons and labels", () => {
  it("picks an icon per kind and per status, and words for every status", () => {
    const sum10 = getMissionDef("m-doormomo-sum10")!;
    expect(missionIconKey(sum10, "active")).toBe("ui/mi-sum10");
    expect(missionIconKey(sum10, "ready")).toBe("ui/mi-ready");
    expect(missionIconKey(sum10, "completed")).toBe("ui/mi-done");
    expect(missionIconKey(getMissionDef("m-tleod1818-delivery")!, "active")).toBe("ui/mi-delivery");
    for (const status of ["locked", "available", "active", "ready", "completed"] as const) expect(STATUS_LABEL[status].length).toBeGreaterThan(0);
  });

  it("describes the reward", () => {
    expect(rewardText(getMissionDef("m-doormomo-sum10")!)).toBe("잔디 조각 +1");
    expect(rewardText(getMissionDef("m-02-arcade")!)).toContain("첫 한 판");
    expect(rewardText(getMissionDef("m-00-hello")!)).toBe("—");
  });
});
