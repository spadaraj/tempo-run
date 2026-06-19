import { notFound, redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { readDB } from "@/lib/db";
import FinishButton from "./FinishButton";

export const dynamic = "force-dynamic";

export default async function RunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getUserId();
  if (!userId) redirect("/");

  const db = await readDB();
  const session = db.sessions.find((s) => s.id === id && s.userId === userId);
  if (!session) notFound();
  if (session.rating) redirect("/");

  const playlistEmbedUrl = session.playlistId
    ? `https://open.spotify.com/embed/playlist/${session.playlistId}`
    : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">{session.plannedMinutes} min run</h1>
        <p className="text-sm text-zinc-500">
          Target cadence: {session.targetCadence} SPM
        </p>
      </header>

      {playlistEmbedUrl && (
        <iframe
          src={playlistEmbedUrl}
          width="100%"
          height="380"
          frameBorder={0}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-xl"
        />
      )}

      {session.playlistUrl && (
        <a
          href={session.playlistUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-center text-sm text-zinc-500 underline"
        >
          Open in Spotify app
        </a>
      )}

      <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Today&apos;s structure
        </h2>
        <ul className="flex flex-col gap-1 text-sm">
          {session.blocks.map((b) => (
            <li key={b.label} className="flex justify-between">
              <span>{b.label}</span>
              <span className="text-zinc-500">
                {b.minutes} min · {b.bpm} BPM
              </span>
            </li>
          ))}
        </ul>
      </section>

      <FinishButton sessionId={session.id} />
    </main>
  );
}
