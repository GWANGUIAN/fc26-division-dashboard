import { CollectionBook } from "./CollectionBook";
import { DailyBoard } from "./DailyBoard";
import { GrassRushModal } from "../arcade/GrassRushModal";
import { refreshDaily } from "../state/daily";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SILENT_AUDIO } from "../audio/worldAudio";
import { debugSkipTutorial } from "../state/debugTools";
import { acceptMission, applyMissionEvent, defaultTracked, missionViews } from "../state/missions";
import { createNewGameSave, DEFAULT_WORLD_SETTINGS } from "../storage";
import { availableGoldenBalls } from "../state/finaleBalls";
import { GoldBallCounter } from "./GoldBallCounter";
import { Hud } from "./Hud";
import { MissionLog } from "./MissionLog";
import { PauseMenu } from "./PauseMenu";
import { StingerOverlay } from "./StingerOverlay";
import { TitleScreen } from "./TitleScreen";
import { nextToasts } from "./Toast";
import { WorldCredits } from "./WorldCredits";
import { STATUS_LABEL, missionIconKey, rewardText } from "./missionIcons";
import { BADGES, getMissionDef } from "../data/missionDefs";

// The overlay's panels render on the server side here (no DOM, effects do not run): enough to catch a render-time
// crash and to check what text a player would read. How they look is what the ?worldDebug check-list is for.

const noop = () => {};

function midGame() {
  let save = acceptMission(debugSkipTutorial(createNewGameSave("janine95kim")), "m-haepalin-lanterns");
  save = applyMissionEvent(save, { type: "pickup", id: "jelly-lantern-a" }).save;
  return { ...save, shards: 3 };
}

describe("TitleScreen", () => {
  const title = (hasSave: boolean) => renderToString(<TitleScreen hasSave={hasSave} audio={SILENT_AUDIO} onContinue={noop} onNew={noop} onExit={noop} debug={false} />);

  it("offers continue, new game and exit when there is a save", () => {
    const html = title(true);
    for (const label of ["이어하기", "새로 시작", "나가기"]) expect(html).toContain(label);
    expect(html).toContain("world-title__row");
  });

  it("leaves out continue without a save and shows the key hints", () => {
    const html = title(false);
    expect(html).not.toContain("이어하기");
    expect(html).toContain("새로 시작");
    expect(html).toContain("world-key");
    expect(html).toContain("잔디동 월드");
  });
});

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
    const html = renderToString(<Hud shards={0} tracked={null} />);
    expect(html).toContain("잔디 조각 0/10");
    expect(html).toContain("미션 트래커");
    expect(html).toContain("미션 로그에서 다음 목표를 확인하세요");
  });

  it("opens the same mission log action when the visible tracker is clicked", () => {
    let opened = 0;
    const element = Hud({ shards: 0, tracked: null, onOpenLog: () => { opened++; } }) as unknown as { props: { children: readonly unknown[] } };
    const tracker = element.props.children[1] as { props: { onClick?: () => void } };
    tracker.props.onClick?.();
    expect(opened).toBe(1);
  });
});

