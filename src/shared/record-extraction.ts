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

/** Career win rate as a percentage (0-100), or undefined if no games are recorded. */
export function winRatePercent(record: CareerRecord): number | undefined {
  const total = record.wins + record.draws + record.losses;
  return total === 0 ? undefined : (record.wins / total) * 100;
}

/** Validates one model response against the expected record-screen shape. */
export function parseRecordScreenResult(value: unknown): ExtractedRecord | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const { isRecordScreen, wins, draws, losses } = value as Record<string, unknown>;
  if (isRecordScreen !== true) return undefined;
  if (![wins, draws, losses].every((count) => typeof count === "number" && Number.isInteger(count) && count >= 0)) return undefined;
  return { wins: wins as number, draws: draws as number, losses: losses as number };
}

function totalGames(record: ExtractedRecord): number {
  return record.wins + record.draws + record.losses;
}

/**
 * Picks the record to keep when a post has multiple images. Streamers
 * sometimes post a "previous record" screenshot alongside a "current record"
 * one, so a higher total from a later image is expected, not an error: the
 * record with the highest total games wins. Only a genuine tie — two images
 * agreeing on the total but disagreeing on the win/draw/loss split — is
 * flagged for manual review rather than picked arbitrarily.
 */
export function chooseRecord(results: Array<ExtractedRecord | undefined>): { record?: ExtractedRecord; needsReview?: boolean } {
  const valid = results.filter((result): result is ExtractedRecord => result !== undefined);
  if (!valid.length) return {};
  const best = valid.reduce((a, b) => (totalGames(b) > totalGames(a) ? b : a));
  const needsReview = valid.some(
    (other) => totalGames(other) === totalGames(best)
      && (other.wins !== best.wins || other.draws !== best.draws || other.losses !== best.losses),
  );
  return needsReview ? { record: best, needsReview: true } : { record: best };
}
