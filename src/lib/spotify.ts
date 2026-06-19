export const SPOTIFY_SCOPES = [
  "user-read-email",
  "user-read-private",
  "playlist-modify-private",
  "playlist-modify-public",
  "user-library-read",
  "user-top-read",
].join(" ");

export function getSpotifyEnv() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Missing Spotify env vars. Set SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, and SPOTIFY_REDIRECT_URI in .env.",
    );
  }
  return { clientId, clientSecret, redirectUri };
}

export async function exchangeCodeForToken(code: string) {
  const { clientId, clientSecret, redirectUri } = getSpotifyEnv();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
    },
    body,
  });
  if (!res.ok) {
    throw new Error(`Spotify token exchange failed: ${res.status}`);
  }
  return (await res.json()) as {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
  };
}
