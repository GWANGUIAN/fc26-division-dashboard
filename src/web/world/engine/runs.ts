import { getMissionDef, type MissionDef } from "../data/missionDefs";

// Timed mission attempts that live only in the running world (docs/world/02 §7, 03 §7): the parcel round of
// the delivery mission, the cone-course time trial and the kick-goals challenge. The manager is pure: the
// engine feeds it what happened (a gate was entered, a cone touched, a goal scored, time passed) and it
// answers with events for the overlay, which turns the finished ones into mission events. Nothing here is
// saved — a reload simply drops a run in progress and the mission stays `active` for another try.

export type RunEvent =
  | { type: "delivery-start"; mission: string; items: string[]; seconds: number }
  | { type: "delivered"; mission: string; item: string; mailbox: string; left: number }
  | { type: "delivery-timeup"; mission: string }
  | { type: "trial-start"; mission: string; seconds: number }
  | { type: "trial-gate"; mission: string; passed: number; total: number }
  | { type: "trial-cone"; mission: string; penalty: number }
  | { type: "trial-finished"; mission: string; seconds: number; passed: boolean }
  | { type: "trial-timeup"; mission: string }
  | { type: "kick-start"; mission: string; seconds: number }
  | { type: "kick-goal"; mission: string; goals: number; need: number }
  | { type: "kick-finished"; mission: string; goals: number; passed: boolean };

interface DeliveryRun { mission: string; left: number; carrying: string[] }
interface TrialRun { mission: string; elapsed: number; penalty: number; next: number; limit: number; gates: number }
interface KickRun { mission: string; left: number; goals: number; need: number }

/** What the canvas HUD shows for the run in progress (one line of text plus an optional detail line). */
export interface RunHud {
  title: string;
  /** Seconds left (or elapsed for the trial), already rounded for display. */
  clock: string;
  detail: string;
  /** Under ten seconds: draw the clock in red. */
  urgent: boolean;
}

type DefLookup = (id: string) => MissionDef | undefined;

export class RunManager {
  delivery: DeliveryRun | null = null;
  trial: TrialRun | null = null;
  kick: KickRun | null = null;

  constructor(private readonly lookup: DefLookup = getMissionDef) {}

  get active(): boolean {
    return this.delivery !== null || this.trial !== null || this.kick !== null;
  }

  /** Forgets the runs that only make sense on the overworld (leaving for an interior). Deliveries carry on. */
  cancelFieldRuns() {
    this.trial = null;
    this.kick = null;
  }

  cancelAll() {
    this.delivery = null;
    this.trial = null;
    this.kick = null;
  }

  // ── delivery ────────────────────────────────────────────────────────────────────────────

  /** The giver hands over the parcels and the clock starts. Restarts a running round. */
  startDelivery(mission: string): RunEvent[] {
    const def = this.lookup(mission);
    if (!def || def.kind !== "delivery" || def.seconds === undefined) return [];
    const items = def.items.map((item) => item.id);
    this.delivery = { mission, left: def.seconds, carrying: [...items] };
    return [{ type: "delivery-start", mission, items, seconds: def.seconds }];
  }

  /** The player used a mailbox: hands over the parcel that belongs there, if they carry it. */
  deliverAt(mailbox: string): RunEvent[] {
    const run = this.delivery;
    if (!run) return [];
    const def = this.lookup(run.mission);
    if (!def || def.kind !== "delivery") return [];
    const item = def.items.find((entry) => run.carrying.includes(entry.id) && "mailbox" in entry.to && entry.to.mailbox === mailbox);
    if (!item) return [];
    run.carrying = run.carrying.filter((id) => id !== item.id);
    const event: RunEvent = { type: "delivered", mission: run.mission, item: item.id, mailbox, left: run.left };
    if (run.carrying.length === 0) this.delivery = null;
    return [event];
  }

  /** Parcels still in the player's bag (for the HUD and the mailbox prompt). */
  carrying(): readonly string[] {
    return this.delivery?.carrying ?? [];
  }

  // ── cone-course time trial ──────────────────────────────────────────────────────────────

  /** Crossing the start gate of an active trial mission starts the clock (again, after a failed run). */
  beginTrial(mission: string): RunEvent[] {
    const def = this.lookup(mission);
    if (!def || def.kind !== "time_trial") return [];
    this.trial = { mission, elapsed: 0, penalty: 0, next: 1, limit: def.seconds, gates: def.gates.length };
    return [{ type: "trial-start", mission, seconds: def.seconds }];
  }