describe("GoldBallCounter", () => {
  it("stays hidden until the first golden ball is found", () => {
    expect(renderToString(<GoldBallCounter count={0} />)).toBe("");
  });

  it("shows how many golden balls were found", () => {
    const html = renderToString(<GoldBallCounter count={7} />);
    expect(html).toContain(">7</span>");
    expect(html).not.toContain("×");
    expect(html).toContain("황금 축구공 7개");
  });

  it("counts only golden balls out of everything the save collected", () => {
    expect(availableGoldenBalls([])).toEqual([]);
    expect(availableGoldenBalls(["gb-01", "gb-20", "jelly-lantern-a", "water-1", "gb-99"])).toEqual(["gb-01", "gb-20"]);
    expect(availableGoldenBalls(["gb-01", "gb-02", "gb-03"], ["gb-01", "gb-03"])).toEqual(["gb-02"]);
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
  const menu = (view: "main" | "settings" | "credits" | "confirm-new") => (
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
    for (const label of ["이어하기", "미션 로그", "설정", "크레딧", "가이드 다시 보기", "새로 시작", "월드 나가기"]) expect(html).toContain(label);
  });

  it("renders the release credit without a deployment gate", () => {
    const html = renderToString(<WorldCredits />);
    expect(html).toContain("기획·구현");
    expect(html).toContain("뉴팬치");
    expect(html).toContain("월드 전용 변환 에셋 453개");
    expect(html).not.toContain("상세 목록은 에셋 체크리스트");
    expect(html).toContain("BGM 13/14, SFX 53/53, 앰비언스 9/9");
    expect(html).not.toContain("배포 전 확인 필요");
    expect(html).toContain('aria-label="크레딧 내용"');
    expect(html).toContain('tabindex="0"');
    expect(renderToString(menu("credits"))).toContain("잔디동 월드");
  });

  it("shows the sound settings and asks before a new game", () => {
    const settings = renderToString(menu("settings"));
    expect(settings).toContain("배경음악 켜짐");
    expect(settings).toContain("효과음 볼륨");
    expect(settings).toContain('aria-label="음악 볼륨 낮추기"');
    expect(settings).toContain('aria-label="음악 볼륨 높이기"');
    expect(renderToString(menu("confirm-new"))).toContain("계속할까요");
  });
});

describe("Toast queue", () => {
  it("replaces only a previous region notice while preserving reward order", () => {
    const reward = { id: 1, text: "보상", channel: "default" as const };
    const firstRegion = { id: 2, text: "광장", channel: "region" as const };
    const nextRegion = { id: 3, text: "호수", channel: "region" as const };
    expect(nextToasts([reward, firstRegion], nextRegion)).toEqual([reward, nextRegion]);
    expect(nextToasts([reward], { id: 4, text: "조각", channel: "default" })).toEqual([reward, { id: 4, text: "조각", channel: "default" }]);
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


describe("S5 panels", () => {
  const plain = (html: string) => html.replaceAll("<!-- -->", ""); // the server renderer marks the text-node borders

  it("renders the arcade records with the rank ladder of the highlighted game", () => {
    const save = createNewGameSave("janine95kim"); save.bests.sum10 = 100;
    const html = plain(renderToString(<CollectionBook save={save} hiddenUnlocked={false} onClose={noop} />));
    expect(html).toContain("잔디동 도감"); expect(html).toContain("축구공 합 10"); expect(html).toContain("합격 조건 충족");
    for (const rank of ["입구컷", "합격 불투명", "상현급", "에이스급", "반장급", "운영급", "회장"]) expect(html).toContain(rank);
    expect(html).toContain("130점 이상"); expect(html).toContain("아직 기록 없음");
  });
  it("renders twenty golden ball slots by state, each hint without an internal id or coordinates", () => {
    const save = createNewGameSave("janine95kim"); save.collected = ["gb-01", "gb-20"];
    const html = plain(renderToString(<CollectionBook save={save} hiddenUnlocked={false} initialTab="balls" onClose={noop} />));
    expect(html.match(/world-codex__ball is-/g)).toHaveLength(20);
    expect(html.match(/world-codex__ball is-found/g)).toHaveLength(2);
    expect(html).toContain("1번 · 분수 뒤편"); expect(html).toContain("발견 2/20");
    expect(html).not.toMatch(/gb-\d\d/); expect(html).not.toMatch(/\(\d+, ?\d+\)/);
  });
  it("renders the eleven cards plus the hidden one, revealed or not", () => {
    const save = createNewGameSave("janine95kim"); save.flags["card:janine95kim"] = true;
    const shut = plain(renderToString(<CollectionBook save={save} hiddenUnlocked={false} initialTab="cards" onClose={noop} />));
    expect(shut.match(/world-codex__card /g)).toHaveLength(12);
    expect(shut).toContain("카드 도감 1/11 공개"); expect(shut).toContain("???");
    const open = plain(renderToString(<CollectionBook save={save} hiddenUnlocked initialTab="cards" onClose={noop} />));
    expect(open).not.toContain("???"); expect(open).toContain("우왁굳");
  });
  it("renders every badge with how to earn it and marks the earned ones", () => {
    const save = createNewGameSave("janine95kim"); save.flags["badge:rush-1000"] = true;
    const html = plain(renderToString(<CollectionBook save={save} hiddenUnlocked={false} initialTab="badges" onClose={noop} />));
    expect(html.match(/world-codex__badge is-/g)).toHaveLength(Object.keys(BADGES).length);
    expect(html.match(/world-codex__badge is-earned/g)).toHaveLength(1);
    expect(html).toContain("뱃지 1/16 획득"); expect(html).toContain("「오락실 워밍업」");
  });
  it("draws done and open daily tasks differently, with the count of the counting ones", () => {
    const save = refreshDaily(createNewGameSave("janine95kim"), Date.now());
    save.flags["ending-seen"] = true; save.daily.picks = ["sum10", "talk", "rush"]; save.daily.done = ["sum10", "talk:elder"];
    const html = plain(renderToString(<DailyBoard save={save} onClaim={noop} onClose={noop} />));
    expect(html.match(/world-daily__task is-done/g)).toHaveLength(1);
    expect(html.match(/world-daily__task is-todo/g)).toHaveLength(2);
    expect(html).toContain("합 10 40점"); expect(html).toContain("1/3");
    expect(html).toContain("스탬프 받기"); expect(html).toMatch(/<button[^>]*disabled=""[^>]*>스탬프 받기/);
  });
  it("opens the claim once all three are done, and shuts the board before the ending", () => {
    const save = refreshDaily(createNewGameSave("janine95kim"), Date.now());
    save.daily.done = [...save.daily.picks];
    expect(plain(renderToString(<DailyBoard save={save} onClaim={noop} onClose={noop} />))).toContain("엔딩 후 열려요");
    save.flags["ending-seen"] = true;
    const ready = plain(renderToString(<DailyBoard save={save} onClaim={noop} onClose={noop} />));
    expect(ready).not.toContain("엔딩 후 열려요"); expect(ready).not.toMatch(/<button[^>]*disabled=""[^>]*>스탬프 받기/);
    expect(ready.match(/world-daily__task is-done/g)).toHaveLength(3);
  });
  it("renders today's completed claim and all thirty stamp slots", () => {
    const save = refreshDaily(createNewGameSave("janine95kim"), Date.now());
    save.flags["ending-seen"] = true; save.daily.stamps = [save.daily.date];
    const html = plain(renderToString(<DailyBoard save={save} onClaim={noop} onClose={noop} />));
    expect(html).toContain("오늘 수령 완료"); expect(html).toContain("disabled"); expect(html).toContain("30일 스탬프 카드");
    expect(html.match(/world-daily__slot /g)).toHaveLength(30);
    expect(html.match(/is-stamped/g)).toHaveLength(1);
    expect(html).toContain("누적 <b>1</b>일");
  });
  it("renders the factory runner controls and saved best", () => {
    const html = renderToString(<GrassRushModal player="janine95kim" factory best={600} onClose={noop} />);
    expect(html).toContain("제초 공장 코스"); expect(html).toContain("슬라이드"); expect(html).toContain("상현급");
  });
});

describe("StingerOverlay", () => {
  it("starts on a black screen (no still, no caption yet) with a skip hint", () => {
    const html = renderToString(<StingerOverlay audio={SILENT_AUDIO} onDone={noop} />);
    expect(html).toContain("world-stinger");
    expect(html).toContain("Esc 전체 건너뛰기");
    expect(html).not.toContain("world-stinger__next");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<p class=\"world-stinger__caption\"");
  });
});
