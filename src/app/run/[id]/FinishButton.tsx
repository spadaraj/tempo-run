"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function FinishButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function finish() {
    setLoading(true);
    await fetch(`/api/sessions/${sessionId}/complete`, { method: "POST" });
    router.push(`/run/${sessionId}/rate`);
  }
  return (
    <button
      type="button"
      onClick={finish}
      disabled={loading}
      className="rounded-full bg-black px-6 py-4 text-lg font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
    >
      {loading ? "Saving…" : "I'm done"}
    </button>
  );
}
