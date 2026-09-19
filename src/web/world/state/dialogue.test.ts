import { describe, expect, it } from "vitest";
import { advance, confirmChoice, countChars, currentLine, fillPlaceholders, moveChoice, startDialogue, tickTyping, visibleText, type DialogueNode } from "./dialogue";

const node: DialogueNode = {
  lines: [
    { speaker: "elder", text: "안녕, {player}!" },
    { speaker: "elder", text: "두 번째 줄" },
  ],
};

describe("typing", () => {
  it("reveals characters and turns to waiting when the line is complete", () => {
    let state = startDialogue(node);
    expect(state.phase).toBe("typing");
    expect(visibleText(state)).toBe("");
    state = tickTyping(state, 3);
    expect(visibleText(state)).toBe("안녕,");
    state = tickTyping(state, 100);
    expect(state.phase).toBe("waiting");
    expect(visibleText(state)).toBe("안녕, {player}!");
  });

  it("counts by code point, so emoji do not split", () => {
    expect(countChars("a🪼b")).toBe(3);
  });
});

describe("advance", () => {
  it("completes a typing line first, then moves on line by line, then ends", () => {
    let state = startDialogue(node);
    state = advance(state);
    expect(state.phase).toBe("waiting");
    expect(state.line).toBe(0);
    state = advance(state);
    expect(state.line).toBe(1);
    expect(state.phase).toBe("typing");
    state = advance(advance(state));
    expect(state.phase).toBe("done");
  });

  it("does nothing once done", () => {
    const done = advance(advance(advance(advance(startDialogue(node)))));
    expect(advance(done)).toBe(done);
    expect(currentLine(done)?.text).toBe("두 번째 줄");
  });
});

describe("choices that cannot be picked", () => {
  const menu: DialogueNode = {
    lines: [{ speaker: "referee", text: "어떻게 할래?" }],
    choices: [
      { label: "도전", next: null },
      { label: "황금 공으로 승리", next: { lines: [{ speaker: "referee", text: "좋아." }] }, disabled: true },
      { label: "준비", next: null },
    ],
  };

  it("starts on the first choice that can be picked", () => {
    const first = advance(advance(startDialogue({ ...menu, choices: [{ ...menu.choices![1] }, menu.choices![2]] })));
    expect(first.phase).toBe("choosing");
    expect(first.choice).toBe(1);
  });

  it("skips them when the cursor moves, in both directions and around the ends", () => {
    let state = advance(advance(startDialogue(menu)));
    expect(state.choice).toBe(0);
    state = moveChoice(state, 1);
    expect(state.choice).toBe(2);
    state = moveChoice(state, 1);
    expect(state.choice).toBe(0);
    state = moveChoice(state, -1);
    expect(state.choice).toBe(2);
    state = moveChoice(state, -1);
    expect(state.choice).toBe(0);
  });

  it("does not follow one even if the cursor is put on it", () => {
    const state = { ...advance(advance(startDialogue(menu))), choice: 1 };
    expect(confirmChoice(state)).toBe(state);
  });
});

describe("choices", () => {
  const withChoices: DialogueNode = {
    lines: [{ speaker: "elder", text: "어떻게 할래?" }],
    choices: [
      { label: "듣는다", next: { lines: [{ speaker: "elder", text: "그럼 들려주마." }] } },
      { label: "괜찮아요", next: null },
    ],
  };

  it("offers the choices after the last line, wraps the cursor and follows a branch", () => {
    let state = advance(advance(startDialogue(withChoices)));
    expect(state.phase).toBe("choosing");
    state = moveChoice(state, -1);
    expect(state.choice).toBe(1);
    state = moveChoice(state, 1);
    expect(state.choice).toBe(0);
    state = confirmChoice(state);
    expect(state.phase).toBe("typing");
    expect(currentLine(state)?.text).toBe("그럼 들려주마.");
  });

  it("ends the conversation when a choice has no branch", () => {
    let state = advance(advance(startDialogue(withChoices)));
    state = confirmChoice(moveChoice(state, 1));
    expect(state.phase).toBe("done");
  });

  it("ignores choice keys outside the choosing phase", () => {
    const state = startDialogue(withChoices);
    expect(moveChoice(state, 1)).toBe(state);
    expect(confirmChoice(state)).toBe(state);
  });
});

describe("fillPlaceholders", () => {
  it("replaces every {player}", () => {
    expect(fillPlaceholders("{player}, {player}!", "재닌")).toBe("재닌, 재닌!");
  });
});
