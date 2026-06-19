export const SPOTIFY_SCOPES = [
  "user-read-email",
  "user-read-private",
  "playlist-read-private",
  "playlist-modify-private",
  "playlist-modify-public",
  "user-library-read",
  "user-top-read",
  "user-read-recently-played",
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

interface SpotifyUser {
  id: string;
  display_name: string | null;
  email: string | null;
}

export async function getCurrentUser(token: string): Promise<SpotifyUser> {
  const res = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch user: ${res.status}`);
  return res.json();
}

export interface SpotifyTrack {
  uri: string;
  id: string;
  name: string;
  duration_ms: number;
  artists: { name: string }[];
}

export async function searchTrack(
  token: string,
  artist: string,
  title: string,
): Promise<SpotifyTrack | null> {
  const q = `track:${title} artist:${artist}`;
  const res = await fetch(
    `https://api.spotify.com/v1/search?type=track&limit=1&q=${encodeURIComponent(
      q,
    )}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    tracks?: { items?: SpotifyTrack[] };
  };
  return data.tracks?.items?.[0] ?? null;
}

export async function createPlaylist(
  token: string,
  _userId: string,
  name: string,
  description: string,
): Promise<{ id: string; uri: string; external_urls: { spotify: string } }> {
  const res = await fetch(`https://api.spotify.com/v1/me/playlists`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, description, public: false }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Create playlist failed: ${res.status} ${body}. ` +
        `If you see 403 Forbidden, your Spotify account is not on the Tempo Run app's User Management allow-list, ` +
        `or the email there doesn't match your Spotify account email exactly.`,
    );
  }
  return res.json();
}

export async function addTracksToPlaylist(
  token: string,
  playlistId: string,
  uris: string[],
) {
  if (uris.length === 0) return;
  const res = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uris }),
    },
  );
  if (!res.ok) {
    throw new Error(`Add tracks failed: ${res.status} ${await res.text()}`);
  }
}

export interface RecentItem {
  track: {
    uri: string;
    duration_ms: number;
  };
  played_at: string;
}

export async function getRecentlyPlayed(
  token: string,
  afterMs?: number,
): Promise<RecentItem[]> {
  const url = new URL("https://api.spotify.com/v1/me/player/recently-played");
  url.searchParams.set("limit", "50");
  if (afterMs) url.searchParams.set("after", afterMs.toString());
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { items?: RecentItem[] };
  return data.items ?? [];
}
