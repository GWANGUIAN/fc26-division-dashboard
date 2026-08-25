export interface PassEntry {
  streamerId: string;
  revealed: boolean;
}

export interface PassAnnouncementState {
  schemaVersion: number;
  passList: PassEntry[];
}

export type PassDragData = { kind: "pool" | "pass"; streamerId: string };

export type PassDropData =
  | { kind: "pool" }
  | { kind: "pass"; streamerId: string }
  | { kind: "pass-panel" };
