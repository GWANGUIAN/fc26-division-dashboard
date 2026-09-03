import {
  POSITION_GROUP_LABELS,
  positionColor,
  positionGroupOf,
} from "../shared/position-theme.js";

export function AssignedPositionTag({ code }: { code: string }) {
  const group = positionGroupOf(code);
  return (
    <span
      className="position-tag"
      style={{ "--position-color": positionColor(code) } as React.CSSProperties}
      title={group ? POSITION_GROUP_LABELS[group] : undefined}
    >
      {code}
    </span>
  );
}
