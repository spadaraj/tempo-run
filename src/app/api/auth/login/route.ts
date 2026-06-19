import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { SPOTIFY_SCOPES, getSpotifyEnv } from "@/lib/spotify";

export async function GET() {
  const { clientId, redirectUri } = getSpotifyEnv();
  const state = randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: SPOTIFY_SCOPES,
    redirect_uri: redirectUri,
    state,
    show_dialog: "true",
  });

  const res = NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${params.toString()}`,
  );
  res.cookies.set("spotify_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
