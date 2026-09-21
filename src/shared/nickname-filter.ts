/**
 * Blocked-word check for nicknames. Bad words are easy to disguise, so both
 * the name and every list entry are reduced to a canonical form first:
 *
 * - Korean: syllables are broken into jamo and typed compatibility jamo are
 *   kept as they are, so "시발" and "ㅅㅣㅂㅏㄹ" become the same string. A silent
 *   initial ㅇ that only continues the previous vowel is dropped ("시이이발"
 *   reads as "시발"), but never after a consonant, or "슈모" would read as
 *   "유모". Repeats are collapsed; digits, spaces and punctuation are dropped
 *   ("씨1발", "씨.발").
 * - Latin: lowercased, separators dropped and common digit look-alikes mapped
 *   back to letters ("f.u_c-k", "sh1t").
 *
 * The lists: nickname-blocklist-ldnoobw.ts (LDNOOBW), -badwords-ko.ts, -slang.ts
 * (all generated from public lists; see their headers) and the hand-maintained
 * nickname-blocklist-extra.ts.
 */
import { BADWORDS_KO } from "./nickname-blocklist-badwords-ko.js";
import { LDNOOBW_EN, LDNOOBW_KO } from "./nickname-blocklist-ldnoobw.js";
import { SLANG_KO } from "./nickname-blocklist-slang.js";
import { ALLOWED_PHRASES, EXTRA_EN, EXTRA_KO, SUBSTRING_SHORT_LATIN, TYPED_JAMO_ABBREVIATIONS } from "./nickname-blocklist-extra.js";

const CHOSEONG = Array.from("ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ");
const JUNGSEONG = Array.from("ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ");
const JONGSEONG = ["", "ㄱ", "ㄲ", "ㄱㅅ", "ㄴ", "ㄴㅈ", "ㄴㅎ", "ㄷ", "ㄹ", "ㄹㄱ", "ㄹㅁ", "ㄹㅂ", "ㄹㅅ", "ㄹㅌ", "ㄹㅍ", "ㄹㅎ", "ㅁ", "ㅂ", "ㅂㅅ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const SILENT_INITIAL = "ㅇ";

const SYLLABLE_FIRST = 0xac00;
const SYLLABLE_LAST = 0xd7a3;
const COMPAT_JAMO_FIRST = 0x3131;
const COMPAT_JAMO_LAST = 0x318e;
const COMPAT_VOWEL_FIRST = 0x314f;
const COMPAT_VOWEL_LAST = 0x3163;

// Digits and marks people swap in for letters. "1" is ambiguous, so it is tried as "i" and as "l".
const LEET_BASE: Record<string, string> = { "0": "o", "3": "e", "4": "a", "5": "s", "7": "t", "!": "i", "@": "a", $: "s" };

const collapse = (text: string) => text.replace(/(.)\1+/gu, "$1");

interface FoldedHangul {
  /** Every jamo, silent initial ㅇ included. */
  keep: string;
  /** Like `keep`, but a silent ㅇ right after a syllable that ends in a vowel is dropped. */
  drop: string;
  /** Only the jamo that were typed on their own (ㅅㅂ), not those taken out of syllables. */
  typed: string;
}

/** Broken-down jamo of every Korean character in `text` (anything else is ignored). */
function foldHangul(text: string): FoldedHangul {
  let keep = "";
  let drop = "";
  let typed = "";
  let previousOpen = false; // the last Korean character ended in a vowel
  for (const char of text) {
    const code = char.codePointAt(0)!;
    if (code >= SYLLABLE_FIRST && code <= SYLLABLE_LAST) {
      const offset = code - SYLLABLE_FIRST;
      const initial = CHOSEONG[Math.floor(offset / 588)];
      const vowel = JUNGSEONG[Math.floor((offset % 588) / 28)];
      const final = JONGSEONG[offset % 28];
      keep += initial + vowel + final;
      drop += (initial === SILENT_INITIAL && previousOpen ? "" : initial) + vowel + final;
      previousOpen = final === "";
    } else if (code >= COMPAT_JAMO_FIRST && code <= COMPAT_JAMO_LAST) {
      keep += char;
      drop += char;
      typed += char;
      previousOpen = code >= COMPAT_VOWEL_FIRST && code <= COMPAT_VOWEL_LAST;
    }
  }
  return { keep: collapse(keep), drop: collapse(drop), typed: collapse(typed) };
}

/** Latin letters of `text` in every plausible reading: as written, and with digit look-alikes turned into letters. */
function latinForms(text: string): string[] {
  const lower = text.toLowerCase();
  const asLetters = (oneAs: string) =>
    Array.from(lower, (char) => (char === "1" ? oneAs : (LEET_BASE[char] ?? char))).join("").replace(/[^a-z]/gu, "");
  return [...new Set([lower.replace(/[^a-z]/gu, ""), asLetters("i"), asLetters("l")])];
}

/** Whole "words" of the name: split at separators, at Korean text and at camelCase joins. */
function latinTokens(text: string): string[] {
  return text
    .replace(/([a-z])([A-Z])/gu, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9!@$]+/u)
    .filter(Boolean);
}

