import { afterEach, describe, expect, it, vi } from "vitest";
import { registerMusicHandler, resumeGlobalMusic, suspendGlobalMusic, type MusicHandler } from "./musicControl";

function makeHandler(playing: boolean) {
  const state = { playing };
  const handler: MusicHandler = {
    isPlaying: () => state.playing,
    pause: vi.fn(() => { state.playing = false; }),
    play: vi.fn(() => { state.playing = true; }),
  };
  return { handler, state };
}

let unregister: (() => void) | undefined;
afterEach(() => {
  unregister?.();
  unregister = undefined;
});

describe("musicControl", () => {
  it("pauses playing music on suspend and resumes it afterwards", () => {
    const { handler } = makeHandler(true);
    unregister = registerMusicHandler(handler);
    suspendGlobalMusic();
    expect(handler.pause).toHaveBeenCalledTimes(1);
    resumeGlobalMusic();
    expect(handler.play).toHaveBeenCalledTimes(1);
  });

  it("leaves music the visitor had already paused alone", () => {
    const { handler } = makeHandler(false);
    unregister = registerMusicHandler(handler);
    suspendGlobalMusic();
    resumeGlobalMusic();
    expect(handler.pause).not.toHaveBeenCalled();
    expect(handler.play).not.toHaveBeenCalled();
  });

  it("does not resume twice or without a preceding suspend", () => {
    const { handler } = makeHandler(true);
    unregister = registerMusicHandler(handler);
    resumeGlobalMusic();
    expect(handler.play).not.toHaveBeenCalled();
    suspendGlobalMusic();
    suspendGlobalMusic();
    expect(handler.pause).toHaveBeenCalledTimes(1);
    resumeGlobalMusic();
    resumeGlobalMusic();
    expect(handler.play).toHaveBeenCalledTimes(1);
  });

  it("is a no-op when no player is mounted, and forgets a player that unmounts while suspended", () => {
    expect(() => { suspendGlobalMusic(); resumeGlobalMusic(); }).not.toThrow();
    const first = makeHandler(true);
    const unregisterFirst = registerMusicHandler(first.handler);
    suspendGlobalMusic();
    unregisterFirst();
    const second = makeHandler(true);
    unregister = registerMusicHandler(second.handler);
    resumeGlobalMusic();
    expect(second.handler.play).not.toHaveBeenCalled();
  });
});
