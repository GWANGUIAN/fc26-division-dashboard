import { beforeEach, describe, expect, it } from "vitest";
import type { PitchAudioLike } from "../audio/pitchAudio";
import type { PitchSfxId } from "../audio/sfxMap";
import type { Scene, SceneCtx } from "../engine/sceneManager";
import {
  CAST_SECONDS, DING_SECONDS, FIELD_MOBS, FOREVER_AREA, FOREVER_MAP_ELWYNN, FOREVER_MAP_FIELD, FOREVER_NPCS, FOREVER_SPAWN, FOREVER_SPAWN_POINT, GATE_FOREVER, FOREVER_ZONES,
  GRIFFIN_SECONDS, MOB_RESPAWN_SECONDS, PORTAL_SECONDS, type ForeverMapId,
} from "../game/forever";
import { ForeverLetterScene } from "../scenes/ForeverLetterScene";
import { QUESTS, acceptQuest, advanceQuest, completeQuest, defaultProgress, loadProgress, resetProgressMemory, saveProgress, type ForeverProgress } from "../game/foreverProgress";
import { QuestPopupScene, wrapLines } from "../scenes/ForeverQuestScene";
import { DummyShootScene, DUMMY_REST_SECONDS } from "../scenes/DummyShootScene";
import { FOREVER_MAP_ORGRIMMAR, foreverTargetAt } from "../game/forever";
import { DUMMY_MAX_SPEED, DUMMY_SWEET, dummyHit, dummySpeed, meterPower } from "../game/dummy";
import { ForeverLoadingScene, FOREVER_MIN_LOADING_MS, FOREVER_TIPS, FOREVER_TIP_SECONDS } from "../scenes/ForeverLoadingScene";
import { ForeverScene } from "../scenes/ForeverScene";
import { PitchScene } from "../scenes/PitchScene";
import { LockerScene } from "../scenes/LockerScene";

const DT = 1 / 60;