  /** The id of the gate the runner has to cross next, or null when no trial is running. */
  nextGate(): { mission: string; gate: string } | null {
    const run = this.trial;
    if (!run) return null;
    const def = this.lookup(run.mission);
    return def && def.kind === "time_trial" ? { mission: run.mission, gate: def.gates[run.next] } : null;
  }

  /** The runner crossed the next gate (checkpoints in order, the last one is the finish). */
  passGate(): RunEvent[] {
    const run = this.trial;
    if (!run) return [];
    run.next += 1;
    if (run.next >= run.gates) {
      const seconds = Math.round((run.elapsed + run.penalty) * 10) / 10;
      this.trial = null;
      return [{ type: "trial-finished", mission: run.mission, seconds, passed: seconds <= run.limit }];
    }
    return [{ type: "trial-gate", mission: run.mission, passed: run.next - 1, total: run.gates - 1 }];
  }

  /** A cone was touched: the mission's penalty seconds are added to the clock. */
  hitHazard(): RunEvent[] {
    const run = this.trial;
    if (!run) return [];
    const def = this.lookup(run.mission);
    const penalty = def && def.kind === "time_trial" ? def.penalty : 1;
    run.penalty += penalty;
    return [{ type: "trial-cone", mission: run.mission, penalty }];
  }

  // ── kick goals ──────────────────────────────────────────────────────────────────────────

  /** The first kick of an active kick mission starts the minute. */
  beginKick(mission: string): RunEvent[] {
    const def = this.lookup(mission);
    if (!def || def.kind !== "kick_goals") return [];
    this.kick = { mission, left: def.seconds, goals: 0, need: def.goals };
    return [{ type: "kick-start", mission, seconds: def.seconds }];
  }

  /** The ball hit the goal. Counts while a run is on; reaching the target ends it with a pass. */
  goalScored(): RunEvent[] {
    const run = this.kick;
    if (!run) return [];
    run.goals += 1;
    if (run.goals >= run.need) {
      this.kick = null;
      return [{ type: "kick-goal", mission: run.mission, goals: run.goals, need: run.need }, { type: "kick-finished", mission: run.mission, goals: run.goals, passed: true }];
    }
    return [{ type: "kick-goal", mission: run.mission, goals: run.goals, need: run.need }];
  }

  // ── clock ───────────────────────────────────────────────────────────────────────────────

  update(dt: number): RunEvent[] {
    const events: RunEvent[] = [];
    if (this.delivery) {
      this.delivery.left -= dt;
      if (this.delivery.left <= 0) {
        events.push({ type: "delivery-timeup", mission: this.delivery.mission });
        this.delivery = null;
      }
    }
    if (this.trial) {
      this.trial.elapsed += dt;
      if (this.trial.elapsed + this.trial.penalty > this.trial.limit) {
        events.push({ type: "trial-timeup", mission: this.trial.mission });
        this.trial = null;
      }
    }
    if (this.kick) {
      this.kick.left -= dt;
      if (this.kick.left <= 0) {
        events.push({ type: "kick-finished", mission: this.kick.mission, goals: this.kick.goals, passed: false });
        this.kick = null;
      }
    }
    return events;
  }

  /** HUD text for the run that is running, delivery first. */
  hud(): RunHud | null {
    if (this.delivery) {
      const left = Math.max(0, this.delivery.left);
      return { title: "번개 배달", clock: `${left.toFixed(1)}초`, detail: `택배 ${this.delivery.carrying.length}개 남음`, urgent: left < 10 };
    }
    if (this.trial) {
      const shown = this.trial.elapsed + this.trial.penalty;
      const left = this.trial.limit - shown;
      const cones = this.trial.penalty > 0 ? ` · 콘 +${this.trial.penalty}초` : "";
      return { title: "콘 코스", clock: `${shown.toFixed(1)}초 / ${this.trial.limit}초`, detail: `체크포인트 ${this.trial.next - 1}/${this.trial.gates - 1}${cones}`, urgent: left < 5 };
    }
    if (this.kick) {
      const left = Math.max(0, this.kick.left);
      return { title: "골 챌린지", clock: `${left.toFixed(1)}초`, detail: `${this.kick.goals}/${this.kick.need}골`, urgent: left < 10 };
    }
    return null;
  }
}
