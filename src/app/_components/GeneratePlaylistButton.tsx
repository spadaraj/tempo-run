"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function GeneratePlaylistButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/playlist/generate", { method: "POST" });
      const text = await res.text();
      let data: { sessionId?: string; error?: string } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          `Server returned non-JSON (${res.status}): ${text.slice(0, 200)}`,
        );
      }
      if (!res.ok)
        throw new Error(data.error || `Failed: ${res.status}`);
      router.push(`/run/${data.sessionId}`);
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={go}
        disabled={loading}
        className="rounded-full bg-[#1DB954] px-6 py-4 text-lg font-semibold text-white transition-colors hover:bg-[#1ed760] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Building your playlist…" : "Build my playlist"}
      </button>
      {error && (
        <p className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}
