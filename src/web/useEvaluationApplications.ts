import { useMemo, useState } from "react";
import type { DashboardSnapshot } from "../shared/model.js";
import { searchable } from "../shared/search.js";

export function useEvaluationApplications(
  snapshot: DashboardSnapshot | undefined,
  query: string,
) {
  const [evaluationFilter, setEvaluationFilter] = useState<
    "all" | "pending" | "completed"
  >("all");
  const applications = useMemo(
    () =>
      (snapshot?.oneVsOneApplications ?? []).filter(
        (application) =>
          searchable(application.displayName, application.cafeAliases, query) &&
          (evaluationFilter === "all" ||
            (evaluationFilter === "completed"
              ? Boolean(application.result)
              : !application.result)),
      ),
    [snapshot, query, evaluationFilter],
  );
  return { evaluationFilter, setEvaluationFilter, applications };
}
