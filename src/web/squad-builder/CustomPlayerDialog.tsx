import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type { CareerRecord } from "../../shared/model.js";
import type { CustomPlayer, CustomPlayerInput } from "./customPlayerTypes.js";
import { MiniDialog } from "./SquadControls";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const DIVISIONS = Array.from({ length: 10 }, (_, index) => index + 1);

export type PhotoAction = "keep" | "remove" | File;

export function CustomPlayerDialog({
  player,
  currentPhotoUrl,
  onSubmit,
  onClose,
}: {
  player?: CustomPlayer;
  currentPhotoUrl?: string;
  onSubmit: (input: CustomPlayerInput, photoAction: PhotoAction) => void;
  onClose: () => void;
}) {
  const isEdit = !!player;
  const [name, setName] = useState(player?.name ?? "");
  const [division, setDivision] = useState(
    player?.division ? String(player.division) : "",
  );
  const [wins, setWins] = useState(player?.record ? String(player.record.wins) : "");
  const [draws, setDraws] = useState(player?.record ? String(player.record.draws) : "");
  const [losses, setLosses] = useState(
    player?.record ? String(player.record.losses) : "",
  );
  const [winRate, setWinRate] = useState(
    !player?.record && player?.winRatePercent !== undefined
      ? String(player.winRatePercent)
      : "",
  );
  const [photoAction, setPhotoAction] = useState<PhotoAction>("keep");
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentPhotoUrl);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const localPreviewUrl = useRef<string | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (localPreviewUrl.current) URL.revokeObjectURL(localPreviewUrl.current);
    };
  }, []);

  const hasRecord =
    Number(wins || 0) > 0 || Number(draws || 0) > 0 || Number(losses || 0) > 0;

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("이미지 용량은 5MB 이하여야 합니다.");
      event.target.value = "";
      return;
    }
    setPhotoError(null);
    if (localPreviewUrl.current) URL.revokeObjectURL(localPreviewUrl.current);
    const url = URL.createObjectURL(file);
    localPreviewUrl.current = url;
    setPhotoAction(file);
    setPreviewUrl(url);
  }

  function handleRemovePhoto() {
    if (localPreviewUrl.current) {
      URL.revokeObjectURL(localPreviewUrl.current);
      localPreviewUrl.current = undefined;
    }
    setPhotoAction("remove");
    setPreviewUrl(undefined);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    let record: CareerRecord | undefined;
    let winRatePercent: number | undefined;
    if (hasRecord) {
      record = {
        wins: Number(wins || 0),
        draws: Number(draws || 0),
        losses: Number(losses || 0),
      };
    } else if (winRate.trim()) {
      const parsed = Number(winRate);
      if (!Number.isNaN(parsed)) winRatePercent = parsed;
    }

    const input: CustomPlayerInput = {
      name: trimmedName,
      division: division ? Number(division) : undefined,
      record,
      winRatePercent,
    };
    onSubmit(input, photoAction);
  }

  return (
    <MiniDialog
      title={isEdit ? "커스텀 선수 수정" : "커스텀 선수 추가"}
      onClose={onClose}
      className="squad-mini-dialog--wide"
    >
      <form onSubmit={handleSubmit}>
        <label className="custom-player-form__field">
          <span>
            이름 <span className="custom-player-form__required">*</span>
          </span>
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="선수 이름"
            maxLength={20}
          />
        </label>

        <label className="custom-player-form__field">
          <span>디비전</span>
          <select value={division} onChange={(event) => setDivision(event.target.value)}>
            <option value="">선택 안 함</option>
            {DIVISIONS.map((d) => (
              <option key={d} value={d}>
                {d}부
              </option>
            ))}
          </select>
        </label>

        <div className="custom-player-form__field custom-player-form__photo-row">
          <span>프로필 사진</span>
          <div className="custom-player-form__photo-controls">
            {previewUrl && (
              <img className="custom-player-form__photo-preview" src={previewUrl} alt="" />
            )}
            <input type="file" accept="image/*" onChange={handlePhotoChange} />
            {previewUrl && (
              <button type="button" onClick={handleRemovePhoto}>
                사진 제거
              </button>
            )}
          </div>
          {photoError && <p className="custom-player-form__error">{photoError}</p>}
        </div>

        <div className="custom-player-form__field">
          <span>전적 (승/무/패)</span>
          <div className="custom-player-form__record-row">
            <input
              type="number"
              min="0"
              value={wins}
              onChange={(event) => setWins(event.target.value)}
              placeholder="승"
            />
            <input
              type="number"
              min="0"
              value={draws}
              onChange={(event) => setDraws(event.target.value)}
              placeholder="무"
            />
            <input
              type="number"
              min="0"
              value={losses}
              onChange={(event) => setLosses(event.target.value)}
              placeholder="패"
            />
          </div>
        </div>

        <label className="custom-player-form__field">
          <span>승률 (%)</span>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={hasRecord ? "" : winRate}
            disabled={hasRecord}
            onChange={(event) => setWinRate(event.target.value)}
            placeholder={hasRecord ? "전적으로 자동 계산됨" : "직접 입력"}
          />
        </label>

        <div className="squad-mini-dialog__actions">
          <button type="button" onClick={onClose}>
            취소
          </button>
          <button type="submit" disabled={!name.trim()}>
            {isEdit ? "저장" : "추가"}
          </button>
        </div>
      </form>
    </MiniDialog>
  );
}
