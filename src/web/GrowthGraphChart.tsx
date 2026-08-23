import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type SyntheticEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { GrowthGraphData, GrowthSeries } from "../shared/growth-series.js";
import { formatGrowthAxisDate } from "../shared/dates.js";
import { winRatePercent } from "../shared/record-extraction.js";
import { formatTimelineDate } from "./formatters";
import { Avatar } from "./cardVisuals";

const PLOT_X = { min: 9, max: 82 };
const PLOT_Y = { min: 8, max: 78 };
const DAY_MS = 86_400_000;

type Rect = { left: number; right: number; top: number; bottom: number };
type Anchor = { top: number; left: number; flip: boolean };

function dayIndex(dateKey: string, fromKey: string): number {
  return Math.round((Date.parse(`${dateKey}T00:00:00+09:00`) - Date.parse(`${fromKey}T00:00:00+09:00`)) / DAY_MS);
}

function anchorFromRect(rect: Rect): Anchor {
  const flip = rect.right + 300 > window.innerWidth;
  return { top: (rect.top + rect.bottom) / 2, left: flip ? rect.left : rect.right, flip };
}

type SeriesGeometry = {
  series: GrowthSeries;
  path: string;
  finalX: number;
  finalY: number;
};

export function GrowthGraphChart({
  data,
  selectedIds,
}: {
  data: GrowthGraphData;
  selectedIds: string[];
}) {
  const [hoveredId, setHoveredId] = useState<string>();
  const [tooltipAnchor, setTooltipAnchor] = useState<Anchor>();
  const [openGroup, setOpenGroup] = useState<number>();
  const [groupAnchor, setGroupAnchor] = useState<Rect>();
  const plotRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpenGroup(undefined);
    setHoveredId(undefined);
  }, [data, selectedIds]);

  useEffect(() => {
    if (openGroup === undefined) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest(".growth-graph__marker-chip")) return;
      if (popoverRef.current && !popoverRef.current.contains(target)) setOpenGroup(undefined);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenGroup(undefined);
    };
    // Capture phase: the modal's own backdrop-click-to-close handler calls stopPropagation()
    // on mousedown (bubble phase) to protect itself, which would otherwise also swallow this
    // listener for every click inside the modal, since the popover is portaled outside it.
    addEventListener("mousedown", closeOnOutsideClick, true);
    addEventListener("keydown", closeOnEscape);
    return () => {
      removeEventListener("mousedown", closeOnOutsideClick, true);
      removeEventListener("keydown", closeOnEscape);
    };
  }, [openGroup]);

  const totalDomainDays = data.domainStartKey ? Math.max(1, dayIndex(data.domainEndKey, data.domainStartKey)) : 1;
  const divisionSpan = Math.max(1, data.maxDivision + 0.5 - (data.minDivision - 0.5));

  const xPercent = (dateKey: string) =>
    PLOT_X.min + (dayIndex(dateKey, data.domainStartKey) / totalDomainDays) * (PLOT_X.max - PLOT_X.min);
  const yPercent = (division: number) =>
    PLOT_Y.min + ((division - (data.minDivision - 0.5)) / divisionSpan) * (PLOT_Y.max - PLOT_Y.min);

  const geometries = useMemo<SeriesGeometry[]>(() => {
    const visible = data.series.filter((series) => selectedIds.includes(series.streamerId));
    return visible.map((series) => {
      const path = series.points
        .map((point, i) => `${i === 0 ? "M" : "L"} ${xPercent(point.dateKey).toFixed(3)} ${yPercent(point.division).toFixed(3)}`)
        .join(" ");
      const last = series.points.at(-1)!;
      return { series, path, finalX: xPercent(last.dateKey), finalY: yPercent(last.division) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, selectedIds]);

  if (data.series.length === 0) {
    return <p className="growth-graph__empty">아직 표시할 승격 보고가 없습니다.</p>;
  }

  const divisionTicks = Array.from(
    { length: Math.floor(data.maxDivision) - Math.ceil(data.minDivision) + 1 },
    (_, i) => Math.ceil(data.minDivision) + i,
  );

  const groups = new Map<number, SeriesGeometry[]>();
  for (const geometry of geometries) {
    const list = groups.get(geometry.series.currentDivision) ?? [];
    list.push(geometry);
    groups.set(geometry.series.currentDivision, list);
  }

  const hoveredGeometry = geometries.find((geometry) => geometry.series.streamerId === hoveredId);
  const orderedGeometries = hoveredGeometry
    ? [...geometries.filter((geometry) => geometry !== hoveredGeometry), hoveredGeometry]
    : geometries;

  function activateFromRect(id: string, rect: Rect) {
    setHoveredId(id);
    setTooltipAnchor(anchorFromRect(rect));
  }
  function activateFromPoint(id: string, xPct: number, yPct: number) {
    const plotRect = plotRef.current?.getBoundingClientRect();
    if (!plotRect) return;
    const x = plotRect.left + (xPct / 100) * plotRect.width;
    const y = plotRect.top + (yPct / 100) * plotRect.height;
    activateFromRect(id, { left: x, right: x, top: y, bottom: y });
  }
  function deactivate() {
    setHoveredId(undefined);
  }
  function openGroupPopover(division: number, event: ReactMouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setOpenGroup((current) => (current === division ? undefined : division));
    setGroupAnchor(rect);
  }

  return (
    <div className="growth-graph__plot" ref={plotRef}>
      <svg className="growth-graph__svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {divisionTicks.map((division) => (
          <line
            key={division}
            className="growth-graph__gridline"
            x1={PLOT_X.min}
            x2={PLOT_X.max}
            y1={yPercent(division)}
            y2={yPercent(division)}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {orderedGeometries.map((geometry) => {
          if (geometry.series.points.length < 2) return null;
          const isHovered = geometry === hoveredGeometry;
          const isDimmed = Boolean(hoveredGeometry) && !isHovered;
          return (
            <g key={geometry.series.streamerId}>
              <path
                d={geometry.path}
                className="growth-graph__hit"
                onMouseEnter={() => activateFromPoint(geometry.series.streamerId, geometry.finalX, geometry.finalY)}
                onMouseLeave={deactivate}
              />
              <path
                d={geometry.path}
                fill="none"
                stroke={geometry.series.color}
                className={`growth-graph__line ${isHovered ? "growth-graph__line--active" : ""} ${isDimmed ? "growth-graph__line--dim" : ""}`}
                style={{ "--line-color": geometry.series.color } as CSSProperties}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          );
        })}
      </svg>
      <div className="growth-graph__axis-y" aria-hidden="true">
        {divisionTicks.map((division) => (
          <span key={division} className="growth-graph__axis-y-tick" style={{ top: `${yPercent(division)}%` }}>
            디비전{division}
          </span>
        ))}
      </div>
      <div className="growth-graph__axis-x" aria-hidden="true">
        {data.ticks.map((tick, index) => (
          <span
            key={tick}
            className={`growth-graph__axis-x-tick ${index === 0 ? "growth-graph__axis-x-tick--first" : ""} ${index === data.ticks.length - 1 ? "growth-graph__axis-x-tick--last" : ""}`}
            style={{ left: `${xPercent(tick)}%`, top: `${PLOT_Y.max}%` }}
          >
            {formatGrowthAxisDate(tick)}
          </span>
        ))}
      </div>
      <div className="growth-graph__overlay">
        {geometries.length === 0 && (
          <p className="growth-graph__overlay-hint">표시할 인원을 선택해주세요.</p>
        )}
        {[...groups.entries()].map(([division, members]) =>
          members.length === 1 ? (
            <Marker
              key={members[0].series.streamerId}
              geometry={members[0]}
              isHovered={hoveredGeometry === members[0]}
              isDimmed={Boolean(hoveredGeometry) && hoveredGeometry !== members[0]}
              onEnter={(event) => activateFromRect(members[0].series.streamerId, event.currentTarget.getBoundingClientRect())}
              onLeave={deactivate}
            />
          ) : (
            <div
              key={`group-${division}`}
              className="growth-graph__marker growth-graph__marker--group"
              style={{ left: `${PLOT_X.max}%`, top: `${yPercent(division)}%`, "--marker-color": members[0].series.color } as CSSProperties}
            >
              <button
                type="button"
                className="growth-graph__marker-chip"
                onClick={(event) => openGroupPopover(division, event)}
                aria-expanded={openGroup === division}
              >
                디비전{division} · {members.length}명
                {openGroup === division ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
              </button>
            </div>
          ),
        )}
      </div>
      {openGroup !== undefined &&
        groupAnchor &&
        groups.has(openGroup) &&
        createPortal(
          <div
            ref={popoverRef}
            className="growth-graph__group-popover"
            role="dialog"
            aria-label={`디비전${openGroup} 명단`}
            style={{ position: "fixed", top: groupAnchor.bottom + 8, left: groupAnchor.right, transform: "translateX(-100%)" }}
          >
            {groups.get(openGroup)!.map((geometry) => (
              <button
                type="button"
                key={geometry.series.streamerId}
                className="growth-graph__group-row"
                onMouseEnter={(event) => activateFromRect(geometry.series.streamerId, event.currentTarget.getBoundingClientRect())}
                onMouseLeave={deactivate}
                onFocus={(event) => activateFromRect(geometry.series.streamerId, event.currentTarget.getBoundingClientRect())}
                onBlur={deactivate}
              >
                <Avatar
                  profileImageUrl={geometry.series.profileImageUrl}
                  soopId={geometry.series.soopId}
                  displayName={geometry.series.displayName}
                />
                <span>{geometry.series.displayName}</span>
              </button>
            ))}
          </div>,
          document.body,
        )}
      {hoveredGeometry &&
        tooltipAnchor &&
        createPortal(<GrowthTooltip geometry={hoveredGeometry} anchor={tooltipAnchor} />, document.body)}
    </div>
  );
}

function Marker({
  geometry,
  isHovered,
  isDimmed,
  onEnter,
  onLeave,
}: {
  geometry: SeriesGeometry;
  isHovered: boolean;
  isDimmed: boolean;
  onEnter: (event: SyntheticEvent<HTMLDivElement>) => void;
  onLeave: () => void;
}) {
  const { series } = geometry;
  return (
    <div
      className={`growth-graph__marker ${isHovered ? "growth-graph__marker--active" : ""} ${isDimmed ? "growth-graph__marker--dim" : ""}`}
      style={{ left: `${geometry.finalX}%`, top: `${geometry.finalY}%`, "--marker-color": series.color } as CSSProperties}
      tabIndex={0}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
    >
      <i className="growth-graph__marker-dot" aria-hidden="true" />
      <Avatar profileImageUrl={series.profileImageUrl} soopId={series.soopId} displayName={series.displayName} />
      <span className="growth-graph__marker-name">{series.displayName}</span>
    </div>
  );
}

function GrowthTooltip({ geometry, anchor }: { geometry: SeriesGeometry; anchor: Anchor }) {
  const { series } = geometry;
  const record = series.record;
  const winRate = record ? winRatePercent(record) : undefined;
  return (
    <div
      className={`growth-graph__tooltip ${anchor.flip ? "growth-graph__tooltip--flip" : ""}`}
      style={{ position: "fixed", top: anchor.top, left: anchor.left }}
      role="tooltip"
    >
      <div className="growth-graph__tooltip-heading">
        <Avatar profileImageUrl={series.profileImageUrl} soopId={series.soopId} displayName={series.displayName} />
        <div>
          <strong>{series.displayName}</strong>
          <span className="growth-graph__tooltip-badge" style={{ "--marker-color": series.color } as CSSProperties}>
            현재 디비전{series.currentDivision}
          </span>
        </div>
      </div>
      <p className="growth-graph__tooltip-meta">
        첫 보고 {formatTimelineDate(series.firstReportDateKey)} · 총 {series.allReports.length}회 보고
      </p>
      <ul className="growth-graph__tooltip-history">
        {series.allReports.map((report) => (
          <li key={report.articleId}>
            <span>{formatTimelineDate(report.dateKey)}</span>
            <b>디비전{report.division}</b>
          </li>
        ))}
      </ul>
      {record && (
        <>
          <hr className="growth-graph__tooltip-divider" />
          <div className="growth-graph__tooltip-record">
            <span>
              {record.wins}승 {record.draws}무 {record.losses}패
            </span>
            {winRate !== undefined && <b>승률 {winRate.toFixed(1)}%</b>}
          </div>
        </>
      )}
    </div>
  );
}
