import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { readDB, withDB, type Session } from "@/lib/db";
import { generatePlan, type PlanBlock } from "@/lib/plan";
import { songsInRange, type BpmCandidate } from "@/lib/getsongbpm";
import {
  addTracksToPlaylist,
  createPlaylist,
  searchTrack,
  type SpotifyTrack,
} from "@/lib/spotify";

export const runtime = "nodejs";
export const maxDuration = 60;

async function pickTracksForBlock(
  accessToken: string,
  block: PlanBlock,
  candidates: BpmCandidate[],
  alreadyPicked: Set<string>,
): Promise<SpotifyTrack[]> {
  const targetMs = block.minutes * 60 * 1000;
  const picked: SpotifyTrack[] = [];
  let total = 0;
  for (const cand of candidates) {
    if (total >= targetMs) break;
    const track = await searchTrack(accessToken, cand.artist, cand.title);
    if (!track) continue;
    if (alreadyPicked.has(track.uri)) continue;
    alreadyPicked.add(track.uri);
    picked.push(track);
    total += track.duration_ms;
  }
  return picked;
}

export async function POST() {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const db = await readDB();
  const onboarding = db.onboarding[session.userId];
  if (!onboarding) {
    return NextResponse.json(
      { error: "Complete onboarding first" },
      { status: 400 },
    );
  }

  const history = db.sessions.filter((s) => s.userId === session.userId);
  const plan = generatePlan(history, onboarding);

  const trackUris: string[] = [];
  const trackBpms: number[] = [];
  const picked = new Set<string>();

  for (const block of plan.blocks) {
    if (block.minutes <= 0) continue;
    const candidates = await songsInRange(block.bpm, 2, 25);
    const tracks = await pickTracksForBlock(
      session.accessToken,
      block,
      candidates,
      picked,
    );
    for (const t of tracks) {
      trackUris.push(t.uri);
      trackBpms.push(block.bpm);
    }
  }

  if (trackUris.length === 0) {
    return NextResponse.json(
      {
        error:
          "Couldn't find tracks at those BPMs. Try again — the music database is occasionally flaky.",
      },
      { status: 502 },
    );
  }

  const name = `Tempo Run · ${plan.targetMinutes} min · ${new Date().toLocaleDateString()}`;
  const description = `${plan.rationale} Built by Tempo Run.`;
  const playlist = await createPlaylist(
    session.accessToken,
    session.userId,
    name,
    description,
  );
  await addTracksToPlaylist(
    session.accessToken,
    playlist.id,
    trackUris,
  );

  const newSession: Session = {
    id: randomUUID(),
    userId: session.userId,
    plannedMinutes: plan.targetMinutes,
    targetCadence: plan.targetCadence,
    blocks: plan.blocks,
    createdAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    playlistId: playlist.id,
    playlistUrl: playlist.external_urls.spotify,
    trackUris,
    trackBpms,
  };

  await withDB((d) => {
    d.sessions.push(newSession);
  });

  return NextResponse.json({ sessionId: newSession.id });
}
