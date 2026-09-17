import type { GroupPhotoSlot } from "./groupPhotoRoster";
import { getGroupPhotoCharacterUrl } from "./groupPhotoAssets";

export function GroupPhotoCharacter({
  slot,
  displayName,
  onSelect,
}: {
  slot: GroupPhotoSlot;
  displayName: string;
  onSelect: () => void;
}) {
  const url = getGroupPhotoCharacterUrl(slot.id);
  if (!url) return null;
  return (
    <button
      type="button"
      className={`group-photo-character group-photo-character--${slot.row}`}
      onClick={onSelect}
      aria-label={`${displayName} 선택`}
      style={
        {
          left: `${slot.left}%`,
          width: `${slot.widthVw}vw`,
          "--group-photo-top-adjust": `${slot.topAdjustVw ?? 0}vw`,
        } as React.CSSProperties
      }
    >
      <img src={url} alt={displayName} />
    </button>
  );
}
