export interface BpmCandidate {
  artist: string;
  title: string;
  bpm: number;
}

interface TempoResponse {
  tempo?: Array<{
    artist?: { name?: string };
    song_title?: string;
    tempo?: string | number;
  }>;
}

export async function songsByBpm(
  bpm: number,
  limit = 25,
): Promise<BpmCandidate[]> {
  const key = process.env.GETSONGBPM_API_KEY;
  if (!key) throw new Error("Missing GETSONGBPM_API_KEY");
  const url = `https://api.getsong.co/tempo/?api_key=${encodeURIComponent(
    key,
  )}&bpm=${bpm}&limit=${limit}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as TempoResponse;
  return (data.tempo ?? [])
    .filter((s) => s.artist?.name && s.song_title)
    .map((s) => ({
      artist: s.artist!.name!,
      title: s.song_title!,
      bpm: typeof s.tempo === "string" ? parseFloat(s.tempo) : s.tempo ?? bpm,
    }));
}

export async function songsInRange(
  centerBpm: number,
  spread: number,
  limit = 25,
): Promise<BpmCandidate[]> {
  const bpms = [centerBpm, centerBpm - spread, centerBpm + spread];
  const all: BpmCandidate[] = [];
  for (const bpm of bpms) {
    const found = await songsByBpm(bpm, limit);
    all.push(...found);
  }
  const seen = new Set<string>();
  return all.filter((c) => {
    const key = `${c.artist}|${c.title}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
