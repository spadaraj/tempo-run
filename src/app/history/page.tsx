import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { readDB } from "@/lib/db";

export const dynamic = "force-dynamic";

const RATING_EMOJI: Record<string, string> = {
  easy: "🙂",
  right: "😐",
  hard: "😩",
};

export default async function HistoryPage() {
  const userId = await getUserId();
  if (!userId) redirect("/");
  const db = await readDB();
  const sessions = db.sessions
    .filter((s) => s.userId === userId && s.rating)
    .sort((a, b) =>
      (b.completedAt ?? "") > (a.completedAt ?? "") ? 1 : -1,
    );

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Run history</h1>
        <Link href="/" className="text-sm underline">
          Back
        </Link>
      </header>

      {sessions.length === 0 ? (
        <p className="text-zinc-500">No completed runs yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="flex flex-col">
                <span className="font-semibold">
                  {s.plannedMinutes} min · {s.targetCadence} SPM
                </span>
                <span className="text-xs text-zinc-500">
                  {new Date(s.completedAt!).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-2xl">{RATING_EMOJI[s.rating!]}</span>
                {s.skippedTrackUris && s.skippedTrackUris.length > 0 && (
                  <span className="text-zinc-500">
                    {s.skippedTrackUris.length} skipped
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
