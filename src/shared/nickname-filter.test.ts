import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { checkNickname } from "./minigame-scores.js";
import { containsBlockedWord, findBlockedWord } from "./nickname-filter.js";

const blocked = (names: string[]) => names.filter((name) => !containsBlockedWord(name));
const allowed = (names: string[]) => names.filter((name) => containsBlockedWord(name));

describe("Korean profanity and sexual words", () => {
  it("blocks the LDNOOBW entries, including the internet slang ones", () => {
    // 노모 / 유모 / 망가 are sexual slang and must stay blocked.
    expect(blocked(["노모", "유모", "망가", "씨발", "병신", "보지", "자지", "섹스", "야동", "변태", "몰카", "강간"])).toEqual([]);
  });

  it("blocks badwords-ko and slang.csv entries", () => {
    expect(blocked(["개새끼", "쌍년", "미친놈", "또라이", "느금마", "니애미", "닥쳐", "쉬발", "십팔", "시팔새끼", "딸딸이", "성관계"])).toEqual([]);
  });

  it("blocks the words wherever they sit in a longer name", () => {
    expect(blocked(["축구왕씨발", "씨발축구", "나는씨발이다", "김병신", "노모짱"])).toEqual([]);
  });

  it("sees through the usual disguises", () => {
    expect(
      blocked([
        "씨 발", // spaces
        "씨.발", "씨_발", "씨-발", // punctuation
        "씨1발", "시8발", "씨123발", // digits
        "ㅅㅣㅂㅏㄹ", "ㅆㅣㅂㅏㄹ", // typed as separate jamo
        "시이이발", "씨이이이발", "시이발", // stretched vowels
        "시ㅣ발", "씨ㅣ발",
        "병 신", "병.신", "병1신",
        "미이친놈", "느으금마",
      ]),
    ).toEqual([]);
  });

  it("blocks consonant-only abbreviations that were typed as jamo", () => {
    expect(blocked(["ㅅㅂ", "ㅆㅂ", "ㅂㅅ", "ㅄ", "ㅈㄹ", "ㅈㄴ", "ㅁㅊ", "ㅋㅋㅅㅂ", "ㅅ ㅂ", "ㅅ.ㅂ"])).toEqual([]);
  });

  it("does not mistake consonants of ordinary syllables for those abbreviations", () => {
    expect(allowed(["옷발", "낫벼", "숫불", "웃방"])).toEqual([]);
  });

  it("blocks Korean typed on an English keyboard", () => {
    expect(blocked(["tlqkf", "Tlqkf", "qudtls", "wlfkf", "whssk", "alcls", "tprtm"])).toEqual([]);
  });

  it("does not block a silent ㅇ that follows a consonant (슈모 is not 유모)", () => {
    expect(allowed(["슈몽이", "딸기슈몽이", "슈모"])).toEqual([]);
  });

  it("still blocks a blocked word glued to an allowed phrase", () => {
    expect(containsBlockedWord("시바견")).toBe(false);
    expect(containsBlockedWord("시바견씨발")).toBe(true);
    expect(containsBlockedWord("씨발시바견")).toBe(true);
  });

  it("lets ordinary words, names and phrases through", () => {
    expect(allowed(["문모모", "라리양", "잔디러너", "축구왕", "골키퍼", "벽돌깨기", "머지왕", "손흥민", "이강인", "새벽", "시범", "시비", "졸라맨", "성기훈", "우왁굳", "아이네", "징버거", "릴파", "21세기", "세기"])).toEqual([]);
  });
});

describe("English words", () => {
  it("blocks profanity, sexual words and their disguises", () => {
    expect(blocked(["fuck", "Fuck123", "f.u_c-k", "sh1t", "shit", "bitch", "b1tch", "asshole", "porn", "Sexy", "pussy", "a.s.s", "Big_Ass", "BigAss", "cunt", "nigger", "fck", "s3x"])).toEqual([]);
  });

  it("matches short words only as whole words so innocent names survive", () => {
    expect(allowed(["Assassin", "Classic", "Analyst", "Scunthorpe", "Pakistan", "Uranus", "Cocktail", "Peacock", "Button", "Grape", "Therapist", "Document", "Spoon", "Title", "Massachusetts", "Bassist", "Passion", "Essex", "advertisement", "basement", "specialist"])).toEqual([]);
  });

  it("does not block a two-letter abbreviation such as SM", () => {
    expect(allowed(["SM", "sm", "xx"])).toEqual([]);
  });
});

describe("checkNickname", () => {
  it("tells a badly shaped name from a blocked one", () => {
    expect(checkNickname("가")).toEqual({ ok: false, reason: "format" });
    expect(checkNickname("<b>hi</b>")).toEqual({ ok: false, reason: "format" });
    expect(checkNickname(42)).toEqual({ ok: false, reason: "format" });
    expect(checkNickname("씨발")).toEqual({ ok: false, reason: "blocked" });
    expect(checkNickname("  노모  ")).toEqual({ ok: false, reason: "blocked" });
    expect(checkNickname("문 모모")).toEqual({ ok: true, name: "문 모모" });
  });
});

describe("real streamer names", () => {
  it("never blocks a name from roster.yaml", () => {
    const roster = parse(readFileSync(new URL("../../roster.yaml", import.meta.url), "utf8")) as { streamers?: { displayName?: string }[] };
    const names = (roster.streamers ?? []).map((entry) => entry.displayName).filter((name): name is string => Boolean(name));
    expect(names.length).toBeGreaterThan(50);
    const hits = names.filter((name) => containsBlockedWord(name)).map((name) => `${name} <- ${findBlockedWord(name)}`);
    // A hit means a new roster name trips a list: add its innocent phrase to ALLOWED_PHRASES in nickname-blocklist-extra.ts.
    expect(hits).toEqual([]);
  });
});
