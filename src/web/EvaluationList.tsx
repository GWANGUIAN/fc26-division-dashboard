import type { OneVsOneApplicationView } from "../shared/model.js";
import { EvaluationCard } from "./EvaluationViews";

export function EvaluationList({
  applications,
  onSelect,
}: {
  applications: OneVsOneApplicationView[];
  onSelect: (application: OneVsOneApplicationView) => void;
}) {
  return (
    <section className="evaluation-list" aria-label="1대1 평가 신청 목록">
      {applications.map((application) => (
        <EvaluationCard
          key={application.articleId}
          application={application}
          onOpen={() => onSelect(application)}
        />
      ))}
      {applications.length === 0 && (
        <p className="empty-list">표시할 1대1 평가 신청자가 없습니다.</p>
      )}
    </section>
  );
}