function fakeGraphics(): CanvasRenderingContext2D {
  const store: Record<string, unknown> = {};
  return new Proxy(store, {
    get(target, prop: string) {
      if (prop === "measureText") return () => ({ width: 10 });
      if (prop in target) return target[prop];
      return () => undefined;
    },
    set(target, prop: string, value) {
      target[prop] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

interface Replaced {
  scene: Scene;
  params: unknown;
  transition?: string;
}

function makeCtx(loadGroup?: (group: string, options?: { onProgress?: (n: number) => void; minMs?: number }) => Promise<unknown>) {
  const held = new Set<string>();
  const events: string[] = [];
  const replaced: Replaced[] = [];
  const loaded: string[] = [];
  const pushed: Scene[] = [];
  let popped = 0;
  const audio: PitchAudioLike = {
    playBgm: (id) => void events.push(`bgm:${id}`),
    playSfx: (id: PitchSfxId) => void events.push(id),
    stopSfx: (id: PitchSfxId) => void events.push(`stop:${id}`),
    setSettings: () => undefined,
  };
  const ctx = {
    width: 960,
    height: 540,
    manager: {
      transitionProgress: null,
      replace: (scene: Scene, params: unknown, options?: { transition?: string }) => void replaced.push({ scene, params, transition: options?.transition }),
      push: (scene: Scene) => {
        pushed.push(scene);
        scene.enter?.(ctx);
      },
      pop: () => void popped++,
    },
    host: {
      assets: {
        get: () => undefined,
        has: () => false,
        loadGroup:
          loadGroup ??
          ((group: string) => {
            loaded.push(group);
            return Promise.resolve({ loaded: [], failed: [], missing: [] });
          }),
      },
      input: { isDown: (code: string) => held.has(code) },
      hasKeyboardFocus: () => true,
      goDashboard: () => undefined,
      setCursor: () => undefined,
      announce: () => undefined,
      audio,
      reducedMotion: () => false,
    },
  } as unknown as SceneCtx;
  return { ctx, held, events, replaced, loaded, pushed, popped: () => popped };
}

const run = (scene: Scene, n: number) => {
  for (let i = 0; i < n; i++) scene.update(DT);
};
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("ForeverLoadingScene", () => {
  it("loads the forever group, keeps the bar up for the minimum time, then fades into the map", async () => {
    const env = makeCtx();
    const scene = new ForeverLoadingScene({ createPitch: () => new PitchScene(), startTip: 0 });
    scene.enter(env.ctx);
    expect(env.loaded).toEqual(["forever"]);
    await flush();
    run(scene, 30);
    expect(env.replaced).toHaveLength(0);
    expect(scene.progress).toBeLessThan(1);
    run(scene, Math.ceil((FOREVER_MIN_LOADING_MS / 1000) * 60));
    expect(env.replaced).toHaveLength(1);
    expect(env.replaced[0]!.scene).toBeInstanceOf(ForeverScene);
    expect(env.replaced[0]!.transition).toBe("fade");
    run(scene, 60);
    expect(env.replaced).toHaveLength(1);
  });

  it("passes minMs 1800 to the loader and still opens the map when the load fails", async () => {
    let minMs: number | undefined;
    const env = makeCtx((_group, options) => {
      minMs = options?.minMs;
      return Promise.reject(new Error("boom"));
    });
    const scene = new ForeverLoadingScene({ createPitch: () => new PitchScene() });
    scene.enter(env.ctx);
    await flush();
    run(scene, 200);
    expect(minMs).toBe(1800);
    expect(env.replaced[0]!.scene).toBeInstanceOf(ForeverScene);
  });

  it("rotates the tips and renders without assets", () => {
    const env = makeCtx();
    const scene = new ForeverLoadingScene({ createPitch: () => new PitchScene(), startTip: 0 });
    scene.enter(env.ctx);
    expect(scene.tip()).toBe(FOREVER_TIPS[0]);
    run(scene, Math.ceil(FOREVER_TIP_SECONDS * 60) + 1);
    expect(scene.tip()).toBe(FOREVER_TIPS[1]);
    expect(() => scene.render(fakeGraphics())).not.toThrow();
  });
});

describe("ForeverScene", () => {
  beforeEach(() => resetProgressMemory());

  const setup = (progress?: ForeverProgress, map?: ForeverMapId) => {
    if (progress) saveProgress(progress);
    const env = makeCtx();
    const scene = new ForeverScene({ createPitch: () => new PitchScene(), random: () => 0.5, map });
    scene.enter(env.ctx);
    const player = () => (scene as unknown as { player: { x: number; y: number } }).player;
    const at = (x: number, y: number) => Object.assign(player(), { x, y });
    const npc = (id: string) => FOREVER_NPCS.find((n) => n.id === id)!;
    const stand = (id: string) => at(npc(id).x, npc(id).y);
    return { ...env, scene, player, at, stand };
  };
  const rabbitsDone = () => completeQuest(advanceQuest(acceptQuest(defaultProgress(), "q_rabbits"), "q_rabbits", 5), "q_rabbits").progress;

  it("starts at (480, 392), out of every interaction circle, and renders without assets", () => {
    const { scene, player, events } = setup();
    expect(player()).toMatchObject({ x: 480, y: 392 });
    expect(scene.interaction()).toBeNull();
    expect(events).toContain("bgm:forever");
    expect(events).toContain("forever-zone-enter");
    expect(scene.chatLines().join("\n")).toContain("잔디 포에버 — 엘윈 잔디숲");
    run(scene, 10);
    expect(() => scene.render(fakeGraphics())).not.toThrow();
  });

  it("moves with the arrow keys and stops at the floor's edge", () => {
    const { scene, held, player } = setup();
    held.add("ArrowRight");
    run(scene, 600);
    expect(player().x).toBe(FOREVER_AREA.maxX);
    held.delete("ArrowRight");
    held.add("ArrowUp");
    run(scene, 600);
    expect(player().y).toBe(FOREVER_AREA.minY);
  });

  it("is blocked by the left bush", () => {
    const { scene, held, player } = setup();
    Object.assign(player(), { x: 100, y: 380 });
    held.add("ArrowDown");
    run(scene, 300);
    expect(player().y).toBeLessThanOrEqual(405);
  });

  it("the mailbox opens the letter, the dummy opens the shooting game; E elsewhere does nothing", () => {
    const { scene, at, replaced, pushed, events } = setup();
    scene.onKey({ code: "KeyE" });
    expect(pushed).toHaveLength(0);
    at(FOREVER_ZONES.mailbox.x, FOREVER_ZONES.mailbox.y);
    expect(scene.interaction()).toBe("mailbox");
    scene.onKey({ code: "KeyE" });
    expect(pushed).toHaveLength(1);
    expect(pushed[0]).toBeInstanceOf(ForeverLetterScene);
    expect(scene.chatLines()).not.toContain("우편이 없습니다.");
    at(FOREVER_ZONES.dummy.x, FOREVER_ZONES.dummy.y);
    scene.onKey({ code: "KeyE" });
    expect(replaced).toHaveLength(0);
    expect(pushed).toHaveLength(2);
    expect(pushed[1]).toBeInstanceOf(DummyShootScene);
    expect(events).toContain("forever-mailbox");
  });

  describe("the letter to Woowakgood", () => {
    const readLetter = (progress?: ForeverProgress) => {
      const env = setup(progress);
      env.at(FOREVER_ZONES.mailbox.x, FOREVER_ZONES.mailbox.y);
      return env;
    };

    it("waits in the mailbox: the sprite and the icon show it until the first reading", () => {
      const { scene } = readLetter();
      expect(scene.letterWaiting).toBe(true);
      const texts: string[] = [];
      const g = fakeGraphics();
      (g as unknown as { fillText: (t: string) => void }).fillText = (t: string) => void texts.push(t);
      scene.render(g);
      expect(texts).toContain("편지"); // the no-art stand-in of the envelope icon
      scene.onKey({ code: "KeyE" });
      expect(scene.letterWaiting).toBe(false);
      const after: string[] = [];
      const g2 = fakeGraphics();
      (g2 as unknown as { fillText: (t: string) => void }).fillText = (t: string) => void after.push(t);
      scene.render(g2);
      expect(after).not.toContain("편지");
    });

    it("opens with the popup and mailbox sounds, announces the first reading once, and saves it", () => {
      const { scene, pushed, events } = readLetter();
      scene.onKey({ code: "KeyE" });
      expect(events).toEqual(expect.arrayContaining(["forever-mailbox", "forever-popup-open"]));
      expect(scene.chatLines()).toContain("우편함: 우왁굳에게 온 편지를 읽었습니다.");
      expect(scene.progressSnapshot().letterRead).toBe(true);
      expect(loadProgress().letterRead).toBe(true);
      scene.onKey({ code: "KeyE" });
      expect(pushed).toHaveLength(2); // it can be read again
      expect(scene.chatLines().filter((line) => line.includes("편지를 읽었습니다"))).toHaveLength(1);
    });

    it("a save that already read it shows the plain mailbox", () => {
      const { scene } = readLetter({ ...defaultProgress(), letterRead: true });
      expect(scene.letterWaiting).toBe(false);
    });

    it("closes on E, Enter and Esc and renders with and without art", () => {
      for (const code of ["KeyE", "Enter", "NumpadEnter", "Escape"]) {
        const env = makeCtx();
        const letter = new ForeverLetterScene();
        letter.enter(env.ctx);
        letter.update(0.1);
        expect(() => letter.render(fakeGraphics())).not.toThrow();
        letter.onKey({ code: "KeyQ" });
        expect(env.popped()).toBe(0);
        letter.onKey({ code });
        expect(env.popped()).toBe(1);
      }
    });
  });

  describe("quests", () => {
    it("draws the quest marks: ! before the quest, a ? once it is running", () => {
      const marks = (scene: ForeverScene) => {
        const texts: string[] = [];
        const g = fakeGraphics();
        (g as unknown as { fillText: (t: string) => void }).fillText = (t: string) => void texts.push(t);
        scene.render(g);
        // every text is drawn twice (shadow, then the text itself)
        return texts.filter((t, i) => (t === "!" || t === "?") && texts[i - 1] === t);
      };
      expect(marks(setup().scene)).toEqual(["!", "!"]); // quest giver, innkeeper
      expect(marks(setup(acceptQuest(defaultProgress(), "q_rabbits")).scene)).toEqual(["?", "!"]);
    });

    it("opens the scroll on E at the quest giver; Esc closes it and nothing is accepted", () => {
      const { scene, stand, pushed, popped, events } = setup();
      stand("questgiver");
      expect(scene.interaction()).toBe("questgiver");
      scene.onKey({ code: "KeyE" });
      expect(pushed).toHaveLength(1);
      expect(pushed[0]).toBeInstanceOf(QuestPopupScene);
      expect(events).toContain("forever-npc-greet");
      expect(events).toContain("forever-popup-open");
      (pushed[0] as QuestPopupScene).onKey({ code: "Escape" });
      expect(popped()).toBe(1);
      expect(scene.progressSnapshot().quests).toEqual({});
      expect(events).not.toContain("forever-quest-accept");
    });

    it("accepts on E in the scroll, saves, and does not offer it a second time", () => {
      const { scene, stand, pushed, popped, events } = setup();
      stand("questgiver");
      scene.onKey({ code: "KeyE" });
      (pushed[0] as QuestPopupScene).onKey({ code: "KeyE" });
      expect(popped()).toBe(1);
      expect(scene.progressSnapshot().quests.q_rabbits).toEqual({ state: "active", count: 0 });
      expect(events).toContain("forever-quest-accept");
      expect(scene.chatLines()).toContain("퀘스트 수락: 「잔디밭의 불청객」");
      // a fresh scene reads the save
      const again = setup();
      expect(again.scene.progressSnapshot().quests.q_rabbits).toEqual({ state: "active", count: 0 });
      // asking again only reminds (info popup), it does not restart the quest
      scene.onKey({ code: "KeyE" });
      expect(pushed).toHaveLength(2);
      (pushed[1] as QuestPopupScene).onKey({ code: "KeyE" });
      expect(scene.progressSnapshot().quests.q_rabbits).toEqual({ state: "active", count: 0 });
    });

    it("counts rabbits only while the quest is active, and they come back", () => {
      const { scene, at, events } = setup(undefined, "field");
      at(FIELD_MOBS[0]!.x, FIELD_MOBS[0]!.y);
      expect(scene.interaction()).toBe("mob_0");
      scene.onKey({ code: "KeyE" });
      expect(scene.mobsAlive()[0]).toBe(false);
      expect(scene.progressSnapshot().quests.q_rabbits).toBeUndefined();
      expect(events).toContain("forever-rabbit-hit");
      expect(events).not.toContain("forever-quest-progress");
      expect(scene.interaction()).toBeNull();
      run(scene, Math.ceil(MOB_RESPAWN_SECONDS * 60) + 2);
      expect(scene.mobsAlive()[0]).toBe(true);
    });

    it("runs the whole first quest: 5 rabbits on the meadow → back through the portal → hand in → 100 xp → DING! at level 2", async () => {
      const { scene, at, stand, pushed, events } = setup(acceptQuest(defaultProgress(), "q_rabbits"), "field");
      const rabbits = FIELD_MOBS.filter((mob) => mob.kind === "rabbit");
      expect(rabbits.length).toBeGreaterThanOrEqual(5);
      rabbits.slice(0, 5).forEach((spot, index) => {
        at(spot.x, spot.y);
        scene.onKey({ code: "KeyE" });
        expect(scene.progressSnapshot().quests.q_rabbits!.count).toBe(index + 1);
      });
      expect(scene.chatLines().join("\n")).toContain("토끼 처치: 5/5");
      expect(events.filter((e) => e === "forever-quest-progress")).toHaveLength(5);
      expect(scene.level).toBe(1);
      // the quest giver stands in the town square: walk back through the portal
      at(FOREVER_MAP_FIELD.zones.portal!.x, FOREVER_MAP_FIELD.zones.portal!.y);
      scene.onKey({ code: "KeyE" });
      await flush();
      run(scene, Math.ceil(PORTAL_SECONDS * 60) + 2);
      expect(scene.mapId).toBe("elwynn");
      stand("questgiver");
      scene.onKey({ code: "KeyE" });
      const popup = pushed[0] as QuestPopupScene;
      expect(scene.dinging).toBe(false); // nothing is paid until the scroll is confirmed
      popup.onKey({ code: "KeyE" });
      expect(scene.progressSnapshot().quests.q_rabbits!.state).toBe("done");
      expect(scene.level).toBe(2);
      expect(scene.progressSnapshot().xp).toBe(0);
      expect(scene.dinging).toBe(true);
      expect(events).toEqual(expect.arrayContaining(["forever-quest-complete", "forever-ding"]));
      expect(scene.chatLines().join("\n")).toContain("축하합니다! 레벨 2에 도달했습니다.");
      expect(scene.progressSnapshot().achievements).toContain("level2");
      expect(() => scene.render(fakeGraphics())).not.toThrow();
      run(scene, Math.ceil(DING_SECONDS * 60) + 2);
      expect(scene.dinging).toBe(false);
      run(scene, 60 * 5); // the achievement toast plays out
      expect(events).toContain("forever-achievement");
      expect(() => scene.render(fakeGraphics())).not.toThrow();
    });

    it("no DING! when the reward does not reach the next level (Leroy: 150 xp at level 2)", () => {
      const { scene, stand, pushed, events } = setup(acceptQuest(rabbitsDone(), "q_leroy"));
      expect(scene.level).toBe(2);
      stand("leroy");
      scene.onKey({ code: "KeyE" });
      (pushed[0] as QuestPopupScene).onKey({ code: "KeyE" });
      expect(scene.progressSnapshot()).toMatchObject({ level: 2, xp: 150 });
      expect(scene.progressSnapshot().quests.q_leroy!.state).toBe("done");
      expect(scene.progressSnapshot().achievements).toContain("leroy");
      expect(scene.dinging).toBe(false);
      expect(events).not.toContain("forever-ding");
    });

    it("offers Leroy's quest at the quest giver only after the rabbits", () => {
      const first = setup();
      first.stand("questgiver");
      first.scene.onKey({ code: "KeyE" });
      expect(first.pushed).toHaveLength(1); // rabbits, not Leroy
      const later = setup(rabbitsDone());
      later.stand("questgiver");
      later.scene.onKey({ code: "KeyE" });
      (later.pushed[0] as QuestPopupScene).onKey({ code: "KeyE" });
      expect(later.scene.progressSnapshot().quests.q_leroy).toEqual({ state: "active", count: 0 });
    });

    it("the innkeeper rests you when he has nothing to hand out", () => {
      const done = completeQuest(advanceQuest(acceptQuest(defaultProgress(), "q_hearth"), "q_hearth"), "q_hearth").progress;
      const { scene, stand, pushed } = setup(done);
      stand("innkeeper");
      scene.onKey({ code: "KeyE" });
      expect(pushed).toHaveLength(0);
      expect(scene.chatLines().join("\n")).toContain("휴식 상태입니다.");
    });

    it("wraps text by spaces and breaks over-long words", () => {
      const measure = (text: string) => text.length * 10;
      expect(wrapLines(measure, "aaa bbb ccc", 70)).toEqual(["aaa bbb", "ccc"]);
      expect(wrapLines(measure, "abcdefghij", 40)).toEqual(["abcd", "efgh", "ij"]);
      expect(wrapLines(measure, "", 40)).toEqual([]);
    });

    it("the popup renders without art", () => {
      const popup = new QuestPopupScene({ mode: "offer", title: QUESTS.q_rabbits.name, body: QUESTS.q_rabbits.offer, reward: QUESTS.q_rabbits.reward });
      popup.enter(makeCtx().ctx);
      popup.update(0.1);
      expect(() => popup.render(fakeGraphics())).not.toThrow();
    });
  });

  describe("hearthstone cast", () => {
    const startCast = (progress?: ForeverProgress) => {
      const env = setup(progress);
      env.at(FOREVER_ZONES.hearthstone.x, FOREVER_ZONES.hearthstone.y - 20);
      expect(env.scene.interaction()).toBe("hearthstone");
      env.scene.onKey({ code: "Enter" });
      return env;
    };

    it("starts a cast bar instead of leaving at once", () => {
      const { scene, replaced, events } = startCast();
      expect(scene.castSeconds).toBe(0);
      expect(replaced).toHaveLength(0);
      expect(events).toContain("forever-cast-loop");
      expect(scene.interaction()).toBeNull();
      run(scene, 60);
      expect(scene.castSeconds).toBeCloseTo(1, 1);
      expect(() => scene.render(fakeGraphics())).not.toThrow();
    });

    it("keeps the player still while casting and ignores a second E", () => {
      const { scene, player } = startCast();
      const before = { ...player() };
      run(scene, 30);
      scene.onKey({ code: "KeyE" });
      expect(scene.castSeconds).toBeGreaterThan(0.4);
      expect(player()).toMatchObject({ x: before.x, y: before.y });
    });

    it("is cancelled by a movement key held down", () => {
      const { scene, held, replaced, events } = startCast();
      run(scene, 60);
      held.add("ArrowLeft");
      run(scene, 2);
      expect(scene.castSeconds).toBeNull();
      expect(events).toEqual(expect.arrayContaining(["forever-cast-cancel", "stop:forever-cast-loop"]));
      expect(scene.chatLines()).toContain("시전이 취소되었습니다.");
      held.delete("ArrowLeft");
      run(scene, CAST_SECONDS * 60);
      expect(replaced).toHaveLength(0);
    });

    it("is cancelled by an arrow key press", () => {
      const { scene, events } = startCast();
      run(scene, 30);
      scene.onKey({ code: "ArrowUp" });
      expect(scene.castSeconds).toBeNull();
      expect(events).toContain("forever-cast-cancel");
    });

    it("can be started again after a cancel", () => {
      const { scene } = startCast();
      scene.onKey({ code: "ArrowDown" });
      scene.onKey({ code: "KeyE" });
      expect(scene.castSeconds).toBe(0);
    });

    it("does not finish early, then wipes back to a pitch flagged fromForever", () => {
      const { scene, replaced, events } = startCast();
      run(scene, (CAST_SECONDS - 1) * 60);
      expect(replaced).toHaveLength(0);
      run(scene, 2 * 60 + 5);
      expect(replaced).toHaveLength(1);
      expect(replaced[0]!.scene).toBeInstanceOf(PitchScene);
      expect(replaced[0]!.params).toEqual({ fromForever: true });
      expect(replaced[0]!.transition).toBe("wipe");
      expect(events).toEqual(expect.arrayContaining(["forever-cast-complete", "stop:forever-cast-loop"]));
      scene.onKey({ code: "KeyE" });
      expect(replaced).toHaveLength(1);
      expect(scene.interaction()).toBeNull();
    });

    it("counts the recall for the hearth quest", () => {
      const { scene } = startCast(acceptQuest(defaultProgress(), "q_hearth"));
      run(scene, CAST_SECONDS * 60 + 5);
      expect(scene.progressSnapshot().quests.q_hearth).toEqual({ state: "active", count: 1 });
    });
  });

  describe("griffin", () => {
    const menu = (scene: ForeverScene, pushed: Scene[]) => {
      scene.onKey({ code: "KeyE" });
      return pushed[pushed.length - 1] as QuestPopupScene;
    };

    it("opens a numbered menu; Esc closes it without flying", () => {
      const { scene, stand, pushed, popped } = setup();
      stand("flightmaster");
      expect(scene.interaction()).toBe("flightmaster");
      menu(scene, pushed).onKey({ code: "Escape" });
      expect(popped()).toBe(1);
      expect(scene.flying).toBe(false);
    });

    it("option 1 shows the flight text and puts the player back on the pitch after GRIFFIN_SECONDS", () => {
      const { scene, stand, pushed, replaced, events } = setup();
      stand("flightmaster");
      menu(scene, pushed).onKey({ code: "Digit1" });
      expect(scene.flying).toBe(true);
      expect(events).toContain("forever-griffin");
      expect(scene.chatLines()).toContain("그리핀 비행 중…");
      run(scene, Math.floor(GRIFFIN_SECONDS * 60) - 3);
      expect(replaced).toHaveLength(0);
      expect(() => scene.render(fakeGraphics())).not.toThrow();
      run(scene, 6);
      expect(replaced).toHaveLength(1);
      expect(replaced[0]!.scene).toBeInstanceOf(PitchScene);
      expect(replaced[0]!.params).toEqual({ fromForever: true });
      expect(replaced[0]!.transition).toBe("wipe");
    });

    it("option 2 flies to the second map: loads its group, new spawn, banner, no pitch return", async () => {
      const { scene, stand, pushed, replaced, loaded, player, events } = setup();
      stand("flightmaster");
      menu(scene, pushed).onKey({ code: "Digit2" });
      expect(loaded).toContain("forever2");
      await flush();
      run(scene, Math.ceil(GRIFFIN_SECONDS * 60) + 2);
      expect(replaced).toHaveLength(0);
      expect(scene.mapId).toBe("orgrimmar");
      expect(scene.flying).toBe(false);
      expect(player()).toMatchObject(FOREVER_MAP_ORGRIMMAR.spawn);
      expect(events.filter((e) => e === "forever-zone-enter")).toHaveLength(2);
      expect(scene.chatLines().join("\n")).toContain("오그리 잔디마");
      expect(() => scene.render(fakeGraphics())).not.toThrow();
    });

    it("waits at the destination until the map group has loaded", async () => {
      let release: () => void = () => undefined;
      const env = makeCtx((group) => (group === "forever2" ? new Promise((resolve) => (release = () => resolve({}))) : Promise.resolve({})));
      const scene = new ForeverScene({ createPitch: () => new PitchScene(), random: () => 0.5 });
      scene.enter(env.ctx);
      const p = (scene as unknown as { player: { x: number; y: number } }).player;
      Object.assign(p, { x: FOREVER_ZONES.flightmaster.x, y: FOREVER_ZONES.flightmaster.y });
      scene.onKey({ code: "KeyE" });
      (env.pushed[0] as QuestPopupScene).onKey({ code: "Digit2" });
      run(scene, 120);
      expect(scene.mapId).toBe("elwynn");
      expect(scene.flying).toBe(true);
      release();
      await flush();
      run(scene, 2);
      expect(scene.mapId).toBe("orgrimmar");
    });
  });

  describe("chat", () => {
    it("keeps at most 5 lines and drops them after 8 seconds", () => {
      const { scene, stand } = setup();
      stand("leroy");
      for (let i = 0; i < 8; i++) scene.onKey({ code: "KeyE" });
      expect(scene.chatLines()).toHaveLength(5);
      expect(() => scene.render(fakeGraphics())).not.toThrow();
      run(scene, 9 * 60);
      expect(() => scene.render(fakeGraphics())).not.toThrow();
    });

    it("drops a [월드] line in every 45-90 s", () => {
      const { scene, events } = setup();
      run(scene, 44 * 60);
      expect(scene.chatLines().some((line) => line.startsWith("[월드] "))).toBe(false);
      run(scene, 30 * 60);
      expect(scene.chatLines().some((line) => line.startsWith("[월드] "))).toBe(true);
      expect(events).toContain("forever-chat");
    });

    it("greets with the guild line and the <잔디동> tag is drawn", () => {
      const { scene } = setup();
      expect(scene.chatLines().some((line) => line.startsWith("[길드] "))).toBe(true);
      const texts: string[] = [];
      const g = fakeGraphics();
      (g as unknown as { fillText: (t: string) => void }).fillText = (t: string) => void texts.push(t);
      scene.render(g);
      expect(texts).toContain("<잔디동>");
    });
  });
});

describe("PitchScene Jandi Forever gate", () => {
  interface Internals {
    player: { x: number; y: number; fx: number };
    ball: { x: number; y: number; mode: string };
    match: { goals: number; saves: number; streak: number; bestStreak: number; shots: number };
    hintsVisible: boolean;
    gateNear: boolean;
    foreverNear: boolean;
  }
  const inner = (scene: PitchScene) => scene as unknown as Internals;

  const setup = (x: number, y: number) => {
    const env = makeCtx();
    const scene = new PitchScene();
    scene.enter(env.ctx);
    inner(scene).player.x = x;
    inner(scene).player.y = y;
    inner(scene).ball.x = x - 28;
    inner(scene).ball.y = y;
    run(scene, 2);
    return { ...env, scene };
  };
  const groupsOnly = (groups: string[]) => groups.filter((group) => !group.startsWith("pets:"));

  it("wipes into the loading screen on E or Enter within 70px of the gate centre", () => {
    for (const code of ["KeyE", "Enter", "NumpadEnter"]) {
      const { scene, replaced, events } = setup(GATE_FOREVER.centerX - 60, GATE_FOREVER.centerY);
      expect(inner(scene).foreverNear).toBe(true);
      scene.onKey({ code });
      expect(replaced).toHaveLength(1);
      expect(replaced[0]!.scene).toBeInstanceOf(ForeverLoadingScene);
      expect(replaced[0]!.transition).toBe("wipe");
      expect(events).toContain("forever-portal-enter");
      expect(events).not.toContain("gate-open");
    }
  });

  it("does nothing just outside the prompt radius or while a skill runs", () => {
    const outside = setup(GATE_FOREVER.centerX - 75, GATE_FOREVER.centerY);
    outside.scene.onKey({ code: "KeyE" });
    expect(outside.replaced).toHaveLength(0);
    const skill = setup(GATE_FOREVER.centerX - 60, GATE_FOREVER.centerY);
    skill.scene.onKey({ code: "KeyZ" });
    skill.scene.onKey({ code: "KeyE" });
    expect(skill.replaced).toHaveLength(0);
  });

  it("preloads the forever group once within 200px and never the locker group", () => {
    expect(groupsOnly(setup(480, 440).loaded)).toHaveLength(0);
    const near = setup(GATE_FOREVER.centerX - 150, GATE_FOREVER.centerY);
    expect(groupsOnly(near.loaded)).toEqual(["forever"]);
    run(near.scene, 30);
    expect(groupsOnly(near.loaded)).toEqual(["forever"]);
  });

  it("the locker gate still opens the locker room, not Forever", () => {
    const { scene, replaced } = setup(99 + 60, 399);
    scene.onKey({ code: "KeyE" });
    expect(replaced[0]!.scene).toBeInstanceOf(LockerScene);
  });

  it("carries the score and returns to FOREVER_SPAWN with the ball at the feet", () => {
    const { scene, replaced } = setup(GATE_FOREVER.centerX - 60, GATE_FOREVER.centerY);
    Object.assign(inner(scene).match, { goals: 3, saves: 2, streak: 2, bestStreak: 3, shots: 5 });
    inner(scene).hintsVisible = false;
    scene.onKey({ code: "KeyE" });
    const loading = replaced[0]!.scene as unknown as { params: { createPitch(): Scene } };
    const back = loading.params.createPitch();
    expect(back).toBeInstanceOf(PitchScene);
    back.enter?.(makeCtx().ctx, { fromForever: true });
    const next = inner(back as PitchScene);
    expect(next.player.x).toBe(FOREVER_SPAWN.x);
    expect(next.player.y).toBe(FOREVER_SPAWN.y);
    expect(next.ball.mode).toBe("carried");
    expect(next.ball.y).toBe(FOREVER_SPAWN.y);
    expect(next.match).toMatchObject({ goals: 3, saves: 2, streak: 2, bestStreak: 3, shots: 5 });
    expect(next.hintsVisible).toBe(false);
  });

  it("with both prompts up, E enters the nearer gate", () => {
    // no real position has both radii at once (the gates are 762px apart), so widen the locker gate's reach through its flag
    const { scene, replaced } = setup(GATE_FOREVER.centerX - 60, GATE_FOREVER.centerY);
    inner(scene).gateNear = true;
    const closer = scene as unknown as { promptGate(): string | null };
    expect(closer.promptGate()).toBe("forever");
    inner(scene).player.x = 99 + 60;
    inner(scene).player.y = 399;
    inner(scene).foreverNear = true;
    expect(closer.promptGate()).toBe("locker");
    expect(replaced).toHaveLength(0);
  });

  it("renders both gates without assets", () => {
    const { scene } = setup(GATE_FOREVER.centerX - 60, GATE_FOREVER.centerY);
    expect(() => scene.render(fakeGraphics())).not.toThrow();
  });
});

describe("Orgrimmar map", () => {
  beforeEach(() => resetProgressMemory());
  const setup = () => {
    const env = makeCtx();
    const scene = new ForeverScene({ createPitch: () => new PitchScene(), random: () => 0.5, map: "orgrimmar" });
    scene.enter(env.ctx);
    const player = () => (scene as unknown as { player: { x: number; y: number } }).player;
    const stand = (id: keyof typeof FOREVER_MAP_ORGRIMMAR.zones) => Object.assign(player(), FOREVER_MAP_ORGRIMMAR.zones[id]!);
    return { ...env, scene, player, stand };
  };

  it("starts at its own spawn, out of every interaction circle, and renders without art", () => {
    const { scene, player } = setup();
    expect(scene.mapId).toBe("orgrimmar");
    expect(player()).toMatchObject(FOREVER_MAP_ORGRIMMAR.spawn);
    expect(foreverTargetAt(FOREVER_MAP_ORGRIMMAR.spawn.x, FOREVER_MAP_ORGRIMMAR.spawn.y, FOREVER_MAP_ORGRIMMAR.zones)).toBeNull();
    expect(scene.chatLines().join("\n")).toContain("오그리 잔디마");
    run(scene, 10);
    expect(() => scene.render(fakeGraphics())).not.toThrow();
  });

  it("keeps the spawn and every interaction spot inside the floor and out of the colliders", () => {
    const { area, colliders, zones, spawn } = FOREVER_MAP_ORGRIMMAR;
    const inside = (x: number, y: number) => x >= area.minX && x <= area.maxX && y >= area.minY && y <= area.maxY;
    const blocked = (x: number, y: number) => colliders.some((box) => x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h);
    expect(inside(spawn.x, spawn.y) && !blocked(spawn.x, spawn.y)).toBe(true);
    for (const zone of Object.values(zones)) expect(zone && inside(zone.x, zone.y) && !blocked(zone.x, zone.y)).toBe(true);
  });

  it("NPCs only chat: no quest scroll, no marks, no rabbits", () => {
    const { scene, stand, pushed } = setup();
    stand("questgiver");
    scene.onKey({ code: "KeyE" });
    expect(pushed).toHaveLength(0);
    expect(scene.chatLines().join("\n")).toContain("족장 잔드록:");
    expect(scene.mobsAlive()).toHaveLength(0);
    expect(scene.progressSnapshot().quests).toEqual({});
  });

  it("casts the hearthstone to the pitch and the flight menu offers the way back", () => {
    const { scene, stand, replaced } = setup();
    stand("hearthstone");
    scene.onKey({ code: "KeyE" });
    run(scene, CAST_SECONDS * 60 + 5);
    expect(replaced[0]!.scene).toBeInstanceOf(PitchScene);
    const again = setup();
    again.stand("flightmaster");
    again.scene.onKey({ code: "KeyE" });
    expect(again.pushed).toHaveLength(1);
  });
});

describe("town square declutter and the monster meadow (docs/forever/07)", () => {
  beforeEach(() => resetProgressMemory());
  const setup = (map: ForeverMapId, progress?: ForeverProgress) => {
    if (progress) saveProgress(progress);
    const env = makeCtx();
    const scene = new ForeverScene({ createPitch: () => new PitchScene(), random: () => 0.5, map });
    scene.enter(env.ctx);
    const player = () => (scene as unknown as { player: { x: number; y: number } }).player;
    const at = (x: number, y: number) => Object.assign(player(), { x, y });
    return { ...env, scene, player, at };
  };
  const flightDone = async (scene: ForeverScene) => {
    await flush();
    run(scene, Math.ceil(PORTAL_SECONDS * 60) + 2);
  };

  it("the square has no monsters; the meadow has 12: 6 rabbits, 2 boars, 2 murlocs, 2 kobolds", () => {
    expect(setup("elwynn").scene.mobsAlive()).toHaveLength(0);
    const meadow = setup("field").scene;
    expect(meadow.mobsAlive()).toHaveLength(12);
    const count = (kind: string) => FIELD_MOBS.filter((mob) => mob.kind === kind).length;
    expect([count("rabbit"), count("boar"), count("murloc"), count("kobold")]).toEqual([6, 2, 2, 2]);
  });

  it("the meadow starts at its own spawn, with the zone banner and no quest marks", () => {
    const { scene, player } = setup("field");
    expect(scene.mapId).toBe("field");
    expect(player()).toMatchObject(FOREVER_MAP_FIELD.spawn);
    expect(scene.chatLines().join("\n")).toContain("토끼 초원");
    expect(scene.interaction()).toBeNull();
    run(scene, 10);
    expect(() => scene.render(fakeGraphics())).not.toThrow();
  });

  it("other monsters give a chat line and the defeat sound (the murloc its own too) and never touch the quest", () => {
    const boar = FIELD_MOBS.findIndex((mob) => mob.kind === "boar");
    const murloc = FIELD_MOBS.findIndex((mob) => mob.kind === "murloc");
    const kobold = FIELD_MOBS.findIndex((mob) => mob.kind === "kobold");
    const { scene, at, events } = setup("field", acceptQuest(defaultProgress(), "q_rabbits"));
    at(FIELD_MOBS[boar]!.x, FIELD_MOBS[boar]!.y);
    expect(scene.interaction()).toBe(`mob_${boar}`);
    scene.onKey({ code: "KeyE" });
    expect(scene.chatLines()).toContain("멧돼지을(를) 처치했습니다.");
    expect(events).toContain("forever-mob-defeat");
    expect(events).not.toContain("forever-murloc");
    at(FIELD_MOBS[murloc]!.x, FIELD_MOBS[murloc]!.y);
    scene.onKey({ code: "KeyE" });
    expect(events).toContain("forever-murloc");
    at(FIELD_MOBS[kobold]!.x, FIELD_MOBS[kobold]!.y);
    scene.onKey({ code: "KeyE" });
    expect(scene.chatLines().join("\n")).toContain("코볼트을(를) 처치했습니다.");
    expect(events).not.toContain("forever-rabbit-hit");
    expect(scene.progressSnapshot().quests.q_rabbits).toEqual({ state: "active", count: 0 });
  });

  it("a sixth rabbit does not move a finished counter", () => {
    const { scene, at } = setup("field", advanceQuest(acceptQuest(defaultProgress(), "q_rabbits"), "q_rabbits", 5));
    const rabbit = FIELD_MOBS.find((mob) => mob.kind === "rabbit")!;
    at(rabbit.x, rabbit.y);
    scene.onKey({ code: "KeyE" });
    expect(scene.progressSnapshot().quests.q_rabbits!.count).toBe(5);
    expect(scene.chatLines()).toContain("토끼를 처치했습니다.");
  });

  describe("portals", () => {
    it("the square's portal asks for the meadow; E fades through it with the portal sound, no griffin", async () => {
      const { scene, at, events, loaded, player } = setup("elwynn");
      at(FOREVER_ZONES.portal.x, FOREVER_ZONES.portal.y);
      expect(scene.interaction()).toBe("portal");
      scene.onKey({ code: "KeyE" });
      expect(scene.flying).toBe(true);
      expect(events).toContain("forever-portal-enter");
      expect(events).not.toContain("forever-griffin");
      expect(scene.chatLines()).not.toContain("그리핀 비행 중…");
      expect(loaded).toContain("forever-field");
      run(scene, 5);
      expect(() => scene.render(fakeGraphics())).not.toThrow();
      await flightDone(scene);
      expect(scene.mapId).toBe("field");
      expect(scene.flying).toBe(false);
      expect(player()).toMatchObject(FOREVER_MAP_FIELD.spawn);
      expect(scene.chatLines().join("\n")).toContain("토끼 초원");
    });

    it("the way back keeps the progress and lands on the square's spawn", async () => {
      const progress = { ...defaultProgress(), level: 3, xp: 40, letterRead: true };
      const { scene, at, player } = setup("field", progress);
      const zone = FOREVER_MAP_FIELD.zones.portal!;
      at(zone.x, zone.y);
      expect(scene.interaction()).toBe("portal");
      scene.onKey({ code: "Enter" });
      await flightDone(scene);
      expect(scene.mapId).toBe("elwynn");
      expect(player()).toMatchObject(FOREVER_MAP_ELWYNN.spawn);
      expect(scene.progressSnapshot()).toMatchObject({ level: 3, xp: 40, letterRead: true });
    });

    it("ignores a second E while walking through and blocks the walk", () => {
      const { scene, at, player, held } = setup("elwynn");
      at(FOREVER_ZONES.portal.x, FOREVER_ZONES.portal.y);
      scene.onKey({ code: "KeyE" });
      const before = { ...player() };
      held.add("ArrowLeft");
      run(scene, 10);
      scene.onKey({ code: "KeyE" });
      expect(player()).toMatchObject({ x: before.x, y: before.y });
      expect(scene.interaction()).toBeNull();
    });

    it("preloads the meadow's group once when the player nears the portal, not before", () => {
      const far = setup("elwynn");
      run(far.scene, 5);
      expect(far.loaded.filter((group) => group === "forever-field")).toHaveLength(0);
      const near = setup("elwynn");
      near.at(FOREVER_ZONES.portal.x - 150, FOREVER_ZONES.portal.y);
      run(near.scene, 5);
      run(near.scene, 30);
      expect(near.loaded.filter((group) => group === "forever-field")).toHaveLength(1);
    });

    it("opens the meadow even when its group fails to load", async () => {
      const env = makeCtx((group) => (group === "forever-field" ? Promise.reject(new Error("boom")) : Promise.resolve({})));
      const scene = new ForeverScene({ createPitch: () => new PitchScene(), random: () => 0.5 });
      scene.enter(env.ctx);
      const p = (scene as unknown as { player: { x: number; y: number } }).player;
      Object.assign(p, FOREVER_ZONES.portal);
      scene.onKey({ code: "KeyE" });
      await flightDone(scene);
      expect(scene.mapId).toBe("field");
      expect(() => scene.render(fakeGraphics())).not.toThrow();
    });
  });
});

describe("dummy shooting", () => {
  it("the meter is a 0..100 triangle wave", () => {
    expect([0, 0.45, 0.9, 1.35, 1.8].map(meterPower)).toEqual([0, 50, 100, 50, 0]);
  });

  it("misses below 8, hits above, crits inside the sweet band and scales with power", () => {
    const mid = () => 0.5;
    expect(dummyHit(5, mid)).toEqual({ power: 5, kind: "miss", damage: 0 });
    const soft = dummyHit(30, mid);
    const strong = dummyHit(70, mid);
    expect(soft.kind).toBe("hit");
    expect(strong.damage).toBeGreaterThan(soft.damage);
    const crit = dummyHit(DUMMY_SWEET.from, mid);
    expect(crit.kind).toBe("crit");
    expect(crit.damage).toBeGreaterThan(strong.damage);
    expect(dummyHit(DUMMY_SWEET.to + 1, mid).kind).toBe("hit");
    expect(dummyHit(500, mid).power).toBe(100);
  });

  it("the meter speeds up with every shot, up to a cap", () => {
    expect(dummySpeed(0)).toBe(1);
    expect(dummySpeed(1)).toBeGreaterThan(dummySpeed(0));
    expect(dummySpeed(5)).toBeGreaterThan(dummySpeed(1));
    expect(dummySpeed(1000)).toBe(DUMMY_MAX_SPEED);
  });

  const open = () => {
    const env = makeCtx();
    const scene = new DummyShootScene({ random: () => 0.5 });
    scene.enter(env.ctx);
    return { ...env, scene };
  };

  it("shoots on Space, rests, then shoots again with no attempt limit", () => {
    const { scene, events } = open();
    run(scene, 30); // 0.5 s: meter at ~55
    expect(scene.shoot()?.kind).toBe("hit");
    expect(scene.shots).toBe(1);
    expect(scene.resting).toBe(true);
    expect(scene.shoot()).toBeNull(); // still resting
    expect(events).toContain("forever-dummy-hit");
    for (let i = 0; i < 20; i++) {
      run(scene, Math.ceil(DUMMY_REST_SECONDS * 60) + 1);
      run(scene, 25);
      scene.onKey({ code: "Space" });
    }
    expect(scene.shots).toBe(21);
    expect(scene.total).toBeGreaterThan(0);
    expect(scene.best).toBeGreaterThan(0);
    expect(() => scene.render(fakeGraphics())).not.toThrow();
  });

  it("after some shots the same time on the meter reads further along than on the first shot", () => {
    const first = open();
    run(first.scene, 20);
    const early = first.scene.power;
    const later = open();
    for (let i = 0; i < 6; i++) {
      run(later.scene, 20);
      later.scene.shoot();
      run(later.scene, Math.ceil(DUMMY_REST_SECONDS * 60) + 1);
    }
    expect(later.scene.speed).toBeGreaterThan(1.5);
    run(later.scene, 20);
    expect(later.scene.power).not.toBe(early);
    expect(later.scene.speed).toBe(dummySpeed(6));
  });

  it("a crit also plays the defeat sound; a miss is silent; Esc closes", () => {
    const crit = open();
    run(crit.scene, Math.round(0.9 * 0.85 * 60)); // ~85
    expect(crit.scene.shoot()?.kind).toBe("crit");
    expect(crit.events).toContain("forever-mob-defeat");
    const miss = open();
    miss.scene.onKey({ code: "KeyE" });
    expect(miss.scene.total).toBe(0);
    expect(miss.events).not.toContain("forever-dummy-hit");
    miss.scene.onKey({ code: "Escape" });
    expect(miss.popped()).toBe(1);
  });

  it("does not touch the Forever progress", () => {
    resetProgressMemory();
    saveProgress(defaultProgress());
    const { scene } = open();
    run(scene, 30);
    scene.shoot();
    expect(scene.total).toBeGreaterThan(0);
    expect(loadProgress()).toEqual(defaultProgress());
  });
});
