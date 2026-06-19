"use client";

import { useState } from "react";
import type { HealthStats } from "@/lib/apple-health";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HealthStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Upload failed: ${res.status}`);
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Upload Apple Health export</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          On your iPhone: Health app → tap your profile picture → Export All
          Health Data → AirDrop or email the zip to yourself, then upload it
          here.
        </p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <input
          type="file"
          accept=".zip,.xml"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="rounded border border-zinc-300 p-3 dark:border-zinc-700"
        />
        <button
          type="submit"
          disabled={!file || loading}
          className="rounded-full bg-[#1DB954] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#1ed760] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Parsing… (this can take a minute)" : "Analyze workouts"}
        </button>
      </form>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      {result && <Results stats={result} />}
    </main>
  );
}

function Results({ stats }: { stats: HealthStats }) {
  const cadence = stats.avgCadenceSpm;
  const pace = stats.avgPaceMinPerMi;
  return (
    <section className="flex flex-col gap-4 rounded border border-zinc-200 p-6 dark:border-zinc-800">
      <h2 className="text-xl font-semibold">Your running profile</h2>
      <dl className="grid grid-cols-2 gap-4">
        <Stat label="Running workouts" value={stats.count.toString()} />
        <Stat
          label="Avg cadence (steps/min)"
          value={cadence ? cadence.toFixed(0) : "—"}
        />
        <Stat
          label="Avg pace (min/mi)"
          value={pace ? formatPace(pace) : "—"}
        />
        <Stat
          label="Total distance (mi)"
          value={stats.totalDistanceMi.toFixed(1)}
        />
      </dl>
      {cadence && (
        <p className="text-zinc-600 dark:text-zinc-400">
          We&apos;ll target songs around{" "}
          <strong>{cadence.toFixed(0)} BPM</strong> to match your natural
          cadence. (Most running cadences map 1:1 to song BPM.)
        </p>
      )}
      {!cadence && (
        <p className="text-zinc-600 dark:text-zinc-400">
          We couldn&apos;t infer cadence directly from your export — we&apos;ll
          let you pick a target BPM on the next step.
        </p>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-sm text-zinc-500">{label}</dt>
      <dd className="text-2xl font-semibold">{value}</dd>
    </div>
  );
}

function formatPace(minPerMi: number): string {
  const m = Math.floor(minPerMi);
  const s = Math.round((minPerMi - m) * 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
