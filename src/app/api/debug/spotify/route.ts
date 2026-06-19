import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const meRes = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: "no-store",
  });
  const meStatus = meRes.status;
  const meBody = await meRes.text();

  const playlistTryRes = await fetch(
    "https://api.spotify.com/v1/me/playlists?limit=1",
    {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: "no-store",
    },
  );
  const playlistStatus = playlistTryRes.status;
  const playlistBody = await playlistTryRes.text();

  return NextResponse.json({
    storedUserId: session.userId,
    me: { status: meStatus, body: tryJson(meBody) },
    listPlaylists: { status: playlistStatus, body: tryJson(playlistBody) },
  });
}

function tryJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