const HAS_KOREAN = /[가-힣ㄱ-ㅣ]/u;
const MIN_WORD_LENGTH = 3;

const koreanKeepWords = new Set<string>();
const koreanDropWords = new Set<string>();
const latinSubstringWords = new Set<string>();
const latinWholeWords = new Set<string>();
const typedAbbreviations = new Set<string>(TYPED_JAMO_ABBREVIATIONS.map((entry) => collapse(entry)));

for (const entry of [...LDNOOBW_KO, ...EXTRA_KO, ...BADWORDS_KO, ...SLANG_KO]) {
  if (!HAS_KOREAN.test(entry)) continue;
  const folded = foldHangul(entry.normalize("NFC"));
  if (folded.keep.length >= 2) koreanKeepWords.add(folded.keep);
  if (folded.drop.length >= 2) koreanDropWords.add(folded.drop);
}
for (const entry of [...LDNOOBW_EN, ...EXTRA_EN]) {
  const word = entry.toLowerCase().replace(/[^a-z]/gu, "");
  if (word.length < MIN_WORD_LENGTH) continue; // "sm", "xx" and emoji would block innocent names
  if (word.length >= 5 || SUBSTRING_SHORT_LATIN.includes(word)) latinSubstringWords.add(word);
  else latinWholeWords.add(word);
}
// Words such as "ass" that appear in several entries are matched at the strictest level they are listed at.
for (const word of SUBSTRING_SHORT_LATIN) if (word.length >= MIN_WORD_LENGTH) latinSubstringWords.add(word);

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
const allowedPhrases = ALLOWED_PHRASES.length ? new RegExp(ALLOWED_PHRASES.map(escapeRegExp).join("|"), "giu") : null;

/** The blocked entry found in `name` (canonical form), or null when the name is clean. */
export function findBlockedWord(rawName: string): string | null {
  // Cut the innocent phrases out first; a space keeps the neighbours from fusing into a new word.
  const name = allowedPhrases ? rawName.normalize("NFC").replace(allowedPhrases, " ") : rawName;
  const { keep, drop, typed } = foldHangul(name.normalize("NFC"));
  for (const word of koreanKeepWords) if (keep.includes(word)) return word;
  for (const word of koreanDropWords) if (drop.includes(word)) return word;
  for (const abbreviation of typedAbbreviations) if (typed.includes(abbreviation)) return abbreviation;

  const wholeName = latinForms(name);
  for (const form of wholeName) {
    for (const word of latinSubstringWords) if (form.includes(word)) return word;
    if (latinWholeWords.has(form)) return form;
  }
  for (const token of latinTokens(name)) {
    for (const form of latinForms(token)) if (latinWholeWords.has(form)) return form;
  }
  return null;
}

export function containsBlockedWord(name: string): boolean {
  return findBlockedWord(name) !== null;
}
