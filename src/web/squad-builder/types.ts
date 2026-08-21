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

export interface Squad {
  id: string;
  name: string;
  formationId: string;
  placements: SquadPlacement[];
  /** Streamer ids not currently placed, in drawer display order. */
  candidateOrder: string[];
}

export interface SquadBuilderState {
  schemaVersion: number;
  squads: Squad[];
  activeSquadId: string;
}
