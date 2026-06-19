import fs from "fs/promises";
import path from "path";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "db.json");

export type YesterdayActivity =
  | "ran_fine"
  | "ran_hard"
  | "rest"
  | "long_break";
export type FeelingToday = "fresh" | "ok" | "tired";
export type Rating = "easy" | "right" | "hard";

export interface Onboarding {
  userId: string;
  yesterdayActivity: YesterdayActivity;
  feelingToday: FeelingToday;
  baselineMinutes: number;
  baselineCadence: number;
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  plannedMinutes: number;
  targetCadence: number;
  blocks: { label: string; minutes: number; bpm: number }[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  rating?: Rating;
  finishedPlaylist?: boolean;
  playlistId?: string;
  playlistUrl?: string;
  trackUris?: string[];
  trackBpms?: number[];
  skippedTrackUris?: string[];
}

export interface TrackScore {
  userId: string;
  trackUri: string;
  bpm: number;
  skips: number;
  completes: number;
}

export interface DB {
  onboarding: Record<string, Onboarding>;
  sessions: Session[];
  trackScores: Record<string, TrackScore>;
}

const DEFAULT_DB: DB = {
  onboarding: {},
  sessions: [],
  trackScores: {},
};

async function ensureFile() {
  await fs.mkdir(DB_DIR, { recursive: true });
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2));
  }
}

export async function readDB(): Promise<DB> {
  await ensureFile();
  const raw = await fs.readFile(DB_PATH, "utf8");
  return { ...DEFAULT_DB, ...JSON.parse(raw) };
}

export async function writeDB(db: DB) {
  await ensureFile();
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
}

export async function withDB<T>(fn: (db: DB) => Promise<T> | T): Promise<T> {
  const db = await readDB();
  const result = await fn(db);
  await writeDB(db);
  return result;
}

export function scoreKey(userId: string, trackUri: string) {
  return `${userId}:${trackUri}`;
}
