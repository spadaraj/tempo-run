import type { Onboarding, Session } from "./db";

export interface PlanBlock {
  label: string;
  minutes: number;
  bpm: number;
}

export interface TodaysPlan {
  targetMinutes: number;
  targetCadence: number;
  rationale: string;
  blocks: PlanBlock[];
  phase: "duration" | "hold-20" | "hold-30" | "speed";
}

const DURATION_GOAL_1 = 20;
const DURATION_GOAL_2 = 30;
const HOLD_RUNS = 2;

export function generatePlan(
  history: Session[],
  onboarding: Onboarding,
): TodaysPlan {
  const completed = history
    .filter((s) => s.completedAt && s.rating)
    .sort((a, b) =>
      (b.completedAt ?? "") > (a.completedAt ?? "") ? 1 : -1,
    );

  const baselineMin = onboarding.baselineMinutes;
  const baselineCad = onboarding.baselineCadence;

  let targetMin = baselineMin;
  let targetCad = baselineCad;
  let phase: TodaysPlan["phase"] = "duration";
  let rationale = "";

  if (completed.length === 0) {
    targetMin = baselineMin;
    targetCad = baselineCad;
    rationale = `Starting baseline: ${baselineMin} min at ${baselineCad} SPM.`;
  } else {
    const last = completed[0];
    const lastMin = last.plannedMinutes;
    targetMin = lastMin;
    targetCad = last.targetCadence;

    const prev = completed[1];
    const twoHard = last.rating === "hard" && prev?.rating === "hard";
    const oneHard = last.rating === "hard" && !twoHard;

    if (twoHard) {
      targetMin = Math.max(baselineMin, lastMin - 1);
      rationale = `Two hard runs in a row. Pulling back to ${targetMin} min so you don't burn out.`;
    } else if (oneHard) {
      targetMin = lastMin;
      rationale = `Last run was tough. Repeating ${lastMin} min — no push this time.`;
    } else if (lastMin < DURATION_GOAL_1) {
      targetMin = lastMin + 1;
      rationale = `Solid ${lastMin} min last time. Nudging to ${targetMin}. Goal: ${DURATION_GOAL_1} min.`;
    } else if (lastMin === DURATION_GOAL_1) {
      const at20 = completed.filter(
        (s) => s.plannedMinutes === DURATION_GOAL_1 && s.rating !== "hard",
      ).length;
      if (at20 < HOLD_RUNS) {
        targetMin = DURATION_GOAL_1;
        phase = "hold-20";
        rationale = `Holding ${DURATION_GOAL_1} min (${at20}/${HOLD_RUNS}) before pushing to ${DURATION_GOAL_2}.`;
      } else {
        targetMin = DURATION_GOAL_1 + 2;
        rationale = `${DURATION_GOAL_1} min locked in. Pushing to ${targetMin}. Goal: ${DURATION_GOAL_2} min.`;
      }
    } else if (lastMin < DURATION_GOAL_2) {
      targetMin = Math.min(lastMin + 2, DURATION_GOAL_2);
      rationale = `Strong at ${lastMin} min. Pushing to ${targetMin}. Goal: ${DURATION_GOAL_2} min.`;
    } else if (lastMin === DURATION_GOAL_2) {
      const at30 = completed.filter(
        (s) => s.plannedMinutes === DURATION_GOAL_2 && s.rating !== "hard",
      ).length;
      if (at30 < HOLD_RUNS) {
        targetMin = DURATION_GOAL_2;
        phase = "hold-30";
        rationale = `Holding ${DURATION_GOAL_2} min (${at30}/${HOLD_RUNS}) before adding speed.`;
      } else {
        targetMin = DURATION_GOAL_2;
        targetCad = last.targetCadence + 2;
        phase = "speed";
        rationale = `${DURATION_GOAL_2} min nailed. Adding speed: target cadence ${targetCad} SPM.`;
      }
    } else {
      targetMin = DURATION_GOAL_2;
      targetCad = last.targetCadence + 2;
      phase = "speed";
      rationale = `Speed phase: bumping cadence to ${targetCad} SPM.`;
    }
  }

  return {
    targetMinutes: targetMin,
    targetCadence: targetCad,
    rationale,
    blocks: buildBlocks(targetMin, targetCad),
    phase,
  };
}

function buildBlocks(totalMin: number, mainCadence: number): PlanBlock[] {
  const warmup = Math.max(1, Math.min(2, Math.floor(totalMin * 0.15)));
  const cooldown = Math.max(1, Math.min(2, Math.floor(totalMin * 0.15)));
  const push = totalMin >= 8 ? 2 : 1;
  const main = totalMin - warmup - push - cooldown;

  return [
    { label: "Warm-up", minutes: warmup, bpm: mainCadence - 14 },
    { label: "Main", minutes: main, bpm: mainCadence },
    { label: "Push", minutes: push, bpm: mainCadence + 4 },
    { label: "Cool-down", minutes: cooldown, bpm: mainCadence - 19 },
  ];
}

export function baselineFromOnboarding(
  yesterday: Onboarding["yesterdayActivity"],
  feeling: Onboarding["feelingToday"],
): { baselineMinutes: number; baselineCadence: number } {
  let baselineMinutes = 12;
  if (yesterday === "ran_hard" || feeling === "tired") baselineMinutes = 10;
  else if (yesterday === "rest" && feeling === "fresh") baselineMinutes = 14;
  else if (yesterday === "long_break") baselineMinutes = 10;
  return { baselineMinutes, baselineCadence: 154 };
}
