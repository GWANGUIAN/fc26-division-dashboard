import { parse } from "yaml";
import type { ReviewContextConfig } from "./model.js";

export function parseReviewContext(source: string): ReviewContextConfig {
  const parsed = parse(source) as { context?: unknown } | null;
  const context = parsed?.context ?? "";
  if (typeof context !== "string") throw new Error("review-context.yaml: context must be a string");
  return { context };
}
