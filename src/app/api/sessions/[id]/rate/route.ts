import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { scoreKey, withDB, type Rating } from "@/lib/db";
import { getRecentlyPlayed } from "@/lib/spotify";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = (await req.json()) as {
    rating: Rating;
    finishedPlaylist: boolean;
  };

  const skipped: string[] = [];

  try {
    const db = await (await import("@/lib/db")).readDB();
    const s = db.sessions.find(
      (x) => x.id === id && x.userId === session.userId,
    );
    if (s?.startedAt && s.trackUris && s.trackUris.length > 0) {
      const afterMs = new Date(s.startedAt).getTime() - 60_000;
      const recent = await getRecentlyPlayed(session.accessToken, afterMs);
      const playedUris = new Set(recent.map((r) => r.track.uri));
      for (const uri of s.trackUris) {
        if (!playedUris.has(uri)) skipped.push(uri);
      }
    }
  } catch {
    // skip detection is best-effort
  }

  await withDB((db) => {
    const s = db.sessions.find(
      (x) => x.id === id && x.userId === session.userId,
    );
    if (!s) return;
    s.rating = body.rating;
    s.finishedPlaylist = body.finishedPlaylist;
    s.skippedTrackUris = skipped;
    if (!s.completedAt) s.completedAt = new Date().toISOString();

    if (s.trackUris && s.trackBpms) {
      const skipSet = new Set(skipped);
      for (let i = 0; i < s.trackUris.length; i++) {
        const uri = s.trackUris[i];
        const bpm = s.trackBpms[i];
        const k = scoreKey(session.userId, uri);
        const existing = db.trackScores[k] ?? {
          userId: session.userId,
          trackUri: uri,
          bpm,
          skips: 0,
          completes: 0,
        };
        if (skipSet.has(uri)) existing.skips += 1;
        else existing.completes += 1;
        db.trackScores[k] = existing;
      }
    }
  });

  return NextResponse.json({ ok: true, skippedCount: skipped.length });
}
