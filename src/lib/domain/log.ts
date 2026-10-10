// Pure helpers for the daily log and the hours ribbon (PRD §6.5, §10.6). No side effects, so these are unit-tested directly.

export const PRESET_SECONDS = [1800, 3600, 7200] as const; // 30 min, 1 h, 2 h chips (LOG-01)

/** "H:MM" for a duration in seconds, e.g. 3695 -> "1:01". Seconds are stored but not shown (report hours are whole). */
export function formatHMS(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${h}:${String(m).padStart(2, "0")}`;
}

/** Report hours = whole hours from the log (§6.5). */
export function floorHours(totalSeconds: number): number {
  return Math.floor(totalSeconds / 3600);
}

export function leftoverSeconds(totalSeconds: number): number {
  return totalSeconds % 3600;
}

export interface RibbonState {
  percent: number; // 0-100, clamped, for the fill width
  goalReached: boolean;
  tickPositions: readonly number[]; // percent positions for the 25/50/75 markers
}

/** The hours ribbon never divides by zero and never exceeds 100% width even past goal. */
export function ribbonState(currentSeconds: number, goalHours: number | null): RibbonState {
  const goalSeconds = (goalHours ?? 0) * 3600;
  const percent = goalSeconds <= 0 ? 0 : Math.min(100, Math.round((currentSeconds / goalSeconds) * 100));
  return { percent, goalReached: goalSeconds > 0 && currentSeconds >= goalSeconds, tickPositions: [25, 50, 75] };
}

/** Parses the machine-readable carry-over note ("carryover:2026-08") back into a month key, or null if not one. */
export function carryoverMonth(note: string | null): string | null {
  const m = /^carryover:(\d{4}-\d{2})$/.exec(note ?? "");
  return m ? `${m[1]}-01` : null;
}
