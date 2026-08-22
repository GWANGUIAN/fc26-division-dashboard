export interface FormationSlot {
  id: string;
  label: string;
  xPct: number;
  yPct: number;
}

export interface FormationPreset {
  id: string;
  label: string;
  slots: FormationSlot[];
}

export interface SquadPlacement {
  slotId: string;
  streamerId: string;
}

/** Manual fine-tune nudge applied on top of a formation slot's xPct/yPct. */
export interface SlotOffset {
  dxPct: number;
  dyPct: number;
}

export interface Squad {
  id: string;
  name: string;
  formationId: string;
  placements: SquadPlacement[];
  /** Streamer ids not currently placed, in drawer display order. */
  candidateOrder: string[];
  /**
   * Per-slot manual position nudges (drag handle on each pitch card),
   * keyed by formation slot id. Cleared whenever the formation changes,
   * since a new formation's slot layout makes the old nudges meaningless.
   */
  slotOffsets?: Record<string, SlotOffset>;
}

export interface SquadBuilderState {
  schemaVersion: number;
  squads: Squad[];
  activeSquadId: string;
}
