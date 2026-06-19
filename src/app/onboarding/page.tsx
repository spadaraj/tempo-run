"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FeelingToday, YesterdayActivity } from "@/lib/db";

const YESTERDAY: { value: YesterdayActivity; label: string }[] = [
  { value: "ran_fine", label: "I ran yesterday — felt fine" },
  { value: "ran_hard", label: "I ran yesterday — felt hard" },
  { value: "rest", label: "Rest day yesterday" },
  { value: "long_break", label: "Haven't run in a week or more" },
];

const FEELING: { value: FeelingToday; label: string }[] = [
  { value: "fresh", label: "Fresh and ready" },
  { value: "ok", label: "Okay, normal" },
  { value: "tired", label: "Tired or sore" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [yesterday, setYesterday] = useState<YesterdayActivity | null>(null);
  const [feeling, setFeeling] = useState<FeelingToday | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!yesterday || !feeling) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          yesterdayActivity: yesterday,
          feelingToday: feeling,
        }),
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
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-8 p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Quick warm-up</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Tell me where you&apos;re at so I can pick the right starting point.
        </p>
      </header>

      <Question label="What did you do yesterday?">
        {YESTERDAY.map((o) => (
          <OptionButton
            key={o.value}
            selected={yesterday === o.value}
            onClick={() => setYesterday(o.value)}
          >
            {o.label}
          </OptionButton>
        ))}
      </Question>

      <Question label="How are you feeling today?">
        {FEELING.map((o) => (
          <OptionButton
            key={o.value}
            selected={feeling === o.value}
            onClick={() => setFeeling(o.value)}
          >
            {o.label}
          </OptionButton>
        ))}
      </Question>

      {error && (
        <p className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!yesterday || !feeling || loading}
        className="rounded-full bg-[#1DB954] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#1ed760] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Setting up…" : "Continue"}
      </button>
    </main>
  );
}

function Question({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function OptionButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition-colors ${
        selected
          ? "border-[#1DB954] bg-[#1DB954]/10 font-semibold"
          : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700"
      }`}
    >
      {children}
    </button>
  );
}
