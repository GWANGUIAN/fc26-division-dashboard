import type { CareerRecord, PromotionPost } from "./model.js";

export type ExtractedRecord = CareerRecord;

export type RecordExtractionStatus = "pending" | "success" | "failed";

const defaultMaxAttempts = 3;

/**
 * Frontend-facing status for a post's record extraction, derived from the
 * stored fields rather than persisted separately so it can never drift out
 * of sync with them. "pending" covers both "not checked yet" and "checked
 * but retries remain" (posts with no images at all are also "pending",
 * since nothing has failed — there is just nothing to extract).
 */
export function recordExtractionStatus(
  post: Pick<PromotionPost, "imageUrls" | "record" | "recordExtractionAttempts">,
  maxAttempts = defaultMaxAttempts,
): RecordExtractionStatus {
  if (post.record) return "success";
  if (post.imageUrls.length === 0) return "pending";
  return (post.recordExtractionAttempts ?? 0) >= maxAttempts ? "failed" : "pending";
}

/** Validates one model response against the expected record-screen shape. */
export function parseRecordScreenResult(value: unknown): ExtractedRecord | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const { isRecordScreen, wins, draws, losses } = value as Record<string, unknown>;
  if (isRecordScreen !== true) return undefined;
  if (![wins, draws, losses].every((count) => typeof count === "number" && Number.isInteger(count) && count >= 0)) return undefined;
  return { wins: wins as number, draws: draws as number, losses: losses as number };
}

/**
 * Picks the record to keep when a post has multiple images. The first valid
 * record screen wins; if a later image in the same post yields a different
 * total, that is flagged for manual review rather than silently overwritten,
 * averaged, or majority-voted.
 */
export function chooseRecord(results: Array<ExtractedRecord | undefined>): { record?: ExtractedRecord; needsReview?: boolean } {
  const valid = results.filter((result): result is ExtractedRecord => result !== undefined);
  if (!valid.length) return {};
  const [record, ...rest] = valid;
  const needsReview = rest.some((other) => other.wins !== record.wins || other.draws !== record.draws || other.losses !== record.losses);
  return needsReview ? { record, needsReview: true } : { record };
}
