import { useState, type ReactNode } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { FORMATIONS } from "./formations.js";
import { SquadDropdown } from "./SquadDropdown";
import type { Squad } from "./types.js";

interface SquadControlsProps {
  squads: Squad[];
  activeSquadId: string;
  onSelect: (squadId: string) => void;
  onAdd: (name: string) => void;
  onRename: (squadId: string, name: string) => void;
  onDelete: (squadId: string) => void;
  formationId: string;
  onFormationChange: (formationId: string) => void;
}

type Dialog =
  | { mode: "add" }
  | { mode: "rename"; squadId: string; initialName: string }
  | { mode: "delete"; squadId: string; name: string };

export function SquadControls({
  squads,
  activeSquadId,
  onSelect,
  onAdd,
  onRename,
  onDelete,
  formationId,
  onFormationChange,
}: SquadControlsProps) {
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const activeSquad = squads.find((squad) => squad.id === activeSquadId);

  return (
    <div className="squad-controls">
      <SquadDropdown
        className="squad-controls__select"
        value={activeSquadId}
        onChange={onSelect}
        ariaLabel="스쿼드 선택"
        options={squads.map((squad) => ({ value: squad.id, label: squad.name }))}
      />
      <button
        type="button"
        className="squad-controls__icon-button"
        onClick={() =>
          activeSquad &&
          setDialog({
            mode: "rename",
            squadId: activeSquad.id,
            initialName: activeSquad.name,
          })
        }
        aria-label="스쿼드 이름 변경"
      >
        <Pencil aria-hidden="true" />
      </button>
      <button
        type="button"
        className="squad-controls__icon-button squad-controls__icon-button--danger"
        disabled={squads.length <= 1}
        onClick={() =>
          activeSquad &&
          setDialog({ mode: "delete", squadId: activeSquad.id, name: activeSquad.name })
        }
        aria-label="스쿼드 삭제"
      >
        <Trash2 aria-hidden="true" />
      </button>
      <button
        type="button"
        className="squad-controls__icon-button"
        onClick={() => setDialog({ mode: "add" })}
        aria-label="스쿼드 추가"
      >
        <Plus aria-hidden="true" />
      </button>
      <SquadDropdown
        className="squad-controls__formation"
        value={formationId}
        onChange={onFormationChange}
        ariaLabel="포메이션 선택"
        options={FORMATIONS.map((formation) => ({
          value: formation.id,
          label: formation.label,
        }))}
      />

      {dialog?.mode === "add" && (
        <SquadNameDialog
          title="새 스쿼드"
          confirmLabel="추가"
          initialValue=""
          onSubmit={(name) => {
            onAdd(name);
            setDialog(null);
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.mode === "rename" && (
        <SquadNameDialog
          title="스쿼드 이름 변경"
          confirmLabel="저장"
          initialValue={dialog.initialName}
          onSubmit={(name) => {
            onRename(dialog.squadId, name);
            setDialog(null);
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.mode === "delete" && (
        <ConfirmDialog
          title="스쿼드 삭제"
          message={`"${dialog.name}" 스쿼드를 삭제할까요? 배치된 선수 정보가 사라집니다.`}
          confirmLabel="삭제"
          onConfirm={() => {
            onDelete(dialog.squadId);
            setDialog(null);
          }}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}

function MiniDialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="squad-mini-dialog-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        className="squad-mini-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

function SquadNameDialog({
  title,
  confirmLabel,
  initialValue,
  onSubmit,
  onClose,
}: {
  title: string;
  confirmLabel: string;
  initialValue: string;
  onSubmit: (name: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <MiniDialog title={title} onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (value.trim()) onSubmit(value);
        }}
      >
        <input
          autoFocus
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="스쿼드 이름"
          maxLength={20}
        />
        <div className="squad-mini-dialog__actions">
          <button type="button" onClick={onClose}>
            취소
          </button>
          <button type="submit" disabled={!value.trim()}>
            {confirmLabel}
          </button>
        </div>
      </form>
    </MiniDialog>
  );
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <MiniDialog title={title} onClose={onClose}>
      <p className="squad-mini-dialog__message">{message}</p>
      <div className="squad-mini-dialog__actions">
        <button type="button" onClick={onClose}>
          취소
        </button>
        <button
          type="button"
          className="squad-mini-dialog__danger"
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </MiniDialog>
  );
}
