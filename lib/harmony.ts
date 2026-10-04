export const HARMONY_LEVELS = [
  { level: 1, name: "Needs Improvement", range: "0–20", threshold: 0 },
  { level: 2, name: "Getting Better", range: "21–40", threshold: 21 },
  { level: 3, name: "Comfortable Home", range: "41–60", threshold: 41 },
  { level: 4, name: "Cozy Home", range: "61–80", threshold: 61 },
  { level: 5, name: "Harmony Home", range: "81–100", threshold: 81 },
] as const;

type HarmonyEventRecord = { taskId?: string | null; points: number; reason: string };
type HarmonyTaskRecord = { id: string; status: string };

export function normalizeHarmonyScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(score) ? score : 0)));
}

export function harmonyLevel(score: number) {
  const normalized = normalizeHarmonyScore(score);
  return [...HARMONY_LEVELS].reverse().find((item) => normalized >= item.threshold) ?? HARMONY_LEVELS[0];
}

/**
 * The event collection is the score ledger. Older demo data contained a
 * completed task whose ledger row was recorded as a zero-point baseline, so
 * completed tasks without a task_completed event are repaired while reading.
 */
export function harmonyScoreFromLedger(events: HarmonyEventRecord[], tasks: HarmonyTaskRecord[]) {
  const awardedTasks = new Set(events.filter((event) => event.reason === "task_completed" && event.taskId).map((event) => event.taskId));
  const untrackedCompletedTasks = tasks.filter((task) => task.status === "completed" && !awardedTasks.has(task.id)).length;
  return normalizeHarmonyScore(events.reduce((sum, event) => sum + event.points, 0) + untrackedCompletedTasks * 10);
}
