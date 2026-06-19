"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Rating } from "@/lib/db";

const OPTIONS: { value: Rating; emoji: string; label: string }[] = [
  { value: "easy", emoji: "🙂", label: "Easy" },
  { value: "right", emoji: "😐", label: "Right" },
  { value: "hard", emoji: "😩", label: "Hard" },
];

export default function RatingForm({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState<Rating | null>(null);
  const [finished, setFinished] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!rating) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, finishedPlaylist: finished }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || `Failed: ${res.status}`);
      }
      router.push("/");
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-3 gap-3">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setRating(o.value)}
            className={`flex flex-col items-center gap-2 rounded-xl border p-6 transition-colors ${
              rating === o.value
                ? "border-[#1DB954] bg-[#1DB954]/10"
                : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700"
            }`}
          >
            <span className="text-4xl">{o.emoji}</span>
            <span className="font-medium">{o.label}</span>
          </button>
        ))}
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={finished}
          onChange={(e) => setFinished(e.target.checked)}
          className="h-5 w-5"
        />
        I finished the playlist
      </label>

      {error && (
        <p className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!rating || loading}
        className="rounded-full bg-[#1DB954] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#1ed760] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
