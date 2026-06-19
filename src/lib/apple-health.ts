import sax from "sax";
import { Readable } from "stream";

export interface RunningWorkout {
  startDate: string;
  durationMin: number;
  distanceMi: number | null;
  steps: number | null;
  paceMinPerMi: number | null;
  cadenceSpm: number | null;
}

export interface HealthStats {
  count: number;
  avgCadenceSpm: number | null;
  avgPaceMinPerMi: number | null;
  totalDistanceMi: number;
  totalDurationMin: number;
  recentWorkouts: RunningWorkout[];
}

function toMiles(value: number, unit: string | undefined): number {
  if (!unit) return value;
  const u = unit.toLowerCase();
  if (u === "mi") return value;
  if (u === "km") return value * 0.621371;
  if (u === "m") return value * 0.000621371;
  return value;
}

function toMinutes(value: number, unit: string | undefined): number {
  if (!unit) return value;
  const u = unit.toLowerCase();
  if (u === "min") return value;
  if (u === "s") return value / 60;
  if (u === "h" || u === "hr") return value * 60;
  return value;
}

export function parseAppleHealthExport(
  stream: Readable,
): Promise<HealthStats> {
  return new Promise((resolve, reject) => {
    const parser = sax.createStream(true, { trim: true });
    const workouts: RunningWorkout[] = [];
    let current: RunningWorkout | null = null;

    parser.on("opentag", (node) => {
      const attrs = node.attributes as Record<string, string>;
      if (node.name === "Workout") {
        if (attrs.workoutActivityType === "HKWorkoutActivityTypeRunning") {
          const duration = parseFloat(attrs.duration || "0");
          const durationMin = toMinutes(duration, attrs.durationUnit);
          let distanceMi: number | null = null;
          if (attrs.totalDistance) {
            distanceMi = toMiles(
              parseFloat(attrs.totalDistance),
              attrs.totalDistanceUnit,
            );
          }
          current = {
            startDate: attrs.startDate || "",
            durationMin,
            distanceMi,
            steps: null,
            paceMinPerMi:
              distanceMi && distanceMi > 0 ? durationMin / distanceMi : null,
            cadenceSpm: null,
          };
        }
      } else if (node.name === "WorkoutStatistics" && current) {
        if (
          attrs.type === "HKQuantityTypeIdentifierStepCount" &&
          attrs.sum
        ) {
          current.steps = parseFloat(attrs.sum);
        } else if (
          attrs.type === "HKQuantityTypeIdentifierDistanceWalkingRunning" &&
          attrs.sum &&
          (current.distanceMi == null || current.distanceMi === 0)
        ) {
          current.distanceMi = toMiles(parseFloat(attrs.sum), attrs.unit);
          if (current.distanceMi > 0) {
            current.paceMinPerMi = current.durationMin / current.distanceMi;
          }
        }
      }
    });

    parser.on("closetag", (name) => {
      if (name === "Workout" && current) {
        if (current.steps && current.durationMin > 0) {
          current.cadenceSpm = current.steps / current.durationMin;
        }
        workouts.push(current);
        current = null;
      }
    });

    parser.on("end", () => {
      const cadences = workouts
        .map((w) => w.cadenceSpm)
        .filter((v): v is number => v != null && isFinite(v));
      const paces = workouts
        .map((w) => w.paceMinPerMi)
        .filter((v): v is number => v != null && isFinite(v));
      const avg = (arr: number[]) =>
        arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

      workouts.sort((a, b) => (b.startDate > a.startDate ? 1 : -1));

      resolve({
        count: workouts.length,
        avgCadenceSpm: avg(cadences),
        avgPaceMinPerMi: avg(paces),
        totalDistanceMi: workouts.reduce(
          (sum, w) => sum + (w.distanceMi || 0),
          0,
        ),
        totalDurationMin: workouts.reduce(
          (sum, w) => sum + w.durationMin,
          0,
        ),
        recentWorkouts: workouts.slice(0, 10),
      });
    });

    parser.on("error", reject);
    stream.pipe(parser);
  });
}
