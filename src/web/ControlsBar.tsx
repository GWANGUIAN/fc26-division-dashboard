import type { RefObject } from "react";
import { Activity, Copy, Download, Trophy, Volume2 } from "lucide-react";

export function ControlsBar({
  sentinelRef,
  stuck,
  isDivision,
  query,
  onQueryChange,
  sfxOnly,
  onToggleSfxOnly,
  achievementOnly,
  onToggleAchievementOnly,
  activityOnly,
  onToggleActivityOnly,
  onCopyList,
  onDownloadList,
  evaluationFilter,
  onEvaluationFilterChange,
}: {
  sentinelRef: RefObject<HTMLDivElement | null>;
  stuck: boolean;
  isDivision: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  sfxOnly: boolean;
  onToggleSfxOnly: () => void;
  achievementOnly: boolean;
  onToggleAchievementOnly: () => void;
  activityOnly: boolean;
  onToggleActivityOnly: () => void;
  onCopyList: () => void;
  onDownloadList: () => void;
  evaluationFilter: "all" | "pending" | "completed";
  onEvaluationFilterChange: (value: "all" | "pending" | "completed") => void;
}) {
  return (
    <>
      <div ref={sentinelRef} className="controls-sentinel" aria-hidden="true" />
      <section
        className={`controls-bar ${stuck ? "controls-bar--stuck" : ""}`}
        aria-label={isDivision ? "스트리머 검색" : "평가 신청 필터"}
      >
        <div className="controls">
          <div className="controls__search">
            <label>
              <span className="sr-only">검색</span>
              <input
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="이름 또는 카페 닉네임 검색"
              />
            </label>
          </div>
          {isDivision ? (
            <div className="controls__actions">
              <div className="segmented segmented--filters">
                <button
                  className={`segmented__sfx-toggle${sfxOnly ? " active" : ""}`}
                  onClick={onToggleSfxOnly}
                  aria-pressed={sfxOnly}
                  aria-label="효과음 있는 스트리머만"
                >
                  <Volume2 aria-hidden="true" />
                  <span className="control-btn__label">
                    효과음 있는 스트리머만
                  </span>
                </button>
                <button
                  className={`segmented__trophy-toggle${achievementOnly ? " active" : ""}`}
                  onClick={onToggleAchievementOnly}
                  aria-pressed={achievementOnly}
                  aria-label="업적 달성자만"
                >
                  <Trophy aria-hidden="true" />
                  <span className="control-btn__label">업적 달성자만</span>
                </button>
                <button
                  className={`segmented__activity-toggle${activityOnly ? " active" : ""}`}
                  onClick={onToggleActivityOnly}
                  aria-pressed={activityOnly}
                  aria-label="활동글 작성자만"
                >
                  <Activity aria-hidden="true" />
                  <span className="control-btn__label">활동글 작성자만</span>
                </button>
              </div>
              <button
                className="copy-list-button"
                type="button"
                onClick={onCopyList}
                aria-label="목록 복사"
              >
                <Copy aria-hidden="true" />
                <span className="control-btn__label">목록 복사</span>
              </button>
              <button
                className="copy-list-button"
                type="button"
                onClick={onDownloadList}
                aria-label="엑셀 다운로드"
              >
                <Download aria-hidden="true" />
                <span className="control-btn__label">엑셀 다운로드</span>
              </button>
            </div>
          ) : (
            <div className="segmented">
              {(["all", "pending", "completed"] as const).map((value) => (
                <button
                  key={value}
                  className={evaluationFilter === value ? "active" : ""}
                  onClick={() => onEvaluationFilterChange(value)}
                >
                  {value === "all"
                    ? "전체"
                    : value === "pending"
                      ? "대결 전"
                      : "대결 완료"}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
